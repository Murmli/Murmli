const Recipe = require("../models/recipeModel.js");
const UserRecipe = require("../models/userRecipeModel.js");
const User = require("../models/userModel.js");
const {
  sortRecipeSuggestions,
  generateRecipeFilter,
} = require(`../utils/llm.js`);
const { translateRecipes } = require(`../utils/translator.js`);

async function generateSuggestions(user, count) {
  const recipeCount = count || user.suggestions.filter.recipes;
  const recipeHistoryLength = 10;
  const sampleSize = recipeCount;

  // Build a safe filter. If prompt is empty for new users, skip LLM and use an empty match.
  const hasPrompt =
    typeof user.suggestions.filter.prompt === "string" &&
    user.suggestions.filter.prompt.trim() !== "";

  let filter = { $match: {} };
  if (hasPrompt) {
    const llmFilter = await generateRecipeFilter(
      user.suggestions.filter.prompt,
      recipeCount
    );
    filter = llmFilter || { $match: {} };
  }

  // Sanitize $match to only allow known fields from the Recipe schema
  const allowedMatchFields = new Set([
    "vegetarian",
    "vegan",
    "glutenfree",
    "lactosefree",
    "preparationTime",
    "season",
    "healthRating",
    "difficultyRating",
    "priceRating",
    "sustainabilityRating",
    "everydayRating",
    "active",
  ]);
  if (filter.$match && typeof filter.$match === "object") {
    const sanitized = {};
    for (const [key, val] of Object.entries(filter.$match)) {
      if (allowedMatchFields.has(key)) {
        sanitized[key] = val;
      }
    }
    filter.$match = sanitized;
  } else {
    filter.$match = {};
  }

  // Do not clear the selected recipes when generating new suggestions.
  // The selected array should only be reset explicitly via dedicated
  // endpoints such as `clearSelectedRecipes` or `setFilter`.

  const latestUpvotesIds = user.suggestions.upvotes
    .slice(-recipeCount)
    .map((upvote) => upvote._id);
  const latestDownvotesIds = user.suggestions.downvotes
    .slice(-recipeHistoryLength)
    .map((downvote) => downvote._id);

  let matchCondition = {
    _id: { $nin: [...latestUpvotesIds, ...latestDownvotesIds] },
    active: true,
  };

  if (filter.$match && Object.keys(filter.$match).length > 0) {
    matchCondition = { $and: [matchCondition, filter.$match] };
  }

  let unsortedRecipes = await Recipe.aggregate([
    { $match: matchCondition },
    { $sample: { size: sampleSize } },
  ]);

  if (!unsortedRecipes || unsortedRecipes.length === 0) {
    const baseMatch = {
      _id: { $nin: [...latestUpvotesIds, ...latestDownvotesIds] },
      active: true,
    };
    unsortedRecipes = await Recipe.aggregate([
      { $match: baseMatch },
      { $sample: { size: sampleSize } },
    ]);

    if (!unsortedRecipes || unsortedRecipes.length === 0) {
      throw new Error("No recipes found matching the criteria");
    }
  }

  const sortedRecipes = await sortRecipeSuggestions(
    unsortedRecipes,
    user.suggestions.upvotes,
    user.suggestions.downvotes,
    user.suggestions.filter.prompt
  );
  if (!sortedRecipes) {
    throw new Error("Failed to sort recipe suggestions");
  }

  const translatedRecipes = await translateRecipes(sortedRecipes, user.language);

  return translatedRecipes.map((recipe) => ({
    title: recipe.title,
    descriptionShort: recipe.descriptionShort,
    description: recipe.description,
    image: recipe.image,
    _id: recipe._id,
  }));
}

