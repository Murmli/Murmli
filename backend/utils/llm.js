// utils/llm.js

const { validateItemArray } = require("./validations.js");

// JSON-Schemata für strukturierte Antworten
const shoppingListItemsSchema = require("./schemas/shoppingListItems.schema.js");
const recipeSchema = require("./schemas/recipe.schema.js");
const recipeTitleSchema = require("./schemas/recipeTitle.schema.js");
const recipeAnalysisSchema = require("./schemas/recipeAnalysis.schema.js");
const recipeIngredientsSchema = require("./schemas/recipeIngredients.schema.js");
const recipeInstructionsSchema = require("./schemas/recipeInstructions.schema.js");
const editRecipeSchema = require("./schemas/editRecipe.schema.js");
const editTrainingPlanSchema = require("./schemas/editTrainingPlan.schema.js");
const migrateRecipeSchema = require("./schemas/migrateRecipe.schema.js");
const trainingPlanSchema = require("./schemas/trainingPlan.schema.js");
const translateSchema = require("./schemas/translate.schema.js");
const translateJsonSchema = require("./schemas/translateJson.schema.js");
const alternativeItemsSchema = require("./schemas/alternativeItems.schema.js");
const sortRecipeSuggestionsSchema = require("./schemas/sortRecipeSuggestions.schema.js");
const userRecipeSchema = require("./schemas/userRecipe.schema.js");
const nutritionItemsSchema = require("./schemas/nutritionItems.schema.js");
const activitySchema = require("./schemas/activity.schema.js");
const imageVisionSchema = require("./schemas/imageVision.schema.js");

const provider = process.env.LLM_PROVIDER || "openai";
if (!process.env.LLM_PROVIDER) {
  throw new Error("LLM_PROVIDER is not defined in environment variables");
}

const { apiCall, generateImage } = require(`./llm/${provider}.js`);

/**
 * Converts text to an array of item objects with units and categories using Google Generative AI.
 * @param {string} text - Text representation of the item.
 * @returns {Array|boolean} - Array of item objects if successful, false otherwise.
 */
exports.textToItemArray = async (text) => {
  try {
    const { itemToArraySystemPrompt } = require("./prompts.js");
    const systemPrompt = itemToArraySystemPrompt();

    const answer = await apiCall(text, { jsonSchema: shoppingListItemsSchema, systemPrompt });
    if (!answer || answer === "") {
      return false;
    } else {
      if (!validateItemArray(answer.items)) {
        return false;
      } else {
        return answer.items;
      }
    }
  } catch (error) {
    console.error("Error:", error.message);
    return false;
  }
};

exports.generateRecipeImagePrompt = async (recipe) => {
  try {
    const { recipeImagePrompt, recipeImageSystemPrompt } = require("./prompts.js");
    const prompt = recipeImagePrompt(recipe);
    const systemPrompt = recipeImageSystemPrompt();

    const response = await apiCall(prompt, {
      systemPrompt,
      json: false,
      cache: false,
    });

    return response;
  } catch (error) {
    console.error("Error generating recipe image prompt:", error.message);
    return false;
  }
};

exports.generateRecipeAnalysis = async (recipe) => {
  try {
    const { recipeAnalysisPrompt, recipeAnalysisSystemPrompt } = require("./prompts.js");
    const prompt = recipeAnalysisPrompt(recipe);
    const systemPrompt = recipeAnalysisSystemPrompt();

    const response = await apiCall(prompt, {
      systemPrompt,
      jsonSchema: recipeAnalysisSchema,
      cache: false,
    });

    return response;
  } catch (error) {
    console.error("Error generating recipe analysis:", error.message);
    return false;
  }
};

exports.generateRecipeInstructions = async (name, description, descriptionShort, ingredients, userPrompt) => {
  try {
    const { recipeInstructionsPrompt, recipeInstructionsSystemPrompt } = require("./prompts.js");
    const prompt = recipeInstructionsPrompt(
      name,
      description,
      descriptionShort,
      userPrompt,
      ingredients
    );
    const systemPrompt = recipeInstructionsSystemPrompt();

    const response = await apiCall(prompt, {
      systemPrompt,
      jsonSchema: recipeInstructionsSchema,
      cache: false,
      modelType: "high",
    });

    return response;
  } catch (error) {
    console.error("Error generating recipe instructions:", error.message);
    return false;
  }
};

exports.generateRecipeIngredients = async (name, description, descriptionShort, image) => {
  try {
    const { recipeIngredientsPrompt, recipeIngredientsSystemPrompt } = require("./prompts.js");
    const prompt = recipeIngredientsPrompt(name, description, descriptionShort);
    const systemPrompt = recipeIngredientsSystemPrompt();

    const param = {
      systemPrompt,
      jsonSchema: recipeIngredientsSchema,
      cache: false,
      modelType: "high",
    };

    if (image) {
      param.files = [image];
    }

    const response = await apiCall(prompt, param);
    return response;
  } catch (error) {
    console.error("Error generating recipe ingredients:", error.message);
    return false;
  }
};

