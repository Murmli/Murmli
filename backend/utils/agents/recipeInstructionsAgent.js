const { generateRecipeInstructions } = require("../llm.js");
const { unitRules } = require("../rules.js");

/**
 * Validates the structure and types of the steps array.
 * @param {Array} steps - The array of step objects to validate.
 * @returns {boolean} - Returns true if valid, false otherwise.
 */
function validateSteps(steps) {
  if (!Array.isArray(steps)) {
    return false;
  }

  const requiredStepFields = ["name", "head", "content"];
  const requiredHeadFields = ["name", "quantity", "unit"];

  return steps.every((step) => {
    // Check for required step fields
    const hasAllStepFields = requiredStepFields.every((field) =>
      step.hasOwnProperty(field)
    );
    if (!hasAllStepFields) return false;

    // Validate step field types
    if (typeof step.name !== "string" || step.name.trim() === "") return false;
    if (typeof step.content !== "string" || step.content.trim() === "") return false;

    // Validate head array
    if (!Array.isArray(step.head)) return false;

    return step.head.length === 0 || step.head.every((ingredient) => {
      // check if al lfields are there in head
      const hasAllHeadFields = requiredHeadFields.every((field) =>
        ingredient.hasOwnProperty(field)
      );
      if (!hasAllHeadFields) return false;

      // Replace null values for unit and quantity if null and not 11 for unit rules
      if (ingredient.unit === null) {
        ingredient.unit = 11; // Set unit to 0
      }
      if (ingredient.quantity === null) {
        ingredient.quantity = 1; // Set quantity to 1
      }
      // check name string
      if (typeof ingredient.name !== "string" || ingredient.name.trim() === "")
        return false;
      // check quantity number
      if (typeof ingredient.quantity !== "number" && ingredient.quantity !== null) return false;
      // check unit number
      if (
        typeof ingredient.unit !== "number" ||
        !unitRules("object").hasOwnProperty(ingredient.unit)
      )
        return false;

      return true;
    });
  });
}

/**
 * Generates a structured and efficient instructions array based on the provided recipe details.
 * @param {string} name - The name of the recipe.
 * @param {string} description - The description of the recipe.
 * @param {string} descriptionShort - A short description of the recipe.
 * @param {Array} ingredients - The array of ingredient objects.
 * @returns {Promise<Array|false>} - Returns the steps array if successful, otherwise false.
 */
module.exports = async (name, description, descriptionShort, ingredients, userPrompt) => {
  try {
    // Validate input parameters
    if (
      typeof name !== "string" ||
      typeof description !== "string" ||
      typeof descriptionShort !== "string" ||
      !Array.isArray(ingredients)
    ) {
      throw new Error("Invalid input parameters");
    }

    // Make the API call to generate steps
    const response = await generateRecipeInstructions(
      name,
      description,
      descriptionShort,
      ingredients,
      userPrompt
    );

    if (!response || response === "") {
      return false;
    }

    // Assuming the response has a "steps" field
    const { steps } = response;

    if (!validateSteps(steps)) {
      console.log(JSON.stringify(steps, null, 2));
      return false;
    }

    return steps;
  } catch (error) {
    console.error("Error in recipeInstructionsAgent:", error.message);
    return false;
  }
};
