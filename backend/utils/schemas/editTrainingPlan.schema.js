const trainingPlan = require('./trainingPlan.schema.js');

module.exports = {
  name: "edit_training_plan",
  strict: true,
  schema: {
    type: "object",
    properties: {
      plan: trainingPlan.schema,
      changes: {
        type: "array",
        description: "Liste kurzer Beschreibungen der Änderungen",
        items: { type: "string" }
      }
    },
    required: ["plan", "changes"],
    additionalProperties: false
  }
};