exports.generateRecipeTitle = async (prompt, titleList, image) => {
  try {
    const { recipeTitleSystemPrompt } = require("./prompts.js");
    const systemPrompt = recipeTitleSystemPrompt(titleList);

    const params = {
      systemPrompt,
      jsonSchema: recipeTitleSchema,
      cache: false,
    };

    if (image) {
      params.files = [image];
    }

    const request = await apiCall(prompt, params);

    return request;
  } catch (error) {
    console.error("Error generating recipe title:", error.message);
    return false;
  }
};

exports.editTextTrainingPlanWithLLM = async (plan, text, language) => {
  try {
    const { tpmSchema } = require("../models/trainingPlanModel.js");
    const { editTextTrainingPlanSystemPrompt } = require("./prompts.js");

    const systemPrompt = editTextTrainingPlanSystemPrompt(tpmSchema, plan, language);
      const llmResponse = await apiCall(text, { jsonSchema: editTrainingPlanSchema, cache: false, systemPrompt });

    return llmResponse;
  } catch (error) {
    console.error("Error editing training plan with LLM:", error.message);
    return false;
  }
};

exports.generateTrainingPlanFromText = async (
  text,
  user,
  existingExerciseNames,
  bodySummary = null,
  historySummary = null
) => {
  try {
    const { generateTrainingPlanSystemPrompt } = require("./prompts.js");

    const systemPrompt = generateTrainingPlanSystemPrompt(
      user.language,
      user,
      existingExerciseNames,
      bodySummary,
      historySummary
    );

      const answer = await apiCall(text, {
        jsonSchema: trainingPlanSchema,
        cache: false,
        modelType: "high",
        systemPrompt,
      });

    return answer;
  } catch (error) {
    console.error("Error generating training plan from text:", error.message);
    return false;
  }
};

exports.generateTrainingPlanContinuation = async (
  basePlan,
  text,
  user,
  existingExerciseNames,
  bodySummary = null,
  historySummary = null,
  basePlanExerciseNames = []
) => {
  try {
    const { generateTrainingPlanContinuationSystemPrompt } = require("./prompts.js");

    const systemPrompt = generateTrainingPlanContinuationSystemPrompt(
      user.language,
      user,
      basePlan,
      existingExerciseNames,
      bodySummary,
      historySummary,
      basePlanExerciseNames
    );

    const promptText = text && text.trim().length
      ? text
      : "Erstelle eine Fortsetzung basierend auf dem vorhandenen Trainingsplan.";

    const answer = await apiCall(promptText, {
      jsonSchema: trainingPlanSchema,
      cache: false,
      modelType: "high",
      systemPrompt,
    });

    return answer;
  } catch (error) {
    console.error("Error generating training plan continuation:", error.message);
    return false;
  }
};

exports.migrateRecipe = async (recipe) => {
  try {
    const { migrateRecipeSystemPrompt, migrateRecipePrompt } = require("./prompts.js");

    const ingredientNames = recipe.ingredients.map(ingredient => ingredient.name).join(", ");
    const systemPrompt = migrateRecipeSystemPrompt();
    const createRecipePrompt = migrateRecipePrompt(
      recipe.title,
      recipe.descriptionShort,
      ingredientNames
    );

      const recipeCall = await apiCall(createRecipePrompt, { jsonSchema: migrateRecipeSchema, systemPrompt, modelType: "high" });
    return recipeCall;
  } catch (error) {
    console.error("Error migrating recipe:", error.message);
    return false;
  }
};

exports.editRecipeWithLLM = async (recipe, text, language) => {
  try {
    const { rpmSchema } = require("../models/recipeModel.js");
    const { editRecipeSystemPrompt } = require("./prompts.js");

    const systemPrompt = editRecipeSystemPrompt(
      rpmSchema,
      recipe,
      language
    );

      const llmResponse = await apiCall(text, {
        jsonSchema: editRecipeSchema,
        cache: false,
        systemPrompt,
      });

    if (!llmResponse) {
      return false;
    }

    let updatedRecipeData;
    let changeSummary = [];

    if (llmResponse.recipe) {
      updatedRecipeData = llmResponse.recipe;
      changeSummary = Array.isArray(llmResponse.changes) ? llmResponse.changes : [];
    } else {
      updatedRecipeData = llmResponse;
    }

    return { updatedRecipeData, changeSummary };
  } catch (error) {
    console.error("Error editing recipe with LLM:", error.message);
    return false;
  }
};

