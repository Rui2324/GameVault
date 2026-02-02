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
router.get("/users/:userId", adminController.getUserDetails);
router.put("/users/:userId", adminController.updateUserInfo);
router.put("/users/:userId/role", adminController.updateUserRole);
router.delete("/users/:userId", adminController.deleteUser);

// Coleção de users
router.get("/users/:userId/collection", adminController.getUserCollection);
router.put("/collection/:entryId", adminController.updateCollectionEntry);
router.delete("/collection/:entryId", adminController.removeFromCollection);

// Wishlist de users
router.get("/users/:userId/wishlist", adminController.getUserWishlist);
router.put("/wishlist/:entryId", adminController.updateWishlistEntry);
router.delete("/wishlist/:entryId", adminController.removeFromWishlist);
router.post("/wishlist/:entryId/move-to-collection", adminController.moveWishlistToCollection);

module.exports = router;