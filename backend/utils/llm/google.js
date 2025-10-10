const BaseLLMClient = require("./baseClient");
const config = {
  provider: "google",
  apiKey: process.env.GOOGLE_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  lowModel: process.env.GOOGLE_LOW_MODEL,
  highModel: process.env.GOOGLE_HIGH_MODEL,
};
const googleClient = new BaseLLMClient(config);

module.exports = {
  apiCall: googleClient.apiCall.bind(googleClient),
};
