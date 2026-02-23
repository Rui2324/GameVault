const pool = require("../config/db");

async function findUserByEmail(email) {
  const [rows] = await pool.query(
    "SELECT * FROM users WHERE email = ? LIMIT 1",
    [email]
  );
  return rows[0] || null;
}

async function findUserById(id) {
  const [rows] = await pool.query(
    "SELECT id, name, email, avatar_url, bio, role, created_at, updated_at FROM users WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] || null;
}

async function createUser({ name, email, passwordHash }) {
  const [result] = await pool.query(
    "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
    [name, email, passwordHash]
  );

  return {
    id: result.insertId,
    name,
    email,
  };
}

async function getAllUsers() {
  const [rows] = await pool.query(
    "SELECT id, name, email, avatar_url, role, created_at, updated_at FROM users ORDER BY created_at DESC"
  );
  return rows;
}

async function updateUserRole(userId, role) {
  const [result] = await pool.query(
    "UPDATE users SET role = ? WHERE id = ?",
    [role, userId]
  );
  return result.affectedRows > 0;
}

async function deleteUser(userId) {
  const [result] = await pool.query(
    "DELETE FROM users WHERE id = ?",
    [userId]
  );
  return result.affectedRows > 0;
}

async function getUserStats() {
  const [totalUsers] = await pool.query("SELECT COUNT(*) as count FROM users");
  const [totalGames] = await pool.query("SELECT COUNT(*) as count FROM collection_entries");
  const [totalWishlist] = await pool.query("SELECT COUNT(*) as count FROM wishlist_entries");
  const [recentUsers] = await pool.query(
    "SELECT COUNT(*) as count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
  );
  
  return {
    totalUsers: totalUsers[0].count,
    totalGames: totalGames[0].count,
    totalWishlist: totalWishlist[0].count,
    newUsersThisMonth: recentUsers[0].count
  };
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getUserStats,
};