/**
 * Generates a translation for the provided text using the specified output language.
 *
 * @param {string} text - The text to be translated.
 * @param {string} outputLang - The target language for the translation.
 * @returns {Promise<string|false>} - The translated text, or `false` if an error occurs.
 */
exports.generateTranslation = async (text, outputLang, optionalInfo = false) => {
  try {
    const { translateSystemPrompt } = require("./prompts.js");
    const systemPrompt = translateSystemPrompt(outputLang, optionalInfo);
      const answer = await apiCall(text, { jsonSchema: translateSchema, cache: true, systemPrompt });

    if (!answer) {
      return false;
    } else {
      return answer.translation;
    }
  } catch (error) {
    console.error("Error:", error.message);
    return false;
  }
};

/**
 * Generates a JSON translation of the provided text using the specified output language.
 *
 * @param {string} text - The text to be translated.
 * @param {string} outputLang - The target language for the translation.
 * @returns {Promise<object|false>} Object mit den übersetzten Werten oder `false` bei Fehlern.
 */
exports.generateJsonTranslation = async (text, outputLang) => {
  try {
    const { translateJsonSystemPrompt } = require("./prompts.js");
    const systemPrompt = translateJsonSystemPrompt(outputLang);
    const answer = await apiCall(text, { jsonSchema: translateJsonSchema, systemPrompt });

    if (!answer) {
      return false;
    }

    if (Array.isArray(answer.translation)) {
      const mapped = {};
      for (const { key, value } of answer.translation) {
        mapped[key] = value;
      }
      return mapped;
    }

    return answer.translation;
  } catch (error) {
    console.error("Error:", error.message);
    return false;
  }
};

exports.findAlternativeItems = async (itemName, outputLang) => {
  try {
    const { findAlternativeItemsPrompt } = require("./prompts.js");
    const prompt = findAlternativeItemsPrompt(itemName, outputLang);
    const answer = await apiCall(prompt, { jsonSchema: alternativeItemsSchema });

    if (!answer) {
      return false;
    } else {
      return answer;
    }
  } catch (error) {
    console.error("Error:", error.message);
    return false;
  }
};

exports.generateRecipeFilter = async (text, recipeCount) => {
  try {
    const { generateRecipeFilterSystemPrompt } = require("./prompts.js");
    const systemPrompt = generateRecipeFilterSystemPrompt(recipeCount);
    const prompt = text || "Ich habe keine extrawünsche";
    const answer = await apiCall(prompt, { json: true, cache: false, systemPrompt });

    if (!answer) {
      return false;
    }

    if (typeof answer === "string") {
      try {
        return JSON.parse(answer);
      } catch (error) {
        console.error("Error parsing recipe filter:", error.message);
        return false;
      }
    }

    return answer;
  } catch (error) {
    console.error("Error:", error.message);
    return false;
  }
};

exports.sortRecipeSuggestions = async (unsortedRecipes, latestUpvote, latestDownvote, text) => {
  try {
    const unsortedRecipeTitles = unsortedRecipes.map((recipe, index) => `${index}. ${recipe.title}`).join(", ");
    const latestUpvoteTitles = latestUpvote
      .slice(-5)
      .map((upvote) => upvote.title)
      .join(", ");
    const latestDownvoteTitles = latestDownvote
      .slice(-5)
      .map((downvote) => downvote.title)
      .join(", ");

    const { sortRecipeSuggestionsSystemPrompt, sortRecipeSuggestionsPrompt } = require("./prompts.js");
    const systemPrompt = sortRecipeSuggestionsSystemPrompt();
    const prompt = sortRecipeSuggestionsPrompt(unsortedRecipeTitles, latestUpvoteTitles, latestDownvoteTitles, text);
      const answer = await apiCall(prompt, { systemPrompt, jsonSchema: sortRecipeSuggestionsSchema, cache: false });

    if (!answer.sort) {
      return false;
    } else {
      const sortedRecipes = answer.sort.map((index) => unsortedRecipes[index]);
      return sortedRecipes;
    }
  } catch (error) {
    console.error("Error:", error.message);
    return false;
  }
};

exports.generateUserRecipe = async (text, file, outputLang) => {
  try {
    const { generateUserRecipePrompt } = require("./prompts.js");

    const prompt = generateUserRecipePrompt(text, outputLang);

      const apiOptions = {
        cache: false,
        jsonSchema: userRecipeSchema,
        modelType: "high",
      };

    if (file) {
      apiOptions.files = [file];
    }

    const answer = await apiCall(prompt, apiOptions);
    if (!answer) {
      return false;
    } else {
      delete answer.ingredientsPlanning;
      return answer;
    }
  } catch (error) {
    console.error("Error:", error.message);
    return false;
  }
};

