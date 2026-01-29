const mongoose = require("mongoose");
const Recipe = require("./recipeModel");

const userRecipeSchema = new mongoose.Schema(
  {
    ...Recipe.schema.obj,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    addedToDatabase: {
      type: Boolean,
      default: false,
    },
    addedRecipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
      default: null,
    },
    addedToDatabaseAt: {
      type: Date,
      default: null,
    },
    originalPrompt: {
      type: String,
      default: "",
    },
  },
  {
    collection: "userRecipes",
    timestamps: true,
  }
);

const UserRecipe = mongoose.model("UserRecipe", userRecipeSchema);

module.exports = UserRecipe;
