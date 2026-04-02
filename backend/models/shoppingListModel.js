const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const shoppingListsSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    recipes: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Recipe",
          required: true,
        },
        title: {
          type: String,
          required: true,
        },
        image: {
          type: String,
          required: true,
        },
        servings: {
          type: Number,
          required: true,
        },
        ingredientsAdded: {
          type: Boolean,
          default: false,
        },
      },
    ],
    items: [
      {
        name: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
        },
        unit: {
          type: Number,
        },
        category: {
          type: Number,
          required: true,
        },
        recipe: {
          type: Boolean,
          default: false,
        },
        recipeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Recipe",
        },
        active: {
          type: Boolean,
          default: true,
        },
      },
    ],
    sharedWith: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: true,
    },
  }
);

const ShoppingList = mongoose.model("shoppingLists", shoppingListsSchema);
module.exports = ShoppingList;
