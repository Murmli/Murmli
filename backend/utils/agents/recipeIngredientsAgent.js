const { generateRecipeIngredients } = require("../llm.js");
const { unitRules, marketCategoryRules } = require("../rules.js");

// Define the available units and categories for validation
const units = unitRules("json");
const categories = marketCategoryRules("json");

/**
 * Validates the structure and types of the ingredients array.
 * @param {Array} ingredients - The array of ingredient objects to validate.
 * @returns {boolean} - Returns true if valid, false otherwise.
 */
function validateIngredients(ingredients) {
  if (!Array.isArray(ingredients)) {
    return false;
  }

  const requiredFields = [
    "name",
    "carbohydrates",
    "fat",
    "protein",
    "kilocalories",
    "category",
    "unitWeight",
    "fiber",
    "quantity",
    "unit",
    "gram",
  ];

  return ingredients.every((ingredient) => {
    // Check for required fields
    const hasAllFields = requiredFields.every((field) =>
      ingredient.hasOwnProperty(field)
    );
    if (!hasAllFields) return false;

    return true;
  });
}

/**
 * Generates an ingredients for 4 Portions, array based on the provided recipe details.
 * @param {string} name - The name of the recipe.
 * @param {string} description - The description of the recipe.
 * @param {string} descriptionShort - A short description of the recipe.
 * @returns {Promise<Array|false>} - Returns the ingredients array if successful, otherwise false.
 */
module.exports = async (name, description, descriptionShort, image = false) => {
  try {
    const response = await generateRecipeIngredients(name, description, descriptionShort, image);

    if (!response || response === "") {
      return false;
    }

    // Assuming the response has an "ingredients" field
    const { ingredients } = response;

    if (!validateIngredients(ingredients)) {
      return false;
    }

    return ingredients;
  } catch (error) {
    console.error("Error in recipeIngredientsAgent:", error.message);
    return false;
  }
};
