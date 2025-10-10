module.exports = {
  name: "recipe_ingredients",
  strict: true,
  schema: {
    type: "object",
    properties: {
      ingredients: {
        type: "array",
        description: "Liste der Zutaten für vier Portionen",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Name der Zutat" },
            carbohydrates: { type: "number", description: "Kohlenhydrate in Gramm" },
            fat: { type: "number", description: "Fett in Gramm" },
            protein: { type: "number", description: "Protein in Gramm" },
            kilocalories: { type: "number", description: "Kilokalorien" },
            category: {
              type: "number",
              description: "Kategorie-ID entsprechend marketCategoryRules",
            },
            unitWeight: {
              type: ["number", "null"],
              description: "Gewicht einer Einheit in Gramm, wenn vorhanden",
            },
            fiber: { type: "number", description: "Ballaststoffe in Gramm" },
            quantity: { type: "number", description: "Menge der Zutat" },
            unit: {
              type: "number",
              description: "Einheits-ID entsprechend unitRules",
            },
            gram: { type: "number", description: "Gramm-Anteil für die Menge" },
          },
          required: [
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
          ],
          additionalProperties: false,
        },
        minItems: 1,
      },
    },
    required: ["ingredients"],
    additionalProperties: false,
  },
};
