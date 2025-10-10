const mongoose = require('mongoose');
const { Schema } = mongoose;

const setSchema = new Schema({
  repetitions: { type: Number }, // optional
  duration: { type: Number }, // Sekunden, optional
  weight: { type: Number }, // optional
  restAfterSet: { type: Number }, // Sekunden, optional
  completed: { type: Boolean, default: false },
});

const exerciseLogSchema = new Schema({
  name: { type: String },
  trainingPlanExercise: { type: Schema.Types.ObjectId, ref: 'TrainingPlan.days.exercises' }, // Referenz zur Übung im Trainingsplan
  image: { type: String, default: null },
  restAfterExercise: { type: Number }, // Sekunden, optional - Hinzugefügt
  measurementType: {
    type: String,
    enum: ['duration', 'weight', 'none'],
    default: 'none',
    required: true,
  },
  difficulty: { type: Number, min: 1, max: 10 }, // Empfundene Anstrengung
  sets: [setSchema],
});

const trainingLogSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    trainingPlan: { type: Schema.Types.ObjectId, ref: 'TrainingPlan', required: true },
    weekday: {
      type: Number,
      enum: [1, 2, 3, 4, 5, 6, 7], // 1 = Montag, 7 = Sonntag
      required: true,
    },
    exercises: [exerciseLogSchema],
    totalDuration: { type: Number }, // Sekunden, optional
    status: {
      type: String,
      enum: ['completed', 'aborted', 'in-progress', 'canceled'],
      default: 'in-progress',
    },
    rating: { type: Number, min: 1, max: 5 }, // optional
    notes: { type: String }, // optional
  },
  { timestamps: true }
);

const TrainingLog = mongoose.model('TrainingLog', trainingLogSchema, 'trainingLogs');
module.exports = TrainingLog;
