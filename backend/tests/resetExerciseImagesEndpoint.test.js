const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

jest.setTimeout(20000);

jest.mock('../utils/imageUtils.js', () => ({
  deleteImageFromStorage: jest.fn().mockResolvedValue(true)
}));

const ExerciseImage = require('../models/exerciseImageModel');
const User = require('../models/userModel');

let mongoServer;
let server;
let token;
const userSecretKey = 'test-secret';

beforeAll(async () => {
  process.env.JWT_SECRET = 'jwt';
  process.env.SECRET_KEY = userSecretKey;
  process.env.LLM_PROVIDER = 'openai';

  mongoServer = await MongoMemoryServer.create();
  process.env.DB_STRING = mongoServer.getUri();
  const app = require('../app');
  server = app.listen(4010);

  const response = await request(server)
    .post('/api/v2/session/create')
    .send({ language: 'de' })
    .set('X-Header-Secret-Key', userSecretKey);

  token = response.body.token;
  const decoded = jwt.verify(token, 'jwt');
  await User.findByIdAndUpdate(decoded.userId, { role: 'administrator' });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  server.close();
});

beforeEach(async () => {
  await ExerciseImage.deleteMany({});
});

test('admin can reset exercise images', async () => {
  await ExerciseImage.create({ exerciseKey: 'p', imageUrl: 'http://img/p' });
  await ExerciseImage.create({ exerciseKey: 'q', imageUrl: 'http://img/q' });
  const utils = require('../utils/imageUtils.js');

  const res = await request(server)
    .delete('/api/v2/system/exercise-images/reset')
    .set('Authorization', `Bearer ${token}`)
    .set('X-Header-Secret-Key', userSecretKey);

  expect(res.status).toBe(200);
  expect(utils.deleteImageFromStorage).toHaveBeenCalledTimes(2);
  const count = await ExerciseImage.countDocuments();
  expect(count).toBe(0);
});
