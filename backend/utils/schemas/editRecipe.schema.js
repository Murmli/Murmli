const recipe = require('./recipe.schema.js');

module.exports = {
  name: "edit_recipe",
  strict: true,
  schema: {
    type: "object",
    properties: {
      recipe: recipe.schema,
      changes: {
        type: "array",
        description: "Liste der vorgenommenen Änderungen",
        items: { type: "string" }
      }
    },
    required: ["recipe", "changes"],
    additionalProperties: false
  }
};
