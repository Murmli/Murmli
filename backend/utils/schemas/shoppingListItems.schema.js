module.exports = {
  name: "shopping_list_items",
  strict: true,
  schema: {
    type: "object",
    properties: {
      items: {
        type: "array",
        description: "Liste erkannter Einkaufsposten.",
        items: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Name des Artikels in der Eingabesprache."
            },
            quantity: {
              type: ["number", "null"],
              description: "Menge des Artikels, falls nicht ermittelbar null."
            },
            unit: {
              type: "integer",
              description: "ID der Einheit gemäß unitRules."
            },
            category: {
              type: "integer",
              description: "ID der Supermarktkategorie gemäß marketCategoryRules."
            }
          },
          required: ["name", "quantity", "unit", "category"],
          additionalProperties: false
        }
      }
    },
    required: ["items"],
    additionalProperties: false
  }
};
