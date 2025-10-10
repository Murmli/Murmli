// routes/userRoutes.js
// loaded from app.js with prefix api/v2/user
// authMiddleware.js is pre-applied and creates req.user object

const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController.js");
const { secretKeyMiddleware, sessionMiddleware } = require("./../middlewares/authMiddleware.js");

/**
 * @swagger
 * /api/v2/user/language/set:
 *   put:
 *     title: Set User Language
 *     summary: Set user language preference
 *     description: Updates the user's language and dialect preference.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *       - secretKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Set User Language Request
 *             properties:
 *               language:
 *                 type: string
 *                 description: Language code or dialect identifier
 *               timezone:
 *                 type: string
 *                 description: User timezone (optional)
 *     responses:
 *       200:
 *         description: Language updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put("/language/set", secretKeyMiddleware, sessionMiddleware, userController.setLanguage);

/**
 * @swagger
 * /api/v2/user/language/get:
 *   post:
 *     title: Get User Language
 *     summary: Get user language preference
 *     description: Retrieves the current language and dialect setting for the authenticated user.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *       - secretKey: []
 *     responses:
 *       200:
 *         description: User language retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               title: User Language Response
 *               properties:
 *                 language:
 *                   type: string
 *       401:
 *         description: Invalid token
 *       403:
 *         description: Invalid or missing secret key
 *       500:
 *         description: Server error
 */
router.post("/language/get", secretKeyMiddleware, sessionMiddleware, userController.getLanguage);

/**
 * @swagger
 * /api/v2/user/shoppingList/sorting/set:
 *   put:
 *     title: Set Shopping List Sorting
 *     summary: Set shopping list category sorting
 *     description: Updates the user's preferred order of shopping list categories.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *       - secretKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Set Shopping List Sorting Request
 *             properties:
 *               sort:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: Array of category IDs in desired order
 *     responses:
 *       200:
 *         description: Sort updated successfully
 *       400:
 *         description: Invalid sort array
 *       401:
 *         description: Invalid token
 *       403:
 *         description: Invalid or missing secret key
 *       500:
 *         description: Server error
 */
router.put("/shoppingList/sorting/set", secretKeyMiddleware, sessionMiddleware, userController.setCategoriesSorting);

/**
 * @swagger
 * /api/v2/user/shoppingList/sorting/get:
 *   post:
 *     title: Get Shopping List Sorting
 *     summary: Get shopping list category sorting
 *     description: Retrieves the user's preferred order of shopping list categories, translated to their language.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *       - secretKey: []
 *     responses:
 *       200:
 *         description: Sorted categories retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               title: Shopping List Sorting Response
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Invalid token
 *       403:
 *         description: Invalid or missing secret key
 *       500:
 *         description: Server error
 */
router.post("/shoppingList/sorting/get", secretKeyMiddleware, sessionMiddleware, userController.getCategoriesSorting);

/**
 * @swagger
 * /api/v2/user/shoppingList/categories/read:
 *   post:
 *     title: Get Shopping Categories
 *     summary: Get available shopping list categories
 *     description: Retrieves all available shopping list categories translated to the user's language.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *       - secretKey: []
 *     responses:
 *       200:
 *         description: Categories retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               title: Shopping Categories Response
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *       401:
 *         description: Invalid token
 *       403:
 *         description: Invalid or missing secret key
 *       500:
 *         description: Server error
 */
router.post("/shoppingList/categories/read", secretKeyMiddleware, sessionMiddleware, userController.readCategories);

/**
 * @swagger
 * /api/v2/user/delete:
 *   delete:
 *     title: Delete User Account
 *     summary: Delete user account and all related data
 *     description: Deletes the authenticated user and all associated recipes, calorie trackers, and shopping lists.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *       - secretKey: []
 *     responses:
 *       200:
 *         description: User and data deleted successfully
 *       401:
 *         description: Invalid token
 *       403:
 *         description: Invalid or missing secret key
 *       500:
 *         description: Server error
 */
router.delete("/delete", secretKeyMiddleware, sessionMiddleware, userController.delete);

/**
 * @swagger
 * /api/v2/user/data/export:
 *   post:
 *     title: Export User Data
 *     summary: Generate user data export link
 *     description: Creates a one-time download link for exporting all user data including recipes, calorie trackers, and shopping list.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *       - secretKey: []
 *     responses:
 *       201:
 *         description: Export link created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               title: Export Link Response
 *               properties:
 *                 message:
 *                   type: string
 *                 link:
 *                   type: string
 *       401:
 *         description: Invalid token
 *       403:
 *         description: Invalid or missing secret key
 *       500:
 *         description: Server error
 */
router.post("/data/export", secretKeyMiddleware, sessionMiddleware, userController.exportUserData);

/**
 * @swagger
 * /api/v2/user/data/download/{token}:
 *   get:
 *     title: Download User Data
 *     summary: Download exported user data
 *     description: Downloads the exported user data JSON file using a one-time token.
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: One-time export token
 *     responses:
 *       200:
 *         description: Exported user data JSON
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               title: User Data Export
 *       404:
 *         description: Invalid or already used token, or user not found
 *       500:
 *         description: Server error
 */
router.get("/data/download/:token", userController.downloadExportData);

/**
 * @swagger
 * /api/v2/user/data/import:
 *   post:
 *     title: Import User Data
 *     summary: Import user data
 *     description: Imports user data from a JSON export, creating a new user and associated data.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *       - secretKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Import User Data Request
 *             properties:
 *               user:
 *                 type: object
 *               recipes:
 *                 type: array
 *                 items:
 *                   type: object
 *               calorieTrackers:
 *                 type: array
 *                 items:
 *                   type: object
 *               shoppingList:
 *                 type: object
 *     responses:
 *       200:
 *         description: User data imported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               title: Import User Data Response
 *               properties:
 *                 token:
 *                   type: string
 *                 shoppingList:
 *                   type: object
 *                 shoppingListSort:
 *                   type: array
 *                   items:
 *                     type: number
 *                 language:
 *                   type: string
 *       400:
 *         description: Invalid import data
 *       401:
 *         description: Invalid token
 *       403:
 *         description: Invalid or missing secret key
 *       500:
 *         description: Server error
 */
router.post("/data/import", secretKeyMiddleware, sessionMiddleware, userController.importUserData);

/**
 * @swagger
 * /api/v2/user/role/get:
 *   post:
 *     title: Get User Role
 *     summary: Get user role
 *     description: Returns the role of the authenticated user.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *       - secretKey: []
 *     responses:
 *       200:
 *         description: Role retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               title: User Role Response
 *               properties:
 *                 role:
 *                   type: string
 *       401:
 *         description: Invalid token
 *       403:
 *         description: Invalid or missing secret key
 *       500:
 *         description: Server error
 */
router.post("/role/get", secretKeyMiddleware, sessionMiddleware, userController.getRole);

/**
 * @swagger
 * /api/v2/user/id/get:
 *   post:
 *     title: Get User ID
 *     summary: Get user ID
 *     description: Returns the MongoDB ID of the authenticated user.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *       - secretKey: []
 *     responses:
 *       200:
 *         description: ID retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               title: User ID Response
 *               properties:
 *                 id:
 *                   type: string
 *       401:
 *         description: Invalid token
 *       403:
 *         description: Invalid or missing secret key
 *       500:
 *         description: Server error
 */
router.post("/id/get", secretKeyMiddleware, sessionMiddleware, userController.getId);

module.exports = router;
