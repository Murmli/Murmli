const mongoose = require("mongoose");
const { Schema } = mongoose;

const feedbackSchema = new Schema(
  {
    content: {
      type: String,
    },
    recipe: {
      type: Schema.Types.ObjectId,
      ref: "recipes",
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "users",
    },
    readed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Feedback = mongoose.model("Feedback", feedbackSchema, "feedback");
module.exports = Feedback;
