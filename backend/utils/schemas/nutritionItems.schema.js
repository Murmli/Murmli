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
            "healthyRating"
          ],
          additionalProperties: false
        }
      }
    },
    required: ["items"],
    additionalProperties: false
  }
};
