// routes/trackerRoute.js
// loaded from app.js with prefix api/v2/calorietracker
// authMiddleware.js is pre-applied and creates req.user object

const express = require("express");
const multer = require("multer");
const router = express.Router();
const trackerController = require("../controllers/trackerController.js");
const { secretKeyMiddleware, sessionMiddleware } = require("./../middlewares/authMiddleware.js");
const upload = multer({
  dest: "uploads/",
  limits: {
    fieldSize: 5 * 1024 * 1024, // 5MB für Formularfelder
    fileSize: 25 * 1024 * 1024 // 25MB für Dateien
  }
});

/**
 * @swagger
 * /api/v2/calorietracker/bodydata/get:
 *   post:
 *     tags: [Tracker]
 *     title: Get Body Data
 *     summary: Get user's body data and latest weight
 *     description: Retrieves the user's profile data including height, weight, birth year, gender, diet preferences, and latest weight entry.
 *     responses:
 *       200:
 *         description: User body data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               title: Body Data Response
 *               properties:
 *                 bodyData:
 *                   type: object
 *                   properties:
 *                     height: { type: number }
 *                     weight: { type: number }
 *                     birthyear: { type: number }
 *                     gender: { type: string }
 *                     dietType: { type: string }
 *                     dietLevel: { type: string }
 *                     baseCalories: { type: number }
 *                     recommendations:
 *                       type: object
 *                       properties:
 *                         kcal: { type: number }
 *                         protein: { type: number }
 *                         carbohydrates: { type: number }
 *                         fat: { type: number }
 *                     workHoursWeek: { type: number }
 *                     workDaysPAL: { type: number }
 *                     latestWeight: { type: number }
 *       404:
 *         description: No body data found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Invalid secret key
 *       500:
 *         description: Server error
 */
router.post("/bodydata/get", secretKeyMiddleware, sessionMiddleware, trackerController.getBodyData);
/**
 * @swagger
 * /api/v2/calorietracker/bodydata/update:
 *   put:
 *     tags: [Tracker]
 *     title: Update Body Data
 *     summary: Update user's body data
 *     description: Updates the user's profile data including height, weight, birth year, gender, diet preferences, and recommendations. Adds new weight entry if weight is provided.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Update Body Data Request
 *             properties:
 *               height: { type: number }
 *               weight: { type: number }
 *               birthyear: { type: number }
 *               gender: { type: string }
 *               dietType: { type: string }
 *               dietLevel: { type: string }
 *               baseCalories: { type: number }
 *               workHoursWeek: { type: number }
 *               workDaysPAL: { type: number }
 *               recommendations:
 *                 type: object
 *                 properties:
 *                   kcal: { type: number }
 *                   protein: { type: number }
 *                   carbohydrates: { type: number }
 *                   fat: { type: number }
 *     responses:
 *       200:
 *         description: User data updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Invalid secret key
 *       500:
 *         description: Server error
 */
router.put("/bodydata/update", secretKeyMiddleware, sessionMiddleware, trackerController.updateBodyData);
/**
 * @swagger
 * /api/v2/calorietracker/bodydata/calculate:
 *   post:
 *     tags: [Tracker]
 *     title: Calculate Calories
 *     summary: Calculate calorie and nutrient recommendations
 *     description: Calculates the user's daily calorie needs and nutrient distribution based on profile data and latest weight. Optionally saves the calculation.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Calculate Calories Request
 *             properties:
 *               saveCalculation:
 *                 type: boolean
 *                 description: Save the calculated recommendations to the user profile
 *     responses:
 *       200:
 *         description: Calorie calculation successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               title: Calorie Calculation Response
 *               properties:
 *                 baseCalories: { type: number }
 *                 recommendations:
 *                   type: object
 *                   properties:
 *                     kcal: { type: number }
 *                     protein: { type: number }
 *                     carbohydrates: { type: number }
 *                     fat: { type: number }
 *                 calculationDetails:
 *                   type: object
 *                 message: { type: string }
 *       400:
 *         description: Missing or invalid user data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Invalid secret key
 *       500:
 *         description: Server error
 */
router.post("/bodydata/calculate", secretKeyMiddleware, sessionMiddleware, trackerController.calculateCalories);
/**
 * @swagger
 * /api/v2/calorietracker/track/text:
 *   post:
 *     tags: [Tracker]
 *     title: Track Food From Text
 *     summary: Track food items from text input
 *     description: Extracts food items from a text description using AI and adds them to the specified tracker.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Track Food From Text Request
 *             required:
 *               - text
 *               - trackerId
 *             properties:
 *               text:
 *                 type: string
 *                 description: Text describing consumed food
 *               trackerId:
 *                 type: string
 *                 description: Tracker ID to add the food items to
 *     responses:
 *       200:
 *         description: Food items tracked successfully
 *       400:
 *         description: Invalid input or no food items found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Invalid secret key
 *       500:
 *         description: Server error
 */
