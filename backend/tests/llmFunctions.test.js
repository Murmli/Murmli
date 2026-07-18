// Unit tests for the LLM helper functions in backend/utils/llm.js
// The OpenRouter client (apiCall) and image generation are mocked.

jest.mock("../utils/llm/openrouter.js", () => ({
  apiCall: jest.fn(),
}));

jest.mock("../utils/imageUtils.js", () => ({
  generateImage: jest.fn(),
}));

jest.mock("../utils/audioTranscriber.js");

const { apiCall } = require("../utils/llm/openrouter.js");
const { generateImage } = require("../utils/imageUtils.js");
const AudioTranscriber = require("../utils/audioTranscriber.js");
const llm = require("../utils/llm.js");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("textToItemArray", () => {
  test("returns validated items from the LLM response", async () => {
    apiCall.mockResolvedValue({ items: [{ name: "Milch", quantity: 1, unit: 0, category: 5 }] });
    const result = await llm.textToItemArray("1l Milch");
    expect(result).toEqual([{ name: "Milch", quantity: 1, unit: 0, category: 5 }]);
    expect(apiCall).toHaveBeenCalledWith("1l Milch", expect.objectContaining({ systemPrompt: expect.any(String) }));
  });

  test("returns false when the response fails validation", async () => {
    apiCall.mockResolvedValue({ items: [{ name: "Milch", quantity: "abc", unit: 0, category: 5 }] });
    const result = await llm.textToItemArray("Milch");
    expect(result).toBe(false);
  });

  test("returns false when the API call fails", async () => {
    apiCall.mockResolvedValue(false);
    expect(await llm.textToItemArray("Milch")).toBe(false);
  });
});

describe("generateTranslation", () => {
  test("returns the translation string", async () => {
    apiCall.mockResolvedValue({ translation: "Apples" });
    expect(await llm.generateTranslation("Äpfel", "en-US")).toBe("Apples");
  });

  test("returns false when there is no answer", async () => {
    apiCall.mockResolvedValue(false);
    expect(await llm.generateTranslation("Äpfel", "en-US")).toBe(false);
  });
});

describe("generateJsonTranslation", () => {
  test("maps key/value arrays to an object", async () => {
    apiCall.mockResolvedValue({ translation: [{ key: "a", value: "b" }, { key: "c", value: "d" }] });
    expect(await llm.generateJsonTranslation("{}", "en-US")).toEqual({ a: "b", c: "d" });
  });

  test("returns object translations directly", async () => {
    apiCall.mockResolvedValue({ translation: { x: "y" } });
    expect(await llm.generateJsonTranslation("{}", "en-US")).toEqual({ x: "y" });
  });
});

describe("textToTrack", () => {
  test("wraps a single item object into an array", async () => {
    apiCall.mockResolvedValue({ items: { name: "Apfel", kcal: 50 } });
    expect(await llm.textToTrack("1 Apfel", "de-DE")).toEqual([{ name: "Apfel", kcal: 50 }]);
  });

  test("returns items array as-is", async () => {
    apiCall.mockResolvedValue({ items: [{ name: "Apfel" }, { name: "Birne" }] });
    expect(await llm.textToTrack("Obst", "de-DE")).toHaveLength(2);
  });

  test("returns false when items are missing", async () => {
    apiCall.mockResolvedValue({ items: null });
    expect(await llm.textToTrack("nichts", "de-DE")).toBe(false);
  });
});

describe("refineTrackedItems", () => {
  test("returns the refined items", async () => {
    apiCall.mockResolvedValue({ items: [{ name: "Apfel", amount: 2 }] });
    const result = await llm.refineTrackedItems([{ name: "Apfel" }], "verdopple die Menge", "de-DE");
    expect(result).toEqual([{ name: "Apfel", amount: 2 }]);
    expect(apiCall).toHaveBeenCalledWith(
      expect.stringContaining("verdopple die Menge"),
      expect.objectContaining({ cache: false })
    );
  });
});

describe("findMdiIconForFood", () => {
  test("returns the icon from the LLM", async () => {
    apiCall.mockResolvedValue({ icon: "mdi-apple" });
    expect(await llm.findMdiIconForFood("Apfel")).toBe("mdi-apple");
  });

  test("falls back to mdi-food on failure", async () => {
    apiCall.mockResolvedValue(false);
    expect(await llm.findMdiIconForFood("Apfel")).toBe("mdi-food");
  });
});

