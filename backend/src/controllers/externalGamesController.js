// backend/src/controllers/externalGamesController.js
const pool = require("../config/db");
const externalGamesService = require("../services/externalGamesService");

/**
 * Normaliza um jogo (RAWG ou já mapeado) para campos que guardamos na DB.
 * (Isto evita partir quando tens nomes diferentes: platforms vs platform, etc.)
 */
function normalizeGameForDb(raw, externalIdFallback) {
  const external_id =
    raw?.external_id ?? raw?.id ?? Number(externalIdFallback) ?? null;

  return {
    external_id,
    title: raw?.title ?? raw?.name ?? null,
    slug: raw?.slug ?? null,

    // alguns mapeiam como string "PC, PS5", outros trazem array/objetos
    platforms:
      raw?.platforms ??
      raw?.platform ??
      (Array.isArray(raw?.platforms)
        ? raw.platforms
            .map((p) => p?.platform?.name || p?.name || p)
            .filter(Boolean)
            .join(", ")
        : null),

    genres:
      raw?.genres ??
      raw?.genre ??
      (Array.isArray(raw?.genres)
        ? raw.genres
            .map((g) => g?.name || g)
            .filter(Boolean)
            .join(", ")
        : null),

    release_date: raw?.release_date ?? raw?.released ?? null,
    cover_url:
      raw?.cover_url ?? raw?.background_image ?? raw?.cover ?? raw?.image ?? null,

    description:
      raw?.description ??
      raw?.description_raw ??
      raw?.descriptionRaw ??
      null,

    // extras (não são obrigatórios, mas se tiveres colunas, podes guardar)
    metacritic: raw?.metacritic ?? null,
    website: raw?.website ?? null,
    reddit_url: raw?.reddit_url ?? raw?.reddit ?? null,
    playtime: raw?.playtime ?? null,
    esrb: raw?.esrb_rating?.name ?? raw?.esrb ?? null,
  };
}

/**
 * Garante que o jogo existe na tabela games e devolve o game_id.
 * Faz INSERT com fallback para nomes de colunas diferentes (platform/genre vs platforms/genres).
 */
async function ensureGameInLocalDb(conn, externalId) {
  const ext = Number(externalId);

  // 1) já existe?
  const [found] = await conn.query(
    "SELECT id FROM games WHERE external_id = ? LIMIT 1",
    [ext]
  );
  if (found.length) return found[0].id;

  // 2) ir buscar ao RAWG via service
  const details = await externalGamesService.getGameDetails(ext);
  const g = normalizeGameForDb(details, ext);

  // 3) tentar inserir com "platforms/genres"
  try {
    await conn.query(
      `INSERT INTO games (external_id, title, slug, platforms, genres, release_date, cover_url, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        g.external_id,
        g.title,
        g.slug,
        g.platforms,
        g.genres,
        g.release_date,
        g.cover_url,
        g.description,
      ]
    );
  } catch (err) {
    // fallback: algumas DBs usam platform/genre (singular)
    if (err?.code === "ER_BAD_FIELD_ERROR") {
      await conn.query(
        `INSERT INTO games (external_id, title, slug, platform, genre, release_date, cover_url, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          g.external_id,
          g.title,
          g.slug,
          g.platforms,
          g.genres,
          g.release_date,
          g.cover_url,
          g.description,
        ]
      );
    } else {
      throw err;
    }
  }

  // 4) devolver id
  const [again] = await conn.query(
    "SELECT id FROM games WHERE external_id = ? LIMIT 1",
    [ext]
  );
  if (!again.length) throw new Error("Falhou a criação do jogo na BD.");
  return again[0].id;
}

/**
 * GET /external-games/search?query=...&page=1
 */
async function searchExternalGames(req, res) {
  try {
    // aceita tanto "query" como "q" para compatibilidade com o frontend
    const query = String(req.query.query || req.query.q || "").trim();
    const page = Number(req.query.page || 1);

    if (!query) {
      return res.status(400).json({ mensagem: "Falta o parâmetro query." });
    }

    const jogos = await externalGamesService.searchGames(query, page);
    return res.json({ jogos });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ mensagem: "Falhou a pesquisa na RAWG." });
  }
}

/**
 * GET /external-games/:externalId
 * (o frontend espera { jogo: ... })
 */
async function getExternalGameDetails(req, res) {
  try {
    const { externalId } = req.params;
    const jogo = await externalGamesService.getGameDetails(externalId);
    return res.json({ jogo });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ mensagem: "Falhou ao carregar detalhes do jogo." });
  }
}

/**
 * POST /external-games/import/collection
 * body: { external_id, rating, hours_played, status, notes }
 */
async function importExternalToCollection(req, res) {
  const userId = req.userId;
  const { external_id, rating, hours_played, status, notes } = req.body || {};

  if (!external_id) {
    return res.status(400).json({ mensagem: "external_id é obrigatório." });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const gameId = await ensureGameInLocalDb(conn, external_id);

    // evitar duplicados
    const [exists] = await conn.query(
      "SELECT id FROM collection_entries WHERE user_id = ? AND game_id = ? LIMIT 1",
      [userId, gameId]
    );
    if (exists.length) {
      await conn.rollback();
      return res.status(409).json({ mensagem: "Já está na tua coleção." });
    }

    const [ins] = await conn.query(
      `INSERT INTO collection_entries (user_id, game_id, rating, hours_played, status, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        gameId,
        rating ?? null,
        hours_played ?? 0,
        status ?? "por_jogar",
        notes ?? null,
      ]
    );

    await conn.commit();
    return res.status(201).json({
      mensagem: "Adicionado à coleção.",
      collection_entry_id: ins.insertId,
      game_id: gameId,
    });
  } catch (e) {
    await conn.rollback();
    console.error(e);

    if (e?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ mensagem: "Já está na tua coleção." });
    }

    return res.status(500).json({ mensagem: "Falhou ao adicionar à coleção." });
  } finally {
    conn.release();
  }
}

/**
 * POST /external-games/import/wishlist
 * body: { external_id }
 */
async function importExternalToWishlist(req, res) {
  const userId = req.userId;
  const { external_id } = req.body || {};

  if (!external_id) {
    return res.status(400).json({ mensagem: "external_id é obrigatório." });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const gameId = await ensureGameInLocalDb(conn, external_id);

    const [exists] = await conn.query(
      "SELECT id FROM wishlist_entries WHERE user_id = ? AND game_id = ? LIMIT 1",
      [userId, gameId]
    );
    if (exists.length) {
      await conn.rollback();
      return res.status(409).json({ mensagem: "Já está na tua wishlist." });
    }

    await conn.query(
      "INSERT INTO wishlist_entries (user_id, game_id) VALUES (?, ?)",
      [userId, gameId]
    );

    await conn.commit();
    return res.status(201).json({ mensagem: "Adicionado à wishlist." });
  } catch (e) {
    await conn.rollback();
    console.error(e);

    if (e?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ mensagem: "Já está na tua wishlist." });
    }

    return res.status(500).json({ mensagem: "Falhou ao adicionar à wishlist." });
  } finally {
    conn.release();
  }
}

module.exports = {
  searchExternalGames,
  getExternalGameDetails,
  importExternalToCollection,
  importExternalToWishlist,
};
