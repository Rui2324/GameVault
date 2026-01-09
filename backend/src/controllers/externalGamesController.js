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

// POST /api/external-games/import/collection
// Body: { external_id, rating, hours_played, status, notes }
async function importExternalToCollection(req, res) {
  // ✅ Defesa extra: se por algum motivo o middleware não meter o user, não rebenta o servidor
  if (!req.user || !req.user.id) {
    return res
      .status(401)
      .json({ mensagem: "Utilizador não autenticado." });
  }

  const userId = req.user.id;
  const { external_id, rating, hours_played, status, notes } = req.body;

  if (!external_id) {
    return res
      .status(400)
      .json({ mensagem: "Campo 'external_id' é obrigatório." });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // 1) Ver se já existe jogo com esse external_id
    const [existing] = await conn.query(
      "SELECT id FROM games WHERE external_id = ?",
      [external_id]
    );

    let gameId;

    if (existing.length > 0) {
      // Já existe, reutilizamos
      gameId = existing[0].id;
    } else {
      // 2) Buscar detalhes ao RAWG e inserir na tabela games
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

      gameId = insertResult.insertId;
    }

    // 3) Criar entrada na collection_entries para este utilizador
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
    if (conn) {
      try {
        await conn.rollback();
      } catch (_) {}
    }
    console.error("Erro ao importar jogo externo:", err.message);
    return res
      .status(500)
      .json({ mensagem: "Erro ao importar jogo para a coleção." });
  } finally {
    if (conn) conn.release();
  }
}

module.exports = {
  searchExternalGames,
  importExternalToCollection,
};
