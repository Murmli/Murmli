const mongoose = require("mongoose");
const { marketCategoryRules } = require("../utils/rules.js");
const { foodItemSchema } = require("./foodItemSchema.js");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    email: {
      type: String,
    },
    language: {
      type: String,
      default: "en",
    },
    role: {
      type: String,
      enum: ["freeuser", "administrator", "premium"],
      default: "freeuser",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastLogin: {
      type: Date,
    },
    linkedAccounts: [
      {
        email: {
          type: String,
          required: true,
        },
        requestHash: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          required: true,
          default: Date.now,
        },
      },
    ],
    loginId: {
      type: String,
    },
    loginIdExpires: {
      type: Date,
    },
    generations: [
      {
        recipeId: {
          type: Schema.Types.ObjectId,
          ref: "userRecipes",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    suggestions: {
      selected: [
        {
          recipeId: {
            type: Schema.Types.ObjectId,
            ref: "recipes",
          },
          title: {
            type: String,
          },
          descriptionShort: {
            type: String,
          },
          image: {
            type: String,
          },
          servings: {
            type: Number,
            required: true,
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      downvotes: [
        {
          recipeId: {
            type: Schema.Types.ObjectId,
            ref: "recipes",
          },
          title: {
            type: String,
            ref: "recipes",
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      upvotes: [
        {
          recipeId: {
            type: Schema.Types.ObjectId,
            ref: "recipes",
          },
          title: {
            type: String,
            ref: "recipes",
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      filter: {
        servings: {
          type: Number,
          default: 2,
        },
        recipes: {
          type: Number,
          default: 2,
        },
        prompt: {
          type: String,
          default: "",
        },
      },
    },
    shoppingList: {
      id: {
        type: Schema.Types.ObjectId,
        ref: "shoppinglists",
      },
    },
    shoppingListSort: {
      type: Array,
      default: marketCategoryRules("keys"),
    },
    favoriteRecipes: {
      type: Array,
    },
    height: {
      type: Number,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    weightTracking: [
      {
        weight: {
          type: Number,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    birthyear: {
      type: Number,
    },
    dietType: {
      type: String,
      enum: ["lowCarb", "lowFat", "balanced"],
    },
    dietLevel: {
      type: String,
      enum: ["strongLose", "lose", "maintain", "gain", "strongGain", "normal"], // normal ist jsut old and a fix
    },
    dietStartedAt: {
      type: Date,
    },
    workHoursWeek: {
      type: Number,
    },
    workDaysPAL: {
      type: Number,
    },
    baseCalories: {
      type: Number,
    },
    recommendations: {
      kcal: {
        type: Number,
      },
      protein: {
        type: Number,
      },
      carbohydrates: {
        type: Number,
      },
      fat: {
        type: Number,
      },
    },
    dailyFoodItems: [foodItemSchema],
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: true,
    },
  }
);

// Erstelle einen Index auf dem 'email'-Feld.
// Der Wert '1' steht für einen aufsteigenden Index, '-1' würde einen absteigenden Index bedeuten.
// 'unique: true' stellt sicher, dass die E-Mail-Adresse eindeutig ist, also kann kein anderer Benutzer die gleiche E-Mail-Adresse haben.
// 'sparse: true' sagt MongoDB, dass der Index nur die Dokumente indiziert, in denen das 'email'-Feld vorhanden ist.
// Dadurch werden Dokumente, in denen das 'email'-Feld fehlt oder 'null' ist, nicht in den Index aufgenommen.
// Daher erlaubt dieser Index mehrere Dokumente mit einem 'null'- oder fehlenden 'email'-Feld.
userSchema.index({ email: 1 }, { unique: true, sparse: true });

const User = mongoose.model("users", userSchema);
module.exports = User;