router.post("/track/text", secretKeyMiddleware, sessionMiddleware, trackerController.trackText);
/**
 * @swagger
 * /api/v2/calorietracker/track/audio:
 *   post:
 *     tags: [Tracker]
 *     title: Track Food From Audio
 *     summary: Track food items from audio input
 *     description: Upload an audio file describing consumed food. The audio is transcribed and food items are extracted and added to the specified tracker.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             title: Track Food From Audio Request
 *             required:
 *               - file
 *               - trackerId
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Audio file containing food description
 *               trackerId:
 *                 type: string
 *                 description: Tracker ID to add the food items to
 *     responses:
 *       200:
 *         description: Food items tracked successfully
 *       400:
 *         description: Invalid input or no food items found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Invalid secret key
 *       500:
 *         description: Server error
 */
router.post("/track/audio", secretKeyMiddleware, sessionMiddleware, upload.single("file"), trackerController.trackItemAudio);
/**
 * @swagger
 * /api/v2/calorietracker/track/recipe:
 *   post:
 *     tags: [Tracker]
 *     title: Track Recipe
 *     summary: Track a recipe as consumed food
 *     description: Adds a recipe's nutritional values multiplied by portions to the specified tracker.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Track Recipe Request
 *             required:
 *               - recipeId
 *               - portions
 *               - trackerId
 *             properties:
 *               recipeId:
 *                 type: string
 *                 description: ID of the recipe
 *               portions:
 *                 type: number
 *                 description: Number of portions consumed
 *               trackerId:
 *                 type: string
 *                 description: Tracker ID to add the recipe to
 *     responses:
 *       200:
 *         description: Recipe tracked successfully
 *       400:
 *         description: Invalid input or recipe not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Invalid secret key
 *       500:
 *         description: Server error
 */
router.post("/track/recipe", secretKeyMiddleware, sessionMiddleware, trackerController.trackRecipe);
/**
 * @swagger
 * /api/v2/calorietracker/get:
 *   post:
 *     tags: [Tracker]
 *     title: Get Tracker Data
 *     summary: Get tracker data for a specific date
 *     description: Retrieves or creates a tracker for the specified date (defaults to today if no date provided).
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Get Tracker Request
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Date for which to get the tracker (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Tracker data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Invalid secret key
 *       500:
 *         description: Server error
 */
router.post("/get", secretKeyMiddleware, sessionMiddleware, trackerController.getTrackerByDate);
/**
 * @swagger
 * /api/v2/calorietracker/set/recommendations:
 *   put:
 *     tags: [Tracker]
 *     title: Set Recommendations
 *     summary: Update calorie and nutrient recommendations
 *     description: Updates the user's and tracker's calorie and nutrient recommendations.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Set Recommendations Request
 *             required:
 *               - trackerId
 *               - recommendations
 *             properties:
 *               trackerId:
 *                 type: string
 *               recommendations:
 *                 type: object
 *                 properties:
 *                   kcal: { type: number }
 *                   protein: { type: number }
 *                   carbohydrates: { type: number }
 *                   fat: { type: number }
 *     responses:
 *       200:
 *         description: Recommendations updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Invalid secret key
 *       500:
 *         description: Server error
 */
router.put("/set/recommendations", secretKeyMiddleware, sessionMiddleware, trackerController.setRecommendations);
/**
 * @swagger
 * /api/v2/calorietracker/track/weight:
 *   post:
 *     tags: [Tracker]
 *     title: Track Weight
 *     summary: Track user's weight
 *     description: Adds a new weight entry for the user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Track Weight Request
 *             required:
 *               - weight
 *             properties:
 *               weight:
 *                 type: number
 *                 description: User's weight in kilograms
 *     responses:
 *       200:
 *         description: Weight tracked successfully
 *       400:
 *         description: Invalid weight
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Invalid secret key
 *       500:
 *         description: Server error
 */
