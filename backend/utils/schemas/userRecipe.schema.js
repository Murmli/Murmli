const recipe = require('./recipe.schema.js');

module.exports = {
  name: "user_recipe",
  strict: true,
  schema: {
    type: "object",
    properties: {
      imageVision: {
        type: ["string", "null"],
        description: "Beschreibung des Bildinhalts oder null." 
      },
      ingredientsPlanning: {
        type: "string",
        description: "Auflistung geplanter Zutaten aus Text oder Bild." 
      },
      reasoning: {
        type: "string",
        description: "Begründung für die Rezeptzusammenstellung." 
      },
      seoImageTitle: {
        type: "string",
        description: "SEO-optimierter Titel für das Rezeptbild." 
      },
      title: recipe.schema.properties.title,
      descriptionShort: recipe.schema.properties.descriptionShort,
      ingredients: recipe.schema.properties.ingredients,
      steps: recipe.schema.properties.steps,
      servings: recipe.schema.properties.servings,
      preparationTime: recipe.schema.properties.preparationTime,
      season: recipe.schema.properties.season,
      originCountry: {
        type: "string",
        description: "Zwei-Buchstaben-Ländercode." 
      },
      type: recipe.schema.properties.type,
      lowcarb: { type: "boolean", description: "Low-Carb geeignet" },
      lowfat: { type: "boolean", description: "Fettarm" },
      vegetarian: recipe.schema.properties.vegetarian,
      vegan: recipe.schema.properties.vegan,
      glutenfree: recipe.schema.properties.glutenfree,
      lactosefree: recipe.schema.properties.lactosefree,
      healthRating: recipe.schema.properties.healthRating,
      difficultyRating: recipe.schema.properties.difficultyRating,
      priceRating: recipe.schema.properties.priceRating,
      sustainabilityRating: recipe.schema.properties.sustainabilityRating,
      everydayRating: recipe.schema.properties.everydayRating,
      nutrients: recipe.schema.properties.nutrients
    },
    required: [
      "imageVision",
      "ingredientsPlanning",
      "reasoning",
      "seoImageTitle",
      "title",
      "descriptionShort",
      "ingredients",
      "steps",
      "servings",
      "preparationTime",
      "season",
      "originCountry",
      "type",
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
      "nutrients"
    ],
    additionalProperties: false
  }
};
