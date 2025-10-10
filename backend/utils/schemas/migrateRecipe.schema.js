const recipe = require('./recipe.schema.js');

module.exports = {
  name: "migrate_recipe",
  strict: true,
  schema: recipe.schema
};
