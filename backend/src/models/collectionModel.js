// src/models/collectionModel.js
const pool = require("../config/db");

// Lista completa da coleção de um utilizador
async function listCollectionForUser(userId) {
  const [rows] = await pool.query(
    `
    SELECT 
      c.*,
      g.title,
      g.platform,
      g.genre,
      g.cover_url,
      g.description,
      g.external_id,
      g.steam_appid,
      g.rawg_id,
      g.source
    FROM collection_entries c
    JOIN games g ON c.game_id = g.id
    WHERE c.user_id = ?
    ORDER BY c.created_at DESC
    `,
    [userId]
  );

  return rows;
}

// Atualiza conquistas (Steam) numa entrada da coleção.
// Se completed=1, também marca status='concluido'.
async function updateAchievements(entryId, userId, { total, unlocked, completed }) {
  const totalN = total ?? null;
  const unlockedN = unlocked ?? null;
  const completedN = completed ? 1 : 0;

  const [result] = await pool.query(
    `
    UPDATE collection_entries
    SET
      achievements_total = ?,
      achievements_unlocked = ?,
      achievements_completed = ?,
      achievements_last_sync = NOW(),
      status = IF(?, 'concluido', status),
      updated_at = NOW()
    WHERE id = ? AND user_id = ?
    `,
    [totalN, unlockedN, completedN, completedN, entryId, userId]
  );

  return result.affectedRows > 0;
}

// Adicionar um jogo à coleção
async function addToCollection({
  user_id,
  game_id,
  rating,
  hours_played,
  status,
  notes,
}) {
  const [result] = await pool.query(
    `
    INSERT INTO collection_entries
      (user_id, game_id, rating, hours_played, status, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `,
    [user_id, game_id, rating ?? null, hours_played ?? 0, status, notes ?? null]
  );

  const insertedId = result.insertId;

  const [rows] = await pool.query(
    `
    SELECT 
      c.*,
      g.title,
      g.platform,
      g.genre,
      g.cover_url,
      g.description
    FROM collection_entries c
    JOIN games g ON c.game_id = g.id
    WHERE c.id = ?
    `,
    [insertedId]
  );

  return rows[0];
}

// Atualizar uma entrada da coleção
async function updateCollectionEntry(id, userId, updates) {
  const { rating, hours_played, status, notes } = updates;

  const [result] = await pool.query(
    `
    UPDATE collection_entries
    SET
      rating = ?,
      hours_played = ?,
      status = ?,
      notes = ?,
      updated_at = NOW()
    WHERE id = ? AND user_id = ?
    `,
    [rating ?? null, hours_played ?? 0, status, notes ?? null, id, userId]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  const [rows] = await pool.query(
    `
    SELECT 
      c.*,
      g.title,
      g.platform,
      g.genre,
      g.cover_url,
      g.description
    FROM collection_entries c
    JOIN games g ON c.game_id = g.id
    WHERE c.id = ?
    `,
    [id]
  );

  return rows[0];
}

// Remover da coleção
async function removeFromCollection(id, userId) {
  const [result] = await pool.query(
    `DELETE FROM collection_entries WHERE id = ? AND user_id = ?`,
    [id, userId]
  );

  return result.affectedRows > 0;
}

// Obter uma entrada específica (para a página de detalhes)
async function getCollectionEntryById(id, userId) {
  const [rows] = await pool.query(
    `
    SELECT 
      c.*,
      g.title,
      g.platform,
      g.genre,
      g.cover_url,
      g.description
    FROM collection_entries c
    JOIN games g ON c.game_id = g.id
    WHERE c.id = ? AND c.user_id = ?
    `,
    [id, userId]
  );

  if (rows.length === 0) {
    return null;
  }
  return rows[0];
}

// Obter entrada pelo game_id (para o ranking global)
async function getCollectionEntryByGameId(gameId, userId) {
  const [rows] = await pool.query(
    `
    SELECT 
      c.*,
      g.title,
      g.platform,
      g.genre,
      g.cover_url,
      g.description
    FROM collection_entries c
    JOIN games g ON c.game_id = g.id
    WHERE c.game_id = ? AND c.user_id = ?
    `,
    [gameId, userId]
  );

  if (rows.length === 0) {
    return null;
  }
  return rows[0];
}

module.exports = {
  listCollectionForUser,
  addToCollection,
  updateCollectionEntry,
  removeFromCollection,
  getCollectionEntryById,
  getCollectionEntryByGameId,
  updateAchievements,
};