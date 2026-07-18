// Unit tests for image generation via OpenRouter (backend/utils/imageUtils.js)
// The OpenRouter SDK client is mocked; Azure storage helpers are not touched here.

const sendMock = jest.fn();

jest.mock("../utils/llm/sdkClient.js", () => ({
  getOpenRouterClient: jest.fn(),
  resetOpenRouterClient: jest.fn(),
}));

const { getOpenRouterClient } = require("../utils/llm/sdkClient.js");
const { generateImage } = require("../utils/imageUtils.js");

beforeEach(() => {
  jest.clearAllMocks();
  getOpenRouterClient.mockResolvedValue({ chat: { send: sendMock } });
  sendMock.mockResolvedValue({
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: "",
          images: [{ imageUrl: { url: "https://cdn.example.com/bild.png" } }],
        },
      },
    ],
  });
});

describe("generateImage", () => {
  test("requests an image via the OpenRouter SDK and returns the image url", async () => {
    const result = await generateImage("Ein Kuchen auf einem Teller");

    expect(result).toBe("https://cdn.example.com/bild.png");
    expect(sendMock).toHaveBeenCalledTimes(1);

    const { chatRequest } = sendMock.mock.calls[0][0];
    expect(chatRequest.model).toBe(process.env.OPENROUTER_RECIPE_IMAGE_MODEL || "google/gemini-2.5-flash-image");
    expect(chatRequest.modalities).toEqual(["image", "text"]);
    expect(chatRequest.imageConfig).toEqual({ aspect_ratio: expect.any(String) });
    expect(chatRequest.messages).toEqual([{ role: "user", content: "Ein Kuchen auf einem Teller" }]);
  });

  test("uses a supported aspect ratio (default 3:2)", async () => {
    await generateImage("prompt");
    expect(sendMock.mock.calls[0][0].chatRequest.imageConfig.aspect_ratio).toBe("3:2");
  });

  test("returns false when the response contains no image", async () => {
    sendMock.mockResolvedValue({
      choices: [{ index: 0, message: { role: "assistant", content: "kein bild" } }],
    });
    expect(await generateImage("prompt")).toBe(false);
  });

  test("returns false when the SDK call fails", async () => {
    sendMock.mockRejectedValue(new Error("API down"));
    expect(await generateImage("prompt")).toBe(false);
  });
});
