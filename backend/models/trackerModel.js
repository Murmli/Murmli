// models/trackerModel.js

const mongoose = require("mongoose");
const { foodItemSchema } = require("./foodItemSchema.js");
const { Schema } = mongoose;

const activitySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true, // Dauer in Minuten
  },
  caloriesBurned: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  }
});

const calorieTrackerSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    foodItems: [foodItemSchema],
    activities: [activitySchema],
    totals: {
      kcal: {
        type: Number,
        default: 0,
      },
      protein: {
        type: Number,
        default: 0,
      },
      carbohydrates: {
        type: Number,
        default: 0,
      },
      fat: {
        type: Number,
        default: 0,
      },
      acidBaseScore: {
        type: Number,
        default: 0,
      },
      histamineAvg: {
        type: Number,
        default: 0,
      },
    },
    calorieGoal: {
      type: Number,
    },
    recommendations: {
      kcal: {
        type: Number,
        default: 0,
      },
      protein: {
        type: Number,
        default: 0,
      },
      carbohydrates: {
        type: Number,
        default: 0,
      },
      fat: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

const CalorieTracker = mongoose.model("calorieTracker", calorieTrackerSchema);

module.exports = CalorieTracker;
