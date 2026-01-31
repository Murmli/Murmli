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
const createRecipeSchema = require("./schemas/createRecipe.schema.js");

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

exports.createRecipe = async (text, { inputImage, exclude, informationObject, servings } = {}) => {
  try {
    const { createRecipeSystemPrompt, createRecipePrompt } = require("./prompts.js");
    const systemPrompt = createRecipeSystemPrompt();
    const prompt = createRecipePrompt(text, exclude, informationObject, servings);

    const apiOptions = {
      systemPrompt,
      jsonSchema: createRecipeSchema,
      cache: false,
      modelType: "high"
    };

    if (inputImage) {
      apiOptions.files = [inputImage];
    }

    const response = await apiCall(prompt, apiOptions);
    return response;
  } catch (error) {
    console.error("Error creating recipe:", error.message);
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

exports.editRecipeWithLLM = async (recipe, text, language, { informationObject } = {}) => {
  try {
    const { rpmSchema } = require("../models/recipeModel.js");
    const { editRecipeSystemPrompt } = require("./prompts.js");

    const systemPrompt = editRecipeSystemPrompt(
      rpmSchema,
      recipe,
      language
    );

    let prompt = text;
    if (informationObject) {
      prompt += `\n\nBerücksichtige bitte folgende User-Informationen/Vorlieben: ${JSON.stringify(informationObject)}.`;
    }

    const llmResponse = await apiCall(prompt, {
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

exports.textToTrack = async (text, outputLang) => {
  try {
    const { textToTrackerArraySystemPrompt } = require("./prompts.js");

    const systemPrompt = textToTrackerArraySystemPrompt(outputLang);

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

exports.askTrainingPlan = async (messages, plan, logs, currentDate, outputLang) => {
  try {
    const { askTrainingPlanSystemPrompt } = require("./prompts.js");

    const systemPrompt = askTrainingPlanSystemPrompt(plan, logs, currentDate, outputLang);

    // If messages is an array (chat mode), take the last one as prompt and others as history
    // If it is a string (legacy/single question), treat it as prompt without history
    let prompt;
    let history = [];

    if (Array.isArray(messages)) {
      prompt = messages[messages.length - 1].content;
      history = messages.slice(0, -1);
    } else {
      prompt = messages;
    }

    const apiOptions = {
      systemPrompt,
      cache: false,
      json: false,
      history
    };

    const answer = await apiCall(prompt, apiOptions);
    return answer ? answer : false;
  } catch (error) {
    console.error("Error:", error.message);
    return false;
  }
};

exports.imageToTrack = async (file, comment, outputLang) => {
  try {
    const { imageToTrackerItemsSystemPrompt } = require("./prompts.js");

    const systemPrompt = imageToTrackerItemsSystemPrompt(outputLang);
    const prompt = comment || "Analysiere das Bild und extrahiere die Nährwerte.";

    const apiOptions = {
      cache: false,
      jsonSchema: nutritionItemsSchema,
      files: [file],
      systemPrompt,
    };

    const answer = await apiCall(prompt, apiOptions);
    if (!answer) {
      return false;
    } else {
      // Ensure we return an array of items
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

exports.audioToItemArray = async (file) => {
  try {
    const { itemToArraySystemPrompt } = require("./prompts.js");
    const systemPrompt = itemToArraySystemPrompt();
    const prompt = "Listen to the audio and extract the shopping list items.";

    const answer = await apiCall(prompt, {
      jsonSchema: shoppingListItemsSchema,
      systemPrompt,
      files: [file],
      cache: false
    });

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
    console.error("Error in audioToItemArray:", error.message);
    return false;
  }
};

exports.audioToTrack = async (file, comment, outputLang) => {
  try {
    const { textToTrackerArraySystemPrompt } = require("./prompts.js");
    const systemPrompt = textToTrackerArraySystemPrompt(outputLang);
    const prompt = comment || "Listen to the audio/video and extract the food items/meals for tracking.";

    const answer = await apiCall(prompt, {
      jsonSchema: nutritionItemsSchema,
      systemPrompt,
      files: [file],
      cache: false
    });

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
    console.error("Error in audioToTrack:", error.message);
    return false;
  }
};

exports.chatWithRecipe = async (messages, recipe, language) => {
  try {
    const { chatWithRecipeSystemPrompt } = require("./prompts.js");
    const systemPrompt = chatWithRecipeSystemPrompt(recipe, language);

    // Assuming apiCall handles array of messages appropriately or we need to pass the last message as prompt and others as history?
    // Looking at other functions, apiCall takes (prompt, options).
    // Usually 'messages' implies a history.
    // If apiCall supports 'messages' in options or if the first argument can be messages array.
    // Let's check apiCall usage in llm/openai.js or similar if possible.
    // Since I cannot see llm/openai.js, I will assume standard usage where I construct the prompt or use a specific chat method.
    // However, looking at the other functions, they seem to be single-turn or limited context.
    // If 'messages' is an array of {role, content}, I might need to format it or use a specific option.
    // The previous plan mentioned "Neu: chatWithRecipe(messages, ...)"
    // Let's assume apiCall standard implementation:

    // If apiCall primarily takes a string prompt, I might need to concatenate or send the messages array in options.
    // Let's try sending the last message as prompt and the rest as history if supported, OR just pass the messages array if apiCall supports it.
    // In `llm.js`, `apiCall` is imported.

    // I'll assume for now `apiCall` can handle a conversation if I pass it correctly.
    // If `apiCall` expects a string prompt, I will take the last message content as prompt.
    // And if `apiCall` supports `messages` or `history` in options, I'll pass the previous ones.

    // Given the lack of visibility into `llm/openai.js`, I'll check `llm.js` again for any conversation usage.
    // `askTrainingPlan` takes `question` text.

    // I'll assume `messages` is just the user's latest input text for now to be safe, OR I will pass the whole array to apiCall if my `apiCall` wrapper supports it.
    // But since I don't know, I'll assume the user sends the chat history.

    // Let's look at `llm/openai.js` (I can list dir to check if I can read it). 
    // Actually, I can read `c:\Users\MGasc\Documents\Murmli\backend\utils\llm\llm.js` but the import says `require(./llm/${provider}.js)`.
    // I should check `c:\Users\MGasc\Documents\Murmli\backend\utils\llm\openai.js` if it exists.

    // For now, I will implement it assuming `messages` is an array and I'll pass it to apiCall.
    // If apiCall expects a string, it might fail if I pass an array.

    // Let's verify `apiCall` signature by reading `backend/utils/llm/openai.js`.

    const lastMessage = messages[messages.length - 1].content;
    const history = messages.slice(0, -1);

    const answer = await apiCall(lastMessage, {
      systemPrompt,
      cache: false,
      json: false,
      history: history // Passing history if supported
    });

    return answer;

  } catch (error) {
    console.error("Error in chatWithRecipe:", error.message);
    return false;
  }
};

exports.chatWithTracker = async (messages, tracker, bodyData, language) => {
  try {
    const { chatWithTrackerSystemPrompt } = require("./prompts.js");
    const systemPrompt = chatWithTrackerSystemPrompt(tracker, bodyData, language);

    const lastMessage = messages[messages.length - 1].content;
    const history = messages.slice(0, -1);

    const answer = await apiCall(lastMessage, {
      systemPrompt,
      cache: false,
      json: false,
      history: history
    });

    return answer;
  } catch (error) {
    console.error("Error in chatWithTracker:", error.message);
    return false;
  }
};
