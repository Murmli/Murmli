const Recipe = require("./../../models/recipeModel"); // Importiere das Rezeptmodell
const { generateRecipeTitle } = require("../llm.js");

function validateAnswer(answer) {
  if (!answer || typeof answer !== 'object') {
    return false;
  }

  const requiredFields = ['title', 'description', 'descriptionShort'];

  return requiredFields.every(field =>
    typeof answer[field] === 'string' && answer[field].trim() !== ''
  );
}

async function getRandomRecipeTitles() {
  const recipes = await Recipe.aggregate([{ $sample: { size: 5 } }]);
  return recipes.map(recipe => recipe.title);
}

module.exports = async (prompt = "Erstelle ein Rezept für den Mittagstisch", image = false) => {
  try {
    const randomTitles = await getRandomRecipeTitles();
    const titleList = randomTitles.join(", ");

    const request = await generateRecipeTitle(prompt, titleList, image);

    if (!request || request === "") {
      return false;
    } else {
      if (!validateAnswer(request)) {
        return false;
      } else {
        return request;
      }
    }
  } catch (error) {
    console.error("Error:", error.message);
    return false;
  }
};
