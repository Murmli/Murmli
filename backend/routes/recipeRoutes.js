// routes/recipeRoutes.js
// loaded from app.js with prefix api/v2/recipe
// authMiddleware.js is pre-applied and creates req.user object

const express = require("express");
const multer = require("multer");
const router = express.Router();
const reciperController = require("../controllers/recipeController.js");
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
 * /api/v2/recipe/read:
 *   post:
 *     tags:
 *       - Recipes
 *     title: Get Recipe By ID
 *     summary: Get a recipe by ID (system or user)
 *     description: Returns a recipe by its ID, optionally scaled to a number of servings and translated to the user's language.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Recipe Read Request
 *             properties:
 *               recipeId:
 *                 type: string
 *                 description: The ID of the recipe to fetch.
 *               servings:
 *                 type: integer
 *                 description: Number of servings to scale the recipe to (default 4).
 *             required:
 *               - recipeId
 *     responses:
 *       200:
 *         description: The recipe object.
 *       400:
 *         description: Missing recipe ID.
 *       404:
 *         description: Recipe not found.
 *       500:
 *         description: Server error.
 */
router.post("/read", secretKeyMiddleware, sessionMiddleware, reciperController.readRecipe);

/**
 * @swagger
 * /api/v2/recipe/create/user:
 *   post:
 *     tags:
 *       - Recipes
 *     title: Create User Recipe
 *     summary: Create a new user recipe
 *     description: Creates a new user recipe from text and optional image upload.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             title: Create User Recipe Request
 *             properties:
 *               text:
 *                 type: string
 *                 description: Recipe description or prompt text.
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Optional image file.
 *             required:
 *               - text
 *     responses:
 *       201:
 *         description: Created recipe object.
 *       400:
 *         description: Missing text or invalid data.
 *       500:
 *         description: Server error.
 */
router.post("/create/user", secretKeyMiddleware, sessionMiddleware, upload.single("file"), reciperController.createUserRecipe);

/**
 * @swagger
 * /api/v2/recipe/create/user/multimodal:
 *   post:
 *     tags:
 *       - Recipes
 *     title: Create User Recipe Multimodal
 *     summary: Create a new user recipe from multimodal input
 *     description: Creates a new user recipe from text, multiple images, and optional audio upload.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             title: Create User Recipe Multimodal Request
 *             properties:
 *               text:
 *                 type: string
 *                 description: Recipe description or prompt text.
 *               imageCount:
 *                 type: integer
 *                 description: Number of images being sent.
 *               image_0:
 *                 type: string
 *                 format: binary
 *                 description: First image file.
 *               image_1:
 *                 type: string
 *                 format: binary
 *                 description: Second image file (optional).
 *               audio:
 *                 type: string
 *                 format: binary
 *                 description: Optional audio file.
 *     responses:
 *       201:
 *         description: Created recipe object.
 *       202:
 *         description: Recipe creation started (async processing).
 *       400:
 *         description: Missing required data.
 *       500:
 *         description: Server error.
 */
router.post("/create/user/multimodal", secretKeyMiddleware, sessionMiddleware, upload.any(), reciperController.createUserRecipeMultimodal);

/**
 * @swagger
 * /api/v2/recipe/user/read:
 *   post:
 *     tags:
 *       - Recipes
 *     title: Get User Recipe By ID
 *     summary: Get a specific user recipe by ID
 *     description: Returns a specific user-created recipe by its ID, translated to the user's language.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: User Recipe Read Request
 *             properties:
 *               recipeId:
 *                 type: string
 *                 description: The ID of the user recipe.
 *             required:
 *               - recipeId
 *     responses:
 *       200:
 *         description: The user recipe object.
 *       400:
 *         description: Missing recipe ID.
 *       404:
 *         description: Recipe not found.
 *       500:
 *         description: Server error.
 */
router.post("/user/read", secretKeyMiddleware, sessionMiddleware, reciperController.readUserRecipes);

/**
 * @swagger
 * /api/v2/recipe/read/user:
 *   post:
 *     tags:
 *       - Recipes
 *     title: Get All User Recipes
 *     summary: Get all recipes created by the user
 *     description: Returns all recipes created by the authenticated user, translated to the user's language.
 *     responses:
 *       200:
 *         description: List of user recipes.
 *       500:
 *         description: Server error.
 */
router.post("/read/user", secretKeyMiddleware, sessionMiddleware, reciperController.getUserRecipes);

/**
 * @swagger
 * /api/v2/recipe/read/user/count:
 *   post:
 *     tags:
 *       - Recipes
 *     title: Get User Recipe Count
 *     summary: Get count of user's recipes
 *     description: Returns only the number of recipes created by the authenticated user.
 *     responses:
 *       200:
 *         description: Number of user recipes.
 *       500:
 *         description: Server error.
 */
