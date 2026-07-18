require("dotenv").config();
jest.setTimeout(20000);

jest.mock("../utils/llm.js", () => ({
  textToItemArray: jest.fn().mockResolvedValue([
    { name: "Äpfel", quantity: 2, unit: 0, category: 5 }
  ]),
  generateTranslation: jest.fn().mockResolvedValue("Apples"),
  generateJsonTranslation: jest.fn().mockResolvedValue({}),
  findAlternativeItems: jest.fn().mockResolvedValue([]),
}));

const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const ShoppingList = require("../models/shoppingListModel");
const app = require("../app");

let mongoServer;
let authToken;
let userSecretKey = process.env.SECRET_KEY; // Secret-Key aus der .env-Datei

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.DB_STRING = mongoServer.getUri();

  // Erstelle Benutzer und erhalte Authentifizierungstoken
  const response = await request(app)
    .post("/api/v2/session/create")
    .send({ language: "de" })
    .set("X-Header-Secret-Key", userSecretKey);

  if (response.status !== 201) {
    throw new Error("Failed to create user session");
  }

  authToken = response.body.token; // Authentifizierungstoken speichern
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await ShoppingList.deleteMany({});
});

describe("Shopping List Controller", () => {
  test("POST /api/v2/shoppingList/create - Should create a new shopping list", async () => {
    const response = await request(app)
      .get("/api/v2/shoppingList/create")
      .set("Authorization", `Bearer ${authToken}`)
      .set("X-Header-Secret-Key", userSecretKey);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("list");
  });

  test("POST /api/v2/shoppingList/item/create/text - Should add an item to the shopping list", async () => {
    // Create a shopping list
    const createResponse = await request(app)
      .get("/api/v2/shoppingList/create")
      .set("Authorization", `Bearer ${authToken}`)
      .set("X-Header-Secret-Key", userSecretKey);

    expect(createResponse.status).toBe(200);
    const listId = createResponse.body.list._id;

    // Add an item to the shopping list
    const addItemResponse = await request(app)
      .post("/api/v2/shoppingList/item/create/text")
      .set("Authorization", `Bearer ${authToken}`)
      .set("X-Header-Secret-Key", userSecretKey)
      .send({
        text: "Apples 2 kg",
        listId, // pass the shopping list id
      });

    expect(addItemResponse.status).toBe(200);
    expect(addItemResponse.body).toHaveProperty("list");
    expect(addItemResponse.body.list.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Apples",
          quantity: 2,
        }),
      ])
    );
  }, 10000);
});
