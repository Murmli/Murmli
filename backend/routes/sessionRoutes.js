// routes/sessionRoute.js
// loaded from app.js with prefix api/v2/session

const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController.js");
const { secretKeyMiddleware } = require("./../middlewares/authMiddleware.js");

/**
 * @swagger
 * /api/v2/session/create:
 *   post:
 *     title: Create Session
 *     summary: Create a new anonymous user session
 *     description: Creates a new user session and returns a JWT token. Requires a valid secret key header.
 *     tags:
 *       - Session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             title: Create Session Request
 *             required:
 *               - language
 *             properties:
 *               language:
 *                 type: string
 *                 description: User's preferred language (e.g., "en", "de").
 *     responses:
 *       201:
 *         description: Session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               title: Session Token Response
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT session token
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post("/create", secretKeyMiddleware, userController.sessionCreate);
/**
 * @swagger
 * /api/v2/session/login:
 *   post:
 *     title: Validate Session
 *     summary: Validate an existing user session token
 *     description: Validates a JWT token and confirms the session is active. Requires a valid secret key header and Bearer Token.
 *     tags:
 *       - Session
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               title: Session Login Response
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post("/login", secretKeyMiddleware, userController.sessionLogin);

module.exports = router;
