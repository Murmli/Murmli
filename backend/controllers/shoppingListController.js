const ShoppingList = require("../models/shoppingListModel.js");
const Recipe = require("../models/recipeModel.js");
const UserRecipe = require("../models/userRecipeModel.js");
const InviteCode = require("../models/inviteCodeModel.js");
const { mergeItemArrays, validateItemArray, sortItemById, deleteExpiredInvites, generateInviteCode, saveRecipeIngredients } = require("../utils/shoppingListUtils.js");
const { textToItemArray, audioToItemArray, findAlternativeItems } = require(`../utils/llm.js`);
const { translateItems, translateString } = require(`../utils/translator.js`);

const streamManager = require("../utils/streamManager.js");

function broadcastUpdate(list) {
  if (list.sharedWith && list.sharedWith.length > 0) {
    streamManager.broadcast(list._id.toString(), {
      event: "update",
      updatedAt: list.updatedAt,
    });
  }
}

async function addItems(shoppingListId, newItemsArray) {
  try {
    if (!newItemsArray || newItemsArray.length === 0 || !validateItemArray(newItemsArray)) {
      throw new Error("Invalid item array");
    }

    const shoppingList = await ShoppingList.findById(shoppingListId);
    if (!shoppingList) {
      throw new Error("Shopping list not found");
    }

    const mergedItemArray = mergeItemArrays(shoppingList.items, newItemsArray);
    if (mergedItemArray.length === 0) {
      throw new Error("Could not merge arrays");
    }

    const updatedShoppingList = await ShoppingList.findByIdAndUpdate(
      shoppingListId,
      { items: mergedItemArray },
      { new: true, runValidators: true }
    );

    if (updatedShoppingList) {
      broadcastUpdate(updatedShoppingList);
      return updatedShoppingList;
    }

    throw new Error("Database Error");
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function addItemsFromText(shoppingListId, text) {
  try {
    const newItemsArray = await textToItemArray(text);
    return await addItems(shoppingListId, newItemsArray);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

exports.create = async (req, res) => {
  try {
    const user = req.user;

    const shoppingList = new ShoppingList({
      user: user._id,
    });

    const newList = await shoppingList.save();
    if (!newList) {
      throw new Error("Database Error");
    } else {
      req.shoppingList = newList;
      return exports.read(req, res);
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.read = async (req, res) => {
  try {
    const user = req.user;
    const shoppingList = req.shoppingList;
    const isOwner = shoppingList.user.toString() === user._id.toString();
    const isSharedWithUser = shoppingList.sharedWith.includes(user._id);
    let list = {};

    if (isOwner) {
      list = {
        ...shoppingList._doc,
        isOwner: true,
      };
    } else if (isSharedWithUser) {
      const { sharedWith, createdAt, __v, ...restOfList } = shoppingList._doc;

      list = {
        ...restOfList,
        isOwner: false,
      };
    }

    const sortedItems = sortItemById(list.items, user.shoppingListSort);
    if (!sortedItems) {
      throw new Error("Can't sort Shoppinglist items");
    }

    const translatedItems = await translateItems(sortedItems, user.language);
    if (!translatedItems || Object.keys(list).length === 0) {
      return res.status(503).json({ error: "Translation Error" });
    } else {
      list.items = translatedItems;
    }

    const translatedRecipes = await Promise.all(
      list.recipes.map(async (recipe) => {
        const translatedTitle = await translateString(recipe.title, user.language);
        return {
          ...recipe._doc,  // Nur das _doc extrahieren, um die unnötigen Mongoose-Metadaten zu vermeiden
          title: translatedTitle || recipe.title,
        };
      })
    );

    if (!translatedRecipes) {
      throw new Error("Recipe Translation Error");
    } else {
      list.recipes = translatedRecipes;
    }


    return res.status(200).json({ list });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.delete = async (req, res) => {
  try {
    const listId = req.body.listId;
    const deletion = await ShoppingList.deleteOne({ _id: listId });
    if (deletion.deletedCount === 0) {
      return res.status(404).json({ error: "List not found" });
    } else {
      return res.status(200).json({ message: "List deleted successfully" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.createItemText = async (req, res) => {
  try {
    const userInput = req.body.text;
    const shoppingListId = req.shoppingList._id;

    if (!userInput) {
      return res.status(400).json({ error: "Input is required" });
    }
    const updatedShoppingList = await addItemsFromText(shoppingListId, userInput);

    if (!updatedShoppingList) {
      throw new Error("Database Error");
    }

    req.shoppingList = updatedShoppingList;
    return exports.read(req, res);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.createItemAudio = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "Audio file is required." });
    }

    const items = await audioToItemArray(file);

    if (!items) {
      return res.status(400).json({ error: "No items could be identified from the audio." });
    }

    const shoppingListId = req.shoppingList._id;

    const updatedShoppingList = await addItems(shoppingListId, items);

    if (!updatedShoppingList) {
      throw new Error("Database Error");
    }

    req.shoppingList = updatedShoppingList;
    return exports.read(req, res);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.findItemAlternative = async (req, res) => {
  try {
    const user = req.user;
    const shoppingList = req.shoppingList;
    const itemId = req.body.itemId;

    if (!itemId) {
      return res.status(400).json({ error: "Input is required" });
    }

    const foundItem = shoppingList.items.find((i) => i._id.toString() === itemId);

    if (!foundItem) {
      return res.status(400).json({ error: "Item not found in the shopping list" });
    }

    const itemName = foundItem.name;
    const alternatives = await findAlternativeItems(itemName, user.language);

    if (!alternatives) {
      throw new Error("No alternative found for the item");
    }

    return res.status(200).json({ alternatives });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const itemId = req.body.itemId;
    const shoppingList = req.shoppingList;

    if (!itemId) {
      return res.status(400).json({ error: "Item ID is required" });
    }

    const itemIndex = shoppingList.items.findIndex((item) => item._id.toString() === itemId.toString());
    if (itemIndex === -1) {
      return res.status(404).json({ error: "Item not found" });
    }

    shoppingList.items.splice(itemIndex, 1);
    const updatedShoppingList = await shoppingList.save();
    if (!updatedShoppingList) {
      throw new Error("Database Error");
    } else {
      req.shoppingList = updatedShoppingList;
      broadcastUpdate(updatedShoppingList);
      return exports.read(req, res);
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.deleteAllItems = async (req, res) => {
  try {
    const shoppingList = req.shoppingList;
    shoppingList.items = [];
    const updatedShoppingList = await shoppingList.save();
    if (!updatedShoppingList) {
      throw new Error("Failed to update shopping list");
    } else {
      req.shoppingList = updatedShoppingList;
      broadcastUpdate(updatedShoppingList);
      return exports.read(req, res);
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.deleteCheckedItems = async (req, res) => {
  try {
    const shoppingList = req.shoppingList;
    const checkedItems = shoppingList.items.filter((item) => item.active === false);
    shoppingList.items = shoppingList.items.filter((item) => item.active === true);
    if (checkedItems.length === 0) {
      return res.status(404).json({ error: "No checked items found" });
    }
    const updatedShoppingList = await shoppingList.save();
    if (!updatedShoppingList) {
      throw new Error("Failed to update shopping list");
    } else {
      req.shoppingList = updatedShoppingList;
      broadcastUpdate(updatedShoppingList);
      return exports.read(req, res);
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const itemId = req.body.itemId;
    const itemName = req.body.name;
    const itemQuantity = req.body.quantity;
    const itemUnit = req.body.unit;
    const itemCategory = req.body.category;
    const itemActive = req.body.active;
    const shoppingList = req.shoppingList;

    if (!itemId) {
      return res.status(400).json({ error: "Item ID is required" });
    }

    const itemIndex = shoppingList.items.findIndex((item) => item._id.toString() === itemId.toString());
    if (itemIndex === -1) {
      return res.status(404).json({ error: "Item not found" });
    }

    if (itemName || itemQuantity || itemUnit || itemCategory !== undefined || typeof itemActive === "boolean") {
      if (itemName) {
        shoppingList.items[itemIndex].name = itemName;
      }
      if (itemQuantity) {
        shoppingList.items[itemIndex].quantity = itemQuantity;
      }
      if (itemUnit) {
        shoppingList.items[itemIndex].unit = itemUnit;
      }
      if (itemCategory !== undefined) {
        shoppingList.items[itemIndex].category = itemCategory;
      }
      if (typeof itemActive === "boolean") {
        shoppingList.items[itemIndex].active = itemActive;
      }
    } else {
      return res.status(400).json({ error: "No update data provided" });
    }

    const update = await shoppingList.save();
    if (update) {
      req.shoppingList = update;
      broadcastUpdate(update);
      return exports.read(req, res);
    } else {
      throw new Error("Failed to update shopping list");
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.getLastUpdate = async (req, res) => {
  try {
    const shoppingList = req.shoppingList;

    const unixTimestamp = Math.floor(shoppingList.updatedAt / 1000);

    if (unixTimestamp) {
      return res.status(200).json({ lastUpdate: unixTimestamp });
    } else {
      throw new Error("Could not retrieve last update timestamp");
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.createInvite = async (req, res) => {
  try {
    const userId = req.user._id;
    const listId = req.shoppingList._id;

    await deleteExpiredInvites();

    const existingInvites = await InviteCode.find({ listId: listId, createdBy: userId });
    if (existingInvites.length > 0) {
      return res.status(403).json({ error: "User created already an valid invite code" });
    }

    const inviteCode = await generateInviteCode(listId);

    if (inviteCode) {
      req.params.listId = listId;
      return exports.readInvite(req, res);
    } else {
      return res.status(400).json({ error: "Code generation failed or valid code already exists." });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.joinInvite = async (req, res) => {
  try {
    const userId = req.user._id;
    const inviteCode = req.body.inviteCode;

    await deleteExpiredInvites();

    const invite = await InviteCode.findOne({ code: inviteCode });
    if (!invite) {
      return res.status(404).json({ error: "Invite Code not found or expired" });
    }

    const shoppingList = await ShoppingList.findById(invite.listId);
    if (!shoppingList) {
      return res.status(404).json({ error: "Shopping List not found" });
    }

    const userOwnsList = shoppingList.user.equals(userId);
    if (userOwnsList) {
      return res.status(403).json({ error: "List owners can't join their own shopping list" });
    }

    if (shoppingList.sharedWith.includes(userId)) {
      return res.status(403).json({ error: "User already joined the list" });
    }

    shoppingList.sharedWith.push(userId);
    const saveList = await shoppingList.save();
    if (!saveList) {
      throw new Error("Failed to save shopping list");
    }

    if (!(await InviteCode.deleteOne({ code: inviteCode }))) {
      throw new Error("Failed to delete invite code");
    } else {
      return res.status(200).json({ listId: shoppingList._id });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.readInvite = async (req, res) => {
  try {
    const listId = req.shoppingList._id;
    await deleteExpiredInvites();

    const invite = await InviteCode.findOne({ listId });
    if (!invite) {
      return res.status(200).json({ inviteCode: null, timeRemaining: null });
    } else {
      const currentTime = new Date();
      const expiresAt = new Date(invite.expiresAt);
      const timeRemaining = Math.floor((expiresAt - currentTime) / 1000); // Zeit in Sekunden berechnen
      return res.status(200).json({ inviteCode: invite.code, timeRemaining });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.readItemSorting = async (req, res) => {
  try {
    const sorting = req.user.shoppingListSort;
    return res.status(200).json({ sorting });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.addRecipe = async (req, res) => {
  try {
    const recipeId = req.body.recipeId;
    const servings = req.body.servings;
    const shoppingList = req.shoppingList;
    const userId = req.user._id;

    if (!recipeId || !servings) {
      return res.status(400).json({ error: "Recipe ID and servings are required" });
    }

    const [systemRecipe, userRecipe] = await Promise.all([
      Recipe.findById(recipeId).lean(),
      UserRecipe.findById(recipeId).lean()
    ]);

    const recipe = systemRecipe || userRecipe;  // Nutze das erste gefundene Rezept

    // Wenn nicht gefunden, versuche in der UserRecipe-Kollektion
    if (!recipe) {
      return res.status(400).json({ error: "Recipe not found" });
    }

    const existingRecipeIndex = shoppingList.recipes.findIndex((r) => r._id.equals(recipeId));

    if (existingRecipeIndex !== -1) {
      // Wenn das Rezept bereits existiert, aktualisiere servings und setze ingredientsAdded auf false
      shoppingList.recipes[existingRecipeIndex].servings = servings;
      shoppingList.recipes[existingRecipeIndex].ingredientsAdded = false;
    } else {
      // Andernfalls füge das Rezept zur Liste hinzu
      shoppingList.recipes.push({
        _id: recipe._id,
        title: recipe.title,
        image: recipe.image,
        servings: servings,
        ingredientsAdded: false,
      });
    }

    // Aktualisiere die Zutaten in der Einkaufsliste
    const updatedList = await saveRecipeIngredients(shoppingList);

    if (!updatedList) {
      throw new Error("Recipe ingredients could not be saved.");
    } else {
      req.shoppingList = updatedList; // gesamte Liste aktualisieren
      broadcastUpdate(updatedList);
      return exports.read(req, res);
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.compileSuggestedRecipes = async (req, res) => {
  try {
    const user = req.user;
    const shoppingList = req.shoppingList;

    // Durchläuft die ausgewählten Rezepte und überprüft die `servings`
    for (const recipe of user.suggestions.selected) {
      const recipeId = recipe._id;
      const servings = recipe.servings;
      const image = recipe.image;
      const title = recipe.title;

      // Nur hinzufügen, wenn das Rezept noch nicht in der Liste ist
      if (!shoppingList.recipes.find((r) => r._id.equals(recipeId))) {
        shoppingList.recipes.push({
          _id: recipeId,
          title,
          servings,
          image,
          ingredientsAdded: false,
        });
      }
    }

    // Speichert die Zutaten der hinzugefügten Rezepte in der Einkaufsliste
    const saveList = await saveRecipeIngredients(shoppingList);
    if (!saveList) {
      throw new Error("Recipes Ingredients cannot be saved.");
    }

    // Setzt die Vorschläge zurück
    user.suggestions.selected = [];
    await user.save();

    // aktualisiert die Einkaufsliste
    req.shoppingList.items = saveList.items;

    broadcastUpdate(shoppingList);

    // Gibt die aktualisierte Einkaufsliste zurück
    return exports.read(req, res);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.leaveInvite = async (req, res) => {
  try {
    const shoppingList = req.shoppingList;
    const userId = req.user._id;

    shoppingList.sharedWith = shoppingList.sharedWith.filter((id) => !id.equals(userId));
    await shoppingList.save();

    const userShoppingList = await ShoppingList.findOne({ user: userId }).sort({ createdAt: -1 });

    if (userShoppingList) {
      return res.status(200).json({ listId: userShoppingList._id });
    } else {
      return exports.create(req, res);
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.clearInvites = async (req, res) => {
  try {
    const shoppingList = req.shoppingList;
    const { id } = req.body;

    if (!shoppingList) {
      return res.status(404).json({ error: "Shopping list not found" });
    }

    if (id) {
      shoppingList.sharedWith = shoppingList.sharedWith.filter((userId) => !userId.equals(id));
    } else {
      // Clear all IDs if no specific ID is provided
      shoppingList.sharedWith = [];
    }

    await shoppingList.save();

    return res.status(200).json({
      message: id ? `Invite with ID ${id} was removed` : "All invites were cleared",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.removeRecipe = async (req, res) => {
  try {
    const shoppingList = req.shoppingList;
    const recipeId = req.body.recipeId;

    // Prüfe, ob recipeId angegeben wurde
    if (!recipeId) {
      return res.status(400).json({ error: "Recipe ID is required" });
    }

    // Entferne die recipeId von shoppingList.recipes
    shoppingList.recipes = shoppingList.recipes.filter((recipe) => !recipe._id.equals(recipeId));

    // Entferne alle Zutaten, die zu diesem Rezept gehören
    shoppingList.items = shoppingList.items.filter((item) => !item.recipeId || !item.recipeId.equals(recipeId));

    // Speichern
    const savedList = await shoppingList.save();
    if (!savedList) {
      throw new Error("Failed to save shopping list");
    }

    // Rückgabe der aktualisierten Einkaufsliste
    req.shoppingList = savedList;
    broadcastUpdate(savedList);
    return exports.read(req, res);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.removeAllRecipes = async (req, res) => {
  try {
    const shoppingList = req.shoppingList;

    // Entferne alle IDs von shoppingList.recipes, um das Array zu leeren
    shoppingList.recipes = [];

    // Speichere die aktualisierte Einkaufsliste
    const savedList = await shoppingList.save();
    if (!savedList) {
      throw new Error("Failed to save shopping list");
    }

    // Merge das Item-Array wieder neu mit saveRecipeIngredients
    const updatedList = await saveRecipeIngredients(shoppingList);
    if (!updatedList) {
      throw new Error("Failed to update shopping list items");
    }

    // Rückgabe der aktualisierten Einkaufsliste
    req.shoppingList = savedList;
    broadcastUpdate(savedList);
    return exports.read(req, res);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.removeAllIngredients = async (req, res) => {
  try {
    const shoppingList = req.shoppingList;

    // Filtere alle Items heraus, die nicht zu einem Rezept gehören
    shoppingList.items = shoppingList.items.filter(item => !item.recipe);

    // Speichere die aktualisierte Einkaufsliste
    const savedList = await shoppingList.save();

    // Aktualisierte Einkaufsliste im Request speichern
    req.shoppingList = savedList;
    broadcastUpdate(savedList);

    // Rückgabe der aktualisierten Einkaufsliste
    return exports.read(req, res);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

// New implementations that rebuild ingredients to ensure correct aggregation updates
exports.removeRecipeFixed = async (req, res) => {
  try {
    const shoppingList = req.shoppingList;
    const recipeId = req.body.recipeId;

    if (!recipeId) {
      return res.status(400).json({ error: "Recipe ID is required" });
    }

    // Remove recipe from list and rebuild ingredients from remaining recipes
    shoppingList.recipes = shoppingList.recipes.filter((recipe) => !recipe._id.equals(recipeId));

    const updatedList = await saveRecipeIngredients(shoppingList);
    if (!updatedList) {
      throw new Error("Failed to update shopping list ingredients");
    }

    req.shoppingList = updatedList;
    broadcastUpdate(updatedList);
    return exports.read(req, res);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.removeAllRecipesFixed = async (req, res) => {
  try {
    const shoppingList = req.shoppingList;

    // Clear all attached recipes and rebuild items (leaves manual items)
    shoppingList.recipes = [];

    const updatedList = await saveRecipeIngredients(shoppingList);
    if (!updatedList) {
      throw new Error("Failed to update shopping list items");
    }

    req.shoppingList = updatedList;
    broadcastUpdate(updatedList);
    return exports.read(req, res);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.getUserShoppingList = async (req, res) => {
  try {
    const userId = req.user._id;

    // Suche nach der letzten Liste des Benutzers
    const userShoppingList = await ShoppingList.findOne({ user: userId }).sort({ createdAt: -1 });

    if (userShoppingList) {
      return res.status(200).json({ listId: userShoppingList._id });
    } else {
      return exports.create(req, res);
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.stream = (req, res) => {
  const shoppingList = req.shoppingList;

  if (!shoppingList.sharedWith || shoppingList.sharedWith.length === 0) {
    return res.status(400).json({ error: "Shopping list is not shared" });
  }

  const listId = shoppingList._id.toString();

  res.status(200).set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();

  streamManager.addClient(listId, res);

  req.on("close", () => {
    streamManager.removeClient(listId, res);
  });
};

