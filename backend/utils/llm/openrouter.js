// Central OpenRouter client for all LLM requests in the backend.
// Every AI call goes through the official OpenRouter SDK (@openrouter/sdk);
// there are no other LLM providers anymore.

const fs = require("fs").promises;
const sharp = require("sharp");
const { llmGetHash, llmReadCache, llmWriteCache } = require("../llmCache.js");
const { getOpenRouterClient } = require("./sdkClient.js");

const PROVIDER = "openrouter";

const getLowModel = () => process.env.OPENROUTER_LOW_MODEL;
const getHighModel = () => process.env.OPENROUTER_HIGH_MODEL;

const AUDIO_FORMAT_BY_MIMETYPE = {
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/mp3": "mp3",
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
  "audio/flac": "flac",
  "audio/aac": "aac",
  "audio/m4a": "m4a",
  "audio/mp4": "m4a", // often m4a is in mp4 container
  "audio/x-m4a": "m4a",
};
const SUPPORTED_AUDIO_FORMATS = ["wav", "mp3", "aiff", "aac", "ogg", "flac", "m4a"];

// Hint appended on degraded retries: some upstream providers (e.g. Alibaba/Qwen)
// reject response_format requests unless the messages literally mention "json".
const JSON_RETRY_HINT =
  "Antworte ausschließlich mit einem validen json-Objekt (json), ohne Markdown-Codeblöcke und ohne weiteren Text.";

/**
 * Reads a file and returns it base64-encoded. Images are downscaled/compressed first.
 * @param {object} file - Multer-style file object ({ path, mimetype, originalname }).
 * @returns {Promise<{base64Data: string, mimetype: string}>}
 */
async function processAndEncodeFile(file) {
  if (file.mimetype && file.mimetype.startsWith("image/")) {
    try {
      const processedBuffer = await sharp(file.path)
        .resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
      return { base64Data: processedBuffer.toString("base64"), mimetype: "image/jpeg" };
    } catch (err) {
      console.error("Error compressing image, falling back to original:", err);
    }
  }
  const fileData = await fs.readFile(file.path);
  return { base64Data: fileData.toString("base64"), mimetype: file.mimetype };
}

function resolveAudioFormat(file) {
  if (AUDIO_FORMAT_BY_MIMETYPE[file.mimetype]) {
    return AUDIO_FORMAT_BY_MIMETYPE[file.mimetype];
  }
  if (file.originalname) {
    const ext = file.originalname.split(".").pop().toLowerCase();
    if (SUPPORTED_AUDIO_FORMATS.includes(ext)) {
      return ext;
    }
  }
  return "mp3"; // default fallback
}

function cleanText(text) {
  return text
    ? text
        .split("\n")
        .map((line) => line.trim())
        .map((line) => line.replace(/\s+/g, " "))
        .filter((line) => line.length > 0)
        .join("\n")
    : "";
}

/**
 * Extracts plain text from an SDK assistant message content
 * (string or array of content items).
 */
function extractTextContent(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((part) => part && part.type === "text" && typeof part.text === "string")
      .map((part) => part.text)
      .join("\n");
  }
  return "";
}

/**
 * Call the OpenRouter API.
 * @param {string} prompt - User prompt.
 * @param {object} [options]
 * @param {boolean} [options.json=false] - Expect JSON response.
 * @param {object} [options.jsonSchema=null] - JSON schema for structured responses.
 * @param {"low"|"high"} [options.modelType="low"] - Model tier.
 * @param {boolean} [options.cache=true] - Use cache.
 * @param {boolean} [options.debug=false] - Verbose logging.
 * @param {Array<object>} [options.history=[]] - Conversation history (SDK message format).
 * @param {Array<object>} [options.files=[]] - Files (images/audio) to attach.
 * @param {string} [options.systemPrompt=""] - System message.
 * @param {Array<object>} [options.tools=null] - Tools for function calling.
 * @param {string} [options.toolChoice="auto"] - Tool choice mode.
 * @returns {Promise<string|object|boolean>} Text, parsed JSON, { toolCalls, message } for tool calls, or false on failure.
 */
