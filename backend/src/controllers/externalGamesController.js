// src/controllers/externalGamesController.js
const pool = require("../config/db");
const externalService = require("../services/externalGamesService");

// GET /api/external-games/search?q=baldur&page=1
async function searchExternalGames(req, res) {
  try {
    const q = (req.query.q || "").trim();
    const page = parseInt(req.query.page || "1", 10);

    if (!q) {
      return res.status(400).json({ mensagem: "Parâmetro 'q' em falta." });
    }

    const resultados = await externalService.searchGames(q, page);

    return res.json({
      query: q,
      page,
      resultados,
    });
  } catch (err) {
    console.error("Erro ao pesquisar jogos externos:", err.message);
    return res
      .status(500)
      .json({ mensagem: "Erro ao pesquisar jogos na API externa." });
  }
}

// Helper: garante que existe jogo em `games` para um external_id.
// Devolve o game_id local.
async function ensureGameInLocalDb(conn, external_id) {
  const [existing] = await conn.query(
    "SELECT id FROM games WHERE external_id = ?",
    [external_id]
  );

  if (existing.length > 0) {
    return existing[0].id;
  }

  // Buscar detalhes à RAWG
  const jogoExt = await externalService.getGameDetails(external_id);

  const [insertResult] = await conn.query(
    `INSERT INTO games
      (external_id, title, slug, platform, genre, release_date, cover_url, description, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      jogoExt.external_id,
      jogoExt.title,
      jogoExt.slug,
      jogoExt.platforms,
      jogoExt.genres,
      jogoExt.release_date,
      jogoExt.cover_url,
      jogoExt.description,
    ]
  );

  return insertResult.insertId;
}

// POST /api/external-games/import/collection
// Body: { external_id, rating, hours_played, status, notes }
async function importExternalToCollection(req, res) {
  const userId = req.userId;
  const { external_id, rating, hours_played, status, notes } = req.body;

  if (!external_id) {
    return res
      .status(400)
      .json({ mensagem: "Campo 'external_id' é obrigatório." });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const gameId = await ensureGameInLocalDb(conn, external_id);

    const [insertCollection] = await conn.query(
      `INSERT INTO collection_entries
        (user_id, game_id, rating, hours_played, status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        userId,
        gameId,
        rating ?? null,
        hours_played ?? 0,
        status || "por_jogar",
        notes || null,
      ]
    );

    await conn.commit();

    return res.status(201).json({
      mensagem: "Jogo importado para a coleção com sucesso.",
      collection_entry_id: insertCollection.insertId,
      game_id: gameId,
    });
  } catch (err) {
    await conn.rollback();
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        mensagem: "Este jogo já existe na tua coleção.",
      });
    }

    console.error("Erro ao importar jogo externo (coleção):", err.message);
    return res
      .status(500)
      .json({ mensagem: "Erro ao importar jogo para a coleção." });
  } finally {
    conn.release();
  }
}

// POST /api/external-games/import/wishlist
// Body: { external_id }
async function importExternalToWishlist(req, res) {
  const userId = req.userId;
  const { external_id } = req.body;

  if (!external_id) {
    return res
      .status(400)
      .json({ mensagem: "Campo 'external_id' é obrigatório." });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const gameId = await ensureGameInLocalDb(conn, external_id);

    const [insertWishlist] = await conn.query(
      `INSERT INTO wishlist_entries
        (user_id, game_id, created_at, updated_at)
       VALUES (?, ?, NOW(), NOW())`,
      [userId, gameId]
    );

    await conn.commit();

    return res.status(201).json({
      mensagem: "Jogo adicionado à wishlist com sucesso.",
      wishlist_entry_id: insertWishlist.insertId,
      game_id: gameId,
    });
  } catch (err) {
    await conn.rollback();

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        mensagem: "Este jogo já está na tua wishlist.",
      });
    }

    console.error("Erro ao importar jogo externo (wishlist):", err.message);
    return res
      .status(500)
      .json({ mensagem: "Erro ao adicionar jogo à wishlist." });
  } finally {
    conn.release();
  }
}

module.exports = {
  searchExternalGames,
  importExternalToCollection,
  importExternalToWishlist,
};
