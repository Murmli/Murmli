const mongoose = require('mongoose');
const { Schema } = mongoose;

const exerciseSchema = new Schema({
  name: { type: String, required: true },
  sets: { type: Number, required: true },
  measurementType: {
    type: String,
    enum: ['duration', 'weight', 'none'],
    default: 'none',
    required: true,
  },
  repetitions: { type: Number }, // optional, falls zeit- oder gewichtsbasiert
  duration: { type: Number }, // Sekunden, optional
  suggestedWeight: { type: Number, default: null }, // optional
  restBetweenSets: { type: Number, default: 60 }, // Sekunden, optional
  restAfterExercise: { type: Number, default: 120 }, // Sekunden, optionale Pause nach dieser Übung
  instructions: { type: String }, // Kurzanleitung zur Übung
  key: { type: String, required: true, default: null },
});

const daySchema = new Schema({
  weekday: {
    type: Number,
    enum: [1, 2, 3, 4, 5, 6, 7], // 1 = Montag, 7 = Sonntag
    required: true,
  },
  description: { type: String }, // Beschreibung des Trainingstags
  duration: { type: Number }, // Dauer des Trainingstages in Minuten
  exercises: [exerciseSchema],
});

const trainingPlanSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    name: { type: String, required: true },
    type: { type: String, required: true }, // Gym, Home, Outdoor, etc.
    goal: { type: String }, // optional, z.B. Muskelaufbau
    difficulty: { type: Number, min: 1, max: 5 }, // optional
    visibility: {
      type: String,
      enum: ['private', 'public'],
      default: 'private',
    },
    days: [daySchema],
    lastCompletedAt: { type: Date },
    notes: { type: String },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'archived',
    },
    startDate: { type: Date, default: null }, // optional, when the training plan starts
    durationWeeks: { type: Number, min: 1, default: 0 }, // optional, duration in weeks
  },
  { timestamps: true }
);

const TrainingPlan = mongoose.model('TrainingPlan', trainingPlanSchema, 'trainingPlans');
module.exports = TrainingPlan;

// [T]raining [P]lan [M]odel Schema for LLM
const tpmSchema = `
{
  "name": "string (Name des Plans)",
  "type": "string (z.B. Fitnessstudio, Zuhause, Draußen)",
  "goal": "string (z.B. Muskelaufbau, Ausdauer)",
  "difficulty": "number (niedrig 1–5 hoch)",
  "notes": "string (ausführliche Beschreibung zum Trainingsplan, warum er so aufgebaut ist und worauf der Fokus liegt)",
  "days": [
    {
      "weekday": "number (1-7, Montag-Sonntag)",
      "description": "string (Beschreibung des Trainingstags, was wird gemacht, worauf liegt der Fokus)",
      "duration": "number (Dauer des gesamten Trainings in Minuten)",
      "exercises": [
        {
          "name": "string (Name der Übung)",
          "sets": "number (Sätze)",
          "measurementType": "string (\"duration\" für zeitbasierte Übungen, \"weight\" für Übungen mit zusätzlichem Gewicht, \"none\" für Körpergewichtsübungen)",
          "repetitions": "number (Wiederholungen, optional, nicht bei measurementType = duration)",
          "duration": "number in Sekunden (optional, nur wenn measurementType = duration)",
          "suggestedWeight": number (optional, nur wenn measurementType = weight, vorgeschlagenes Gesamtgewicht in kg),
          "restBetweenSets": "number in Sekunden (Pause zwischen Sätzen)",
          "restAfterExercise": "number in Sekunden (Pause nach Übung zur nächsten Übung)",
          "instructions": "string (Anleitung zur korrekten Ausführung der Übung für eine komplette Wdh. Zyklus, zudem worauf man achten muss damit man sich nicht verletzt)",
          "key": "string (eindeutiger Schlüssel für die Übung in englischer Sprache, z.B. 'squat', 'bench_press')"
        }
      ]
    }
  ],
  "durationWeeks": "number (optional, sinnvolle Dauer für den Plan in Wochen)"
}
`;

module.exports.tpmSchema = tpmSchema;