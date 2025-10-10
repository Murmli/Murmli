const mongoose = require("mongoose");

const inviteCodeSchema = new mongoose.Schema(
  {
    code: { type: Number, required: true },
    listId: { type: mongoose.Schema.Types.ObjectId, ref: "shoppingLists", required: true },
    expiresAt: { type: Date, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const inviteCodes = mongoose.model("invites", inviteCodeSchema);
module.exports = inviteCodes;
