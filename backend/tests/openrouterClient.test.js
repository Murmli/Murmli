// Unit tests for the OpenRouter client (backend/utils/llm/openrouter.js)
// The OpenRouter SDK client and the LLM cache are mocked, so no network or DB access happens.

process.env.OPENROUTER_LOW_MODEL = "test/low-model";
process.env.OPENROUTER_HIGH_MODEL = "test/high-model";

const sendMock = jest.fn();

jest.mock("../utils/llm/sdkClient.js", () => ({
  getOpenRouterClient: jest.fn(),
  resetOpenRouterClient: jest.fn(),
}));

jest.mock("../utils/llmCache.js", () => ({
  llmGetHash: jest.fn().mockReturnValue(123456),
  llmReadCache: jest.fn(),
  llmWriteCache: jest.fn().mockResolvedValue(true),
}));

const mockSharpToBuffer = jest.fn().mockResolvedValue(Buffer.from("compressed-image"));
jest.mock("sharp", () => {
  const sharpFn = jest.fn(() => ({
    resize: jest.fn(() => ({
      jpeg: jest.fn(() => ({ toBuffer: mockSharpToBuffer })),
    })),
  }));
  return sharpFn;
});

const fs = require("fs");
const os = require("os");
const path = require("path");

const { getOpenRouterClient } = require("../utils/llm/sdkClient.js");
const { llmReadCache, llmWriteCache } = require("../utils/llmCache.js");
const { apiCall } = require("../utils/llm/openrouter.js");

const textResponse = (content) => ({
  id: "gen-1",
  model: "test/low-model",
  choices: [
    {
      index: 0,
      finishReason: "stop",
      message: { role: "assistant", content },
    },
  ],
});

const toolCallResponse = (toolCalls) => ({
  id: "gen-2",
  model: "test/low-model",
  choices: [
    {
      index: 0,
      finishReason: "tool_calls",
      message: { role: "assistant", content: null, toolCalls },
    },
  ],
});

let audioFixturePath;

beforeAll(() => {
  audioFixturePath = path.join(os.tmpdir(), `openrouter-client-test-${Date.now()}.wav`);
  fs.writeFileSync(audioFixturePath, "fake-audio-data");
});

afterAll(() => {
  if (fs.existsSync(audioFixturePath)) fs.unlinkSync(audioFixturePath);
});

const mockModelsList = jest.fn().mockResolvedValue({
  result: {
    data: [
      {
        id: "test/low-model",
        supportedParameters: ["max_tokens", "temperature", "structured_outputs", "response_format"],
      },
      {
        id: "test/high-model",
        supportedParameters: ["max_tokens", "temperature", "structured_outputs", "response_format"],
      },
    ],
  },
});

beforeEach(() => {
  jest.clearAllMocks();
  getOpenRouterClient.mockResolvedValue({
    chat: { send: sendMock },
    models: { list: mockModelsList },
  });
  llmReadCache.mockResolvedValue(false);
  sendMock.mockResolvedValue(textResponse("Hello!"));
});

