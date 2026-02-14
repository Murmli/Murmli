const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController.js");
const { secretKeyMiddleware, sessionMiddleware } = require("./../middlewares/authMiddleware.js");

router.post("/create", secretKeyMiddleware, sessionMiddleware, messageController.createMessage);
router.post("/read", secretKeyMiddleware, sessionMiddleware, messageController.getMessages);
router.post("/unread/count", secretKeyMiddleware, sessionMiddleware, messageController.getUnreadCount);
router.post("/mark-read", secretKeyMiddleware, sessionMiddleware, messageController.markAsRead);

module.exports = router;
