module.exports = {
  name: "kalorienzaehler_zutaten",
  strict: true,
  schema: {
    type: "object",
    properties: {
      items: {
        type: "array",
        description: "Liste von Zutaten mit Ernährungsangaben.",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Name der Zutat oder des Gerichts" },
            amount: { type: "number", description: "Menge" },
            unit: { type: "string", description: "Einheit der Menge" },
            kcal: { type: "number", description: "Kaloriengehalt" },
            protein: { type: "number", description: "Proteingehalt in Gramm" },
            carbohydrates: { type: "number", description: "Kohlenhydrate in Gramm" },
            fat: { type: "number", description: "Fett in Gramm" },
            healthyRating: {
              type: "number",
              description: "Bewertung 1 sehr ungesund bis 5 sehr gesund",
              minimum: 1,
              maximum: 5
            },
            acidBaseScore: {
              type: "number",
              description: "PRAL-Score (Potential Renal Acid Load) in mEq pro angegebener Menge. Negativ = basisch, Positiv = säurebildend. Beispiele: Spinat 100g ~ -14, Rindfleisch 100g ~ +12, Reis 100g ~ +4.6, Zitrone 100g ~ -2.5"
            },
            histamineLevel: {
              type: "number",
              description: "Histamin-Stufe: 0 = kein/kaum Histamin (frisches Fleisch, frisches Gemüse), 1 = wenig Histamin (leicht verträglich), 2 = mäßig Histamin (z.B. Tomaten, Spinat, Avocado), 3 = hoch Histamin (z.B. gereifter Käse, Salami, Sauerkraut, Rotwein, Thunfisch)",
              minimum: 0,
              maximum: 3
            }
          },
          required: [
            "name",
            "amount",
            "unit",
            "kcal",
            "protein",
            "carbohydrates",
            "fat",
            "healthyRating",
            "acidBaseScore",
            "histamineLevel"
          ],
          additionalProperties: false
        }
      }
    },
    required: ["items"],
    additionalProperties: false
  }
};