describe("chatWithRecipe", () => {
  test("sends the last message as prompt and the rest as history", async () => {
    apiCall.mockResolvedValue("Leckere Antwort");
    const messages = [
      { role: "user", content: "Frage 1" },
      { role: "assistant", content: "Antwort 1" },
      { role: "user", content: "Frage 2" },
    ];
    const result = await llm.chatWithRecipe(messages, { title: "Rezept" }, "de-DE");

    expect(result).toBe("Leckere Antwort");
    expect(apiCall).toHaveBeenCalledWith("Frage 2", expect.objectContaining({
      history: [
        { role: "user", content: "Frage 1" },
        { role: "assistant", content: "Antwort 1" },
      ],
      json: false,
    }));
  });
});

describe("correctGrammar", () => {
  test("returns the corrected text", async () => {
    apiCall.mockResolvedValue("Korrigierter Text");
    expect(await llm.correctGrammar("fehlerhaft", "de-DE")).toBe("Korrigierter Text");
  });
});

describe("editRecipeWithLLM", () => {
  test("handles responses with recipe and changes wrapper", async () => {
    apiCall.mockResolvedValue({ recipe: { title: "Neu" }, changes: ["Titel geändert"] });
    const result = await llm.editRecipeWithLLM({ title: "Alt" }, "ändere den Titel", "de-DE");
    expect(result).toEqual({ updatedRecipeData: { title: "Neu" }, changeSummary: ["Titel geändert"] });
  });

  test("handles plain recipe responses", async () => {
    apiCall.mockResolvedValue({ title: "Nur Rezept" });
    const result = await llm.editRecipeWithLLM({ title: "Alt" }, "text", "de-DE");
    expect(result).toEqual({ updatedRecipeData: { title: "Nur Rezept" }, changeSummary: [] });
  });

  test("returns false when the API call fails", async () => {
    apiCall.mockResolvedValue(false);
    expect(await llm.editRecipeWithLLM({ title: "Alt" }, "text", "de-DE")).toBe(false);
  });
});

describe("sortRecipeSuggestions", () => {
  const recipes = [{ title: "A" }, { title: "B" }, { title: "C" }];

  test("sorts recipes by the returned indices", async () => {
    apiCall.mockResolvedValue({ sort: [2, 0, 1] });
    const result = await llm.sortRecipeSuggestions(recipes, [], [], "text");
    expect(result).toEqual([{ title: "C" }, { title: "A" }, { title: "B" }]);
  });

  test("returns false when no sort order is returned", async () => {
    apiCall.mockResolvedValue({});
    expect(await llm.sortRecipeSuggestions(recipes, [], [], "text")).toBe(false);
  });
});

describe("generateImage", () => {
  test("delegates to imageUtils and returns the image url", async () => {
    generateImage.mockResolvedValue("https://img.example/x.png");
    expect(await llm.generateImage("ein prompt")).toBe("https://img.example/x.png");
  });

  test("returns false when image generation fails", async () => {
    generateImage.mockResolvedValue(false);
    expect(await llm.generateImage("ein prompt")).toBe(false);
  });
});

describe("audioToItemArray", () => {
  test("transcribes audio and extracts items", async () => {
    AudioTranscriber.mockImplementation(() => ({
      transcribeFromBuffer: jest.fn().mockResolvedValue("zwei Äpfel und eine Birne"),
    }));
    apiCall.mockResolvedValue({ items: [{ name: "Äpfel", quantity: 2, unit: 11, category: 5 }] });

    const result = await llm.audioToItemArray({ path: "/tmp/a.mp3", mimetype: "audio/mpeg" });
    expect(result).toEqual([{ name: "Äpfel", quantity: 2, unit: 11, category: 5 }]);
    expect(apiCall).toHaveBeenCalledWith(
      expect.stringContaining("zwei Äpfel und eine Birne"),
      expect.objectContaining({ cache: false })
    );
  });

  test("returns false when transcription fails", async () => {
    AudioTranscriber.mockImplementation(() => ({
      transcribeFromBuffer: jest.fn().mockResolvedValue(false),
    }));
    expect(await llm.audioToItemArray({ path: "/tmp/a.mp3", mimetype: "audio/mpeg" })).toBe(false);
    expect(apiCall).not.toHaveBeenCalled();
  });
});

describe("generateRecipeFilter", () => {
  test("parses string responses as JSON", async () => {
    apiCall.mockResolvedValue('{"vegetarian": true}');
    expect(await llm.generateRecipeFilter("nur vegetarisch", 10)).toEqual({ vegetarian: true });
  });

  test("returns false for invalid JSON strings", async () => {
    apiCall.mockResolvedValue("kein json");
    expect(await llm.generateRecipeFilter("x", 10)).toBe(false);
  });
});
