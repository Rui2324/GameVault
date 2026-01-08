// src/routes/gameRoutes.js
const express = require("express");
const {
  createGameHandler,
  listGamesHandler,
} = require("../controllers/gameController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// proteger tudo com auth
router.use(authMiddleware);

router.post("/", createGameHandler);
router.get("/", listGamesHandler);

module.exports = router;
