const Recipe = require("../models/recipeModel.js");
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
    const TrainingPlan = require("../models/trainingPlanModel.js");
    const TrainingLog = require("../models/trainingLogModel.js");
    const ShoppingList = require("../models/shoppingListModel.js");
    const CalorieTracker = require("../models/trackerModel.js");
    const LlmCache = require("../models/llmCacheModel.js");
    const Feedback = require("../models/feedbackModel.js");

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    const day = startOfDay.getDay();
    const diffToMonday = (day + 6) % 7; // Monday as start of week
    startOfWeek.setDate(startOfDay.getDate() - diffToMonday);

    const startOfYesterday = new Date(startOfDay);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    const startOfLast7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfPrevious7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const usersLast7Days = await User.countDocuments({ createdAt: { $gte: startOfLast7Days } });
    const usersPrevious7Days = await User.countDocuments({
      createdAt: { $gte: startOfPrevious7Days, $lt: startOfLast7Days },
    });
    const usersLast7DaysDiff = usersLast7Days - usersPrevious7Days;

    const usersToday = await User.countDocuments({ createdAt: { $gte: startOfDay } });
    const usersYesterday = await User.countDocuments({
      createdAt: { $gte: startOfYesterday, $lt: startOfDay },
    });
    const usersThisWeek = await User.countDocuments({ createdAt: { $gte: startOfWeek } });
    const usersLastWeek = await User.countDocuments({
      createdAt: { $gte: startOfLastWeek, $lt: startOfWeek },
    });

    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recipesLast24h = await Recipe.countDocuments({ createdAt: { $gte: last24h } });
    const trainingPlansLast24h = await TrainingPlan.countDocuments({ createdAt: { $gte: last24h } });

    const plannerUsersTotal = await User.countDocuments({
      'suggestions.downvotes': { $ne: [] },
    });

    const plannerUsersToday = await User.countDocuments({
      $or: [
        { 'suggestions.upvotes': { $elemMatch: { createdAt: { $gte: startOfDay } } } },
        { 'suggestions.downvotes': { $elemMatch: { createdAt: { $gte: startOfDay } } } },
        { 'suggestions.selected': { $elemMatch: { createdAt: { $gte: startOfDay } } } },
      ],
    });

    const plannerUsersYesterday = await User.countDocuments({
      $or: [
        {
          'suggestions.upvotes': {
            $elemMatch: { createdAt: { $gte: startOfYesterday, $lt: startOfDay } },
          },
        },
        {
          'suggestions.downvotes': {
            $elemMatch: { createdAt: { $gte: startOfYesterday, $lt: startOfDay } },
          },
        },
        {
          'suggestions.selected': {
            $elemMatch: { createdAt: { $gte: startOfYesterday, $lt: startOfDay } },
          },
        },
      ],
    });

    const plannerUsersThisWeek = await User.countDocuments({
      $or: [
        { 'suggestions.upvotes': { $elemMatch: { createdAt: { $gte: startOfWeek } } } },
        { 'suggestions.downvotes': { $elemMatch: { createdAt: { $gte: startOfWeek } } } },
        { 'suggestions.selected': { $elemMatch: { createdAt: { $gte: startOfWeek } } } },
      ],
    });

    const plannerUsersLastWeek = await User.countDocuments({
      $or: [
        {
          'suggestions.upvotes': {
            $elemMatch: { createdAt: { $gte: startOfLastWeek, $lt: startOfWeek } },
          },
        },
        {
          'suggestions.downvotes': {
            $elemMatch: { createdAt: { $gte: startOfLastWeek, $lt: startOfWeek } },
          },
        },
        {
          'suggestions.selected': {
            $elemMatch: { createdAt: { $gte: startOfLastWeek, $lt: startOfWeek } },
          },
        },
      ],
    });

    const shoppingListUsersToday = (
      await ShoppingList.distinct('user', { updatedAt: { $gte: startOfDay } })
    ).length;
    const shoppingListUsersYesterday = (
      await ShoppingList.distinct('user', {
        updatedAt: { $gte: startOfYesterday, $lt: startOfDay },
      })
    ).length;
    const shoppingListUsersThisWeek = (
      await ShoppingList.distinct('user', { updatedAt: { $gte: startOfWeek } })
    ).length;
    const shoppingListUsersLastWeek = (
      await ShoppingList.distinct('user', {
        updatedAt: { $gte: startOfLastWeek, $lt: startOfWeek },
      })
    ).length;

    const calorieEntryFilter = {
      $or: [
        { 'foodItems.0': { $exists: true } },
        { 'activities.0': { $exists: true } },
      ],
    };

    const calorieTrackerUsersTotal = (
      await CalorieTracker.distinct('user', calorieEntryFilter)
    ).length;
    const calorieTrackerUsersToday = (
      await CalorieTracker.distinct('user', {
        ...calorieEntryFilter,
        updatedAt: { $gte: startOfDay },
      })
    ).length;
    const calorieTrackerUsersYesterday = (
      await CalorieTracker.distinct('user', {
        ...calorieEntryFilter,
        updatedAt: { $gte: startOfYesterday, $lt: startOfDay },
      })
    ).length;
    const calorieTrackerUsersThisWeek = (
      await CalorieTracker.distinct('user', {
        ...calorieEntryFilter,
        updatedAt: { $gte: startOfWeek },
      })
    ).length;
    const calorieTrackerUsersLastWeek = (
      await CalorieTracker.distinct('user', {
        ...calorieEntryFilter,
        updatedAt: { $gte: startOfLastWeek, $lt: startOfWeek },
      })
    ).length;

    const models = [
      { model: UserRecipe, field: 'userId' },
      { model: TrainingPlan, field: 'user' },
      { model: TrainingLog, field: 'user' },
      { model: ShoppingList, field: 'user' },
      { model: CalorieTracker, field: 'user' },
    ];

    const activeToday = new Set();
    const activeYesterday = new Set();
    const activeWeek = new Set();
    const activeLastWeek = new Set();

    for (const { model, field } of models) {
      const todayIds = await model.distinct(field, { updatedAt: { $gte: startOfDay } });
      todayIds.forEach((id) => activeToday.add(String(id)));
      const yesterdayIds = await model.distinct(field, {
        updatedAt: { $gte: startOfYesterday, $lt: startOfDay },
      });
      yesterdayIds.forEach((id) => activeYesterday.add(String(id)));
      const weekIds = await model.distinct(field, { updatedAt: { $gte: startOfWeek } });
      weekIds.forEach((id) => activeWeek.add(String(id)));
      const lastWeekIds = await model.distinct(field, {
        updatedAt: { $gte: startOfLastWeek, $lt: startOfWeek },
      });
      lastWeekIds.forEach((id) => activeLastWeek.add(String(id)));
    }

    const activeUsersToday = activeToday.size;
    const activeUsersYesterday = activeYesterday.size;
    const activeUsersThisWeek = activeWeek.size;
    const activeUsersLastWeek = activeLastWeek.size;

    const usersTodayDiff = usersToday - usersYesterday;
    const usersThisWeekDiff = usersThisWeek - usersLastWeek;
    const activeUsersTodayDiff = activeUsersToday - activeUsersYesterday;
    const activeUsersThisWeekDiff = activeUsersThisWeek - activeUsersLastWeek;
    const plannerUsersTodayDiff = plannerUsersToday - plannerUsersYesterday;
    const plannerUsersThisWeekDiff = plannerUsersThisWeek - plannerUsersLastWeek;
    const shoppingListUsersTodayDiff = shoppingListUsersToday - shoppingListUsersYesterday;
    const shoppingListUsersThisWeekDiff = shoppingListUsersThisWeek - shoppingListUsersLastWeek;
    const calorieTrackerUsersTodayDiff =
      calorieTrackerUsersToday - calorieTrackerUsersYesterday;
    const calorieTrackerUsersThisWeekDiff =
      calorieTrackerUsersThisWeek - calorieTrackerUsersLastWeek;

    const trainingLogsThisWeek = await TrainingLog.countDocuments({ createdAt: { $gte: startOfWeek } });
    const trainingLogsLastWeek = await TrainingLog.countDocuments({
      createdAt: { $gte: startOfLastWeek, $lt: startOfWeek },
    });
    const trainingLogsThisWeekDiff = trainingLogsThisWeek - trainingLogsLastWeek;

    // Smart Stats
    // 1. AI Efficiency
    const cacheSavedTotal = await LlmCache.countDocuments({});

    // 2. Feedback
    const unreadFeedback = await Feedback.countDocuments({ readed: false });

    // 3. Stickiness (DAU/MAU)
    // MAU = Active users in last 30 days
    const startOfLast30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const activeMonthly = new Set();

    for (const { model, field } of models) {
      const monthlyIds = await model.distinct(field, { updatedAt: { $gte: startOfLast30Days } });
      monthlyIds.forEach((id) => activeMonthly.add(String(id)));
    }
    const activeUsersMonthly = activeMonthly.size;

    let stickiness = 0;
    if (activeUsersMonthly > 0) {
      stickiness = Math.round((activeUsersToday / activeUsersMonthly) * 100);
    }

    return res.status(200).json({
      cacheSavedTotal,
      unreadFeedback,
      activeUsersMonthly,
      stickiness,
      usersToday,
      usersThisWeek,
      usersLast7Days,
      usersLast7DaysDiff,
      usersLast30Days: await User.countDocuments({ createdAt: { $gte: startOfLast30Days } }),
      usersLast90Days: await User.countDocuments({ createdAt: { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) } }),
      activeUsersToday,
      activeUsersThisWeek,
      recipesLast24h,
      trainingPlansLast24h,
      plannerUsersTotal,
      plannerUsersToday,
      plannerUsersThisWeek,
      shoppingListUsersToday,
      shoppingListUsersThisWeek,
      calorieTrackerUsersTotal,
      calorieTrackerUsersToday,
      calorieTrackerUsersThisWeek,
      usersYesterday,
      usersLastWeek,
      activeUsersYesterday,
      activeUsersLastWeek,
      plannerUsersYesterday,
      plannerUsersLastWeek,
      shoppingListUsersYesterday,
      shoppingListUsersLastWeek,
      calorieTrackerUsersYesterday,
      calorieTrackerUsersLastWeek,
      usersTodayDiff,
      usersThisWeekDiff,
      activeUsersTodayDiff,
      activeUsersThisWeekDiff,
      plannerUsersTodayDiff,
      plannerUsersThisWeekDiff,
      shoppingListUsersTodayDiff,
      shoppingListUsersThisWeekDiff,
      calorieTrackerUsersTodayDiff,
      calorieTrackerUsersThisWeekDiff,
      trainingLogsThisWeek,
      trainingLogsLastWeek,
      trainingLogsThisWeekDiff,
    });
  } catch (error) {
    console.error("Error collecting statistics:", error.message);
    return res.status(500).json({ error: "Server Error" });
  }
};
