const User = require("../models/userModel.js");
const jwt = require("jsonwebtoken");
const { translateListCategories } = require("../utils/translator.js");
const { readCategoriesTranslated } = require("../utils/shoppingListUtils.js");
const ExportLink = require("../models/exportLinkModel.js");
const crypto = require("crypto");
const { languageMapRaw } = require("../languageMap.js");

/**
 * Normalize a language input so that codes are stored in the database
 * even if the request sends a descriptive string.
 *
 * @param {string} input
 * @returns {string}
 */
const normalizeLanguage = (input) => {
  if (!input) return input;
  if (languageMapRaw[input]) {
    return input; // already a code
  }
  for (const [code, desc] of Object.entries(languageMapRaw)) {
    if (desc.toLowerCase() === String(input).toLowerCase()) {
      return code;
    }
  }
  return input;
};

/**
 * Creates a new user with a generated session ID and the specified language.
 *
 * @param {Object} req - The HTTP request object.
 * @param {string} req.body.language - The language of the new user.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<Object>} - The created user's session ID.
 */
exports.sessionCreate = async (req, res) => {
  try {
    const language = normalizeLanguage(req.body.language);

    if (!language) {
      return res.status(400).json({ error: "Language is required" });
    }

    const user = new User({ language });
    const authToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

    await user.save();
    return res.status(201).json({ token: authToken });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

/**
 * Handles user login by validating the provided session ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} - A Promise that resolves when the login process is complete.
 */
exports.sessionLogin = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Invalid Token" });
    }

    const authToken = authHeader.split(" ")[1];

    let decodedToken;
    try {
      decodedToken = jwt.verify(authToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Invalid Token" });
    }

    const user = await User.findOne({ _id: decodedToken.userId });

    if (!user || user.length === 0) {
      return res.status(404).json({ error: "Token not Found" });
    } else {
      return res.status(200).json({ message: "Login Successful" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

/**
 * Updates the language preference for the authenticated user.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - The request body containing the language to update.
 * @param {string} req.body.language - The 2-letter ISO 639-1 language code to set.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<Object>} - A JSON response indicating the success or failure of the operation.
 */
exports.setLanguage = async (req, res) => {
  try {
    const { language, timezone } = req.body;
    const user = req.user;

    user.language = normalizeLanguage(language);

    if (await user.save()) {
      return res.status(200).json({ message: "Language updated successfully" });
    } else {
      return res.status(500).json({ error: "Server Error" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.getLanguage = async (req, res) => {
  try {
    const user = req.user;
    return res.status(200).json({ language: user.language });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.getRole = async (req, res) => {
  try {
    const user = req.user;
    return res.status(200).json({ role: user.role });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.getId = async (req, res) => {
  try {
    const user = req.user;
    return res.status(200).json({ id: user._id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.delete = async (req, res) => {
  try {
    const user = req.user;

    // Load models for dependencies
    const UserRecipe = require("../models/userRecipeModel.js");
    const CalorieTracker = require("../models/trackerModel.js");
    const ShoppingList = require("../models/shoppingListModel.js");

    // Delete all user-related data
    await UserRecipe.deleteMany({ userId: user._id });
    await CalorieTracker.deleteMany({ user: user._id });
    await ShoppingList.deleteMany({ user: user._id });

    // Finally, delete the user
    const deleteResult = await User.deleteOne({ _id: user._id });

    if (deleteResult.deletedCount > 0) {
      return res.status(200).json({ message: "User and all related data deleted successfully" });
    } else {
      return res.status(500).json({ error: "User deletion failed" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.setCategoriesSorting = async (req, res) => {
  try {
    const user = req.user;
    const sort = req.body.sort;

    if (!Array.isArray(sort) || !sort.every(Number.isFinite) || new Set(sort).size !== sort.length) {
      return res.status(400).json({ error: "Invalid Sort" });
    }

    user.shoppingListSort = sort;

    if (await user.save()) {
      return res.status(200).json({ message: "Sort updated successfully" });
    } else {
      return res.status(500).json({ error: "Server Error" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.getCategoriesSorting = async (req, res) => {
  try {
    const user = req.user;
    const categories = await translateListCategories(user.shoppingListSort, user.language);
    return res.status(200).json({ categories });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.readCategories = async (req, res) => {
  try {
    const user = req.user;

    // API zum Abrufen der Kategorien
    const categories = await readCategoriesTranslated(user.language);

    // Umwandeln in ein Array von Objekten
    const categoriesArray = Object.entries(categories).map(([id, name]) => ({
      id: Number(id),
      name,
    }));

    return res.status(200).json({ categories: categoriesArray });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.exportUserData = async (req, res) => {
  try {
    const user = req.user;

    // Prüfen, ob es bereits einen gültigen Link gibt
    const existingLink = await ExportLink.findOne({ userId: user._id, accessed: false });
    if (existingLink) {
      existingLink.accessed = true;
      await existingLink.save();
    }

    // Erstelle einen einzigartigen Token
    const token = crypto.randomBytes(32).toString("hex");

    // Speichere den Link in der Datenbank
    const newExportLink = new ExportLink({
      userId: user._id,
      token,
    });
    await newExportLink.save();

    // URL für den Abruf des Exports
    const downloadUrl = `${process.env.APP_URL}/api/v2/user/data/download/${token}`;

    return res.status(201).json({ message: "Export-Link erstellt", link: downloadUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.downloadExportData = async (req, res) => {
  try {
    const { token } = req.params;

    // Token in der Datenbank finden
    const exportLink = await ExportLink.findOne({ token });
    if (!exportLink || exportLink.accessed) {
      return res.status(404).json({ error: "Ungültiger oder bereits genutzter Link" });
    }

    // Benutzer abrufen
    const user = await User.findById(exportLink.userId);
    if (!user) {
      return res.status(404).json({ error: "Benutzer nicht gefunden" });
    }

    const TrainingPlan = require("../models/trainingPlanModel.js");
    const TrainingLog = require("../models/trainingLogModel.js");
    // Relevante Daten abrufen
    const UserRecipe = require("../models/userRecipeModel.js");
    const CalorieTracker = require("../models/trackerModel.js");
    const ShoppingList = require("../models/shoppingListModel.js");

    const userRecipes = await UserRecipe.find({ userId: user._id }).lean();
    const trainingPlans = await TrainingPlan.find({ user: user._id }).lean();
    const trainingLogs = await TrainingLog.find({ user: user._id }).lean();
    const calorieTrackers = await CalorieTracker.find({ user: user._id }).lean();
    const shoppingList = await ShoppingList.findOne({ user: user._id }).sort({ createdAt: -1 }).lean();

    const userObj = user.toObject();
    delete userObj._id;
    delete userObj.__v;

    const cleanRecipes = userRecipes.map(recipe => {
      delete recipe._id;
      delete recipe.__v;
      return recipe;
    });



    const cleanTrainingPlans = trainingPlans.map(plan => {
      delete plan._id;
      delete plan.__v;
      return plan;
    });

    const cleanTrainingLogs = trainingLogs.map(log => {
      delete log._id;
      delete log.__v;
      return log;
    });
    const cleanTrackers = calorieTrackers.map(tracker => {
      delete tracker._id;
      delete tracker.__v;
      return tracker;
    });

    const exportData = {
      user: userObj,
      recipes: cleanRecipes,
      calorieTrackers: cleanTrackers,
      shoppingList,
      trainingPlans: cleanTrainingPlans,
      trainingLogs: cleanTrainingLogs,
    };

    // Link als genutzt markieren
    exportLink.accessed = true;
    await exportLink.save();

    // Datei zum Download bereitstellen
    const timestamp = new Date().toISOString().split("T")[0].replace(/-/g, "");
    res.setHeader("Content-Disposition", `attachment; filename=${timestamp}_murmli_export.json`);
    res.setHeader("Content-Type", "application/json");
    return res.status(200).json(exportData);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

/**
 * Imports Nutzerdaten from an uploaded JSON file.
 * Creates a new user with the imported data and associates recipes and calorie tracker records with the new user.
 * Returns a session token and the user's current shopping list information upon successful import.
 *
 * Expected JSON structure:
 * {
 *   "user": { ... },
 *   "recipes": [ { ... }, { ... } ],
 *   "calorieTrackers": [ { ... }, ... ]
 * }
 *
 * @param {Object} req - Express request object containing the import data in req.body.
 * @param {Object} res - Express response object.
 * @returns {Promise<Object>} - JSON response with session token and shopping list info.
 */
exports.importUserData = async (req, res) => {
  try {
    // Parse the import data from the request body
    const importData = req.body;
    if (!importData || !importData.user) {
      return res.status(400).json({ error: "Invalid import data" });
    }

    // Create a new user with the imported user data
    const User = require("../models/userModel.js");
    let newUser = new User(importData.user);
    newUser = await newUser.save();

    // Import shopping list if available in the import data
    if (importData.shoppingList) {
      const ShoppingList = require("../models/shoppingListModel.js");
      let importedShoppingList = importData.shoppingList;
      // Remove _id if it exists
      if (importedShoppingList._id) delete importedShoppingList._id;
      // Set the shopping list's user to the new user's _id
      importedShoppingList.user = newUser._id;
      // Create the shopping list document
      const newShoppingList = await ShoppingList.create(importedShoppingList);
      // Update the user's shoppingList field with the new shopping list ID
      newUser.shoppingList = { id: newShoppingList._id };
      await newUser.save();
    }

    // Import recipes if available
    if (Array.isArray(importData.recipes)) {
      const UserRecipe = require("../models/userRecipeModel.js");
      for (const recipeData of importData.recipes) {
        if (recipeData._id) delete recipeData._id;
        recipeData.userId = newUser._id;
        await UserRecipe.create(recipeData);
      }
    }

    // Import calorie tracker data if available
    if (Array.isArray(importData.calorieTrackers)) {
      const CalorieTracker = require("../models/trackerModel.js");
      for (const trackerData of importData.calorieTrackers) {
        if (trackerData._id) delete trackerData._id;
        trackerData.user = newUser._id;
        await CalorieTracker.create(trackerData);
      }
    }



    // Import training plans if available
    if (Array.isArray(importData.trainingPlans)) {
      const TrainingPlan = require("../models/trainingPlanModel.js");
      for (const planData of importData.trainingPlans) {
        if (planData._id) delete planData._id;
        planData.user = newUser._id;
        await TrainingPlan.create(planData);
      }
    }

    // Import training logs if available
    if (Array.isArray(importData.trainingLogs)) {
      const TrainingLog = require("../models/trainingLogModel.js");
      for (const logData of importData.trainingLogs) {
        if (logData._id) delete logData._id;
        logData.user = newUser._id;
        await TrainingLog.create(logData);
      }
    }
    // Generate a new session token for the new user
    const jwt = require("jsonwebtoken");
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET);

    return res.status(200).json({
      token,
      shoppingList: newUser.shoppingList, // Contains the ID of the newly imported shopping list
      shoppingListSort: newUser.shoppingListSort,
      language: newUser.language,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};