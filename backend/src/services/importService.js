// backend/src/services/importService.js
const pool = require("../config/db");
const externalGamesService = require("./externalGamesService");

/**
 * NOTA:
 * Assumi estas tabelas/colunas (o mais comum no teu projeto):
 * - games: id, external_id, title, slug, platforms, genres, release_date, cover_url, description
 * - collection_entries: id, user_id, game_id, rating, hours_played, status, notes
 * - wishlist_items: id, user_id, game_id
 *
 * Se no teu MySQL os nomes forem diferentes, diz-me o nome real das tabelas/colunas e eu adapto já.
 */

async function getOrCreateGameIdByExternalId(externalId) {
  const ext = Number(externalId);

  const [found] = await pool.query(
    "SELECT id FROM games WHERE external_id = ? LIMIT 1",
    [ext]
  );

  if (found.length) return found[0].id;

  // vai buscar detalhes à RAWG e guarda no teu DB
  const game = await externalGamesService.getGameDetails(ext);

  // campos para inserir
  const payload = {
    external_id: game.external_id ?? ext,
    title: game.title ?? null,
    slug: game.slug ?? null,
    platforms: game.platforms ?? null,
    genres: game.genres ?? null,
    release_date: game.release_date ?? null,
    cover_url: game.cover_url ?? null,
    description: game.description ?? null,
  };

  const [ins] = await pool.query(
    `INSERT INTO games
      (external_id, title, slug, platforms, genres, release_date, cover_url, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.external_id,
      payload.title,
      payload.slug,
      payload.platforms,
      payload.genres,
      payload.release_date,
      payload.cover_url,
      payload.description,
    ]
  );

  return ins.insertId;
}

async function addExternalGameToCollection(userId, data) {
  const extId = Number(data.external_id);
  const gameId = await getOrCreateGameIdByExternalId(extId);

  // já existe na coleção?
  const [exists] = await pool.query(
    `SELECT ce.id
       FROM collection_entries ce
       WHERE ce.user_id = ? AND ce.game_id = ?
       LIMIT 1`,
    [userId, gameId]
  );

  if (exists.length) {
    const err = new Error("Já está na coleção.");
    err.status = 409;
    err.existingId = exists[0].id;
    throw err;
  }

  const rating = data.rating ?? null;
  const hoursPlayed = data.hours_played ?? 0;
  const status = data.status ?? "por_jogar";
  const notes = data.notes ?? null;

  const [ins] = await pool.query(
    `INSERT INTO collection_entries (user_id, game_id, rating, hours_played, status, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, gameId, rating, hoursPlayed, status, notes]
  );

  return { collection_entry_id: ins.insertId, game_id: gameId };
}

async function addExternalGameToWishlist(userId, data) {
  const extId = Number(data.external_id);
  const gameId = await getOrCreateGameIdByExternalId(extId);

  // já existe na wishlist?
  const [exists] = await pool.query(
    `SELECT wi.id
       FROM wishlist_items wi
       WHERE wi.user_id = ? AND wi.game_id = ?
       LIMIT 1`,
    [userId, gameId]
  );

  if (exists.length) {
    const err = new Error("Já está na wishlist.");
    err.status = 409;
    err.existingId = exists[0].id;
    throw err;
  }

  const [ins] = await pool.query(
    `INSERT INTO wishlist_items (user_id, game_id)
     VALUES (?, ?)`,
    [userId, gameId]
  );

  return { wishlist_item_id: ins.insertId, game_id: gameId };
}

/**
 * Exporto com vários nomes “alias” para bater certo
 * com o que tu possas ter escrito no controller.
 */
module.exports = {
  // nomes “principais”
  addExternalGameToCollection,
  addExternalGameToWishlist,

  // aliases comuns
  importToCollection: addExternalGameToCollection,
  importToWishlist: addExternalGameToWishlist,
  addToCollection: addExternalGameToCollection,
  addToWishlist: addExternalGameToWishlist,
};
