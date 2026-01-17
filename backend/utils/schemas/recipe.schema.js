module.exports = {
  name: "recipe",
  strict: true,
  schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "Titel des Rezepts" },
      description: { type: "string", description: "Ausführliche Beschreibung" },
      descriptionShort: { type: "string", description: "Kurze Beschreibung" },
      ingredients: {
        type: "array",
        description: "Liste der Zutaten",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Name der Zutat, kurz, ohne weitere Zusätze in Klammern dahinter" },
            carbohydrates: { type: "number", description: "Kohlenhydrate pro Portion" },
            fat: { type: "number", description: "Fett pro Portion" },
            protein: { type: "number", description: "Protein pro Portion" },
            kilocalories: { type: "number", description: "Kilokalorien pro Portion" },
            category: { type: "number", description: "Kategorie-ID" },
            season: { type: ["string", "null"], description: "Saison der Zutat" },
            unitWeight: { type: ["number", "null"], description: "Gewicht eines Stücks" },
            fiber: { type: ["number", "null"], description: "Ballaststoffe" },
            quantity: { type: ["number", "null"], description: "Menge der Zutat" },
            unit: { type: "number", description: "Einheits-ID" },
            gram: { type: ["number", "null"], description: "Gewicht in Gramm" }
          },
          required: [
            "name",
            "carbohydrates",
            "fat",
            "protein",
            "kilocalories",
            "category",
            "season",
            "unitWeight",
            "fiber",
            "quantity",
            "unit",
            "gram"
          ],
          additionalProperties: false
        }
      },
      steps: {
        type: "array",
        description: "Kochanleitung Schritt für Schritt",
        items: {
          type: "object",
          properties: {
            head: {
              type: "array",
              description: "Zutatenliste für diesen Schritt",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Zutatenname" },
                  quantity: { type: "number", description: "Menge" },
                  unit: { type: "number", description: "Einheits-ID" },
                  addition: { type: ["string", "null"], description: "Zusatzangabe" }
                },
                required: ["name", "quantity", "unit", "addition"],
                additionalProperties: false
              }
            },
            content: { type: "string", description: "Beschreibung des Schritts" },
            name: { type: "string", description: "Kurzer Titel des Schritts" }
          },
          required: ["head", "content", "name"],
          additionalProperties: false
        }
      },
      servings: { type: "number", description: "Anzahl Portionen" },
      preparationTime: { type: "number", description: "Zubereitungszeit in Minuten" },
      season: { type: "number", description: "Saison 0=Ganzjährig,1=Frühling,2=Sommer,3=Herbst,4=Winter" },
      vegetarian: { type: "boolean", description: "Vegetarisch" },
      vegan: { type: "boolean", description: "Vegan" },
      glutenfree: { type: "boolean", description: "Glutenfrei" },
      lactosefree: { type: "boolean", description: "Laktosefrei" },
      healthRating: { type: "number", description: "Gesundheitsbewertung 1-10" },
      difficultyRating: { type: "number", description: "Schwierigkeit 1-10" },
      priceRating: { type: "number", description: "Kostenbewertung 1-10" },
      sustainabilityRating: { type: "number", description: "Nachhaltigkeitsbewertung 1-10" },
      everydayRating: { type: "number", description: "Alltagstauglichkeit 1-10" },
      image: { type: ["string", "null"], description: "Bild-URL" },
      nutrients: {
        type: "object",
        description: "Nährwerte pro Portion",
        properties: {
          kilocalories: { type: "number", description: "Kilokalorien" },
          fat: { type: "number", description: "Fett" },
          protein: { type: "number", description: "Protein" },
          carbohydrates: { type: "number", description: "Kohlenhydrate" }
        },
        required: ["kilocalories", "fat", "protein", "carbohydrates"],
        additionalProperties: false
      },
      type: { type: "string", description: "Typ, z.B. recipe" },
      provider: { type: "string", description: "Quelle oder Ersteller" }
    },
    required: [
      "title",
      "description",
      "descriptionShort",
      "ingredients",
      "steps",
      "servings",
      "preparationTime",
      "season",
      "vegetarian",
      "vegan",
      "glutenfree",
      "lactosefree",
      "healthRating",
      "difficultyRating",
      "priceRating",
      "sustainabilityRating",
      "everydayRating",
      "image",
      "nutrients",
      "type",
      "provider"
    ],
    additionalProperties: false
  }
};
