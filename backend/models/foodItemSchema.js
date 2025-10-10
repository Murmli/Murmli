const mongoose = require("mongoose");
const { Schema } = mongoose;

const foodItemSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    required: true,
  },
  kcal: {
    type: Number,
    required: true,
  },
  protein: {
    type: Number,
    required: true,
  },
  carbohydrates: {
    type: Number,
    required: true,
  },
  fat: {
    type: Number,
    required: true,
  },
  healthyRating: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  daily: {
    type: Number,
    default: 0,
  },
});

module.exports = { foodItemSchema };