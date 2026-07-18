// Unit tests for the AudioTranscriber (backend/utils/audioTranscriber.js)
// Uses the OpenRouter SDK client (mocked) for audio transcription.

process.env.OPENROUTER_LOW_MODEL = "test/low-model";

const sendMock = jest.fn();

jest.mock("../utils/llm/sdkClient.js", () => ({
  getOpenRouterClient: jest.fn(),
  resetOpenRouterClient: jest.fn(),
}));

const fs = require("fs");
const os = require("os");
const path = require("path");

const { getOpenRouterClient } = require("../utils/llm/sdkClient.js");
const AudioTranscriber = require("../utils/audioTranscriber.js");

let sourceFilePath;

beforeEach(() => {
  jest.clearAllMocks();
  getOpenRouterClient.mockResolvedValue({ chat: { send: sendMock } });
  sendMock.mockResolvedValue({
    choices: [{ index: 0, message: { role: "assistant", content: "Hallo Welt" } }],
  });
  sourceFilePath = path.join(os.tmpdir(), `transcriber-src-${Date.now()}-${Math.random().toString(36).slice(2)}.wav`);
  fs.writeFileSync(sourceFilePath, "fake-audio");
});

afterEach(() => {
  if (sourceFilePath && fs.existsSync(sourceFilePath)) fs.unlinkSync(sourceFilePath);
});

describe("transcribeFromBuffer", () => {
  test("sends the audio file to OpenRouter and returns the transcription", async () => {
    const transcriber = new AudioTranscriber();
    const file = { path: sourceFilePath, originalname: "aufnahme.wav", mimetype: "audio/wav" };

    const result = await transcriber.transcribeFromBuffer(file);

    expect(result).toBe("Hallo Welt");
    expect(sendMock).toHaveBeenCalledTimes(1);

    const { chatRequest } = sendMock.mock.calls[0][0];
    expect(chatRequest.model).toBeDefined();
    const userMessage = chatRequest.messages[0];
    expect(userMessage.role).toBe("user");
    expect(userMessage.content[0].type).toBe("text");
    expect(userMessage.content[1]).toEqual({
      type: "input_audio",
      inputAudio: {
        data: Buffer.from("fake-audio").toString("base64"),
        format: "wav",
      },
    });
  });

  test("uses the file extension from the original filename", async () => {
    const transcriber = new AudioTranscriber();
    const file = { path: sourceFilePath, originalname: "memo.m4a", mimetype: "audio/x-m4a" };

    await transcriber.transcribeFromBuffer(file);

    const audioPart = sendMock.mock.calls[0][0].chatRequest.messages[0].content[1];
    expect(audioPart.inputAudio.format).toBe("m4a");
  });

  test("falls back to mp3 for unknown extensions", async () => {
    const transcriber = new AudioTranscriber();
    const file = { path: sourceFilePath, originalname: "memo.unbekannt", mimetype: "application/octet-stream" };

    await transcriber.transcribeFromBuffer(file);

    const audioPart = sendMock.mock.calls[0][0].chatRequest.messages[0].content[1];
    expect(audioPart.inputAudio.format).toBe("mp3");
  });

  test("returns false when the OpenRouter call fails", async () => {
    sendMock.mockRejectedValue(new Error("API down"));
    const transcriber = new AudioTranscriber();
    const file = { path: sourceFilePath, originalname: "aufnahme.wav", mimetype: "audio/wav" };

    expect(await transcriber.transcribeFromBuffer(file)).toBe(false);
  });

  test("cleans up the uploaded source file", async () => {
    const transcriber = new AudioTranscriber();
    const file = { path: sourceFilePath, originalname: "aufnahme.wav", mimetype: "audio/wav" };

    await transcriber.transcribeFromBuffer(file);

    expect(fs.existsSync(sourceFilePath)).toBe(false);
  });
});
