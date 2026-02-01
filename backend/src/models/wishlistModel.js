// backend/src/models/wishlistModel.js
const pool = require("../config/db");

// Lista a wishlist de um utilizador
async function listarWishlistPorUtilizador(userId) {
  const [rows] = await pool.query(
    `
    SELECT 
      w.id,
      w.game_id AS jogo_id,

      -- ids do jogo
      g.id AS game_id,
      g.external_id,
      g.steam_appid,
      g.rawg_id,
      g.source,

      -- nomes (duplicado para compatibilidade)
      g.title AS titulo,
      g.title AS title,

      -- plataforma/genero (duplicado)
      g.platform AS plataforma,
      g.platform AS platform,
      g.genre AS genero,
      g.genre AS genre,

      -- capa (duplicado para compatibilidade)
      g.cover_url AS capa_url,
      g.cover_url AS cover_url,

      w.created_at
    FROM wishlist_entries w
    JOIN games g ON g.id = w.game_id
    WHERE w.user_id = ?
    ORDER BY w.created_at DESC
    `,
    [userId]
  );

  return rows;
}

// Adiciona um jogo à wishlist
async function adicionarWishlist(userId, gameId) {
  const [result] = await pool.query(
    "INSERT INTO wishlist_entries (user_id, game_id) VALUES (?, ?)",
    [userId, gameId]
  );

  const [rows] = await pool.query(
    `
    SELECT 
      w.id,
      w.game_id AS jogo_id,

      g.id AS game_id,
      g.external_id,
      g.steam_appid,
      g.rawg_id,
      g.source,

      g.title AS titulo,
      g.title AS title,

      g.platform AS plataforma,
      g.platform AS platform,
      g.genre AS genero,
      g.genre AS genre,

      g.cover_url AS capa_url,
      g.cover_url AS cover_url,

      w.created_at
    FROM wishlist_entries w
    JOIN games g ON g.id = w.game_id
    WHERE w.id = ?
    LIMIT 1
    `,
    [result.insertId]
  );

  return rows[0];
}

// Remove da wishlist (garantir que pertence ao user)
async function removerWishlist(id, userId) {
  await pool.query("DELETE FROM wishlist_entries WHERE id = ? AND user_id = ?", [
    id,
    userId,
  ]);
}

module.exports = {
  listarWishlistPorUtilizador,
  adicionarWishlist,
  removerWishlist,
};
