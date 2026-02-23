const pool = require("../config/db");

// Buscar todas as conquistas disponíveis
async function getAllAchievements() {
  const [rows] = await pool.query(
    "SELECT * FROM achievements ORDER BY category, requirement_value"
  );
  return rows;
}

// Buscar conquistas de um utilizador
async function getUserAchievements(userId) {
  const [rows] = await pool.query(
    `SELECT a.*, ua.unlocked_at
     FROM achievements a
     LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
     ORDER BY a.category, a.requirement_value`,
    [userId]
  );
  return rows;
}

// Buscar conquistas desbloqueadas de um utilizador
async function getUnlockedAchievements(userId) {
  const [rows] = await pool.query(
    `SELECT a.*, ua.unlocked_at
     FROM achievements a
     INNER JOIN user_achievements ua ON a.id = ua.achievement_id
     WHERE ua.user_id = ?
     ORDER BY ua.unlocked_at DESC`,
    [userId]
  );
  return rows;
}

// Buscar uma conquista por código
async function getAchievementByCode(code) {
  const [rows] = await pool.query(
    "SELECT * FROM achievements WHERE code = ? LIMIT 1",
    [code]
  );
  return rows[0] || null;
}

// Verificar se utilizador já tem uma conquista
async function hasAchievement(userId, achievementId) {
  const [rows] = await pool.query(
    "SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ? LIMIT 1",
    [userId, achievementId]
  );
  return rows.length > 0;
}

// Desbloquear conquista para utilizador
async function unlockAchievement(userId, achievementId) {
  try {
    await pool.query(
      "INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)",
      [userId, achievementId]
    );
    
    // Adicionar XP ao utilizador
    const achievement = await getAchievementById(achievementId);
    if (achievement) {
      await pool.query(
        "UPDATE users SET total_xp = total_xp + ? WHERE id = ?",
        [achievement.xp_reward, userId]
      );
    }
    
    return true;
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return false; // Já tem esta conquista
    }
    throw err;
  }
}

// Buscar conquista por ID
async function getAchievementById(achievementId) {
  const [rows] = await pool.query(
    "SELECT * FROM achievements WHERE id = ? LIMIT 1",
    [achievementId]
  );
  return rows[0] || null;
}

// Contar conquistas desbloqueadas de um utilizador
async function countUserAchievements(userId) {
  const [rows] = await pool.query(
    "SELECT COUNT(*) as total FROM user_achievements WHERE user_id = ?",
    [userId]
  );
  return rows[0].total;
}

// Buscar XP total de um utilizador
async function getUserXP(userId) {
  const [rows] = await pool.query(
    "SELECT total_xp FROM users WHERE id = ? LIMIT 1",
    [userId]
  );
  return rows[0]?.total_xp || 0;
}

// Conquistas recentes desbloqueadas (para notificações)
async function getRecentUnlocks(userId, limit = 5) {
  const [rows] = await pool.query(
    `SELECT a.*, ua.unlocked_at
     FROM achievements a
     INNER JOIN user_achievements ua ON a.id = ua.achievement_id
     WHERE ua.user_id = ?
     ORDER BY ua.unlocked_at DESC
     LIMIT ?`,
    [userId, limit]
  );
  return rows;
}

module.exports = {
  getAllAchievements,
  getUserAchievements,
  getUnlockedAchievements,
  getAchievementByCode,
  hasAchievement,
  unlockAchievement,
  getAchievementById,
  countUserAchievements,
  getUserXP,
  getRecentUnlocks,
};