exports.textToTrack = async (text) => {
  try {
    const { textToTrackerArraySystemPrompt } = require("./prompts.js");

    const systemPrompt = textToTrackerArraySystemPrompt();

      const apiOptions = {
        cache: true,
        jsonSchema: nutritionItemsSchema,
        systemPrompt,
      };

    const answer = await apiCall(text, apiOptions);
    if (!answer) {
      return false;
    } else {
      // Immer ein Array zurückgeben, auch wenn nur ein einzelnes Objekt vorhanden ist
      if (answer.items === undefined || answer.items === null) {
        return false;
      }
      const items = Array.isArray(answer.items) ? answer.items : [answer.items];
      return items;
    }
  } catch (error) {
    console.error("Error:", error.message);
    return false;
  }
};

exports.textToActivity = async (text, gender, height, weight) => {
  try {
    const { textToActivitySystemPrompt, textToActivityPrompt } = require("./prompts.js");

    const systemPrompt = textToActivitySystemPrompt();
    const prompt = textToActivityPrompt(text, gender, height, weight);


    const apiOptions = {
      systemPrompt,
      cache: true,
      jsonSchema: activitySchema,
    };

    const answer = await apiCall(prompt, apiOptions);
    if (!answer) {
      return false;
    } else {
      return answer;
    }
  } catch (error) {
    console.error("Error:", error.message);
    return false;
  }
};

exports.askCalorieTracker = async (question, tracker, bodydata, outputLang) => {
  try {
    const { askCalorieTrackerSystemPrompt } = require("./prompts.js");

    const systemPrompt = askCalorieTrackerSystemPrompt(tracker, bodydata, outputLang);

    const prompt = question;

    const apiOptions = {
      systemPrompt,
      cache: false,
      json: false,
    };

    const answer = await apiCall(prompt, apiOptions);

    if (!answer) {
      return false;
    } else {
      return answer;
    }
  } catch (error) {
    console.error("Error:", error.message);
    return false;
  }
};

exports.askTrainingPlan = async (question, logs, currentDate, outputLang) => {
  try {
    const { askTrainingPlanSystemPrompt } = require("./prompts.js");

    const systemPrompt = askTrainingPlanSystemPrompt(logs, currentDate, outputLang);

    const apiOptions = {
      systemPrompt,
      cache: false,
      json: false,
    };

    const answer = await apiCall(question, apiOptions);
    return answer ? answer : false;
  } catch (error) {
    console.error("Error:", error.message);
    return false;
  }
};

exports.imageToTrack = async (file, comment, outputLang) => {
  try {
    const { imageToTrackArray } = require("./prompts.js");

    const prompt = imageToTrackArray(comment, outputLang);

    const apiOptions = {
      cache: false,
      jsonSchema: imageVisionSchema,
      files: [file],
    };

    const answer = await apiCall(prompt, apiOptions);
    if (!answer) {
      return false;
    } else {
      if (typeof answer.vision === 'string') {
        return answer.vision;
      } else {
        throw new Error("Invalid answer format: expected a string.");
      }
    }
  } catch (error) {
    console.error("Error:", error.message);
    return false;
  }
};

exports.generateImage = async (input) => {
  try {
    const answer = await generateImage(input);
    if (!answer) {
      return false;
    } else {
      return answer
    }
  } catch (error) {
    console.error("Error:", error.message);
    return false;
  }
};
/**
 * Analyzes a completed training log and provides insights.
 * @param {object} trainingLog - The completed training log object.
 * @returns {Promise<object|false>} - An object with analysis results, or false if an error occurs.
 */
exports.analyzeTrainingLog = async ({ currentLog, previousLogs, outputLang = "de-DE" }) => {
  try {
    const {
      trainingLogFeedbackSystemPrompt,
      trainingLogFeedbackPrompt,
    } = require("./prompts.js");

    const systemPrompt = trainingLogFeedbackSystemPrompt(outputLang);
    const prompt = trainingLogFeedbackPrompt(currentLog, previousLogs);

    const answer = await apiCall(prompt, {
      systemPrompt,
      cache: false,
      json: false,
    });

    if (!answer) {
      return false;
    }

    return {
      analysisText: answer,
      currentLog,
      previousLogs,
    };
  } catch (error) {
    console.error("Error analyzing training log:", error.message);
    return false;
  }
};

exports.trainingLogToActivity = async ({ currentLog, user }) => {
  try {
    const {
      trainingLogCaloriesSystemPrompt,
      trainingLogCaloriesPrompt,
    } = require("./prompts.js");

    const systemPrompt = trainingLogCaloriesSystemPrompt();
    const prompt = trainingLogCaloriesPrompt(currentLog, user);

    const answer = await apiCall(prompt, {
      systemPrompt,
      cache: false,
      jsonSchema: activitySchema,
    });

    if (!answer) {
      return false;
    }
    return answer;
  } catch (error) {
    console.error("Error converting training log to activity:", error.message);
    return false;
  }
};