router.post("/track/weight", secretKeyMiddleware, sessionMiddleware, trackerController.trackWeight);
/**
 * @swagger
 * /api/v2/calorietracker/track/activity:
 *   post:
 *     tags: [Tracker]
 *     title: Track Activity
 *     summary: Track a physical activity
 *     description: Adds an activity with calories burned to the specified tracker and adjusts calorie recommendations.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Track Activity Request
 *             required:
 *               - text
 *               - trackerId
 *             properties:
 *               text:
 *                 type: string
 *                 description: Description of the activity
 *               trackerId:
 *                 type: string
 *                 description: Tracker ID to add the activity to
 *     responses:
 *       200:
 *         description: Activity tracked successfully
 *       400:
 *         description: Invalid input or no weight data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Invalid secret key
 *       500:
 *         description: Server error
 */
router.post("/track/activity", secretKeyMiddleware, sessionMiddleware, trackerController.trackActivity);
/**
 * @swagger
 * /api/v2/calorietracker/ask:
 *   post:
 *     tags: [Tracker]
 *     title: Ask Calorie Tracking Question
 *     summary: Ask a question about your calorie tracking
 *     description: Asks an AI assistant a question related to your calorie tracking data from the last 14 days.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Ask Question Request
 *             required:
 *               - question
 *             properties:
 *               question:
 *                 type: string
 *                 description: The question to ask
 *     responses:
 *       200:
 *         description: AI-generated answer returned successfully
 *       400:
 *         description: Invalid question
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Invalid secret key
 *       404:
 *         description: No trackers found
 *       500:
 *         description: Server error
 */
router.post("/ask", secretKeyMiddleware, sessionMiddleware, trackerController.askQuestion);
/**
 * @swagger
 * /api/v2/calorietracker/item/daily/toggle:
 *   put:
 *     tags: [Tracker]
 *     title: Toggle Food Item Daily Status
 *     summary: Toggle daily status of a food item
 *     description: Marks or unmarks a food item as a daily recurring item for the user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trackerId
 *               - foodItemId
 *             properties:
 *               trackerId:
 *                 type: string
 *               foodItemId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Food item daily status toggled successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Invalid secret key
 *       404:
 *         description: Tracker or food item not found
 *       500:
 *         description: Server error
 */
router.put("/item/daily/toggle", secretKeyMiddleware, sessionMiddleware, trackerController.toggleFoodItemDaily);
/**
 * @swagger
 * /api/v2/calorietracker/track/image:
 *   post:
 *     tags: [Tracker]
 *     title: Track Food From Image
 *     summary: Track food items from an image
 *     description: Upload an image of food (optionally with a comment). Food items are extracted using AI and added to the specified tracker.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - trackerId
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file containing food
 *               comment:
 *                 type: string
 *                 description: Optional comment about the image
 *               trackerId:
 *                 type: string
 *                 description: Tracker ID to add the food items to
 *     responses:
 *       200:
 *         description: Food items tracked successfully
 *       400:
 *         description: Invalid input or no food items found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Invalid secret key
 *       500:
 *         description: Server error
 */
router.post("/track/image", secretKeyMiddleware, sessionMiddleware, upload.single("file"), trackerController.trackImage);
/**
 * @swagger
 * /api/v2/calorietracker/item/remove:
 *   delete:
 *     tags: [Tracker]
 *     title: Remove Food Item
 *     summary: Remove a food item from a tracker
 *     description: Removes a specific food item from the specified tracker.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trackerId
 *               - foodItemId
 *             properties:
 *               trackerId:
 *                 type: string
 *               foodItemId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Food item removed successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Invalid secret key
 *       404:
 *         description: Item not found
 *       500:
 *         description: Server error
 */
router.delete("/item/remove", secretKeyMiddleware, sessionMiddleware, trackerController.removeItem);

/**
 * @swagger
 * /api/v2/calorietracker/item/addtoday:
 *   post:
 *     tags: [Tracker]
 *     title: Add Food Item To Today
 *     summary: Add a food item to today's tracker
 *     description: Copies a food item from a past tracker to today's tracker.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sourceTrackerId
 *               - foodItemId
 *             properties:
 *               sourceTrackerId:
 *                 type: string
 *               foodItemId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Food item added successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Invalid secret key
 *       404:
 *         description: Tracker or item not found
 *       500:
 *         description: Server error
 */
