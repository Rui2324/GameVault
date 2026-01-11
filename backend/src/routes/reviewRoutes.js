// src/routes/reviewRoutes.js
const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { verifyToken, optionalAuth } = require("../middleware/authMiddleware");

// Reviews de um jogo específico (público, mas com info extra se autenticado)
router.get("/games/:gameId/reviews", optionalAuth, reviewController.getGameReviews);

// Reviews de um utilizador específico (público)
router.get("/user/:userId", reviewController.getUserReviews);

// Criar review (autenticado)
router.post("/games/:gameId/reviews", verifyToken, reviewController.createReview);

// Atualizar review (autenticado, só dono)
router.put("/:reviewId", verifyToken, reviewController.updateReview);

// Eliminar review (autenticado, só dono)
router.delete("/:reviewId", verifyToken, reviewController.deleteReview);

// Like/Unlike numa review (autenticado)
router.post("/:reviewId/like", verifyToken, reviewController.likeReview);
router.delete("/:reviewId/like", verifyToken, reviewController.unlikeReview);

module.exports = router;
