// src/models/profileModel.js
const pool = require("../config/db");

// Buscar perfil público de um utilizador
async function getPublicProfile(userId) {
  const [rows] = await pool.query(
    `SELECT id, name, avatar_url, bio, is_public, total_xp, created_at
     FROM users WHERE id = ? LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

// Buscar perfil por username ou id
async function findProfileByNameOrId(identifier) {
  // Tentar primeiro por ID (se for número)
  if (!isNaN(identifier)) {
    const profile = await getPublicProfile(parseInt(identifier));
    if (profile) return profile;
  }
  
  // Tentar por nome
  const [rows] = await pool.query(
    `SELECT id, name, avatar_url, bio, is_public, total_xp, created_at
     FROM users WHERE name = ? LIMIT 1`,
    [identifier]
  );
  return rows[0] || null;
}

// Estatísticas públicas do utilizador
async function getProfileStats(userId) {
  // Total de jogos na coleção
  const [collectionCount] = await pool.query(
    "SELECT COUNT(*) as total FROM collection_entries WHERE user_id = ?",
    [userId]
  );
  
  // Jogos concluídos
  const [completedCount] = await pool.query(
    "SELECT COUNT(*) as total FROM collection_entries WHERE user_id = ? AND status = 'completed'",
    [userId]
  );
  
  // Horas totais jogadas
  const [hoursResult] = await pool.query(
    "SELECT COALESCE(SUM(hours_played), 0) as total FROM collection_entries WHERE user_id = ?",
    [userId]
  );
  
  // Total de reviews
  const [reviewsCount] = await pool.query(
    "SELECT COUNT(*) as total FROM reviews WHERE user_id = ?",
    [userId]
  );
  
  // Média de rating dado
  const [avgRating] = await pool.query(
    "SELECT AVG(rating) as average FROM collection_entries WHERE user_id = ? AND rating IS NOT NULL",
    [userId]
  );
  
  // Conquistas desbloqueadas
  const [achievementsCount] = await pool.query(
    "SELECT COUNT(*) as total FROM user_achievements WHERE user_id = ?",
    [userId]
  );
  
  return {
    totalGames: collectionCount[0].total,
    completedGames: completedCount[0].total,
    totalHours: parseFloat(hoursResult[0].total) || 0,
    totalReviews: reviewsCount[0].total,
    averageRating: avgRating[0].average ? parseFloat(avgRating[0].average).toFixed(1) : null,
    totalAchievements: achievementsCount[0].total
  };
}

// Jogos favoritos (top rated pelo utilizador)
async function getFavoriteGames(userId, limit = 5) {
  const [rows] = await pool.query(
    `SELECT g.id, g.title, g.cover_url, g.external_id, ce.rating, ce.hours_played
     FROM collection_entries ce
     JOIN games g ON ce.game_id = g.id
     WHERE ce.user_id = ? AND ce.rating IS NOT NULL
     ORDER BY ce.rating DESC, ce.hours_played DESC
     LIMIT ?`,
    [userId, limit]
  );
  return rows;
}

// Jogos recentes adicionados à coleção
async function getRecentGames(userId, limit = 5) {
  const [rows] = await pool.query(
    `SELECT g.id, g.title, g.cover_url, g.external_id, ce.rating, ce.status, ce.created_at
     FROM collection_entries ce
     JOIN games g ON ce.game_id = g.id
     WHERE ce.user_id = ?
     ORDER BY ce.created_at DESC
     LIMIT ?`,
    [userId, limit]
  );
  return rows;
}

// Géneros favoritos do utilizador
async function getFavoriteGenres(userId) {
  const [rows] = await pool.query(
    `SELECT g.genres, COUNT(*) as count
     FROM collection_entries ce
     JOIN games g ON ce.game_id = g.id
     WHERE ce.user_id = ? AND g.genres IS NOT NULL
     GROUP BY g.genres
     ORDER BY count DESC
     LIMIT 5`,
    [userId]
  );
  return rows;
}

// Atualizar visibilidade do perfil
async function updateProfileVisibility(userId, isPublic) {
  await pool.query(
    "UPDATE users SET is_public = ? WHERE id = ?",
    [isPublic, userId]
  );
}

module.exports = {
  getPublicProfile,
  findProfileByNameOrId,
  getProfileStats,
  getFavoriteGames,
  getRecentGames,
  getFavoriteGenres,
  updateProfileVisibility,
};
