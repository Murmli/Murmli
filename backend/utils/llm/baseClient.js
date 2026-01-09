const OpenAI = require("openai");
const { toFile } = OpenAI;
const { llmGetHash, llmReadCache, llmWriteCache } = require("./../llmCache.js");
const fs = require("fs").promises;

class BaseLLMClient {
  constructor({ provider, apiKey, baseURL, lowModel, highModel, imageModel = false }) {
    this.provider = provider;
    this.lowModel = lowModel;
    this.highModel = highModel;
    this.imageModel = imageModel;
    this.llm = new OpenAI({ apiKey, baseURL });
    process.env.DEBUG = false; // Disable OpenAI library debug logs
  }

  async encodeFileToBase64(filePath) {
    const fileData = await fs.readFile(filePath);
    return fileData.toString("base64");
  }

  /**
   * Call the configured LLM provider.
   * @param {string} prompt - User prompt.
   * @param {object} [options]
   * @param {boolean} [options.json=false] - Expect JSON response.
   * @param {object} [options.jsonSchema=null] - JSON schema for structured responses.
   * @param {"low"|"high"} [options.modelType="low"] - Model tier.
   * @param {boolean} [options.cache=true] - Use cache.
   * @param {boolean} [options.debug=false] - Verbose logging.
   * @param {Array<object>} [options.history=[]] - Conversation history.
   * @param {Array<object>} [options.files=[]] - Files (e.g., images) to attach.
   * @param {string} [options.systemPrompt=""] - System message.
   * @returns {Promise<string|object|boolean>}
   */
  async apiCall(prompt, options = {}) {
    const {
      json = false,
      jsonSchema = null,
      modelType = "low",
      cache = true,
      debug = false,
      history = [],
      files = [],
      systemPrompt = "",
    } = options;

    if (!prompt) return false;

    const cleanText = (text) =>
      text
        .split("\n")
        .map((line) => line.trim())
        .map((line) => line.replace(/\s+/g, " "))
        .filter((line) => line.length > 0)
        .join("\n");

    const cleanedPrompt = cleanText(prompt);
    const cleanedSystemPrompt = systemPrompt ? cleanText(systemPrompt) : "";
    const hashPrompt = cleanedPrompt + cleanedSystemPrompt;
    const selectedModel = modelType === "low" ? this.lowModel : this.highModel;

    if (cache && !debug) {
      const cached = await llmReadCache(hashPrompt, this.provider, selectedModel);
      if (cached) return json || jsonSchema ? JSON.parse(cached) : cached;
    }

    let messages = [];

    if (cleanedSystemPrompt) {
      messages.push({ role: "system", content: cleanedSystemPrompt });
    }

    if (history.length > 0) {
      messages = messages.concat(history);
    } else if (files.length === 0) {
      messages.push({ role: "user", content: cleanedPrompt });
    }

    // Attach images (if provided)
    if (files.length > 0) {
      const imageContent = await Promise.all(
        files.map(async (file) => {
          const base64Data = await this.encodeFileToBase64(file.path);
          return {
            type: "image_url",
            image_url: { url: `data:${file.mimetype};base64,${base64Data}` },
          };
        })
      );

      const userContent = [{ type: "text", text: cleanedPrompt }, ...imageContent];
      const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
      if (lastMessage && lastMessage.role === "user" && !Array.isArray(lastMessage.content)) {
        messages[messages.length - 1] = {
          role: "user",
          content: [{ type: "text", text: lastMessage.content }, ...imageContent],
        };
      } else if (lastMessage && lastMessage.role === "user" && Array.isArray(lastMessage.content)) {
        lastMessage.content.push(...imageContent);
      } else {
        messages.push({ role: "user", content: userContent });
      }
    }

    try {
      if (debug) {
        const hash = llmGetHash(hashPrompt, this.provider);
        console.log("\x1b[31m%s\x1b[0m", "System Prompt:", cleanedSystemPrompt);
        console.log("\x1b[32m%s\x1b[0m", "Prompt:", cleanedPrompt);
        console.log("\x1b[33m%s\x1b[0m", "LLM Cache Hash: ", hash);
        console.log("\x1b[36m%s\x1b[0m", "Messages:", JSON.stringify(messages, null, 2));
      }

      const response = await this.llm.chat.completions.create({
        model: selectedModel,
        messages,
        response_format: jsonSchema
          ? { type: "json_schema", json_schema: jsonSchema }
          : { type: json ? "json_object" : "text" },
      });

      const answer = response.choices[0].message.content;

      if (cache && !debug) {
        llmWriteCache(hashPrompt, this.provider, selectedModel, answer);
      }

      if (debug) {
        console.log("\x1b[33m%s\x1b[0m", "API Response:", answer);
      }

      let cleanAnswer = answer;
      // Strip markdown code blocks if present
      if (typeof cleanAnswer === 'string') {
        cleanAnswer = cleanAnswer.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
      }

      return json || jsonSchema ? JSON.parse(cleanAnswer) : cleanAnswer;
    } catch (error) {
      console.error(`Error with ${this.provider} API:`, error.response ? error.response.data : error.message);
      if (error.response && error.response.data && error.response.data.error) {
        console.error("API Error Details:", error.response.data.error);
      }
      return false;
    }
  }

