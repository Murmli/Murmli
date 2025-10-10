const mongoose = require('mongoose');
const { Schema } = mongoose;

const exerciseImageSchema = new Schema(
  {
    exerciseKey: {
      type: String,
      required: true,
      unique: true, // Jede Übung sollte nur einen Bildeintrag haben
      index: true, // Index für schnellere Abfragen
      ref: 'TrainingPlan.days.exercises.key' // Informelle Referenz, da Mongoose keine direkten Refs auf Sub-Doc-Felder unterstützt
    },
    imageUrl: {
      type: String,
      required: true,
      default: 'dummy'
    },
    prompt: { type: String },
    model: { type: String },
  },
  { timestamps: true } // Fügt createdAt und updatedAt Felder hinzu
);

const ExerciseImage = mongoose.model('ExerciseImage', exerciseImageSchema, 'exerciseImages');

module.exports = ExerciseImage;