describe("apiCall – basic behavior", () => {
  test("returns false for empty prompt without history and does not call the API", async () => {
    const result = await apiCall("", {});
    expect(result).toBe(false);
    expect(sendMock).not.toHaveBeenCalled();

    const resultNull = await apiCall(null, { history: [] });
    expect(resultNull).toBe(false);
    expect(sendMock).not.toHaveBeenCalled();
  });

  test("sends system prompt and user prompt via the OpenRouter SDK and returns text", async () => {
    const result = await apiCall("  Sag Hallo  ", { systemPrompt: "Du bist hilfreich.", cache: false });

    expect(result).toBe("Hello!");
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledWith({
      chatRequest: expect.objectContaining({
        model: "test/low-model",
        stream: false,
        messages: [
          { role: "system", content: "Du bist hilfreich." },
          { role: "user", content: "Sag Hallo" },
        ],
      }),
    });
  });

  test("normalizes whitespace and blank lines in prompts", async () => {
    await apiCall("Zeile  eins\n\n\nZeile   zwei", { cache: false });
    expect(sendMock).toHaveBeenCalledWith({
      chatRequest: expect.objectContaining({
        messages: [{ role: "user", content: "Zeile eins\nZeile zwei" }],
      }),
    });
  });

  test("uses the high model when modelType is 'high'", async () => {
    await apiCall("Hallo", { modelType: "high", cache: false });
    expect(sendMock).toHaveBeenCalledWith({
      chatRequest: expect.objectContaining({ model: "test/high-model" }),
    });
  });

  test("appends history between system prompt and user prompt", async () => {
    const history = [
      { role: "user", content: "Frage 1" },
      { role: "assistant", content: "Antwort 1" },
    ];
    await apiCall("Frage 2", { history, cache: false });

    expect(sendMock).toHaveBeenCalledWith({
      chatRequest: expect.objectContaining({
        messages: [
          { role: "user", content: "Frage 1" },
          { role: "assistant", content: "Antwort 1" },
          { role: "user", content: "Frage 2" },
        ],
      }),
    });
  });

  test("allows a null prompt when history is present (tool loop continuation)", async () => {
    const history = [
      { role: "user", content: "Frage" },
      { role: "assistant", content: null, toolCalls: [{ id: "call_1", type: "function", function: { name: "f", arguments: "{}" } }] },
      { role: "tool", toolCallId: "call_1", content: "Ergebnis" },
    ];
    const result = await apiCall(null, { history, cache: false });

    expect(result).toBe("Hello!");
    expect(sendMock).toHaveBeenCalledWith({
      chatRequest: expect.objectContaining({ messages: history }),
    });
  });

  test("returns false when the SDK throws", async () => {
    sendMock.mockRejectedValue(new Error("API down"));
    const result = await apiCall("Hallo", { cache: false });
    expect(result).toBe(false);
  });

  test("returns false when the response has no choices", async () => {
    sendMock.mockResolvedValue({ choices: [] });
    const result = await apiCall("Hallo", { cache: false });
    expect(result).toBe(false);
  });

  test("joins text parts when message content is an array", async () => {
    sendMock.mockResolvedValue({
      choices: [
        {
          index: 0,
          finishReason: "stop",
          message: {
            role: "assistant",
            content: [
              { type: "text", text: "Teil eins" },
              { type: "text", text: "Teil zwei" },
            ],
          },
        },
      ],
    });
    const result = await apiCall("Hallo", { cache: false });
    expect(result).toBe("Teil eins\nTeil zwei");
  });
});

describe("apiCall – JSON and JSON schema", () => {
  test("requests json_object format and parses the response", async () => {
    sendMock.mockResolvedValue(textResponse('{"a": 1}'));
    const result = await apiCall("Gib JSON", { json: true, cache: false });

    expect(result).toEqual({ a: 1 });
    expect(sendMock).toHaveBeenCalledWith({
      chatRequest: expect.objectContaining({
        responseFormat: { type: "json_object" },
      }),
    });
  });

  test("requests json_schema format with the provided schema", async () => {
    const schema = { name: "test_schema", strict: true, schema: { type: "object" } };
    sendMock.mockResolvedValue(textResponse('{"x": "y"}'));

    const result = await apiCall("Gib JSON", { jsonSchema: schema, cache: false });

    expect(result).toEqual({ x: "y" });
    expect(sendMock).toHaveBeenCalledWith({
      chatRequest: expect.objectContaining({
        responseFormat: { type: "json_schema", jsonSchema: schema },
      }),
    });
  });

  test("strips markdown code fences before parsing JSON", async () => {
    sendMock.mockResolvedValue(textResponse('```json\n{"a": 2}\n```'));
    const result = await apiCall("Gib JSON", { json: true, cache: false });
    expect(result).toEqual({ a: 2 });
  });

  test("falls back from low to high model when JSON parsing fails on the low model", async () => {
    sendMock
      .mockResolvedValueOnce(textResponse("kein JSON"))
      .mockResolvedValueOnce(textResponse('{"ok": true}'));

    const result = await apiCall("Gib JSON", { json: true, cache: false });

    expect(result).toEqual({ ok: true });
    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(sendMock.mock.calls[0][0].chatRequest.model).toBe("test/low-model");
    expect(sendMock.mock.calls[1][0].chatRequest.model).toBe("test/high-model");
  });

  test("returns false when all attempts fail to produce valid JSON", async () => {
    sendMock.mockResolvedValue(textResponse("kein JSON"));
    const result = await apiCall("Gib JSON", { json: true, cache: false });
    expect(result).toBe(false);
    expect(sendMock).toHaveBeenCalledTimes(3); // low + degraded high attempts
  });

  test("makes only one attempt for text responses on the low model", async () => {
    sendMock.mockResolvedValue({ choices: [] });
    const result = await apiCall("Hallo", { cache: false });
    expect(result).toBe(false);
    expect(sendMock).toHaveBeenCalledTimes(1);
  });
});

