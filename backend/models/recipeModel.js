const mongoose = require("mongoose");
const { Schema } = mongoose;

const recipeSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  descriptionShort: {
    type: String,
    required: true,
  },
  ingredients: [
    {
      name: {
        type: String,
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
      protein: {
        type: Number,
        required: true,
      },
      kilocalories: {
        type: Number,
        required: true,
      },
      category: {
        type: Number,
        required: true,
      },
      season: {
        type: String,
      },
      unitWeight: {
        type: Number,
      },
      fiber: {
        type: Number,
      },
      quantity: {
        type: Number,
      },
      unit: {
        type: Number,
        required: true,
      },
      gram: {
        type: Number,
      },
    },
  ],
  steps: [
    {
      head: [
        {
          name: {
            type: String,
            required: true,
          },
          quantity: {
            type: Number,
            required: false,
          },
          unit: {
            type: String,
            required: false,
          },
          addition: {
            type: String,
            required: false,
          },
        },
      ],
      content: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
    },
  ],
  servings: {
    type: Number,
    required: true,
  },
  preparationTime: {
    type: Number,
    required: true,
  },
  season: {
    type: Number,
  },
  vegetarian: {
    type: Boolean,
    required: true,
  },
  vegan: {
    type: Boolean,
    required: true,
  },
  glutenfree: {
    type: Boolean,
    required: true,
  },
  lactosefree: {
    type: Boolean,
    required: true,
  },
  healthRating: {
    type: Number,
    required: true,
  },
  difficultyRating: {
    type: Number,
    required: true,
  },
  priceRating: {
    type: Number,
    required: true,
  },
  sustainabilityRating: {
    type: Number,
    required: true,
  },
  everydayRating: {
    type: Number,
    required: true,
  },
  generations: {
    type: Number,
  },
  upvotes: {
    type: Number,
  },
  downvotes: {
    type: Number,
  },
  ratings: [
    {
      user: {
        type: Schema.Types.ObjectId, // Verwende ObjectId für Referenzen
        ref: "users", // Referenziert das User-Modell, falls vorhanden
      },
      stars: {
        type: Number,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  originCountry: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  nutrients: {
    kilocalories: {
      type: Number,
      required: true,
    },
    fat: {
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
  },
  active: {
    type: Boolean,
    default: true,
  },
  type: {
    type: String,
    required: true,
  },
  provider: {
    type: String,
    required: true,
  },
},
  {
    timestamps: true,
  }
);

const Recipe = mongoose.model("Recipe", recipeSchema, "recipes");
module.exports = Recipe;

// [R]ecipe [P]rompt [M]odel Schema for LLM guidance
const rpmSchema = `
{
  "title": "string",
  "description": "string",
  "descriptionShort": "string",
  "ingredients": [
    {
      "name": "string",
      "carbohydrates": "number",
      "fat": "number",
      "protein": "number",
      "kilocalories": "number",
      "category": "number",
      "season": "string | null",
      "unitWeight": "number | null",
      "fiber": "number | null",
      "quantity": "number | null",
      "unit": "number",
      "gram": "number | null"
    }
  ],
  "steps": [
    {
      "head": [
        { "name": "string", "quantity": "number", "unit": "string", "addition": "string" }
      ],
      "content": "string",
      "name": "string"
    }
  ],
  "servings": "number",
  "preparationTime": "number",
  "season": "number",
  "vegetarian": "boolean",
  "vegan": "boolean",
  "glutenfree": "boolean",
  "lactosefree": "boolean",
  "healthRating": "number",
  "difficultyRating": "number",
  "priceRating": "number",
  "sustainabilityRating": "number",
  "everydayRating": "number",
  "image": "string",
  "nutrients": {
    "kilocalories": "number",
    "fat": "number",
    "protein": "number",
    "carbohydrates": "number"
  },
  "type": "string",
  "provider": "string"
}`;

module.exports.rpmSchema = rpmSchema;
