const { unitRules, marketCategoryRules } = require("./rules.js");
const { validateItemArray } = require("./validations.js");
const { generateJsonTranslation } = require(`./llm.js`);
const { scaleRecipe } = require(`./recipeUtils.js`);
const InviteCode = require("../models/inviteCodeModel.js");
const Recipe = require("../models/recipeModel.js");
const UserRecipe = require("../models/userRecipeModel.js");

/**
 * Merge two arrays of shopping list items.
 *
 * Items that share the same name, unit and origin (recipe or manual) are
 * combined so that their quantities sum up. Only active items are considered
 * for merging. This keeps duplicates from piling up when users add the same
 * ingredient multiple times.
 *
 * @param {Object[]} existingItems - Current shopping list items.
 * @param {Object[]} newIngredient - New items to merge into the list.
 * @returns {Object[]} The merged array of shopping list items.
 */
exports.mergeItemArrays = (existingItems, newIngredient) => {
  const mergedItems = [...existingItems];

  newIngredient.forEach((newItem) => {
    const normalizedRecipe = Boolean(newItem.recipe);
    const normalizedName = newItem.name ? newItem.name.toLowerCase() : "";
    const normalizedUnit =
      typeof newItem.unit === "string" ? Number(newItem.unit) : newItem.unit;

    const existingItemIndex = mergedItems.findIndex((item) => {
      const itemUnit = typeof item.unit === "string" ? Number(item.unit) : item.unit;
      return (
        item.active &&
        Boolean(item.recipe) === normalizedRecipe &&
        (item.name ? item.name.toLowerCase() : "") === normalizedName &&
        itemUnit === normalizedUnit
      );
    });

    if (existingItemIndex !== -1) {
      const existingItem = mergedItems[existingItemIndex];
      const existingQty =
        typeof existingItem.quantity === "number"
          ? existingItem.quantity
          : parseFloat(existingItem.quantity);
      const newQty =
        typeof newItem.quantity === "number"
          ? newItem.quantity
          : parseFloat(newItem.quantity);

      if (!isNaN(existingQty) && !isNaN(newQty)) {
        existingItem.quantity = existingQty + newQty;
      } else if ((existingItem.quantity == null || isNaN(existingQty)) && !isNaN(newQty)) {
        existingItem.quantity = newQty;
      }
      return;
    }

    mergedItems.push({ active: true, recipe: false, ...newItem });
  });

  return mergedItems;
};

/**
 * Converts text representation of an item into an array of items.
 * @param {string} text - Text representation of the item.
 * @returns {Array} - Array of items.
 */
exports.itemToArray = (text) => {
  try {
    // const ingredientRegex = /^(\d+(?:[.,]\d+)?)\s*(prise|gramm|dose|liter|zehen|zehe|pack|packung|flasche|flaschen|stücke|stück|kg|ml|ms|st|el|tl|l|g)?\s*(.*)?$/i;
    const ingredientRegex = /^(\d+(?:[.,]\d+)?)?\s*(prise|gramm|dose|liter|zehen|zehe|pack|packung|flasche|flaschen|stücke|stück|kg|ml|ms|st|el|tl|l|g)?\s*(.*)?$/i;
    let matches = ingredientRegex.exec(text);

    // CHECK 1: RegEx
    if (matches) {
      const newItems = [
        {
          quantity: matches[1] || null,
          unit: matches[2] || null,
          name: matches[3] || null,
        },
      ];
      return newItems;
    }
    // CHECK 2: Only one Word
    else if (text.split(" ").length === 1) {
      const newItems = [
        {
          quantity: null,
          unit: null,
          name: text,
        },
      ];
      return newItems;
    }
  } catch (error) {
    console.error("Regex Error");
  }
};

/**
 * Validates an array of item objects.
 * @param {Array} itemArray - Array of item objects to be validated.
 * @returns {boolean} - True if the item array is valid, false otherwise.
 */
