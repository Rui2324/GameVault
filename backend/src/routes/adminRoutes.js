const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/adminMiddleware");
const adminController = require("../controllers/adminController");
const adminAdvancedController = require("../controllers/adminAdvancedController");

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
router.post("/users/:userId/collection", adminController.addGameToCollection);
router.put("/collection/:entryId", adminController.updateCollectionEntry);
router.delete("/collection/:entryId", adminController.removeFromCollection);

// Wishlist de users
router.get("/users/:userId/wishlist", adminController.getUserWishlist);
router.put("/wishlist/:entryId", adminController.updateWishlistEntry);
router.delete("/wishlist/:entryId", adminController.removeFromWishlist);
router.post("/wishlist/:entryId/move-to-collection", adminController.moveWishlistToCollection);

// Admin Logs
router.get("/logs", adminAdvancedController.getLogs);
router.get("/logs/stats", adminAdvancedController.getLogsStats);

// Moderação de Reviews
router.get("/reviews", adminAdvancedController.getAllReviews);
router.delete("/reviews/:reviewId", adminAdvancedController.deleteReview);

// Gestão de Achievements
router.get("/users/:userId/achievements", adminAdvancedController.getUserAchievements);
router.post("/users/:userId/achievements/:achievementId/unlock", adminAdvancedController.forceUnlockAchievement);
router.post("/users/:userId/achievements/:achievementId/lock", adminAdvancedController.forceLockAchievement);

// Analytics
router.get("/analytics", adminAdvancedController.getAnalytics);

// Notificações
router.get("/notifications", adminAdvancedController.getNotifications);
router.get("/notifications/unread", adminAdvancedController.getUnread);
router.put("/notifications/:notificationId/read", adminAdvancedController.markNotificationAsRead);
router.put("/notifications/read-all", adminAdvancedController.markAllNotificationsAsRead);
router.delete("/notifications/:notificationId", adminAdvancedController.deleteNotificationById);

// Manutenção de Games
router.post("/games/enrich-steam", adminAdvancedController.enrichSteamGames);

module.exports = router;