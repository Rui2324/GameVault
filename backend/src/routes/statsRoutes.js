const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { getStats, getTopGames } = require("../controllers/statsController");

router.get("/", authMiddleware, getStats);
router.get("/top-games", getTopGames); // Público - ranking global

module.exports = router;
