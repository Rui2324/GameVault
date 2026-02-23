const pool = require("../config/db");

// Seguir um utilizador
async function followUser(followerId, followingId) {
  if (followerId === followingId) {
    throw new Error("Não podes seguir-te a ti próprio");
  }

  const [result] = await pool.query(
    `INSERT INTO follows (follower_id, following_id) VALUES (?, ?)`,
    [followerId, followingId]
  );

  return result.insertId;
}

// Deixar de seguir
async function unfollowUser(followerId, followingId) {
  const [result] = await pool.query(
    `DELETE FROM follows WHERE follower_id = ? AND following_id = ?`,
    [followerId, followingId]
  );

  return result.affectedRows > 0;
}

// Verificar se está a seguir
async function isFollowing(followerId, followingId) {
  const [rows] = await pool.query(
    `SELECT id FROM follows WHERE follower_id = ? AND following_id = ?`,
    [followerId, followingId]
  );

  return rows.length > 0;
}

// Obter lista de quem o utilizador segue
async function getFollowing(userId, limit = 50, offset = 0) {
  const [rows] = await pool.query(
    `SELECT 
      u.id,
      u.name,
      u.email,
      u.avatar_url,
      u.bio,
      f.created_at as followed_at
    FROM follows f
    JOIN users u ON f.following_id = u.id
    WHERE f.follower_id = ?
    ORDER BY f.created_at DESC
    LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );

  return rows;
}

// Obter lista de seguidores
async function getFollowers(userId, limit = 50, offset = 0) {
  const [rows] = await pool.query(
    `SELECT 
      u.id,
      u.name,
      u.email,
      u.avatar_url,
      u.bio,
      f.created_at as followed_at
    FROM follows f
    JOIN users u ON f.follower_id = u.id
    WHERE f.following_id = ?
    ORDER BY f.created_at DESC
    LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );

  return rows;
}

// Contar seguidores e seguindo
async function getFollowCounts(userId) {
  const [[followersResult]] = await pool.query(
    `SELECT COUNT(*) as count FROM follows WHERE following_id = ?`,
    [userId]
  );

  const [[followingResult]] = await pool.query(
    `SELECT COUNT(*) as count FROM follows WHERE follower_id = ?`,
    [userId]
  );

  return {
    followers: Number(followersResult.count),
    following: Number(followingResult.count)
  };
}

// Obter amigos mútuos (seguem-se mutuamente)
async function getMutualFollows(userId, limit = 50) {
  const [rows] = await pool.query(
    `SELECT 
      u.id,
      u.name,
      u.avatar_url,
      u.bio
    FROM follows f1
    JOIN follows f2 ON f1.following_id = f2.follower_id AND f1.follower_id = f2.following_id
    JOIN users u ON f1.following_id = u.id
    WHERE f1.follower_id = ?
    LIMIT ?`,
    [userId, limit]
  );

  return rows;
}

module.exports = {
  followUser,
  unfollowUser,
  isFollowing,
  getFollowing,
  getFollowers,
  getFollowCounts,
  getMutualFollows
};
