module.exports = {
  name: "recipeTitle",
  strict: true,
  schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "Titel des Rezepts" },
      description: { type: "string", description: "Ausführliche Beschreibung des Rezepts" },
      descriptionShort: { type: "string", description: "Kurze Beschreibung des Rezepts" }
    },
    required: ["title", "description", "descriptionShort"],
    additionalProperties: false
  }
};
