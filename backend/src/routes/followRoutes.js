// src/routes/followRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");

const {
  follow,
  unfollow,
  checkFollowing,
  myFollowing,
  myFollowers,
  userFollowing,
  userFollowers,
  userCounts,
  mutuals
} = require("../controllers/followController");

// Rotas autenticadas
router.post("/:userId", verifyToken, follow);           // Seguir
router.delete("/:userId", verifyToken, unfollow);       // Deixar de seguir
router.get("/check/:userId", verifyToken, checkFollowing);  // Verificar se sigo
router.get("/following", verifyToken, myFollowing);     // Quem eu sigo
router.get("/followers", verifyToken, myFollowers);     // Meus seguidores
router.get("/mutuals", verifyToken, mutuals);           // Amigos mútuos

// Rotas públicas (para ver perfis de outros)
router.get("/user/:userId/following", userFollowing);
router.get("/user/:userId/followers", userFollowers);
router.get("/user/:userId/counts", userCounts);

module.exports = router;