describe("apiCall – structured output degradation (models without json_schema support)", () => {
  test("degrades json_schema to json_object with a json hint on API error", async () => {
    sendMock
      .mockRejectedValueOnce(new Error("Response validation failed"))
      .mockResolvedValueOnce(textResponse('{"items": []}'));

    const schema = { name: "s", strict: true, schema: { type: "object" } };
    const result = await apiCall("Gib JSON", { jsonSchema: schema, systemPrompt: "Du bist ein Parser.", cache: false });

    expect(result).toEqual({ items: [] });
    expect(sendMock).toHaveBeenCalledTimes(2);

    const first = sendMock.mock.calls[0][0].chatRequest;
    expect(first.model).toBe("test/low-model");
    expect(first.responseFormat).toEqual({ type: "json_schema", jsonSchema: schema });
    expect(first.messages[0]).toEqual({ role: "system", content: "Du bist ein Parser." });

    const second = sendMock.mock.calls[1][0].chatRequest;
    expect(second.model).toBe("test/high-model");
    expect(second.responseFormat).toEqual({ type: "json_object" });
    expect(second.messages[0].role).toBe("system");
    expect(second.messages[0].content).toContain("Du bist ein Parser.");
    expect(second.messages[0].content.toLowerCase()).toContain("json");
  });

  test("drops response_format entirely on the third attempt and parses plain text", async () => {
    sendMock
      .mockRejectedValueOnce(new Error("schema unsupported"))
      .mockRejectedValueOnce(new Error("json_object unsupported"))
      .mockResolvedValueOnce(textResponse('```json\n{"ok": 1}\n```'));

    const result = await apiCall("Gib JSON", { jsonSchema: { name: "s", schema: {} }, cache: false });

    expect(result).toEqual({ ok: 1 });
    expect(sendMock).toHaveBeenCalledTimes(3);
    const third = sendMock.mock.calls[2][0].chatRequest;
    expect(third.responseFormat).toBeUndefined();
    expect(third.messages.some((m) => m.role === "system" && m.content.toLowerCase().includes("json"))).toBe(true);
  });

  test("returns false when all degraded attempts fail", async () => {
    sendMock.mockRejectedValue(new Error("down"));
    const result = await apiCall("Gib JSON", { jsonSchema: { name: "s", schema: {} }, cache: false });
    expect(result).toBe(false);
    expect(sendMock).toHaveBeenCalledTimes(3);
  });

  test("keeps json_object on the second attempt when the first request had json mode", async () => {
    sendMock
      .mockRejectedValueOnce(new Error("upstream error"))
      .mockResolvedValueOnce(textResponse('{"a": 5}'));

    const result = await apiCall("Gib JSON", { json: true, cache: false });

    expect(result).toEqual({ a: 5 });
    const second = sendMock.mock.calls[1][0].chatRequest;
    expect(second.responseFormat).toEqual({ type: "json_object" });
    expect(second.messages.some((m) => m.role === "system" && m.content.toLowerCase().includes("json"))).toBe(true);
  });

  test("does not degrade or add hints for plain text calls", async () => {
    sendMock.mockResolvedValue(textResponse("Hallo"));
    await apiCall("Hallo", { systemPrompt: "Sys", cache: false });
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock.mock.calls[0][0].chatRequest.messages[0].content).toBe("Sys");
  });
});

describe("apiCall – caching", () => {
  test("returns the cached value without calling the API", async () => {
    llmReadCache.mockResolvedValue('{"cached": true}');
    const result = await apiCall("Hallo", { json: true });

    expect(result).toEqual({ cached: true });
    expect(sendMock).not.toHaveBeenCalled();
    expect(llmReadCache).toHaveBeenCalledWith(expect.any(String), "openrouter", "test/low-model");
  });

  test("returns cached plain text as string", async () => {
    llmReadCache.mockResolvedValue("Zwischengespeicherte Antwort");
    const result = await apiCall("Hallo", {});
    expect(result).toBe("Zwischengespeicherte Antwort");
    expect(sendMock).not.toHaveBeenCalled();
  });

  test("writes successful answers to the cache", async () => {
    await apiCall("Hallo", { cache: true });
    expect(llmWriteCache).toHaveBeenCalledWith(expect.any(String), "openrouter", "test/low-model", "Hello!");
  });

  test("does not read or write the cache when cache is false", async () => {
    await apiCall("Hallo", { cache: false });
    expect(llmReadCache).not.toHaveBeenCalled();
    expect(llmWriteCache).not.toHaveBeenCalled();
  });
});

