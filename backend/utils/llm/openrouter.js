const BaseLLMClient = require("./baseClient");
const config = {
  provider: "openrouter",
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  lowModel: process.env.OPENROUTER_LOW_MODEL,
  highModel: process.env.OPENROUTER_HIGH_MODEL,
};
const openrouterClient = new BaseLLMClient(config);

module.exports = {
  apiCall: openrouterClient.apiCall.bind(openrouterClient),
};
