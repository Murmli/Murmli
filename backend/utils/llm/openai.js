const BaseLLMClient = require("./baseClient");
const config = {
  provider: "openai",
  apiKey: process.env.OPENAI_API_KEY,
  lowModel: process.env.OPENAI_LOW_MODEL,
  highModel: process.env.OPENAI_HIGH_MODEL,
  imageModel: process.env.OPENAI_IMAGE_MODEL,
};
const openaiClient = new BaseLLMClient(config);

module.exports = {
  apiCall: openaiClient.apiCall.bind(openaiClient),
  generateImage: openaiClient.generateImage.bind(openaiClient),
  editImage: openaiClient.editImage.bind(openaiClient),
};
