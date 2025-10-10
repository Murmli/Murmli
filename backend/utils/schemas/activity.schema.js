module.exports = {
  name: "activity_calories",
  strict: true,
  schema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Name der Aktivität" },
      duration: { type: "number", description: "Geschätzte Dauer in Minuten" },
      caloriesBurned: { type: "number", description: "Verbrauchte Kalorien" }
    },
    required: ["name", "duration", "caloriesBurned"],
    additionalProperties: false
  }
};
