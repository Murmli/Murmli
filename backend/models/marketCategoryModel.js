const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserInputCategorySchema = new Schema({
  userInput: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("userInputCategories", UserInputCategorySchema);
