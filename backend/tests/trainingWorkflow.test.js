const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
jest.setTimeout(20000);

jest.mock('../utils/llm/openai.js', () => ({
  apiCall: jest.fn().mockResolvedValue({
    name: 'Generated Plan',
    type: 'gym',
    goal: 'strength',
    days: [
      {
        weekday: 1,
        description: 'Day 1',
        duration: 30,
        exercises: [
          { name: 'Push Up', sets: 1, repetitions: 10, key: 'push_up', measurementType: 'none' }
        ]
      }
    ],
    durationWeeks: 1
  }),
  generateImage: jest.fn().mockResolvedValue('base64data'),
  editImage: jest.fn(),
}));

jest.mock('../utils/imageUtils.js', () => ({
  uploadBase64ImageToStorage: jest.fn().mockResolvedValue('http://stored/img.jpg'),
  deleteImageFromStorage: jest.fn(),
}));

const ExerciseImage = require('../models/exerciseImageModel');
const imageUtils = require('../utils/imageUtils.js');

let mongoServer;
let authToken;
let server;
const userSecretKey = 'test-secret';
let planId;

beforeAll(async () => {
  process.env.JWT_SECRET = 'jwt';
  process.env.SECRET_KEY = userSecretKey;
  process.env.LLM_PROVIDER = 'openai';

  mongoServer = await MongoMemoryServer.create();
  process.env.DB_STRING = mongoServer.getUri();
  const app = require('../app');
  server = app.listen(4001);

  const response = await request(server)
    .post('/api/v2/session/create')
    .send({ language: 'de' })
    .set('X-Header-Secret-Key', userSecretKey);

  authToken = response.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  server.close();
});

describe('Training workflow', () => {
  test('generate training plan and log workflow', async () => {
    const genResponse = await request(server)
      .post('/api/v2/training-plans/generate')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-Header-Secret-Key', userSecretKey)
      .send({ text: 'test plan' });

    expect(genResponse.status).toBe(202);

    await new Promise(resolve => setTimeout(resolve, 50));

    const plansResponse = await request(server)
      .get('/api/v2/training-plans')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-Header-Secret-Key', userSecretKey);

    expect(plansResponse.status).toBe(200);
    planId = plansResponse.body[0]._id;

    const logResponse = await request(server)
      .post('/api/v2/training-logs')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-Header-Secret-Key', userSecretKey)
      .send({ trainingPlanId: planId, weekday: 1 });

    expect(logResponse.status).toBe(201);
    expect(logResponse.body.exercises[0].measurementType).toBe('none');
    expect(logResponse.body.exercises[0].sets[0].weight).toBeNull();
    const logId = logResponse.body._id;
    const exerciseLogId = logResponse.body.exercises[0]._id;

    const lastResponse = await request(server)
      .get(`/api/v2/training-logs/last?trainingPlanId=${planId}&weekday=1`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-Header-Secret-Key', userSecretKey);

    expect(lastResponse.status).toBe(200);
    expect(lastResponse.body._id).toBe(logId);

    const completeResponse = await request(server)
      .post(`/api/v2/training-logs/${logId}/exercises/${exerciseLogId}/sets/0/complete`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-Header-Secret-Key', userSecretKey)
      .send({ repetitions: 10 });

    expect(completeResponse.status).toBe(200);

    const img = await ExerciseImage.findOne({ exerciseKey: 'push_up' });
    expect(img).not.toBeNull();
    expect(img.imageUrl).toBe('http://stored/img.jpg');

    expect(imageUtils.uploadBase64ImageToStorage).toHaveBeenCalled();
    const filenameArg = imageUtils.uploadBase64ImageToStorage.mock.calls[0][1];
    expect(filenameArg).toMatch(/^ei_\d{5,6}$/);
  }, 20000);

  test('update training plan exercise', async () => {
    const plansResponse = await request(server)
      .get('/api/v2/training-plans')
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-Header-Secret-Key', userSecretKey);

    expect(plansResponse.status).toBe(200);
    const exerciseId = plansResponse.body[0].days[0].exercises[0]._id;

    const patchResponse = await request(server)
      .patch(`/api/v2/training-plans/${planId}/exercises/${exerciseId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-Header-Secret-Key', userSecretKey)
      .send({ repetitions: 20 });

    expect(patchResponse.status).toBe(200);
    expect(patchResponse.body.repetitions).toBe(20);
  });
});
