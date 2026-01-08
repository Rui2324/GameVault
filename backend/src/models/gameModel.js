// src/models/gameModel.js
const pool = require("../config/db");

async function createGame(data) {
  const {
    external_id = null,
    title,
    slug,
    platform = null,
    genre = null,
    release_date = null,
    cover_url = null,
    description = null,
  } = data;

  const [result] = await pool.query(
    `INSERT INTO games
      (external_id, title, slug, platform, genre, release_date, cover_url, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      external_id,
      title,
      slug,
      platform,
      genre,
      release_date,
      cover_url,
      description,
    ]
  );

  return { id: result.insertId, ...data };
}

async function getGameById(id) {
  const [rows] = await pool.query(
    "SELECT * FROM games WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] || null;
}

async function getGameBySlug(slug) {
  const [rows] = await pool.query(
    "SELECT * FROM games WHERE slug = ? LIMIT 1",
    [slug]
  );
  return rows[0] || null;
}

async function listAllGames() {
  const [rows] = await pool.query(
    "SELECT * FROM games ORDER BY created_at DESC"
  );
  return rows;
}

module.exports = {
  createGame,
  getGameById,
  getGameBySlug,
  listAllGames,
};
