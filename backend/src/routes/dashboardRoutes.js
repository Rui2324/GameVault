// backend/src/routes/dashboardRoutes.js
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { listForDashboard } = require("../controllers/dashboardController");

// /api/list?kind=featured&page_size=6
router.get("/list", authMiddleware, listForDashboard);

module.exports = router;
