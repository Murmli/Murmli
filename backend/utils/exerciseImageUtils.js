const ExerciseImage = require('../models/exerciseImageModel');
const { generateImage, uploadImageToStorage } = require('./imageUtils');
const { exerciseImagePrompt } = require('./prompts');

// In-memory set to track currently generating images to prevent race conditions
const generatingKeys = new Set();

// Prefix for stored exercise images
const EXERCISE_IMAGE_PREFIX = 'ei_';

// Create a random 6 digit id for image filenames and include a sanitized exercise name
function generateExerciseImageFilename(exerciseName = '') {
  const id = Math.floor(100000 + Math.random() * 900000); // 6 digits

  // Sanitize and slugify the exercise name for safe filenames
  const slug = String(exerciseName)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents/diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // non-alphanumerics to dashes
    .replace(/^-+|-+$/g, '') // trim leading/trailing dashes
    .slice(0, 50); // keep it reasonably short

  // If no valid slug, just return prefix + id
  if (!slug) return `${EXERCISE_IMAGE_PREFIX}${id}`;

  return `${EXERCISE_IMAGE_PREFIX}${slug}_${id}`;
}

/**
 * Generates and stores an image for the given exercise if it does not already exist.
 * @param {Object} exercise - Exercise object containing name and key.
 */
async function createExerciseImage(exercise) {
  if (!exercise || !exercise.key || !exercise.name) return;

  // Prevent multiple simultaneous generations for the same key
  if (generatingKeys.has(exercise.key)) return;

  try {
    const existing = await ExerciseImage.findOne({ exerciseKey: exercise.key });
    if (existing) return;

    generatingKeys.add(exercise.key);

    const prompt = exerciseImagePrompt(exercise.name, exercise.instructions);
    const imageUrl = await generateImage(prompt);
    if (!imageUrl) {
      console.error(`Failed to generate image for ${exercise.key}`);
      generatingKeys.delete(exercise.key);
      return;
    }

    const filename = generateExerciseImageFilename(exercise.name);
    const storedUrl = await uploadImageToStorage(imageUrl, filename);
    if (!storedUrl) {
      console.error(`Failed to upload image for ${exercise.key}`);
      generatingKeys.delete(exercise.key);
      return;
    }

    try {
      const doc = await ExerciseImage.create({
        exerciseKey: exercise.key,
        imageUrl: storedUrl,
        prompt,
        model: process.env.OPENROUTER_RECIPE_IMAGE_MODEL || 'google/gemini-2.5-flash-image'
      });
      console.log('Created exercise image:', doc.imageUrl);
    } catch (createErr) {
      if (createErr.code === 11000) {
        console.log(`Image for ${exercise.key} already created by another process.`);
      } else {
        throw createErr;
      }
    }
  } catch (err) {
    console.error('Error generating exercise image:', err.message);
  } finally {
    generatingKeys.delete(exercise.key);
  }
}

// Export einzeln für gezielte Nachgenerierung
exports.createExerciseImage = createExerciseImage;

/**
 * Loops through all exercises in a plan and ensures an image exists for each unique exercise key.
 * @param {Object} plan - Training plan document or plain object.
 */
exports.generateImagesForPlan = async function (plan) {
  if (!plan || !Array.isArray(plan.days)) return;

  const processed = new Set();
  for (const day of plan.days) {
    if (!Array.isArray(day.exercises)) continue;
    for (const ex of day.exercises) {
      if (ex.key && !processed.has(ex.key)) {
        processed.add(ex.key);
        await createExerciseImage(ex);
      }
    }
  }
};

/**
 * Deletes all exercise images from MongoDB and Azure Blob Storage.
 */
exports.deleteAllExerciseImages = async function () {
  try {
    const images = await ExerciseImage.find({});
    for (const img of images) {
      if (img.imageUrl && img.imageUrl !== 'dummy') {
        try {
          const { deleteImageFromStorage } = require('./imageUtils');
          await deleteImageFromStorage(img.imageUrl);
        } catch (err) {
          console.error('Failed to delete image from storage:', err.message);
        }
      }
    }
    await ExerciseImage.deleteMany({});
  } catch (err) {
    console.error('Error deleting exercise images:', err.message);
  }
};
