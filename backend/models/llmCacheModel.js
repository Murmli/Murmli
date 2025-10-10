const mongoose = require("mongoose");

const llmCacheSchema = new mongoose.Schema(
  {
    hash: { type: Number, required: true },
    provider: { type: String, required: true },
    model: { type: String, required: true },
    content: { type: String, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const LlmCache = mongoose.model("llmcache", llmCacheSchema);
module.exports = LlmCache;
