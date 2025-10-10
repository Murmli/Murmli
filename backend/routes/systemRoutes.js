// routes/systemRoutes.js
// loaded from app.js with prefix api/v2/system
// authMiddleware.js is pre-applied and creates req.user object

const express = require("express");
const router = express.Router();
const systemController = require("../controllers/systemController.js");
const multer = require('multer');
const os = require('os');
const path = require('path');
const AudioTranscriber = require('../utils/audioTranscriber');
const { secretKeyMiddleware, sessionMiddleware } = require("./../middlewares/authMiddleware.js");


// Multer setup for temporary file storage
const upload = multer({ dest: os.tmpdir() });
const audioTranscriber = new AudioTranscriber();

/**
 * @swagger
 * /api/v2/system/translate:
 *   post:
 *     tags:
 *       - System
 *     title: Translate Text
 *     summary: Translate a given text into a specified language
 *     description: Translates the provided text into the target language using AI translation service.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Translate Text Request
 *             required:
 *               - text
 *               - outputLang
 *             properties:
 *               text:
 *                 type: string
 *                 description: The text to be translated.
 *                 example: "Hello, how are you?"
 *               outputLang:
 *                 type: string
 *                 description: The target language code (e.g., 'de' for German, 'fr' for French).
 *                 example: "de"
 *     responses:
 *       200:
 *         description: Successfully translated text
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               title: Translation Response
 *               properties:
 *                 translation:
 *                   type: string
 *                   description: The translated text.
 *                   example: "Hallo, wie geht es dir?"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post("/translate", secretKeyMiddleware, sessionMiddleware, systemController.translate);

/**
 * @swagger
 * /api/v2/system/recipe/generate:
 *   post:
 *     tags:
 *       - System
 *     title: Generate AI Recipes
 *     summary: Generate new recipes using AI
 *     description: Generates one or multiple new recipes based on provided text prompt and optional image. Only accessible by administrator users.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             title: Generate Recipes Request
 *             properties:
 *               text:
 *                 type: string
 *                 description: Prompt or description to generate recipes from.
 *                 example: "Create a vegan pasta recipe with tomatoes and basil."
 *               count:
 *                 type: integer
 *                 description: Number of recipes to generate (default is 1).
 *                 example: 3
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Optional image file to assist recipe generation.
 *     responses:
 *       201:
 *         description: Successfully generated recipes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               title: Generated Recipes Response
 *               properties:
 *                 recipes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Recipe'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post("/recipe/generate", secretKeyMiddleware, sessionMiddleware, systemController.generateRecipes);


/**
 * @swagger
 * /api/v2/system/transcribe:
 *   post:
 *     tags:
 *       - System
 *     title: Transcribe Audio
 *     summary: Transcribe audio to text
 *     description: Receives an audio file (multipart/form-data) and transcribes it to text using AI.
 *     security:
 *       - bearerAuth: []
 *       - secretKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             title: Transcribe Audio Request
 *             required:
 *               - audio
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *                 description: The audio file to transcribe (e.g., mp3, wav, m4a).
 *     responses:
 *       200:
 *         description: Successfully transcribed audio
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               title: Transcription Response
 *               properties:
 *                 text:
 *                   type: string
 *                   description: The transcribed text.
 *                   example: "This is the transcribed text from the audio."
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/transcribe', secretKeyMiddleware, sessionMiddleware, upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No audio file uploaded.' });
  }

  try {
    const text = await audioTranscriber.transcribeFromBuffer(req.file);

    if (text === false) {
      // transcribeFromBuffer handles its own console errors
      return res.status(500).json({ message: 'Failed to transcribe audio.' });
    }

    res.status(200).json({ text });
  } catch (error) {
    console.error('Error in /transcribe route:', error);
    // Ensure temp file is cleaned up even on unexpected errors
    if (req.file && req.file.path && require('fs').existsSync(req.file.path)) {
      try {
        require('fs').unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError);
      }
    }
    res.status(500).json({ message: 'An unexpected error occurred during transcription.' });
  }
});


/**
 * @swagger
 * /api/v2/system/test:
 *   get:
 *     title: Test Image Generation
 *     summary: Testet die Bildgenerierungsfunktion.
 *     description: Ruft die LLM-basierte Bildgenerierungsfunktion mit einem festen Prompt auf und gibt das Ergebnis zurück.
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: Erfolgreiche Bildgenerierung.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               title: Image Generation Test Response
 *               properties:
 *                 test:
 *                   type: string
 *                   description: Das Ergebnis der Bildgenerierungsfunktion (z.B. eine URL oder Base64-Daten).
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/test", sessionMiddleware, async (req, res) => {
  const user = req.user;
  if (!user || user.role != "administrator") {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const { generateImage } = require(`../utils/llm.js`);
  const test = await generateImage("a cat sitting at the park and chilling");
  console.log("finish generation")
  res.status(200).json({ test });
});

/**
 * @swagger
 * /api/v2/system/exercise-images/reset:
 *   delete:
 *     summary: Delete all exercise images
 *     description: Removes all exercise images from the database and Azure storage. Administrator only.
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: Images deleted
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.delete('/exercise-images/reset', secretKeyMiddleware, sessionMiddleware, systemController.resetExerciseImages);

/**
 * @swagger
 * /api/v2/system/llm/cache:
 *   delete:
 *     summary: Clear LLM cache
 *     description: Removes all cached LLM responses. Administrator only.
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: Cache cleared
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.delete('/llm/cache', secretKeyMiddleware, sessionMiddleware, systemController.clearLlmCache);

/**
 * @swagger
 * /api/v2/system/stats:
 *   get:
 *     summary: Get system statistics
 *     description: Returns various statistics about users and content. Administrator only.
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: Statistics object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               title: Statistics
 *               properties:
 *                 usersToday:
 *                   type: integer
 *                 usersYesterday:
 *                   type: integer
 *                 usersThisWeek:
 *                   type: integer
 *                 usersLastWeek:
 *                   type: integer
 *                 activeUsersToday:
 *                   type: integer
 *                 activeUsersYesterday:
 *                   type: integer
 *                 activeUsersThisWeek:
 *                   type: integer
 *                 activeUsersLastWeek:
 *                   type: integer
 *                 usersTodayDiff:
 *                   type: integer
 *                 usersThisWeekDiff:
 *                   type: integer
 *                 activeUsersTodayDiff:
 *                   type: integer
 *                 activeUsersThisWeekDiff:
 *                   type: integer
 *                 plannerUsersTodayDiff:
 *                   type: integer
 *                 plannerUsersThisWeekDiff:
 *                   type: integer
 *                 shoppingListUsersTodayDiff:
 *                   type: integer
 *                 shoppingListUsersThisWeekDiff:
 *                   type: integer
 *                 calorieTrackerUsersTodayDiff:
 *                   type: integer
 *                 calorieTrackerUsersThisWeekDiff:
 *                   type: integer
 *                 recipesLast24h:
 *                   type: integer
 *                 trainingPlansLast24h:
 *                   type: integer
 *                 plannerUsersTotal:
 *                   type: integer
 *                 plannerUsersToday:
 *                   type: integer
 *                 plannerUsersYesterday:
 *                   type: integer
 *                 plannerUsersThisWeek:
 *                   type: integer
 *                 plannerUsersLastWeek:
 *                   type: integer
 *                 shoppingListUsersToday:
 *                   type: integer
 *                 shoppingListUsersYesterday:
 *                   type: integer
 *                 shoppingListUsersThisWeek:
 *                   type: integer
 *                 shoppingListUsersLastWeek:
 *                   type: integer
 *                 calorieTrackerUsersTotal:
 *                   type: integer
 *                   description: Users with at least one calorie tracker entry
 *                 calorieTrackerUsersToday:
 *                   type: integer
 *                   description: Users with entries today
 *                 calorieTrackerUsersYesterday:
 *                   type: integer
 *                 calorieTrackerUsersThisWeek:
 *                   type: integer
 *                 calorieTrackerUsersLastWeek:
 *                   type: integer
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get('/stats', sessionMiddleware, systemController.getStatistics);

/**
 * components:
 *   responses:
 *     BadRequest:
 *       description: Invalid input or request parameters
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *     Unauthorized:
 *       description: Unauthorized, invalid or missing JWT token
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *     Forbidden:
 *       description: Forbidden, invalid or missing secret key
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *     NotFound:
 *       description: Resource not found
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *     InternalServerError:
 *       description: Server error
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *   schemas:
 *     Error:
 *       type: object
 *       title: Error Response
 *       properties:
 *         error:
 *           type: string
 *           description: Error type or category
 *         message:
 *           type: string
 *           description: Detailed error message
 *       example:
 *         error: "ValidationError"
 *         message: "Invalid input parameters"
 */

module.exports = router;
