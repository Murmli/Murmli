const { seasonRules } = require("../rules.js");
const seasons = seasonRules("json");
const { generateRecipeAnalysis } = require("../llm.js");
const provider = process.env.LLM_PROVIDER || "openai";

/**
 * Validates the structure and types of the analysis data.
 * @param {Object} analysis - The analysis object to validate.
 * @returns {boolean} - Returns true if valid, false otherwise.
 */
function validateAnalysis(analysis) {
  if (typeof analysis !== "object" || analysis === null) {
    return false;
  }

  const requiredFields = [
    "servings",
    "preparationTime",
    "season",
    "originCountry",
    "lowcarb",
    "lowfat",
    "vegetarian",
    "vegan",
    "glutenfree",
    "lactosefree",
    "healthRating",
    "difficultyRating",
    "priceRating",
    "sustainabilityRating",
    "everydayRating",
    "nutrients",
    "seoImageTitle",
  ];

  // Check for required fields
  const hasAllFields = requiredFields.every((field) =>
    analysis.hasOwnProperty(field)
  );
  if (!hasAllFields) return false;

  // Validate types
  if (
    typeof analysis.servings !== "number" ||
    typeof analysis.preparationTime !== "number" ||
    typeof analysis.season !== "number" ||
    typeof analysis.originCountry !== "string"
  )
    return false;

  const booleanFields = [
    "lowcarb",
    "lowfat",
    "vegetarian",
    "vegan",
    "glutenfree",
    "lactosefree",
  ];
  for (const field of booleanFields) {
    if (typeof analysis[field] !== "boolean") return false;
  }

  const ratingFields = [
    "healthRating",
    "difficultyRating",
    "priceRating",
    "sustainabilityRating",
    "everydayRating",
  ];
  for (const field of ratingFields) {
    if (
      typeof analysis[field] !== "number" ||
      analysis[field] < 1 ||
      analysis[field] > 10
    )
      return false;
  }

  if (
    typeof analysis.nutrients !== "object" ||
    analysis.nutrients === null ||
    typeof analysis.nutrients.kilocalories !== "number" ||
    typeof analysis.nutrients.fat !== "number" ||
    typeof analysis.nutrients.protein !== "number" ||
    typeof analysis.nutrients.carbohydrates !== "number"
  )
    return false;

  // Anpassung der Regex für seoImageTitle, um Großbuchstaben zu erlauben
  if (typeof analysis.seoImageTitle !== "string") return false;

  return true;
}

/**
 * Generates an analysis object based on the provided recipe details.
 * @param {Object} recipe - The complete recipe object.
 * @returns {Promise<Object|false>} - Returns the analysis object if successful, otherwise false.
 */
module.exports = async (recipe) => {
  try {
    // Validate input parameter
    if (typeof recipe !== "object" || recipe === null) {
      throw new Error("Invalid recipe object");
    }

    // Make the API call to generate analysis
    const response = await generateRecipeAnalysis(recipe);

    if (!response || response === "") {
      return false;
    }

    // Assuming the response includes the additional fields
    const analysis = response;

    if (!validateAnalysis(analysis)) {
      console.error("Validation failed for analysis:", analysis);
      return false;
    }

    // Merge the analysis into the original recipe
    const augmentedRecipe = {
      ...recipe,
      ...analysis,
    };

    // set provider
    augmentedRecipe.provider = provider;

    return augmentedRecipe;
  } catch (error) {
    console.error("Error in recipeAnalysisAgent:", error.message);
    return false;
  }
};
