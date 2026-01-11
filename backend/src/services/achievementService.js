// src/services/achievementService.js
const pool = require("../config/db");
const achievementModel = require("../models/achievementModel");

// Verificar e desbloquear uma conquista específica por código
async function checkAndUnlock(userId, achievementCode) {
  try {
    const achievement = await achievementModel.getAchievementByCode(achievementCode);
    if (!achievement) return null;
    
    const alreadyHas = await achievementModel.hasAchievement(userId, achievement.id);
    if (alreadyHas) return null;
    
    const unlocked = await achievementModel.unlockAchievement(userId, achievement.id);
    if (unlocked) {
      console.log(`🏆 Conquista desbloqueada: ${achievement.name} para user ${userId}`);
      return achievement;
    }
    return null;
  } catch (err) {
    console.error("Erro ao verificar conquista:", err);
    return null;
  }
}

// Verificar conquistas de coleção
async function checkCollectionAchievements(userId) {
  try {
    const [countResult] = await pool.query(
      "SELECT COUNT(*) as total FROM collection_entries WHERE user_id = ?",
      [userId]
    );
    const totalGames = countResult[0].total;
    
    const [completedResult] = await pool.query(
      "SELECT COUNT(*) as total FROM collection_entries WHERE user_id = ? AND status = 'completed'",
      [userId]
    );
    const completedGames = completedResult[0].total;
    
    // Conquistas de quantidade na coleção
    if (totalGames >= 1) await checkAndUnlock(userId, "first_game");
    if (totalGames >= 10) await checkAndUnlock(userId, "collector_10");
    if (totalGames >= 50) await checkAndUnlock(userId, "collector_50");
    if (totalGames >= 100) await checkAndUnlock(userId, "collector_100");
    
    // Conquistas de jogos concluídos
    if (completedGames >= 1) await checkAndUnlock(userId, "first_complete");
    if (completedGames >= 10) await checkAndUnlock(userId, "completionist_10");
    if (completedGames >= 25) await checkAndUnlock(userId, "completionist_25");
    
  } catch (err) {
    console.error("Erro ao verificar conquistas de coleção:", err);
  }
}

// Verificar conquistas de tempo de jogo
async function checkPlaytimeAchievements(userId) {
  try {
    const [result] = await pool.query(
      "SELECT COALESCE(SUM(hours_played), 0) as total_hours FROM collection_entries WHERE user_id = ?",
      [userId]
    );
    const totalHours = result[0].total_hours;
    
    if (totalHours >= 10) await checkAndUnlock(userId, "playtime_10");
    if (totalHours >= 100) await checkAndUnlock(userId, "playtime_100");
    if (totalHours >= 500) await checkAndUnlock(userId, "playtime_500");
    if (totalHours >= 1000) await checkAndUnlock(userId, "playtime_1000");
    
  } catch (err) {
    console.error("Erro ao verificar conquistas de tempo:", err);
  }
}

// Verificar conquistas de reviews
async function checkReviewAchievements(userId) {
  try {
    const [result] = await pool.query(
      "SELECT COUNT(*) as total FROM reviews WHERE user_id = ?",
      [userId]
    );
    const totalReviews = result[0].total;
    
    if (totalReviews >= 1) await checkAndUnlock(userId, "first_review");
    if (totalReviews >= 10) await checkAndUnlock(userId, "reviewer_10");
    
  } catch (err) {
    console.error("Erro ao verificar conquistas de reviews:", err);
  }
}

// Verificar conquistas de likes recebidos (para o autor da review)
async function checkLikeAchievements(reviewId) {
  try {
    // Buscar o autor da review
    const [reviewResult] = await pool.query(
      "SELECT user_id FROM reviews WHERE id = ?",
      [reviewId]
    );
    if (!reviewResult.length) return;
    
    const authorId = reviewResult[0].user_id;
    
    // Contar total de likes em todas as reviews do autor
    const [likesResult] = await pool.query(
      `SELECT COUNT(*) as total FROM review_likes rl
       INNER JOIN reviews r ON rl.review_id = r.id
       WHERE r.user_id = ?`,
      [authorId]
    );
    const totalLikes = likesResult[0].total;
    
    if (totalLikes >= 10) await checkAndUnlock(authorId, "helpful_10");
    if (totalLikes >= 50) await checkAndUnlock(authorId, "helpful_50");
    
  } catch (err) {
    console.error("Erro ao verificar conquistas de likes:", err);
  }
}

// Verificar conquistas de wishlist
async function checkWishlistAchievements(userId) {
  try {
    const [result] = await pool.query(
      "SELECT COUNT(*) as total FROM wishlist_entries WHERE user_id = ?",
      [userId]
    );
    const totalWishlist = result[0].total;
    
    if (totalWishlist >= 5) await checkAndUnlock(userId, "wishlist_5");
    
  } catch (err) {
    console.error("Erro ao verificar conquistas de wishlist:", err);
  }
}

// Verificar todas as conquistas para um utilizador
async function checkAllAchievements(userId) {
  await checkCollectionAchievements(userId);
  await checkPlaytimeAchievements(userId);
  await checkReviewAchievements(userId);
  await checkWishlistAchievements(userId);
}

module.exports = {
  checkAndUnlock,
  checkCollectionAchievements,
  checkPlaytimeAchievements,
  checkReviewAchievements,
  checkLikeAchievements,
  checkWishlistAchievements,
  checkAllAchievements,
};
