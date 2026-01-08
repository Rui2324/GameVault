// src/models/wishlistModel.js
const pool = require("../config/db");

// lista a wishlist de um utilizador
async function listarWishlistPorUtilizador(userId) {
  const [rows] = await pool.query(
    `
    SELECT 
      w.id,
      w.game_id,
      g.title      AS titulo,
      g.platform   AS plataforma,
      g.genre      AS genero,
      g.cover_url  AS capa_url,
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

// adiciona um jogo à wishlist
async function adicionarWishlist(userId, gameId) {
  const [result] = await pool.query(
    "INSERT INTO wishlist_entries (user_id, game_id) VALUES (?, ?)",
    [userId, gameId]
  );

  const [rows] = await pool.query(
    `
    SELECT 
      w.id,
      w.game_id,
      g.title      AS titulo,
      g.platform   AS plataforma,
      g.genre      AS genero,
      g.cover_url  AS capa_url,
      w.created_at
    FROM wishlist_entries w
    JOIN games g ON g.id = w.game_id
    WHERE w.id = ?
    `,
    [result.insertId]
  );

  return rows[0];
}

// remove da wishlist (garantir que pertence ao user)
async function removerWishlist(id, userId) {
  await pool.query(
    "DELETE FROM wishlist_entries WHERE id = ? AND user_id = ?",
    [id, userId]
  );
}

module.exports = {
  listarWishlistPorUtilizador,
  adicionarWishlist,
  removerWishlist,
};
