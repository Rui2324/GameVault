const reviewModel = require("../models/reviewModel");
const achievementService = require("../services/achievementService");

// GET /api/games/:gameId/reviews
async function getGameReviews(req, res) {
  try {
    const { gameId } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    const reviews = await reviewModel.getGameReviews(gameId, parseInt(limit), parseInt(offset));
    const total = await reviewModel.countGameReviews(gameId);
    const stats = await reviewModel.getGameAverageRating(gameId);
    
    // Se utilizador autenticado, verificar quais reviews já levou like
    if (req.userId) {
      for (const review of reviews) {
        review.userLiked = await reviewModel.hasUserLiked(req.userId, review.id);
      }
    }
    
    res.json({
      reviews,
      total,
      averageRating: stats.average,
      totalRatings: stats.total
    });
  } catch (err) {
    console.error("Erro ao buscar reviews:", err);
    res.status(500).json({ mensagem: "Erro ao buscar reviews." });
  }
}

// GET /api/reviews/user/:userId
async function getUserReviews(req, res) {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    const reviews = await reviewModel.getUserReviews(userId, parseInt(limit), parseInt(offset));
    
    res.json({ reviews });
  } catch (err) {
    console.error("Erro ao buscar reviews do utilizador:", err);
    res.status(500).json({ mensagem: "Erro ao buscar reviews." });
  }
}

// POST /api/games/:gameId/reviews
async function createReview(req, res) {
  try {
    const { gameId } = req.params;
    const userId = req.userId;
    const { rating, title, content, spoiler } = req.body;
    
    if (!rating || rating < 0 || rating > 10) {
      return res.status(400).json({ mensagem: "Rating deve ser entre 0 e 10." });
    }
    
    // Verificar se já tem review para este jogo
    const existing = await reviewModel.getUserReviewForGame(userId, gameId);
    if (existing) {
      return res.status(409).json({ mensagem: "Já tens uma review para este jogo." });
    }
    
    const review = await reviewModel.createReview({
      userId,
      gameId: parseInt(gameId),
      rating,
      title,
      content,
      spoiler: spoiler || false
    });
    
    // Verificar conquistas relacionadas com reviews
    await achievementService.checkAndUnlock(userId, "first_review");
    await achievementService.checkReviewAchievements(userId);
    
    // Se rating é 10, verificar conquista de rating perfeito
    if (rating === 10) {
      await achievementService.checkAndUnlock(userId, "perfect_rating");
    }
    
    res.status(201).json({ mensagem: "Review criada com sucesso!", review });
  } catch (err) {
    console.error("Erro ao criar review:", err);
    res.status(500).json({ mensagem: "Erro ao criar review." });
  }
}

// PUT /api/reviews/:reviewId
async function updateReview(req, res) {
  try {
    const { reviewId } = req.params;
    const userId = req.userId;
    const { rating, title, content, spoiler } = req.body;
    
    if (rating !== undefined && (rating < 0 || rating > 10)) {
      return res.status(400).json({ mensagem: "Rating deve ser entre 0 e 10." });
    }
    
    const updated = await reviewModel.updateReview(reviewId, userId, {
      rating,
      title,
      content,
      spoiler
    });
    
    if (!updated) {
      return res.status(404).json({ mensagem: "Review não encontrada ou não tens permissão." });
    }
    
    res.json({ mensagem: "Review atualizada com sucesso!" });
  } catch (err) {
    console.error("Erro ao atualizar review:", err);
    res.status(500).json({ mensagem: "Erro ao atualizar review." });
  }
}

// DELETE /api/reviews/:reviewId
async function deleteReview(req, res) {
  try {
    const { reviewId } = req.params;
    const userId = req.userId;
    
    const deleted = await reviewModel.deleteReview(reviewId, userId);
    
    if (!deleted) {
      return res.status(404).json({ mensagem: "Review não encontrada ou não tens permissão." });
    }
    
    res.json({ mensagem: "Review eliminada com sucesso!" });
  } catch (err) {
    console.error("Erro ao eliminar review:", err);
    res.status(500).json({ mensagem: "Erro ao eliminar review." });
  }
}

// POST /api/reviews/:reviewId/like
async function likeReview(req, res) {
  try {
    const { reviewId } = req.params;
    const userId = req.userId;
    
    const liked = await reviewModel.likeReview(userId, reviewId);
    
    if (!liked) {
      return res.status(409).json({ mensagem: "Já deste like nesta review." });
    }
    
    // Verificar conquistas de likes
    await achievementService.checkLikeAchievements(reviewId);
    
    res.json({ mensagem: "Like adicionado!" });
  } catch (err) {
    console.error("Erro ao dar like:", err);
    res.status(500).json({ mensagem: "Erro ao dar like." });
  }
}

// DELETE /api/reviews/:reviewId/like
async function unlikeReview(req, res) {
  try {
    const { reviewId } = req.params;
    const userId = req.userId;
    
    const unliked = await reviewModel.unlikeReview(userId, reviewId);
    
    if (!unliked) {
      return res.status(404).json({ mensagem: "Like não encontrado." });
    }
    
    res.json({ mensagem: "Like removido!" });
  } catch (err) {
    console.error("Erro ao remover like:", err);
    res.status(500).json({ mensagem: "Erro ao remover like." });
  }
}

module.exports = {
  getGameReviews,
  getUserReviews,
  createReview,
  updateReview,
  deleteReview,
  likeReview,
  unlikeReview,
};
