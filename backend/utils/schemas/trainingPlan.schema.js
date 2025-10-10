module.exports = {
  name: "training_plan",
  strict: true,
  schema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Name des Plans" },
      type: { type: "string", description: "Trainingsumgebung" },
      goal: { type: "string", description: "Trainingsziel" },
      difficulty: { type: "number", description: "Schwierigkeit 1-5" },
      notes: { type: "string", description: "Beschreibung des Plans" },
      days: {
        type: "array",
        description: "Trainingstage",
        items: {
          type: "object",
          properties: {
            weekday: { type: "number", description: "Wochentag 1-7" },
            description: { type: "string", description: "Beschreibung des Trainingstags" },
            duration: { type: "number", description: "Dauer des Trainings in Minuten" },
            exercises: {
              type: "array",
              description: "Übungen des Tages",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Name der Übung" },
                  sets: { type: "number", description: "Anzahl Sätze" },
                  measurementType: {
                    type: "string",
                    description: "Messmethode: duration, weight oder none"
                  },
                  repetitions: { type: ["number", "null"], description: "Wiederholungen" },
                  duration: { type: ["number", "null"], description: "Dauer in Sekunden" },
                  suggestedWeight: { type: ["number", "null"], description: "Vorgeschlagenes Gewicht in kg" },
                  restBetweenSets: { type: "number", description: "Pause zwischen Sätzen in Sekunden" },
                  restAfterExercise: { type: "number", description: "Pause nach der Übung in Sekunden" },
                  instructions: { type: "string", description: "Ausführungsbeschreibung" },
                  key: { type: "string", description: "Eindeutiger Schlüssel für Bildgenerierung, es soll den Namen der übung auf englisch beinhalten, lowercase" }
                },
                required: [
                  "name",
                  "sets",
                  "measurementType",
                  "repetitions",
                  "duration",
                  "suggestedWeight",
                  "restBetweenSets",
                  "restAfterExercise",
                  "instructions",
                  "key"
                ],
                additionalProperties: false
              }
            }
          },
          required: ["weekday", "description", "duration", "exercises"],
          additionalProperties: false
        }
      },
      durationWeeks: { type: "number", description: "Gesamtdauer des Plans in Wochen" }
    },
    required: ["name", "type", "goal", "difficulty", "notes", "days", "durationWeeks"],
    additionalProperties: false
  }
};