router.post("/item/addtoday", secretKeyMiddleware, sessionMiddleware, trackerController.addItemToToday);
/**
 * @swagger
 * /api/v2/calorietracker/item/update:
 *   put:
 *     tags: [Tracker]
 *     title: Update Food Item
 *     summary: Update a food item in a tracker
 *     description: Updates details of a specific food item in the specified tracker.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trackerId
 *               - foodItemId
 *             properties:
 *               trackerId:
 *                 type: string
 *               foodItemId:
 *                 type: string
 *               name:
 *                 type: string
 *               amount:
 *                 type: number
 *               unit:
 *                 type: string
 *               kcal:
 *                 type: number
 *               protein:
 *                 type: number
 *               carbohydrates:
 *                 type: number
 *               fat:
 *                 type: number
 *               healthyRating:
 *                 type: number
 *               acidBaseScore:
 *                 type: number
 *                 description: PRAL score in mEq (negative = alkaline, positive = acidic)
 *               histamineLevel:
 *                 type: number
 *                 description: Histamine level 0-3 (0=none, 1=low, 2=moderate, 3=high)
 *     responses:
 *       200:
 *         description: Food item updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Invalid secret key
 *       404:
 *         description: Item not found
 *       500:
 *         description: Server error
 */
router.put("/item/update", secretKeyMiddleware, sessionMiddleware, trackerController.updateItem);
/**
 * @swagger
 * /api/v2/calorietracker/activity/remove:
 *   delete:
 *     tags: [Tracker]
 *     title: Remove Activity
 *     summary: Remove an activity from a tracker
 *     description: Removes a specific activity from the specified tracker and adjusts calorie recommendations.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trackerId
 *               - activityId
 *             properties:
 *               trackerId:
 *                 type: string
 *               activityId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Activity removed successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Invalid secret key
 *       404:
 *         description: Activity not found
 *       500:
 *         description: Server error
 */
router.delete("/activity/remove", secretKeyMiddleware, sessionMiddleware, trackerController.removeActivity);
/**
 * @swagger
 * /api/v2/calorietracker/activity/update:
 *   put:
 *     tags: [Tracker]
 *     title: Update Activity
 *     summary: Update an activity in a tracker
 *     description: Updates details of a specific activity in the specified tracker and adjusts calorie recommendations.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trackerId
 *               - activityId
 *             properties:
 *               trackerId:
 *                 type: string
 *               activityId:
 *                 type: string
 *               name:
 *                 type: string
 *               duration:
 *                 type: number
 *               caloriesBurned:
 *                 type: number
 *     responses:
 *       200:
 *         description: Activity updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Invalid secret key
 *       404:
 *         description: Activity not found
 *       500:
 *         description: Server error
 */
router.put("/activity/update", secretKeyMiddleware, sessionMiddleware, trackerController.updateActivity);

/**
 * @swagger
 * /api/v2/calorietracker/chat:
 *   post:
 *     tags: [Tracker]
 *     title: Chat with Tracker
 *     summary: Chat with AI about your tracker data
 *     description: Sends a message history and tracker context to AI and receives a response.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messages
 *               - trackerId
 *             properties:
 *               messages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role: { type: string }
 *                     content: { type: string }
 *               trackerId:
 *                 type: string
 *     responses:
 *       200:
 *         description: AI response returned successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Tracker not found
 *       500:
 *         description: Server error
 */
router.post("/chat", secretKeyMiddleware, sessionMiddleware, trackerController.chat);

/**
 * @swagger
 * /api/v2/calorietracker/item/add:
 *   post:
 *     tags: [Tracker]
 *     title: Add Food Item Directly
 *     summary: Add a food item directly without AI processing
 *     description: Adds a food item with all nutritional values directly to the tracker without AI processing. Useful for favorites or manual entries.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trackerId
 *               - item
 *             properties:
 *               trackerId:
 *                 type: string
 *               item:
 *                 type: object
 *                 required:
 *                   - name
 *                   - amount
 *                   - unit
 *                   - kcal
 *                 properties:
 *                   name:
 *                     type: string
 *                   amount:
 *                     type: number
 *                   unit:
 *                     type: string
 *                   kcal:
 *                     type: number
 *                   protein:
 *                     type: number
 *                   carbohydrates:
 *                     type: number
 *                   fat:
 *                     type: number
 *                   healthyRating:
 *                     type: number
 *                   acidBaseScore:
 *                     type: number
 *                     description: PRAL score in mEq (negative = alkaline, positive = acidic)
 *                   histamineLevel:
 *                     type: number
 *                     description: Histamine level 0-3 (0=none, 1=low, 2=moderate, 3=high)
 *     responses:
 *       200:
 *         description: Food item added successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Invalid secret key
 *       404:
 *         description: Tracker not found
 *       500:
 *         description: Server error
 */
router.post("/item/add", secretKeyMiddleware, sessionMiddleware, trackerController.addItem);

module.exports = router;
