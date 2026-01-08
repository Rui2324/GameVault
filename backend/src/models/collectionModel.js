// src/models/collectionModel.js
const pool = require("../config/db");

async function addToCollection({
  user_id,
  game_id,
  rating = null,
  hours_played = 0,
  status = "por_jogar",
  notes = null,
}) {
  const [result] = await pool.query(
    `INSERT INTO collection_entries
      (user_id, game_id, rating, hours_played, status, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [user_id, game_id, rating, hours_played, status, notes]
  );

  const [rows] = await pool.query(
    `SELECT ce.*, g.title, g.platform, g.genre, g.cover_url
     FROM collection_entries ce
     JOIN games g ON g.id = ce.game_id
     WHERE ce.id = ?`,
    [result.insertId]
  );

  return rows[0];
}

async function listCollectionForUser(user_id) {
  const [rows] = await pool.query(
    `SELECT ce.*, g.title, g.platform, g.genre, g.cover_url
     FROM collection_entries ce
     JOIN games g ON g.id = ce.game_id
     WHERE ce.user_id = ?
     ORDER BY g.title ASC`,
    [user_id]
  );
  return rows;
}

async function updateCollectionEntry(id, user_id, data) {
  const {
    rating = null,
    hours_played = 0,
    status = "por_jogar",
    notes = null,
  } = data;

  await pool.query(
    `UPDATE collection_entries
     SET rating = ?, hours_played = ?, status = ?, notes = ?
     WHERE id = ? AND user_id = ?`,
    [rating, hours_played, status, notes, id, user_id]
  );

  const [rows] = await pool.query(
    `SELECT ce.*, g.title, g.platform, g.genre, g.cover_url
     FROM collection_entries ce
     JOIN games g ON g.id = ce.game_id
     WHERE ce.id = ? AND ce.user_id = ?`,
    [id, user_id]
  );

  return rows[0] || null;
}

async function removeFromCollection(id, user_id) {
  const [result] = await pool.query(
    "DELETE FROM collection_entries WHERE id = ? AND user_id = ?",
    [id, user_id]
  );
  return result.affectedRows > 0;
}

module.exports = {
  addToCollection,
  listCollectionForUser,
  updateCollectionEntry,
  removeFromCollection,
};
