const express = require("express");
const router = express.Router();
const { getFeed } = require("../controllers/activityController");
const verifyToken = require("../middleware/authMiddleware");

// GET /api/activity/feed - Feed de atividade
router.get("/feed", verifyToken, getFeed);

module.exports = router;