  /**
   * Generate an image (PNG) using the image model.
   * @param {string} prompt
   * @param {object} [options]
   * @returns {Promise<string|boolean>} base64 PNG or false
   */
  async generateImage(prompt, options = {}) {
    const {
      background = "auto",
      moderation = "auto",
      n = 1,
      output_compression = 100,
      quality = "auto",
      size = "1024x1024",
      user,
    } = options;

    if (!prompt) {
      console.error("Prompt is required for image generation.");
      return false;
    }

    const params = {
      model: this.imageModel || "gpt-image-1",
      prompt,
      n,
      size,
      output_format: "png",
      background,
      moderation,
      output_compression,
      quality,
    };

    if (params.size === "auto") delete params.size;
    if (params.quality === "auto") delete params.quality;
    if (params.background === "auto") delete params.background;
    if (params.moderation === "auto") delete params.moderation;

    if (user) params.user = user;

    try {
      console.log(`Generating PNG image with ${params.model} and prompt: "${prompt}"`);
      const response = await this.llm.images.generate(params);

      // gpt-image-1 returns b64_json
      if (response && response.data && response.data[0] && response.data[0].b64_json) {
        return response.data[0].b64_json;
      } else {
        console.error(`Invalid response structure or missing b64_json from ${params.model} API:`, response);
        return false;
      }
    } catch (error) {
      console.error(`Error generating image with ${this.provider} (${params.model}) API:`, error.response ? error.response.data : error.message);
      if (error.response && error.response.data && error.response.data.error) {
        console.error("API Error Details:", error.response.data.error);
      }
      return false;
    }
  }

  /**
   * Edit an image using the provider's image editing API.
   * @returns {Promise<string|boolean>} base64 PNG or false
   */
  async editImage(prompt, imagePath, options = {}) {
    const { maskPath, n = 1, size = "1024x1024", user } = options;

    if (!prompt) {
      console.error("Prompt is required for image editing.");
      return false;
    }
    if (!imagePath) {
      console.error("Image path is required for image editing.");
      return false;
    }

    try {
      const imageBuffer = await fs.readFile(imagePath);
      const imageFile = await toFile(imageBuffer, "image.png");

      let maskFile = undefined;
      if (maskPath) {
        try {
          await fs.access(maskPath);
          const maskBuffer = await fs.readFile(maskPath);
          maskFile = await toFile(maskBuffer, "mask.png");
        } catch (maskError) {
          console.warn(`Mask file not found or inaccessible at ${maskPath}. Proceeding without mask.`);
        }
      }

      const params = {
        model: this.imageModel || "gpt-image-1",
        image: imageFile,
        prompt,
        n,
        size,
      };

      if (maskFile) params.mask = maskFile;
      if (params.size === "auto") delete params.size;
      if (user) params.user = user;

      console.log(`Editing image "${imagePath}" with model ${params.model} and prompt: "${prompt}"`);
      const response = await this.llm.images.edit(params);

      if (response && response.data && response.data[0] && response.data[0].b64_json) {
        return response.data[0].b64_json;
      } else {
        console.error("Invalid response structure or missing b64_json from image edit API:", response);
        return false;
      }
    } catch (error) {
      console.error(`Error editing image with ${this.provider} API:`, error.response ? error.response.data : error.message);
      if (error.response && error.response.data && error.response.data.error) {
        console.error("OpenAI Error Details:", error.response.data.error);
      }
      return false;
    }
  }
}

module.exports = BaseLLMClient;

