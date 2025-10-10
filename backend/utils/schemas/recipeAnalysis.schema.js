module.exports = {
  name: "recipe_analysis",
  strict: true,
  schema: {
    type: "object",
    properties: {
      servings: { type: "number", description: "Anzahl der Portionen" },
      preparationTime: { type: "number", description: "Zubereitungszeit in Minuten" },
      season: {
        type: "number",
        description:
          "Saison 0=Ganzjährig,1=Frühling,2=Sommer,3=Herbst,4=Winter",
      },
      originCountry: {
        type: "string",
        description: "Zwei-Buchstaben-Ländercode in Kleinbuchstaben",
      },
      lowcarb: { type: "boolean", description: "Geeignet für Low-Carb" },
      lowfat: { type: "boolean", description: "Fettarm" },
      vegetarian: { type: "boolean", description: "Vegetarisch" },
      vegan: { type: "boolean", description: "Vegan" },
      glutenfree: { type: "boolean", description: "Glutenfrei" },
      lactosefree: { type: "boolean", description: "Laktosefrei" },
      healthRating: {
        type: "number",
        description: "Gesundheitsbewertung 1-10",
      },
      difficultyRating: {
        type: "number",
        description: "Schwierigkeitsgrad 1-10",
      },
      priceRating: {
        type: "number",
        description: "Kostenbewertung 1-10",
      },
      sustainabilityRating: {
        type: "number",
        description: "Nachhaltigkeitsbewertung 1-10",
      },
      everydayRating: {
        type: "number",
        description: "Alltagstauglichkeit 1-10",
      },
      nutrients: {
        type: "object",
        description: "Nährwerte pro Portion",
        properties: {
          kilocalories: { type: "number", description: "Kilokalorien" },
          fat: { type: "number", description: "Fett in Gramm" },
          protein: { type: "number", description: "Protein in Gramm" },
          carbohydrates: { type: "number", description: "Kohlenhydrate in Gramm" },
        },
        required: [
          "kilocalories",
          "fat",
          "protein",
          "carbohydrates",
        ],
        additionalProperties: false,
      },
      seoImageTitle: {
        type: "string",
        description: "SEO-Titel ohne Dateiendung, Unterstriche statt Leerzeichen",
      },
    },
    required: [
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
    ],
    additionalProperties: false,
  },
};

