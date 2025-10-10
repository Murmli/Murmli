const mongoose = require("mongoose");
const { Schema } = mongoose;

const exportLinkSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    accessed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const ExportLink = mongoose.model("exportLinks", exportLinkSchema);
module.exports = ExportLink;