router.post("/read/user/count", secretKeyMiddleware, sessionMiddleware, reciperController.getUserRecipeCount);

/**
 * @swagger
 * /api/v2/recipe/user/delete:
 *   delete:
 *     tags:
 *       - Recipes
 *     title: Delete User Recipe
 *     summary: Delete a user recipe
 *     description: Deletes a user-created recipe by its ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Delete User Recipe Request
 *             properties:
 *               recipeId:
 *                 type: string
 *                 description: The ID of the user recipe to delete.
 *             required:
 *               - recipeId
 *     responses:
 *       200:
 *         description: Recipe successfully deleted.
 *       400:
 *         description: Missing recipe ID.
 *       404:
 *         description: Recipe not found.
 *       500:
 *         description: Server error.
 */
router.delete("/user/delete", secretKeyMiddleware, sessionMiddleware, reciperController.deleteUserRecipe);

/**
 * @swagger
 * /api/v2/recipe/user/promote:
 *   post:
 *     tags:
 *       - Recipes
 *     title: Promote User Recipe
 *     summary: Add a user recipe to the official database
 *     description: Allows administrators to asynchronously copy their own user-generated recipes into the main recipe collection.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Promote User Recipe Request
 *             properties:
 *               recipeId:
 *                 type: string
 *                 description: The ID of the user recipe to promote.
 *             required:
 *               - recipeId
 *     responses:
 *       202:
 *         description: Promotion process started.
 *       400:
 *         description: Missing recipe ID.
 *       403:
 *         description: Only administrators can promote recipes.
 *       404:
 *         description: Recipe not found.
 *       409:
 *         description: Recipe already promoted.
 *       500:
 *         description: Server error.
 */
router.post("/user/promote", secretKeyMiddleware, sessionMiddleware, reciperController.promoteUserRecipe);

/**
 * @swagger
 * /api/v2/recipe/user/{id}/edit-text:
 *   post:
 *     tags:
 *       - Recipes
 *     title: Edit User Recipe With AI
 *     summary: Edit a user recipe with natural language
 *     description: Modifies an existing user recipe using an LLM. When `preview` is true the edited recipe is returned but not saved. The preview result can be sent back in `updatedRecipe` to save without a second LLM call.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User recipe ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Edit User Recipe Request
 *             properties:
 *               text:
 *                 type: string
 *                 description: Instructions describing the desired changes
 *               preview:
 *                 type: boolean
 *                 description: Return only a preview without saving when true
 *               updatedRecipe:
 *                 type: object
 *                 description: Recipe object returned from preview to save
 *             required:
 *               - text
 *     responses:
 *       200:
 *         description: Updated recipe or preview data. When `preview` is true
 *           the response contains `preview` (recipe) and `changes` (array of strings).
 *       400:
 *         description: Missing parameters
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Server error
 */
router.post("/user/:id/edit-text", secretKeyMiddleware, sessionMiddleware, reciperController.editTextUserRecipe);

/**
 * @swagger
 * /api/v2/recipe/{id}/edit-text:
 *   post:
 *     tags:
 *       - Recipes
 *     title: Edit System Recipe With AI
 *     summary: Edit a system recipe with natural language
 *     description: |
 *       Allows administrators to modify an existing system recipe using an LLM.
 *       Works similar to editing user recipes. When `preview` is true the edited
 *       recipe is returned but not saved. The preview result can be sent back in
 *       `updatedRecipe` to save without a second LLM call.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Recipe ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Edit System Recipe Request
 *             properties:
 *               text:
 *                 type: string
 *                 description: Instructions describing the desired changes
 *               preview:
 *                 type: boolean
 *                 description: Return only a preview without saving when true
 *               updatedRecipe:
 *                 type: object
 *                 description: Recipe object returned from preview to save
 *             required:
 *               - text
 *     responses:
 *       200:
 *         description: Updated recipe or preview data. When `preview` is true the response contains `preview` (recipe) and `changes` (array of strings).
 *       400:
 *         description: Missing parameters
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Server error
 */
router.post("/:id/edit-text", secretKeyMiddleware, sessionMiddleware, reciperController.editTextRecipe);

/**
 * @swagger
 * /api/v2/recipe/feedback:
 *   post:
 *     tags:
 *       - Recipes
 *     title: Submit Recipe Feedback
 *     summary: Submit feedback for a recipe
 *     description: Creates feedback for a recipe by its ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Recipe Feedback Request
 *             properties:
 *               recipeId:
 *                 type: string
 *                 description: The ID of the recipe.
 *               content:
 *                 type: string
 *                 description: Feedback content.
 *             required:
 *               - recipeId
 *               - content
 *     responses:
 *       201:
 *         description: Created feedback object.
 *       400:
 *         description: Missing recipe ID or content.
 *       404:
 *         description: Recipe not found.
 *       500:
 *         description: Server error.
 */
