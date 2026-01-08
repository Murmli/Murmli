const BaseLLMClient = require("./baseClient");
const config = {
  provider: "openrouter",
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.OPENROUTER_APP_URL,
    "X-Title": process.env.OPENROUTER_APP_TITLE,
  },
  lowModel: process.env.OPENROUTER_LOW_MODEL,
  highModel: process.env.OPENROUTER_HIGH_MODEL,
};
const openrouterClient = new BaseLLMClient(config);

module.exports = {
  apiCall: openrouterClient.apiCall.bind(openrouterClient),
};
