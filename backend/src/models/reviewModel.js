const pool = require("../config/db");

// Buscar todas as reviews de um jogo
async function getGameReviews(gameId, limit = 20, offset = 0) {
  const [rows] = await pool.query(
    `SELECT r.*, u.name as user_name, u.avatar_url as user_avatar,
            (SELECT COUNT(*) FROM review_likes WHERE review_id = r.id) as likes_count
     FROM reviews r
     JOIN users u ON r.user_id = u.id
     WHERE r.game_id = ?
     ORDER BY r.created_at DESC
     LIMIT ? OFFSET ?`,
    [gameId, limit, offset]
  );
  return rows;
}

// Buscar review de um utilizador para um jogo específico
async function getUserReviewForGame(userId, gameId) {
  const [rows] = await pool.query(
    `SELECT r.*, 
            (SELECT COUNT(*) FROM review_likes WHERE review_id = r.id) as likes_count
     FROM reviews r
     WHERE r.user_id = ? AND r.game_id = ?
     LIMIT 1`,
    [userId, gameId]
  );
  return rows[0] || null;
}

// Buscar todas as reviews de um utilizador
async function getUserReviews(userId, limit = 20, offset = 0) {
  const [rows] = await pool.query(
    `SELECT r.*, g.title as game_title, g.cover_url as game_cover,
            (SELECT COUNT(*) FROM review_likes WHERE review_id = r.id) as likes_count
     FROM reviews r
     JOIN games g ON r.game_id = g.id
     WHERE r.user_id = ?
     ORDER BY r.created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );
  return rows;
}

// Criar uma nova review
async function createReview({ userId, gameId, rating, title, content, spoiler = false }) {
  const [result] = await pool.query(
    `INSERT INTO reviews (user_id, game_id, rating, title, content, spoiler)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, gameId, rating, title, content, spoiler]
  );
  return { id: result.insertId, userId, gameId, rating, title, content, spoiler };
}

// Atualizar uma review existente
async function updateReview(reviewId, userId, { rating, title, content, spoiler }) {
  const [result] = await pool.query(
    `UPDATE reviews 
     SET rating = ?, title = ?, content = ?, spoiler = ?, updated_at = NOW()
     WHERE id = ? AND user_id = ?`,
    [rating, title, content, spoiler, reviewId, userId]
  );
  return result.affectedRows > 0;
}

// Eliminar uma review
async function deleteReview(reviewId, userId) {
  const [result] = await pool.query(
    "DELETE FROM reviews WHERE id = ? AND user_id = ?",
    [reviewId, userId]
  );
  return result.affectedRows > 0;
}

// Dar like numa review
async function likeReview(userId, reviewId) {
  try {
    await pool.query(
      "INSERT INTO review_likes (user_id, review_id) VALUES (?, ?)",
      [userId, reviewId]
    );
    return true;
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return false; 
    }
    throw err;
  }
}

// Remover like de uma review
async function unlikeReview(userId, reviewId) {
  const [result] = await pool.query(
    "DELETE FROM review_likes WHERE user_id = ? AND review_id = ?",
    [userId, reviewId]
  );
  return result.affectedRows > 0;
}

// Verificar se utilizador deu like
async function hasUserLiked(userId, reviewId) {
  const [rows] = await pool.query(
    "SELECT id FROM review_likes WHERE user_id = ? AND review_id = ? LIMIT 1",
    [userId, reviewId]
  );
  return rows.length > 0;
}

// Contar total de reviews de um jogo
async function countGameReviews(gameId) {
  const [rows] = await pool.query(
    "SELECT COUNT(*) as total FROM reviews WHERE game_id = ?",
    [gameId]
  );
  return rows[0].total;
}

// Média de ratings de um jogo
async function getGameAverageRating(gameId) {
  const [rows] = await pool.query(
    "SELECT AVG(rating) as average, COUNT(*) as total FROM reviews WHERE game_id = ?",
    [gameId]
  );
  return { average: rows[0].average || 0, total: rows[0].total };
}

module.exports = {
  getGameReviews,
  getUserReviewForGame,
  getUserReviews,
  createReview,
  updateReview,
  deleteReview,
  likeReview,
  unlikeReview,
  hasUserLiked,
  countGameReviews,
  getGameAverageRating,
};
