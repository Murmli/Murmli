jest.setTimeout(20000);

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('../utils/imageUtils.js', () => ({
  deleteImageFromStorage: jest.fn().mockResolvedValue(true)
}));

const ExerciseImage = require('../models/exerciseImageModel');
const { deleteAllExerciseImages } = require('../utils/exerciseImageUtils');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await ExerciseImage.deleteMany({});
});

test('deleteAllExerciseImages removes images from db and storage', async () => {
  await ExerciseImage.create({ exerciseKey: 'push', imageUrl: 'http://img/push' });
  await ExerciseImage.create({ exerciseKey: 'pull', imageUrl: 'http://img/pull' });
  const utils = require('../utils/imageUtils.js');

  await deleteAllExerciseImages();

  expect(utils.deleteImageFromStorage).toHaveBeenCalledTimes(2);
  const remaining = await ExerciseImage.countDocuments();
  expect(remaining).toBe(0);
});