async function apiCall(prompt, options = {}) {
  const {
    json = false,
    jsonSchema = null,
    modelType = "low",
    cache = true,
    debug = false,
    history = [],
    files = [],
    systemPrompt = "",
    tools = null,
    toolChoice = "auto",
  } = options;

  if (!prompt && history.length === 0) return false;

  const cleanedPrompt = cleanText(prompt);
  const cleanedSystemPrompt = systemPrompt ? cleanText(systemPrompt) : "";
  const hashPrompt = (cleanedPrompt || "") + cleanedSystemPrompt;
  const lowModel = getLowModel();
  const highModel = getHighModel();
  let selectedModel = modelType === "low" ? lowModel : highModel;

  if (cache && !debug && cleanedPrompt) {
    const cached = await llmReadCache(hashPrompt, PROVIDER, selectedModel);
    if (cached) return json || jsonSchema ? JSON.parse(cached) : cached;
  }

  let messages = [];

  if (cleanedSystemPrompt) {
    messages.push({ role: "system", content: cleanedSystemPrompt });
  }

  if (history.length > 0) {
    messages = messages.concat(history);
  }

  if (cleanedPrompt && files.length === 0) {
    messages.push({ role: "user", content: cleanedPrompt });
  }

  // Attach images or audio (if provided)
  if (files.length > 0) {
    const fileContent = await Promise.all(
      files.map(async (file) => {
        const { base64Data, mimetype } = await processAndEncodeFile(file);

        if (file.mimetype && file.mimetype.startsWith("audio/")) {
          return {
            type: "input_audio",
            inputAudio: {
              data: base64Data,
              format: resolveAudioFormat(file),
            },
          };
        }

        // Default to image handling
        return {
          type: "image_url",
          imageUrl: { url: `data:${mimetype};base64,${base64Data}` },
        };
      })
    );

    const userContent = [{ type: "text", text: cleanedPrompt }, ...fileContent];
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    if (lastMessage && lastMessage.role === "user" && !Array.isArray(lastMessage.content)) {
      messages[messages.length - 1] = {
        role: "user",
        content: [{ type: "text", text: lastMessage.content }, ...fileContent],
      };
    } else if (lastMessage && lastMessage.role === "user" && Array.isArray(lastMessage.content)) {
      lastMessage.content.push(...fileContent);
    } else {
      messages.push({ role: "user", content: userContent });
    }
  }

  let attempt = 0;
  const expectsJson = Boolean(json || jsonSchema);
  const maxAttempts = expectsJson ? 3 : 1;

  // Degradation ladder for models/providers without full structured output support:
  // attempt 1 uses the requested format, attempt 2 falls back to json_object (+ json hint),
  // attempt 3 drops response_format entirely and parses plain text.
  let responseFormatMode = jsonSchema ? "json_schema" : json ? "json_object" : null;
  let useJsonHint = false;

  const degrade = () => {
    selectedModel = highModel;
    if (responseFormatMode === "json_schema") {
      responseFormatMode = "json_object";
      useJsonHint = true;
    } else if (responseFormatMode === "json_object") {
      responseFormatMode = null;
      useJsonHint = true;
    }
  };

  const buildRequestMessages = () => {
    if (!useJsonHint) return messages;
    const hinted = messages.map((m) => ({ ...m }));
    const systemMessage = hinted.find((m) => m.role === "system");
    if (systemMessage && typeof systemMessage.content === "string") {
      systemMessage.content = `${systemMessage.content}\n\n${JSON_RETRY_HINT}`;
    } else {
      hinted.unshift({ role: "system", content: JSON_RETRY_HINT });
    }
    return hinted;
  };

  const client = await getOpenRouterClient();

  while (attempt < maxAttempts) {
    attempt++;
    try {
      const requestMessages = buildRequestMessages();

      if (debug) {
        const hash = llmGetHash(hashPrompt, PROVIDER);
        console.log("\x1b[31m%s\x1b[0m", "System Prompt:", cleanedSystemPrompt);
        console.log("\x1b[32m%s\x1b[0m", "Prompt:", cleanedPrompt);
        console.log("\x1b[33m%s\x1b[0m", "LLM Cache Hash: ", hash);
        console.log("\x1b[36m%s\x1b[0m", "Messages:", JSON.stringify(requestMessages, null, 2));
        if (tools) console.log("\x1b[35m%s\x1b[0m", "Tools:", JSON.stringify(tools, null, 2));
        console.log("\x1b[35m%s\x1b[0m", "Model:", selectedModel, "Attempt:", attempt);
      }

      const chatRequest = {
        model: selectedModel,
        messages: requestMessages,
        stream: false,
      };

      if (responseFormatMode === "json_schema") {
        chatRequest.responseFormat = { type: "json_schema", jsonSchema };
      } else if (responseFormatMode === "json_object") {
        chatRequest.responseFormat = { type: "json_object" };
      }

      if (tools && tools.length > 0) {
        chatRequest.tools = tools;
        chatRequest.toolChoice = toolChoice;
      }

      const response = await client.chat.send({ chatRequest });

      // Validate response structure
      if (!response || !Array.isArray(response.choices) || response.choices.length === 0) {
        console.error("Invalid response structure from OpenRouter API:", response);
        if (attempt < maxAttempts) { degrade(); continue; }
        return false;
      }

      const message = response.choices[0].message;

      // Check for tool calls
      if (message.toolCalls && message.toolCalls.length > 0) {
        if (debug) console.log("\x1b[35m%s\x1b[0m", "Tool Calls:", JSON.stringify(message.toolCalls, null, 2));
        return { toolCalls: message.toolCalls, message: message };
      }

      const answer = extractTextContent(message.content);

      if (!answer) {
        console.error("Invalid message structure in response from OpenRouter API:", response.choices[0]);
        if (attempt < maxAttempts) { degrade(); continue; }
        return false;
      }

      if (cache && !debug) {
        llmWriteCache(hashPrompt, PROVIDER, selectedModel, answer);
      }

      if (debug) console.log("\x1b[33m%s\x1b[0m", "API Response:", answer);

      // Strip markdown code blocks if present
      let cleanAnswer = answer
        .replace(/^```json\s*/, "")
        .replace(/^```\s*/, "")
        .replace(/\s*```$/, "")
        .trim();

      // Parse JSON if required
      if (expectsJson) {
        if (!cleanAnswer) {
          console.error("Empty response from OpenRouter API when JSON was expected");
          if (attempt < maxAttempts) { degrade(); continue; }
          return false;
        }

        try {
          return JSON.parse(cleanAnswer);
        } catch (parseError) {
          console.error("JSON parse error from OpenRouter API:", parseError.message);
          if (attempt < maxAttempts) {
            console.log(`Fallback triggered: Switching from ${lowModel} to ${highModel}`);
            degrade();
            continue;
          }
          return false;
        }
      }

      return cleanAnswer;
    } catch (error) {
      console.error("Error with OpenRouter API:", error.message || error);
      if (attempt < maxAttempts) {
        console.log(`Fallback triggered due to error: Switching from ${lowModel} to ${highModel}`);
        degrade();
        continue;
      }
      return false;
    }
  }

  return false;
}

module.exports = { apiCall };
