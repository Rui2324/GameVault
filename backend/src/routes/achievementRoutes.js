const express = require("express");
const router = express.Router();
const achievementController = require("../controllers/achievementController");
const { verifyToken } = require("../middleware/authMiddleware");

// Todas as conquistas disponíveis (público)
router.get("/", achievementController.getAllAchievements);

// Minhas conquistas (autenticado)
router.get("/me", verifyToken, achievementController.getMyAchievements);

// Conquistas recentes (autenticado)
router.get("/recent", verifyToken, achievementController.getRecentAchievements);

// Verificar e desbloquear conquistas pendentes (autenticado)
router.post("/check", verifyToken, achievementController.checkAchievements);

// Conquistas de um utilizador específico (público)
router.get("/user/:userId", achievementController.getUserAchievements);

module.exports = router;
