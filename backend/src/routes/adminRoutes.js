// src/routes/adminRoutes.js
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/adminMiddleware");
const adminController = require("../controllers/adminController");

// Todas as rotas de admin requerem autenticação + role de admin
router.use(authMiddleware);
router.use(requireAdmin);

// Dashboard
router.get("/stats", adminController.getDashboardStats);

// User management
router.get("/users", adminController.getAllUsers);
router.put("/users/:userId/role", adminController.updateUserRole);
router.delete("/users/:userId", adminController.deleteUser);

module.exports = router;