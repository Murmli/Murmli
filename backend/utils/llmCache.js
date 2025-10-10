const LlmCache = require("../models/llmCacheModel.js");
const xxhash = require("xxhash");
const seed = 0x8d2e4c59;

exports.llmReadCache = async (prompt, provider, model) => {
  try {
    const buffer = Buffer.from(prompt, "utf-8");
    const hash = xxhash.hash(buffer, seed);
    const cache = await LlmCache.findOne({ hash: hash, provider: provider, model: model });

    if (cache) {
      const maxAgeDays = parseInt(process.env.LLM_CACHE_MAX_AGE_DAYS, 10);
      if (maxAgeDays && maxAgeDays > 0) {
        const now = new Date();
        const cacheDate = cache.createdAt;
        const expiryDate = new Date(cacheDate);
        expiryDate.setDate(expiryDate.getDate() + maxAgeDays);

        if (now > expiryDate) {
          console.log(`LLM Cache expired for hash ${hash} (provider: ${provider})`);
          await LlmCache.deleteOne({ _id: cache._id });
          return false; // Treat as cache miss
        }
      }
      // Cache is valid or age check is disabled
      return JSON.parse(cache.content);
    } else {
      return false; // Cache miss
    }
  } catch (error) {
    console.error(error);
    return false;
  }
};

exports.llmWriteCache = async (prompt, provider, model, content) => {
  try {
    const buffer = Buffer.from(prompt, "utf-8");
    const hash = xxhash.hash(buffer, seed);
    const cache = new LlmCache({ hash, provider, model, content: JSON.stringify(content) });

    return cache.save();
  } catch (error) {
    console.error(error);
    return false;
  }
};

exports.llmClearCache = async (provider = null, days = null) => {
  try {
    const query = {};

    if (provider) {
      query.provider = provider;
    }

    if (days) {
      const date = new Date();
      date.setDate(date.getDate() - days);
      query.createdAt = { $lt: date };
    }

    return LlmCache.deleteMany(query);
  } catch (error) {
    console.error(error);
    return false;
  }
};


exports.llmGetHash = (prompt) => {
  try {
    const buffer = Buffer.from(prompt, "utf-8");
    const hash = xxhash.hash(buffer, seed);
    return hash;
  } catch (error) {
    console.error("Error generating LLM cache hash:", error);
    return null;
  }
};