exports.setFilter = async (req, res) => {
  try {
    const user = req.user;
    const recipes = req.body.recipes;
    const servings = req.body.servings;
    const prompt = req.body.prompt;

    if (!req.body.servings && !req.body.recipes && !req.body.prompt) {
      return res.status(400).json({ error: "At least one filter parameter is required" });
    }

    // Validate and set servings
    if (servings !== undefined && servings !== null) {
      const servingsInt = parseInt(servings, 10);
      if (isNaN(servingsInt) || !Number.isInteger(servingsInt)) {
        return res.status(400).json({ error: "Servings must be a valid integer" });
      } else {
        user.suggestions.filter.servings = servingsInt;
      }
    } else {
      // Optional: Handle case where servings is not provided (e.g., delete or keep existing)
      // delete user.suggestions.filter.servings; // Example: remove if not provided
    }

    // Validate and set recipes
    if (recipes !== undefined && recipes !== null) {
      const recipesInt = parseInt(recipes, 10);
      if (isNaN(recipesInt) || !Number.isInteger(recipesInt)) {
        return res.status(400).json({ error: "Recipes must be a valid integer" });
      } else {
        user.suggestions.filter.recipes = recipesInt;
      }
    } else {
      // Optional: Handle case where recipes is not provided
      // delete user.suggestions.filter.recipes; // Example: remove if not provided
    }

    // Validate and set prompt
    if (prompt !== undefined && prompt !== null) {
      if (typeof prompt !== "string") {
        return res.status(400).json({ error: "Prompt must be a string" });
      } else {
        user.suggestions.filter.prompt = prompt;
      }
    } else {
      // Optional: Handle case where prompt is not provided
      // delete user.suggestions.filter.prompt; // Example: remove if not provided
    }

    user.suggestions.selected = [];

    const savedUser = await user.save();

    if (!savedUser) {
      throw new Error("Failed to save user filters");
    }
    return res
      .status(200)
      .json({ message: "Filters updated successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.readFilter = async (req, res) => {
  try {
    const user = req.user;
    return res.status(200).json(user.suggestions.filter);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.getSuggestions = async (req, res) => {
  try {
    const user = req.user;
    const count = parseInt(
      req.body?.count ?? req.query?.count ?? process.env.RECIPE_SUGGESTIONS_PER_REQUEST,
      10
    );
    const suggestions = await generateSuggestions(user, count);
    return res.status(200).json(suggestions);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.voteSuggestion = async (req, res) => {
  try {
    const user = req.user;
    const recipeId = req.body.recipeId;
    const voteType = req.body.voteType;

    if (user.suggestions.selected.length >= user.suggestions.filter.recipes) {
      return res.status(200).json({ error: "Please compile your suggested recipes." });
    }

    const [systemRecipe, userRecipe] = await Promise.all([
      Recipe.findById(recipeId).lean(),
      UserRecipe.findById(recipeId).lean()
    ]);

    const recipe = systemRecipe || userRecipe;  // Nutze das erste gefundene Rezept

    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    // Remove the recipe from both arrays before adding it again
    user.suggestions.upvotes = user.suggestions.upvotes.filter(
      (vote) => vote._id.toString() !== recipeId
    );
    user.suggestions.downvotes = user.suggestions.downvotes.filter(
      (vote) => vote._id.toString() !== recipeId
    );

    if (voteType === "downvote") {
      user.suggestions.downvotes.push({ _id: recipe._id, title: recipe.title });
    } else if (voteType === "upvote") {
      user.suggestions.upvotes.push({ _id: recipe._id, title: recipe.title });

      user.suggestions.selected.push({
        _id: recipe._id,
        servings: user.suggestions.filter.servings,
        title: recipe.title,
        descriptionShort: recipe.descriptionShort,
        image: recipe.image,
      });
    } else {
      return res.status(400).json({ error: "Invalid vote type" });
    }

    await user.save();

    const selectedCount = user.suggestions.selected.length;

    if (selectedCount >= user.suggestions.filter.recipes) {
      return res.status(200).json({
        error: "Please compile your suggested recipes.",
        selectedCount,
      });
    } else {
      return res.status(201).json({
        message: "Vote successfully saved",
        selectedCount,
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.removeSelectedRecipe = async (req, res) => {
  try {
    const user = req.user;
    const recipeId = req.body.recipeId;

    if (!recipeId) {
      return res.status(400).json({ error: "recipeId is required" });
    }

    const isIdPresent = user.suggestions.selected.some((item) => item._id.toString() === recipeId); // das ist okay

    if (!isIdPresent) {
      return res.status(400).json({ error: "Recipe not found in suggestions" });
    }

    user.suggestions.selected = user.suggestions.selected.filter((item) => item._id.toString() !== recipeId);

    await user.save();

    res.status(200).json({ message: "Removed Recipe from selections successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.clearSelectedRecipes = async (req, res) => {
  try {
    const user = req.user;
    user.suggestions.selected = [];
    await user.save();

    res.status(200).json({ message: "Selected Recipes cleared successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.readSelectedRecipes = async (req, res) => {
  try {
    const user = req.user;
    if (user && user.suggestions && Array.isArray(user.suggestions.selected)) {
      return res.status(200).json({ selectedRecipes: user.suggestions.selected });
    } else {
      return res.status(200).json({ selectedRecipes: [] });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.getSelectedRecipeCount = async (req, res) => {
  try {
    const user = req.user;
    if (user && user.suggestions && Array.isArray(user.suggestions.selected)) {
      return res.status(200).json({ count: user.suggestions.selected.length });
    } else {
      return res.status(200).json({ count: 0 });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};
