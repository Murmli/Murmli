// routes/planerRoute.js
// loaded from app.js with prefix api/v2/planer
// authMiddleware.js is pre-applied and creates req.user object

const express = require("express");
const router = express.Router();
const planerController = require("../controllers/planerController.js");
const { secretKeyMiddleware, sessionMiddleware } = require("./../middlewares/authMiddleware.js");

/**
 * @swagger
 * /api/v2/planer/filter/set:
 *   put:
 *     title: Set Recipe Filters
 *     summary: Set or update recipe filter preferences
 *     description: Updates the user's filter settings for recipe suggestions. At least one of `servings`, `recipes`, or `prompt` must be provided.
 *     tags:
 *       - Planer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Set Recipe Filters Request
 *             properties:
 *               servings:
 *                 type: integer
 *                 description: Number of servings per recipe
 *               recipes:
 *                 type: integer
 *                 description: Number of recipe suggestions to generate
 *               prompt:
 *                 type: string
 *                 description: Custom prompt or dietary preferences
 *             example:
 *               servings: 2
 *               recipes: 5
 *               prompt: "vegetarian, high protein"
 *     responses:
 *       200:
 *         description: Filters updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               title: Set Recipe Filters Response
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Filters updated successfully
 *       400:
 *         description: Invalid input parameters
 *       401:
 *         description: Invalid or missing JWT token
 *       403:
 *         description: Invalid or missing secret key
 *       500:
 *         description: Server error
 */
router.put("/filter/set", secretKeyMiddleware, sessionMiddleware, planerController.setFilter);

/**
 * @swagger
 * /api/v2/planer/filter/read:
 *   post:
 *     title: Get Recipe Filters
 *     summary: Get current recipe filter preferences
 *     description: Retrieves the user's current filter settings for recipe suggestions.
 *     tags:
 *       - Planer
 *     responses:
 *       200:
 *         description: Current filter settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               title: Recipe Filters Response
 *               properties:
 *                 servings:
 *                   type: integer
 *                 recipes:
 *                   type: integer
 *                 prompt:
 *                   type: string
 *       401:
 *         description: Invalid or missing JWT token
 *       403:
 *         description: Invalid or missing secret key
 *       500:
 *         description: Server error
 */
router.post("/filter/read", secretKeyMiddleware, sessionMiddleware, planerController.readFilter);

/**
 * @swagger
 * /api/v2/planer/suggestions/get:
 *   post:
 *     title: Get Recipe Suggestions
 *     summary: Get recipe suggestions
 *     description: Generates personalized recipe suggestions based on the user's filters, preferences, and voting history.
 *     tags:
 *       - Planer
 *     responses:
 *       200:
 *         description: List of suggested recipes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               title: Recipe Suggestions
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   descriptionShort:
 *                     type: string
 *                   description:
 *                     type: string
 *                   image:
 *                     type: string
 *       401:
 *         description: Invalid or missing JWT token
 *       403:
 *         description: Invalid or missing secret key
 *       500:
 *         description: Server error
 */
router.post("/suggestions/get", secretKeyMiddleware, sessionMiddleware, planerController.getSuggestions);

/**
 * @swagger
 * /api/v2/planer/suggestions/vote:
 *   post:
 *     title: Vote On Recipe Suggestion
 *     summary: Vote on a recipe suggestion
 *     description: Upvote or downvote a suggested recipe. Upvoting adds the recipe to the user's selected list.
 *     tags:
 *       - Planer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Vote Recipe Request
 *             required:
 *               - recipeId
 *               - voteType
 *             properties:
 *               recipeId:
 *                 type: string
 *                 description: ID of the recipe to vote on
 *               voteType:
 *                 type: string
 *                 enum: [upvote, downvote]
 *                 description: Type of vote
 *             example:
 *               recipeId: "60f7c2b8e1b1c8a1b4d5e6f7"
 *               voteType: "upvote"
 *     responses:
 *       200:
 *         description: Vote saved or prompt to compile suggestions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   nullable: true
 *                 error:
 *                   type: string
 *                   nullable: true
 *                 selectedCount:
 *                   type: integer
 *       201:
 *         description: Vote saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 selectedCount:
 *                   type: integer
 *       400:
 *         description: Invalid vote type or other validation error
 *       401:
 *         description: Invalid or missing JWT token
 *       403:
 *         description: Invalid or missing secret key
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Server error
 */
router.post("/suggestions/vote", secretKeyMiddleware, sessionMiddleware, planerController.voteSuggestion);

/**
 * @swagger
 * /api/v2/planer/selected/clear:
 *   post:
 *     title: Clear Selected Recipes
 *     summary: Clear all selected recipes
 *     description: Removes all recipes from the user's current selection.
 *     tags:
 *       - Planer
 *     responses:
 *       200:
 *         description: Selected recipes cleared successfully
 *       401:
 *         description: Invalid or missing JWT token
 *       403:
 *         description: Invalid or missing secret key
 *       500:
 *         description: Server error
 */
router.post("/selected/clear", secretKeyMiddleware, sessionMiddleware, planerController.clearSelectedRecipes);

/**
 * @swagger
 * /api/v2/planer/selected/remove:
 *   post:
 *     title: Remove Selected Recipe
 *     summary: Remove a recipe from selected list
 *     description: Removes a specific recipe from the user's selected recipes.
 *     tags:
 *       - Planer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Remove Recipe Request
 *             required:
 *               - recipeId
 *             properties:
 *               recipeId:
 *                 type: string
 *                 description: ID of the recipe to remove
 *             example:
 *               recipeId: "60f7c2b8e1b1c8a1b4d5e6f7"
 *     responses:
 *       200:
 *         description: Recipe removed successfully
 *       400:
 *         description: Recipe not found in selection or missing ID
 *       401:
 *         description: Invalid or missing JWT token
 *       403:
 *         description: Invalid or missing secret key
 *       500:
 *         description: Server error
 */
router.post("/selected/remove", secretKeyMiddleware, sessionMiddleware, planerController.removeSelectedRecipe);

/**
 * @swagger
 * /api/v2/planer/selected/count:
 *   post:
 *     title: Get Selected Recipe Count
 *     summary: Get count of selected recipes
 *     description: Returns the number of recipes currently selected by the user.
 *     tags:
 *       - Planer
 *     responses:
 *       200:
 *         description: Number of selected recipes
 *       500:
 *         description: Server error
 */
router.post("/selected/count", secretKeyMiddleware, sessionMiddleware, planerController.getSelectedRecipeCount);

/**
 * @swagger
 * /api/v2/planer/selected/read:
 *   post:
 *     title: Get Selected Recipes
 *     summary: Get selected recipes
 *     description: Retrieves the user's currently selected recipes.
 *     tags:
 *       - Planer
 *     responses:
 *       200:
 *         description: List of selected recipes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               title: Selected Recipes Response
 *               properties:
 *                 selectedRecipes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       servings:
 *                         type: integer
 *                       descriptionShort:
 *                         type: string
 *                       image:
 *                         type: string
 *       401:
 *         description: Invalid or missing JWT token
 *       403:
 *         description: Invalid or missing secret key
 *       500:
 *         description: Server error
 */
router.post("/selected/read", secretKeyMiddleware, sessionMiddleware, planerController.readSelectedRecipes);

module.exports = router;
