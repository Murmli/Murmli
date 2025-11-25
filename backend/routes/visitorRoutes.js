const express = require("express");
const router = express.Router();
const visitorController = require("../controllers/visitorController");

// Public routes (no authentication required)
router.post("/track", visitorController.trackVisitor);
router.post("/interaction", visitorController.updateInteraction);
router.post("/store-click", visitorController.trackStoreClick);

// Admin route for statistics (should be protected in production)
router.get("/stats", visitorController.getStats);

module.exports = router;
