const Recipe = require("../models/recipeModel.js");
const User = require("../models/userModel.js");
const Feedback = require("../models/feedbackModel.js");
const UserRecipe = require("../models/userRecipeModel.js");
const mongoose = require("mongoose");
const { createRecipe } = require("../utils/recipeUtils.js");
const { migrateRecipe } = require("../utils/llm.js");
const { llmClearCache } = require("../utils/llmCache.js");

exports.translate = async (req, res) => {
  try {
    const { text, outputLang } = req.body;

    if (!text || !outputLang) {
      return res.status(400).json({ error: "Invalid input. Please provide both text and outputLang." });
    }

    const translation = await generateJsonTranslation(text, outputLang);

    if (!translation) {
      return res.status(500).json({ error: "Translation failed." });
    }

    return res.status(200).json({ translation });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.generateRecipes = async (req, res) => {
  try {
    const user = req.user;
    const file = req.file ? req.file : false;
    const text = req.body.text;
    const count = parseInt(req.body.count) || 1;

    if (user.role !== "administrator") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const recipes = [];

    for (let i = 0; i < count; i++) {
      // Aggregate existing recipes
      const randomRecipes = await Recipe.aggregate([{ $sample: { size: 5 } }]);
      const exclude = randomRecipes.map((recipe) => recipe.title).join(", ");

      // Create a new recipe
      const recipe = await createRecipe(
        text,
        {
          inputImage: file,
          image: true,
          active: false,
          exclude
        });

      try {
        const newRecipe = new Recipe(recipe);
        await newRecipe.save();
        recipes.push(newRecipe);
      } catch (validationError) {
        // Debugging bei Fehler
        console.error("Validation error:", validationError.message);
        console.error(
          "Recipe causing the error:",
          JSON.stringify(recipe, null, 2)
        );
        return res.status(400).json({
          error: "Recipe validation failed",
          details: validationError.message,
        });
      }
    }

    return res.status(201).json({ recipes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.deactivateRecipe = async (req, res) => {
  try {
    const { recipeId } = req.body;

    if (!recipeId) {
      return res.status(400).json({ error: "Recipe ID is required." });
    }

    const [systemRecipe, userRecipe] = await Promise.all([
      Recipe.findById(recipeId).lean(),
      UserRecipe.findById(recipeId).lean()
    ]);

    const recipe = systemRecipe || userRecipe;  // Nutze das erste gefundene Rezept

    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found." });
    }

    return res.status(200).json({ message: "Recipe deactivated successfully.", recipe });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.rebuildOldRecipeFormat = async (req, res) => {
  try {
    const recipes = await Recipe.find({});

    for (let recipe of recipes) {
      const recipeCall = await migrateRecipe(recipe);
      if (!recipeCall) {
        console.error(`Failed to migrate recipe: ${recipe.title}`);
        continue;
      }

      recipe.servings = 4;
      recipe.description = recipeCall.description;
      recipe.ingredients = recipeCall.ingredients;
      recipe.steps = recipeCall.steps;
      recipe.nutrients = recipeCall.nutrients;
      recipe.originCountry = recipeCall.originCountry;
      recipe.season = recipeCall.season;
      recipe.lowcarb = recipeCall.lowcarb;
      recipe.lowfat = recipeCall.lowfat;
      recipe.vegetarian = recipeCall.vegetarian;
      recipe.vegan = recipeCall.vegan;
      recipe.glutenfree = recipeCall.glutenfree;
      recipe.lactosefree = recipeCall.lactosefree;
      recipe.healthRating = recipeCall.healthRating;
      recipe.difficultyRating = recipeCall.difficultyRating;
      recipe.priceRating = recipeCall.priceRating;
      recipe.sustainabilityRating = recipeCall.sustainabilityRating;
      recipe.everydayRating = recipeCall.everydayRating;

      // if null make to 0 at nutrients and gram to 1
      recipe.ingredients = recipe.ingredients.map(ingredient => {
        for (let key in ingredient) {
          if (ingredient[key] === null) {
            if (key === 'gram') {
              ingredient[key] = 1;
            } else {
              ingredient[key] = 0;
            }
          }
        }
        return ingredient;
      });

      // Bild-URL aktualisieren
      if (recipe.image && !recipe.image.startsWith("https://murmli")) {
        recipe.image = `https://murmli.blob.core.windows.net/rezeptebilder/${recipe.image}`;
      }

      // Standardwerte setzen
      recipe.active = false;
      recipe.ratings = [];
      recipe._id = new mongoose.Types.ObjectId();  // Erstelle eine neue ID
      recipe.isNew = true;  // Erzwingt, dass es als neues Dokument behandelt wird

      // Upvotes und Downvotes entfernen
      recipe.upvotes = 0;
      recipe.downvotes = 0;
      console.log('recipe', recipe);
      await recipe.save();
      console.log(`Rezept ${recipe.title} aktualisiert.`);
    }
    console.log("Alle Rezepte wurden erfolgreich aktualisiert.");
  } catch (error) {
    console.error("Fehler beim Aktualisieren der Rezepte:", error);
  }
};

exports.test = async (req, res) => {
  try {
    return res.status(200).json({ message: "Test successfully." });
  } catch (error) {
    console.error("Fehler Testfuncktion:", error);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.resetExerciseImages = async (req, res) => {
  try {
    if (req.user.role !== "administrator") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { deleteAllExerciseImages } = require('../utils/exerciseImageUtils');
    await deleteAllExerciseImages();

    return res.status(200).json({ message: "Exercise images reset" });
  } catch (error) {
    console.error("Error resetting exercise images:", error.message);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.clearLlmCache = async (req, res) => {
  try {
    if (req.user.role !== "administrator") {
      return res.status(403).json({ message: "Forbidden" });
    }

    await llmClearCache();

    return res.status(200).json({ message: "LLM cache cleared" });
  } catch (error) {
    console.error("Error clearing LLM cache:", error.message);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.getStatistics = async (req, res) => {
  try {
    if (req.user.role !== "administrator") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const User = require("../models/userModel.js");
    const UserRecipe = require("../models/userRecipeModel.js");
    const TrainingPlan = require("../models/trainingPlanModel.js");
    const TrainingLog = require("../models/trainingLogModel.js");
    const ShoppingList = require("../models/shoppingListModel.js");
    const CalorieTracker = require("../models/trackerModel.js");
    const LlmCache = require("../models/llmCacheModel.js");
    const Feedback = require("../models/feedbackModel.js");

    const now = new Date();
    const periods = {
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    };

    const getMetricForPeriod = async (model, periodMs, query = {}, dateField = "createdAt") => {
      const mid = new Date(now.getTime() - periodMs);
      const start = new Date(now.getTime() - 2 * periodMs);
      const current = await model.countDocuments({ ...query, [dateField]: { $gte: mid } });
      const previous = await model.countDocuments({ ...query, [dateField]: { $gte: start, $lt: mid } });
      return { current, previous, diff: current - previous };
    };

    const getActiveUsersForPeriod = async (periodMs) => {
      const mid = new Date(now.getTime() - periodMs);
      const start = new Date(now.getTime() - 2 * periodMs);
      const models = [
        { model: UserRecipe, field: "userId" },
        { model: TrainingPlan, field: "user" },
        { model: TrainingLog, field: "user" },
        { model: ShoppingList, field: "user" },
        { model: CalorieTracker, field: "user" },
      ];
      
      const getActiveCount = async (from, to) => {
        const activeUsers = new Set();
        for (const { model, field } of models) {
          const ids = await model.distinct(field, { updatedAt: { $gte: from, $lt: to || now } });
          ids.forEach((id) => activeUsers.add(String(id)));
        }
        return activeUsers.size;
      };

      const current = await getActiveCount(mid);
      const previous = await getActiveCount(start, mid);
      return { current, previous, diff: current - previous };
    };

    const getPlannerForPeriod = async (periodMs) => {
      const mid = new Date(now.getTime() - periodMs);
      const start = new Date(now.getTime() - 2 * periodMs);
      const getCount = async (from, to) => {
        return await User.countDocuments({
          $or: [
            { "suggestions.upvotes": { $elemMatch: { createdAt: { $gte: from, $lt: to || now } } } },
            { "suggestions.downvotes": { $elemMatch: { createdAt: { $gte: from, $lt: to || now } } } },
            { "suggestions.selected": { $elemMatch: { createdAt: { $gte: from, $lt: to || now } } } },
          ],
        });
      };
      const current = await getCount(mid);
      const previous = await getCount(start, mid);
      return { current, previous, diff: current - previous };
    };

    const results = {};
    for (const [key, ms] of Object.entries(periods)) {
      results[key] = {
        newUsers: await getMetricForPeriod(User, ms),
        calorieTrackers: await getMetricForPeriod(CalorieTracker, ms),
        shoppingLists: await getMetricForPeriod(ShoppingList, ms, {}, "updatedAt"),
        generatedRecipes: await getMetricForPeriod(UserRecipe, ms),
        trainingPlans: await getMetricForPeriod(TrainingPlan, ms),
        trainingLogs: await getMetricForPeriod(TrainingLog, ms),
        activeUsers: await getActiveUsersForPeriod(ms),
        plannerUsage: await getPlannerForPeriod(ms),
      };
    }

    const cacheSavedTotal = await LlmCache.countDocuments({});
    const unreadFeedback = await Feedback.countDocuments({ readed: false });
    const totalUsers = await User.countDocuments({});

    // Stickiness based on last 24h vs last 30d
    const activeDaily = (await getActiveUsersForPeriod(periods["24h"])).current;
    const activeMonthly = (await getActiveUsersForPeriod(periods["30d"])).current;
    const stickiness = activeMonthly > 0 ? Math.round((activeDaily / activeMonthly) * 100) : 0;

    return res.status(200).json({
      metrics: results,
      global: {
        cacheSavedTotal,
        unreadFeedback,
        totalUsers,
        stickiness,
        activeMonthly
      }
    });
  } catch (error) {
    console.error("Error collecting statistics:", error.message);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.getFeedbacks = async (req, res) => {
  try {
    if (req.user.role !== "administrator") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const Feedback = require("../models/feedbackModel.js");
    const feedbacks = await Feedback.find({})
      .populate("user", "username email")
      .populate("recipe", "title")
      .sort({ createdAt: -1 });

    return res.status(200).json({ feedbacks });
  } catch (error) {
    console.error("Error fetching feedbacks:", error.message);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.updateFeedback = async (req, res) => {
  try {
    if (req.user.role !== "administrator") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const Feedback = require("../models/feedbackModel.js");
    const { id } = req.params;
    const updateData = req.body;

    const feedback = await Feedback.findByIdAndUpdate(id, updateData, { new: true })
      .populate("user", "username email")
      .populate("recipe", "title");

    if (!feedback) {
      return res.status(404).json({ error: "Feedback not found" });
    }

    return res.status(200).json({ feedback });
  } catch (error) {
    console.error("Error updating feedback:", error.message);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.deleteFeedback = async (req, res) => {
  try {
    if (req.user.role !== "administrator") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const Feedback = require("../models/feedbackModel.js");
    const { id } = req.params;

    const feedback = await Feedback.findByIdAndDelete(id);

    if (!feedback) {
      return res.status(404).json({ error: "Feedback not found" });
    }

    return res.status(200).json({ message: "Feedback deleted successfully" });
  } catch (error) {
    console.error("Error deleting feedback:", error.message);
    return res.status(500).json({ error: "Server Error" });
  }
};

