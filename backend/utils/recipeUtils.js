
const recipeTitleAgent = require(`./../utils/agents/recipeTitleAgent.js`);
const recipeIngredientsAgent = require(`./../utils/agents/recipeIngredientsAgent.js`);
const recipeInstructionsAgent = require("../utils/agents/recipeInstructionsAgent.js");
const recipeAnalysisAgent = require("../utils/agents/recipeAnalysisAgent.js");
const recipeImagePromptAgent = require("../utils/agents/recipeImagePromptAgent.js");
const { roundingRules } = require(`./../utils/rules.js`);
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
    if (exclude) {
      prompt = `${prompt}. Sofern ich dies nicht explizit beschrieben habe, soll es sich unterscheiden von diesen Rezepten: ${exclude}`;
    }
    if (informationObject) {
      prompt = `${prompt}. Hier ist noch ein Object das Informationen zum User enthält: ${JSON.stringify(informationObject)}. `;
    }

    // Step 1 : Title
    const defineRecipe = await recipeTitleAgent(prompt, inputImage);
    if (!defineRecipe) {
      throw new Error("Error defining recipe.");
    } else {
      console.log('Recipe title generated: ', defineRecipe.title);
    }

    // Schritt 2: Zutaten generieren
    const ingredientsArray = await recipeIngredientsAgent(
      defineRecipe.title,
      defineRecipe.description,
      defineRecipe.descriptionShort,
      inputImage
    );
    if (!ingredientsArray) {
      throw new Error("Error generating ingredients.");
    } else {
      console.log('Ingredients generated');
    }

    // Schritt 3: Anleitungen generieren
    const stepsArray = await recipeInstructionsAgent(
      defineRecipe.title,
      defineRecipe.description,
      defineRecipe.descriptionShort,
      ingredientsArray,
      prompt
    );
    if (!stepsArray) {
      throw new Error("Error generating instructions.");
    } else {
      console.log('Instructions generated');
    }

    // Schritt 4: Rezept-Objekt zusammenstellen
    const initialRecipe = {
      title: defineRecipe.title,
      description: defineRecipe.description,
      descriptionShort: defineRecipe.descriptionShort,
      ingredients: ingredientsArray,
      steps: stepsArray,
      servings,
      type
    };

    // Schritt 5: Rezept analysieren und erweitern
    const augmentedRecipe = await recipeAnalysisAgent(initialRecipe);
    if (!augmentedRecipe) {
      throw new Error("Error analyzing recipe.");
    } else {
      console.log('Recipe created');
    }

    if (image) {
      // Schritt 6: Bildbeschreibung generieren
      const imageDescription = await recipeImagePromptAgent(augmentedRecipe);
      if (!imageDescription) {
        throw new Error("Error generating image description.");
      } else {
        console.log('Image description generated');
      }

      // Schritt 7: Bild generieren & in Azure Speicher laden
      console.log('Generate Picture now...');
      const imagePrompt = imageDescription;
      const generatedImage = await generateImage(imagePrompt);
      if (!generatedImage) {
        throw new Error("Error generating image.");
      } else {
        console.log('Image generated');
      }

      // Schritt 8: Bild in Azure Blob Storage hochladen
      const filename = `${augmentedRecipe.seoImageTitle}-${Date.now()}`;
      const imageUrl = await uploadImageToStorage(generatedImage, filename);
      if (!imageUrl) {
        throw new Error("Error uploading image.");
      } else {
        console.log('Image uploaded');
      }
      augmentedRecipe.image = imageUrl;
    } else {
      augmentedRecipe.image = "dummy";
    }

    // Schritt 9: Zusammenstellen und exportieren des Rezepts
    augmentedRecipe.active = active;
    return augmentedRecipe;
  }
  catch (err) {
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