require("dotenv").config();
jest.setTimeout(20000);

jest.mock("../utils/llm/openrouter.js", () => ({
  apiCall: jest.fn(),
}));

const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Tracker = require("../models/trackerModel");
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
  await Tracker.deleteMany({});
});

describe("Calorie Tracker Controller", () => {
  test("POST /api/v2/calorietracker/item/add - Should add a food item manually", async () => {
    // 1. Fetch/Create today's tracker to get its trackerId
    const getTrackerResponse = await request(app)
      .post("/api/v2/calorietracker/get")
      .set("Authorization", `Bearer ${authToken}`)
      .set("X-Header-Secret-Key", userSecretKey)
      .send({ date: new Date().toISOString() });

    expect(getTrackerResponse.status).toBe(200);
    const trackerId = getTrackerResponse.body._id;
    expect(trackerId).toBeDefined();

    // 2. Add an item manually to this tracker
    const testItem = {
      name: "Apfel",
      amount: 150,
      unit: "g",
      kcal: 78,
      protein: 0.5,
      carbohydrates: 21,
      fat: 0.3,
    };

    const addItemResponse = await request(app)
      .post("/api/v2/calorietracker/item/add")
      .set("Authorization", `Bearer ${authToken}`)
      .set("X-Header-Secret-Key", userSecretKey)
      .send({
        trackerId,
        item: testItem,
      });

    expect(addItemResponse.status).toBe(200);
    expect(addItemResponse.body).toHaveProperty("message", "Food item added successfully");
    expect(addItemResponse.body).toHaveProperty("tracker");

    const updatedTracker = addItemResponse.body.tracker;
    expect(updatedTracker.foodItems).toHaveLength(1);
    expect(updatedTracker.foodItems[0]).toMatchObject({
      name: "Apfel",
      amount: 150,
      unit: "g",
      kcal: 78,
      protein: 0.5,
      carbohydrates: 21,
      fat: 0.3,
    });
  });

  test("POST /api/v2/calorietracker/item/add - Should return 400 if item is invalid", async () => {
    const getTrackerResponse = await request(app)
      .post("/api/v2/calorietracker/get")
      .set("Authorization", `Bearer ${authToken}`)
      .set("X-Header-Secret-Key", userSecretKey)
      .send({});

    const trackerId = getTrackerResponse.body._id;

    // Send invalid item (missing name and unit)
    const invalidResponse = await request(app)
      .post("/api/v2/calorietracker/item/add")
      .set("Authorization", `Bearer ${authToken}`)
      .set("X-Header-Secret-Key", userSecretKey)
      .send({
        trackerId,
        item: { amount: 100 },
      });

    expect(invalidResponse.status).toBe(400);
    expect(invalidResponse.body).toHaveProperty("error", "Item with name, amount, and unit is required.");
  });
});
