const { generateRecipeImagePrompt } = require("../llm.js");

/**
 * Validates the structure and types of the recipe object.
 * @param {Object} recipe - The complete recipe object to validate.
 * @returns {boolean} - Returns true if valid, false otherwise.
 */
function validateRecipe(recipe) {
  if (typeof recipe !== "object" || recipe === null) {
    return false;
  }

  const requiredFields = ["title", "description", "descriptionShort", "ingredients", "steps"];
  const hasAllFields = requiredFields.every((field) => recipe.hasOwnProperty(field));
  if (!hasAllFields) return false;

  if (
    typeof recipe.title !== "string" ||
    typeof recipe.description !== "string" ||
    typeof recipe.descriptionShort !== "string" ||
    !Array.isArray(recipe.ingredients) ||
    !Array.isArray(recipe.steps)
  ) {
    return false;
  }

  return true;
}

/**
 * Generates an image prompt description based on the provided recipe details.
 * @param {Object} recipe - The complete recipe object.
 * @returns {Promise<string|false>} - Returns the image prompt string if successful, otherwise false.
 */
module.exports = async (recipe) => {
  try {
    // Validate input parameter
    if (!validateRecipe(recipe)) {
      throw new Error("Invalid recipe object");
    }

    // Make the API call to generate image prompt
    const response = await generateRecipeImagePrompt(recipe);

    if (!response || response === "") {
      return false;
    }

    // Optional: Further processing or validation of the response
    const imageDescription = response.trim();

    if (imageDescription.length === 0) {
      console.error("Leere Bildbeschreibung erhalten.");
      return false;
    }

    return imageDescription;
  } catch (error) {
    console.error("Error in recipeImagePromptAgent:", error.message);
    return false;
  }
};
