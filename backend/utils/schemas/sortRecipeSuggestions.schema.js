module.exports = {
  name: "sort_recipe_suggestions",
  strict: true,
  schema: {
    type: "object",
    properties: {
      reasoning: {
        type: "string",
        description: "Kurze Begründung für die Sortierung." 
      },
      sort: {
        type: "array",
        description: "Sortierte Indexliste der Rezepte.",
        items: { type: "integer" }
      }
    },
    required: ["reasoning", "sort"],
    additionalProperties: false
  }
};