describe("apiCall – tool calling", () => {
  test("passes tools and toolChoice to the SDK", async () => {
    const tools = [
      {
        type: "function",
        function: { name: "get_data", description: "d", parameters: { type: "object" } },
      },
    ];
    sendMock.mockResolvedValue(
      toolCallResponse([{ id: "call_1", type: "function", function: { name: "get_data", arguments: '{"x":1}' } }])
    );

    await apiCall("Hallo", { tools, toolChoice: "auto", cache: false });

    expect(sendMock).toHaveBeenCalledWith({
      chatRequest: expect.objectContaining({ tools, toolChoice: "auto" }),
    });
  });

  test("returns toolCalls and the assistant message for the tool loop", async () => {
    const toolCalls = [{ id: "call_1", type: "function", function: { name: "get_data", arguments: "{}" } }];
    sendMock.mockResolvedValue(toolCallResponse(toolCalls));

    const result = await apiCall("Hallo", { tools: [{ type: "function", function: { name: "get_data" } }], cache: false });

    expect(result).toHaveProperty("toolCalls", toolCalls);
    expect(result).toHaveProperty("message");
    expect(result.message.role).toBe("assistant");
  });
});

describe("apiCall – multimodal files", () => {
  test("attaches images as compressed image_url content parts", async () => {
    const file = { path: "/tmp/fake.jpg", mimetype: "image/jpeg", originalname: "fake.jpg" };
    await apiCall("Was ist das?", { files: [file], cache: false });

    const { messages } = sendMock.mock.calls[0][0].chatRequest;
    const userMessage = messages[messages.length - 1];
    expect(userMessage.role).toBe("user");
    expect(Array.isArray(userMessage.content)).toBe(true);
    expect(userMessage.content[0]).toEqual({ type: "text", text: "Was ist das?" });
    expect(userMessage.content[1]).toEqual({
      type: "image_url",
      imageUrl: { url: `data:image/jpeg;base64,${Buffer.from("compressed-image").toString("base64")}` },
    });
  });

  test("attaches audio as input_audio content part with mapped format", async () => {
    const file = { path: audioFixturePath, mimetype: "audio/wav", originalname: "audio.wav" };
    await apiCall("Transkribiere", { files: [file], cache: false });

    const { messages } = sendMock.mock.calls[0][0].chatRequest;
    const userMessage = messages[messages.length - 1];
    expect(userMessage.content[1]).toEqual({
      type: "input_audio",
      inputAudio: {
        data: Buffer.from("fake-audio-data").toString("base64"),
        format: "wav",
      },
    });
  });

  test("maps common audio mimetypes to OpenRouter formats", async () => {
    const cases = [
      ["audio/mpeg", "datei.mp3", "mp3"],
      ["audio/x-m4a", "datei.m4a", "m4a"],
      ["audio/ogg", "datei.ogg", "ogg"],
      ["audio/basic", "datei.flac", "flac"],
      ["audio/webm", "datei.unbekannt", "mp3"],
    ];

    for (const [mimetype, originalname, expectedFormat] of cases) {
      sendMock.mockClear();
      const file = { path: audioFixturePath, mimetype, originalname };
      await apiCall("Transkribiere", { files: [file], cache: false });
      const { messages } = sendMock.mock.calls[0][0].chatRequest;
      const audioPart = messages[messages.length - 1].content.find((c) => c.type === "input_audio");
      expect(audioPart.inputAudio.format).toBe(expectedFormat);
    }
  });

  test("appends file parts to an existing user history message", async () => {
    const file = { path: "/tmp/fake.jpg", mimetype: "image/jpeg", originalname: "fake.jpg" };
    const history = [{ role: "user", content: "Sieh dir das an" }];
    await apiCall("und das?", { history, files: [file], cache: false });

    const { messages } = sendMock.mock.calls[0][0].chatRequest;
    // prompt is appended as its own user message; file parts go to the last user message
    const lastMessage = messages[messages.length - 1];
    expect(Array.isArray(lastMessage.content)).toBe(true);
    expect(lastMessage.content.some((c) => c.type === "image_url")).toBe(true);
  });
});
