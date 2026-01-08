// src/routes/statsRoutes.js
const express = require("express");
const { getMyStats } = require("../controllers/statsController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getMyStats);

module.exports = router;


