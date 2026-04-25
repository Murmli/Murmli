const mongoose = require("mongoose");
const { foodItemSchema } = require("./foodItemSchema.js");
const { Schema } = mongoose;

const favoriteFoodSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    item: foodItemSchema,
  },
  {
    timestamps: true,
  }
);

// Index for faster lookup and uniqueness per user/food name
favoriteFoodSchema.index({ user: 1, "item.name": 1 }, { unique: true });

const FavoriteFood = mongoose.model("favoriteFood", favoriteFoodSchema);

module.exports = FavoriteFood;
