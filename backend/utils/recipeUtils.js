
const recipeTitleAgent = require(`./../utils/agents/recipeTitleAgent.js`);
const recipeIngredientsAgent = require(`./../utils/agents/recipeIngredientsAgent.js`);
const recipeInstructionsAgent = require("../utils/agents/recipeInstructionsAgent.js");
const recipeAnalysisAgent = require("../utils/agents/recipeAnalysisAgent.js");
const recipeImagePromptAgent = require("../utils/agents/recipeImagePromptAgent.js");
const { roundingRules } = require(`./../utils/rules.js`);

const { createRecipe } = require('../utils/llm.js');
const { generateImage, uploadImageToStorage } = require(`../utils/imageUtils.js`);

exports.createRecipe = async (prompt, {
  inputImage = false,
  image = false,
  type = "recipe",
  active = true,
  servings = 4,
  exclude = false,
  informationObject = false
} = {}) => {
  try {
    // Consolidated LLM call
    const recipeData = await createRecipe(prompt, { inputImage, exclude, informationObject, servings });

    if (!recipeData) {
      throw new Error("Error creating recipe.");
    } else {
      console.log('Recipe generated:', recipeData.title);
    }

    // Filter out empty steps (steps with empty name or content)
    if (recipeData.steps && Array.isArray(recipeData.steps)) {
      recipeData.steps = recipeData.steps.filter(step => {
        const hasName = step.name && step.name.trim() !== '';
        const hasContent = step.content && step.content.trim() !== '';
        return hasName && hasContent;
      });
    }

    // Set additional properties
    recipeData.type = type;
    recipeData.active = active;
    recipeData.provider = "AI";
    // Ensure servings match 
    if (!recipeData.servings) recipeData.servings = servings;

    if (image) {
      console.log('Generate Picture now...');
      const imagePrompt = recipeData.imageDescription;

      if (imagePrompt) {
        const generatedImage = await generateImage(imagePrompt);
        if (!generatedImage) {
          console.error("Error generating image.");
        } else {
          console.log('Image generated');
          const filename = `${recipeData.seoImageTitle || 'recipe'}-${Date.now()}`;
          const imageUrl = await uploadImageToStorage(generatedImage, filename);
          if (!imageUrl) {
            console.error("Error uploading image.");
          } else {
            console.log('Image uploaded');
            recipeData.image = imageUrl;
          }
        }
      }
    }

    if (!recipeData.image) {
      recipeData.image = "dummy";
    }

    return recipeData;
  } catch (err) {
    console.error(err);
    return false;
  }
}

exports.scaleRecipe = (recipe, requestedServings) => {
  if (!recipe || !recipe.servings || !recipe.ingredients) {
    throw new Error("Invalid recipe data");
  }

  const currentServings = recipe.servings;
  const scaleFactor = requestedServings / currentServings;

  // Zutaten skalieren
  const scaledIngredients = recipe.ingredients.map((ingredient) => {
    const scaledQuantity = ingredient.quantity * scaleFactor;
    const roundedQuantity = roundQuantity(scaledQuantity, ingredient.unit);
    const scaledGram = ingredient.gram ? ingredient.gram * scaleFactor : null;
    return { ...ingredient, quantity: roundedQuantity, gram: scaledGram };
  });

  // Schritte skalieren (falls notwendig)
  const scaledSteps = recipe.steps
    ? recipe.steps.map((step) => {
      const scaledHead = step.head
        ? step.head.map((headItem) => {
          if (headItem.quantity) {
            const scaledQuantity = headItem.quantity * scaleFactor;
            const roundedQuantity = roundQuantity(scaledQuantity, headItem.unit);
            return { ...headItem, quantity: roundedQuantity };
          }
          return headItem;
        })
        : [];
      return { ...step, head: scaledHead };
    })
    : [];

  // Skalierte Rezeptdaten zurückgeben
  const scaledRecipe = {
    ...recipe,
    ingredients: scaledIngredients,
    steps: scaledSteps,
    servings: requestedServings,
  };

  return scaledRecipe;
};

// HELPER for scaleRecipe
function roundQuantity(quantity, unit) {
  if (unit === null || quantity === null) {
    return quantity;
  }

  const roundings = roundingRules("object");

  const roundingFactor = roundings[unit] || 1;

  const roundedQuantity = Math.round(quantity / roundingFactor) * roundingFactor;

  const minQuantity = roundingFactor || 1;

  if (roundedQuantity === 0) {
    return minQuantity;
  } else {
    return roundedQuantity;
  }
}