router.post("/feedback", secretKeyMiddleware, sessionMiddleware, reciperController.createFeedback);

/**
 * @swagger
 * /api/v2/recipe/favorite/create:
 *   post:
 *     tags:
 *       - Recipes
 *     title: Add Recipe To Favorites
 *     summary: Add a recipe to favorites
 *     description: Adds a recipe to the user's list of favorite recipes.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Add Recipe to Favorites Request
 *             properties:
 *               recipeId:
 *                 type: string
 *                 description: The ID of the recipe to favorite.
 *             required:
 *               - recipeId
 *     responses:
 *       201:
 *         description: Favorite added successfully.
 *       400:
 *         description: Missing recipe ID.
 *       404:
 *         description: Recipe not found.
 *       500:
 *         description: Server error.
 */
router.post("/favorite/create", secretKeyMiddleware, sessionMiddleware, reciperController.createFavorite);

/**
 * @swagger
 * /api/v2/recipe/favorite/delete:
 *   delete:
 *     tags:
 *       - Recipes
 *     title: Remove Recipe From Favorites
 *     summary: Remove a recipe from favorites
 *     description: Removes a recipe from the user's list of favorite recipes.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Remove Recipe from Favorites Request
 *             properties:
 *               recipeId:
 *                 type: string
 *                 description: The ID of the recipe to remove from favorites.
 *             required:
 *               - recipeId
 *     responses:
 *       200:
 *         description: Updated list of favorite recipes.
 *       400:
 *         description: Missing recipe ID.
 *       500:
 *         description: Server error.
 */
router.delete("/favorite/delete", secretKeyMiddleware, sessionMiddleware, reciperController.deleteFavorite);

/**
 * @swagger
 * /api/v2/recipe/read/favorites:
 *   post:
 *     tags:
 *       - Recipes
 *     title: Get Favorite Recipes
 *     summary: Get user's favorite recipes
 *     description: Returns a list of the user's favorite recipes. Can limit the number returned randomly.
 *     parameters:
 *       - in: query
 *         name: count
 *         schema:
 *           type: integer
 *         description: Number of favorite recipes to return (random subset).
 *     responses:
 *       200:
 *         description: List of favorite recipes.
 *       500:
 *         description: Server error.
 */
router.post("/read/favorites", secretKeyMiddleware, sessionMiddleware, reciperController.readFavorite);

/**
 * @swagger
 * /api/v2/recipe/download/pdf:
 *   post:
 *     tags:
 *       - Recipes
 *     title: Download Recipe PDF
 *     summary: Download recipe as PDF
 *     description: Generates a PDF file for a recipe. Optionally scale the recipe using `servings`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Download Recipe PDF Request
 *             properties:
 *               recipeId:
 *                 type: string
 *               servings:
 *                 type: integer
 *             required:
 *               - recipeId
 *     responses:
 *       200:
 *         description: PDF file stream.
 *       400:
 *         description: Missing recipe ID.
 *       404:
 *         description: Recipe not found.
 *       500:
 *         description: Server error.
 */
router.post("/download/pdf", secretKeyMiddleware, sessionMiddleware, reciperController.downloadRecipePDF);

router.post(
  "/download/selected/pdf",
  secretKeyMiddleware,
  sessionMiddleware,
  reciperController.downloadSelectedRecipesPDF
);

/**
 * @swagger
 * /api/v2/recipe/public/{id}:
 *   get:
 *     tags:
 *       - Recipes
 *     title: Get Public Recipe By ID
 *     summary: Get a recipe by ID for public sharing
 *     description: Returns a recipe by its ID without authentication, scaled to servings and translated to German.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the recipe to fetch.
 *       - in: query
 *         name: servings
 *         schema:
 *           type: integer
 *         description: Number of servings to scale the recipe to (default 4).
 *     responses:
 *       200:
 *         description: The recipe object.
 *       400:
 *         description: Missing recipe ID.
 *       404:
 *         description: Recipe not found.
 *       500:
 *         description: Server error.
 */
router.get("/public/:id", reciperController.readPublicRecipe);


/**
 * @swagger
 * /api/v2/recipe/chat:
 *   post:
 *     tags:
 *       - Recipes
 *     title: Chat with Recipe
 *     summary: Chat with an LLM about a specific recipe
 *     description: Sends a message history and recipe ID to get an answer from the LLM based on the recipe context.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Chat Request
 *             properties:
 *               recipeId:
 *                 type: string
 *               messages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                     content:
 *                       type: string
 *             required:
 *               - recipeId
 *               - messages
 *     responses:
 *       200:
 *         description: LLM answer.
 *       400:
 *         description: Missing parameters.
 *       500:
 *         description: Server error.
 */
router.post("/chat", secretKeyMiddleware, sessionMiddleware, reciperController.chat);


module.exports = router;