exports.validateItemArray = (itemArray) => {
  try {
    const validUnits = unitRules("object");
    const validCategories = marketCategoryRules("object");

    if (!Array.isArray(itemArray)) {
      return false;
    }

    for (const item of itemArray) {
      if (typeof item.name !== "string" || item.name.trim() === "") {
        return false;
      }
      if (!("quantity" in item) || (item.quantity !== null && typeof item.quantity !== "number")) {
        return false;
      }
      if (!("unit" in item) || (item.unit !== null && !(item.unit in validUnits))) {
        return false;
      }
      if (typeof item.category !== "number" || !(item.category in validCategories)) {
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

exports.sortItemById = (items, sortArray) => {
  try {
    items.sort((a, b) => {
      const indexA = sortArray.indexOf(a.category);
      const indexB = sortArray.indexOf(b.category);

      const sortIndexA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
      const sortIndexB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;

      if (sortIndexA === sortIndexB) {
        if (a.category === b.category) {
          return a.name.localeCompare(b.name);
        }
        return a.category - b.category;
      }

      return sortIndexA - sortIndexB;
    });

    return items;
  } catch (error) {
    console.error(error);
    return false;
  }
};

exports.deleteExpiredInvites = async () => {
  try {
    const validityLimit = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    const deletion = await InviteCode.deleteMany({ createdAt: { $lt: validityLimit } });
    if (deletion) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error(error);
    return false;
  }
};

exports.generateInviteCode = async (listId) => {
  try {
    if (!listId) {
      return false;
    }

    await this.deleteExpiredInvites(listId);

    // prüfen obschon ein code vorahdnen ist, wenn ja dan nreturn false
    const existingCode = await InviteCode.findOne({ listId: listId });
    if (existingCode) {
      return false;
    }

    let inviteCode;
    let isUnique = false;

    while (!isUnique) {
      inviteCode = Math.floor(10000 + Math.random() * 90000).toString();
      const existingCode = await InviteCode.findOne({ code: inviteCode, listId: listId });
      if (!existingCode) {
        isUnique = true;
      }
    }

    const newInvite = new InviteCode({
      code: inviteCode,
      listId: listId,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    });

    const savedInvite = await newInvite.save();
    if (savedInvite) {
      return inviteCode;
    } else {
      return false;
    }
  } catch (error) {
    console.error(error);
    return false;
  }
};

exports.mergeRecipeIngredients = async (items, ingredientItems) => {
  try {
    const recipeItems = ingredientItems.map((item) => ({
      ...item,
      recipe: true,
    }));

    const filteredItems = items.filter((item) => !(item.recipe && item.active));

    const mergedItems = [...filteredItems, ...recipeItems];

    if (!validateItemArray(mergedItems)) {
      throw new Error("Invalid Item Array");
    } else {
      return mergedItems;
    }
  } catch (error) {
    console.error(error);
    return false;
  }
};

exports.readCategoriesTranslated = async (language) => {
  try {
    const validCategories = marketCategoryRules("json");
    const translatedCategories = await generateJsonTranslation(validCategories, language);
    return translatedCategories;
  } catch (error) {
    console.error(error);
    return false;
  }
};

/**
 * Rebuilds all recipe-based ingredients for the given shopping list
 * from the current set of attached recipes and their servings.
 *
 * Rationale: When multiple recipes contribute the same ingredient, they are
 * merged (summed). If a recipe is later removed, the quantities must be
 * decremented accordingly. To guarantee correctness, we recompute all recipe
 * ingredients from scratch on each update and merge them with manual items.
 */
exports.saveRecipeIngredients = async (shoppingList) => {
  try {
    // 1) Collect all ingredient items from ALL recipes currently attached
    const ingredientItems = [];

    for (const recipeEntry of shoppingList.recipes) {
      const [recipe, userRecipe] = await Promise.all([
        Recipe.findById(recipeEntry._id).lean(),
        UserRecipe.findById(recipeEntry._id).lean(),
      ]);

      const finalRecipe = recipe || userRecipe;
      if (!finalRecipe) continue;

      const scaledRecipe = scaleRecipe(finalRecipe, recipeEntry.servings);
      const formattedIngredients = scaledRecipe.ingredients.map((ingredient) => ({
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        category: ingredient.category,
        recipe: true,
        recipeId: finalRecipe._id,
        active: true,
      }));

      ingredientItems.push(...formattedIngredients);
    }

    // 2) Start with all manual items (non-recipe) and merge the rebuilt recipe ingredients
    const manualItems = shoppingList.items.filter((item) => !item.recipe);
    let mergedItems = [...manualItems];
    ingredientItems.forEach((ingredient) => {
      mergedItems = exports.mergeItemArrays(mergedItems, [ingredient]);
    });

    shoppingList.items = mergedItems;

    // 3) Mark all recipes as having their ingredients added (recomputed)
    shoppingList.recipes = shoppingList.recipes.map((r) => ({ ...r, ingredientsAdded: true }));

    // 4) Persist changes
    const saved = await shoppingList.save();
    if (!saved) {
      throw new Error("Failed to save the list with rebuilt ingredients");
    }
    return shoppingList;
  } catch (err) {
    console.error(err);
    throw new Error("Server Error while saving recipe ingredients");
  }
};
