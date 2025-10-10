const BaseLLMClient = require("./baseClient");
const config = {
  provider: "deepseek",
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
  lowModel: process.env.DEEPSEEK_LOW_MODEL,
  highModel: process.env.DEEPSEEK_HIGH_MODEL,
};
const deepseekClient = new BaseLLMClient(config);

module.exports = {
  apiCall: deepseekClient.apiCall.bind(deepseekClient),
};
