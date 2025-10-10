module.exports = {
  name: "recipe_instructions",
  strict: true,
  schema: {
    type: "object",
    properties: {
      steps: {
        type: "array",
        description: "Kochanweisungen in chronologischer Reihenfolge",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Titel des Schrittes" },
            head: {
              type: "array",
              description: "Optionale Zutatenliste für den Schritt",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Name der Zutat" },
                  quantity: {
                    type: ["number", "null"],
                    description: "Menge der Zutat für den Schritt",
                  },
                  unit: {
                    type: ["number", "null"],
                    description: "Einheits-ID oder null, wenn keine Einheit", 
                  },
                },
                required: ["name", "quantity", "unit"],
                additionalProperties: false,
              },
            },
            content: {
              type: "string",
              description: "Ausführliche Beschreibung der Aktion",
            },
          },
          required: ["name", "head", "content"],
          additionalProperties: false,
        },
        minItems: 1,
      },
    },
    required: ["steps"],
    additionalProperties: false,
  },
};
