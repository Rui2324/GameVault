// backend/src/controllers/externalGamesController.js
const pool = require("../config/db");
const externalGamesService = require("../services/externalGamesService");
const axios = require("axios");

/**
 * Normaliza um jogo (RAWG ou já mapeado) para campos que guardamos na DB.
 */
function normalizeGameForDb(raw, externalIdFallback) {
  const external_id =
    raw?.external_id ?? raw?.id ?? Number(externalIdFallback) ?? null;

  const platforms =
    raw?.platforms ??
    raw?.platform ??
    (Array.isArray(raw?.platforms)
      ? raw.platforms
          .map((p) => p?.platform?.name || p?.name || p)
          .filter(Boolean)
          .join(", ")
      : null);

  const genres =
    raw?.genres ??
    raw?.genre ??
    (Array.isArray(raw?.genres)
      ? raw.genres
          .map((g) => g?.name || g)
          .filter(Boolean)
          .join(", ")
      : null);

  return {
    external_id,
    rawg_id: external_id, // normalmente o id RAWG
    title: raw?.title ?? raw?.name ?? null,
    slug: raw?.slug ?? null,
    platforms: typeof platforms === "string" ? platforms : null,
    genres: typeof genres === "string" ? genres : null,
    release_date: raw?.release_date ?? raw?.released ?? null,
    cover_url:
      raw?.cover_url ??
      raw?.background_image ??
      raw?.cover ??
      raw?.image ??
      null,
    description:
      raw?.description ??
      raw?.description_raw ??
      raw?.descriptionRaw ??
      null,

    metacritic: raw?.metacritic ?? null,
    website: raw?.website ?? null,
    reddit_url: raw?.reddit_url ?? raw?.reddit ?? null,
    playtime: raw?.playtime ?? null,
    esrb: raw?.esrb_rating?.name ?? raw?.esrb ?? null,
  };
}

/**
 * Garante que o jogo existe na tabela games e devolve o game_id.
 * Cria o jogo via RAWG se não existir.
 */
async function ensureGameInLocalDb(conn, externalId) {
  const ext = Number(externalId);

  const [found] = await conn.query(
    "SELECT id FROM games WHERE external_id = ? LIMIT 1",
    [ext]
  );
  if (found.length) return found[0].id;

  const details = await externalGamesService.getGameDetails(ext);
  const g = normalizeGameForDb(details, ext);

  // tenta schema mais completo primeiro
  try {
    await conn.query(
      `INSERT INTO games (rawg_id, source, external_id, title, slug, platforms, genres, release_date, cover_url, description)
       VALUES (?, 'rawg', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        g.rawg_id,
        g.external_id,
        g.title,
        g.slug,
        g.platforms,
        g.genres,
        g.release_date,
        g.cover_url,
        detectedStringOrNull(g.description),
      ]
    );
  } catch (err) {
    // schema sem rawg_id/source
    if (err?.code === "ER_BAD_FIELD_ERROR") {
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
            detectedStringOrNull(g.description),
          ]
        );
      } catch (err2) {
        // schema antigo: platform/genre
        if (err2?.code === "ER_BAD_FIELD_ERROR") {
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
              detectedStringOrNull(g.description),
            ]
          );
        } else {
          throw err2;
        }
      }
    } else {
      throw err;
    }
  }

  const [again] = await conn.query(
    "SELECT id FROM games WHERE external_id = ? LIMIT 1",
    [ext]
  );
  if (!again.length) throw new Error("Falhou a criação do jogo na BD.");
  return again[0].id;
}

function detectedStringOrNull(v) {
  if (typeof v === "string") return v;
  if (v == null) return null;
  // às vezes vem HTML/object
  try {
    return String(v);
  } catch {
    return null;
  }
}

/**
 * GET /external-games/search?q=...&page=1
 */
async function searchExternalGames(req, res) {
  try {
    const query = String(req.query.query || req.query.q || "").trim();
    const page = Number(req.query.page || 1);

    if (!query) return res.status(400).json({ mensagem: "Falta o parâmetro query." });

    const jogos = await externalGamesService.searchGames(query, page);
    return res.json({ jogos });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ mensagem: "Falhou a pesquisa na RAWG." });
  }
}

/**
 * GET /external-games/:externalId
 * frontend espera { jogo: ... }
 */
async function getExternalGameDetails(req, res) {
  try {
    const { externalId } = req.params;
    const jogo = await externalGamesService.getGameDetails(externalId);
    return res.json({ jogo });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ mensagem: "Falhou ao carregar detalhes do jogo." });
  }
}

/**
 * POST /external-games/import/collection
 */
async function importExternalToCollection(req, res) {
  const userId = req.userId;
  const { external_id, rating, hours_played, status, notes } = req.body || {};

  if (!external_id) return res.status(400).json({ mensagem: "external_id é obrigatório." });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const gameId = await ensureGameInLocalDb(conn, external_id);

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
      [userId, gameId, rating ?? null, hours_played ?? 0, status ?? "por_jogar", notes ?? null]
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
    if (e?.code === "ER_DUP_ENTRY") return res.status(409).json({ mensagem: "Já está na tua coleção." });
    return res.status(500).json({ mensagem: "Falhou ao adicionar à coleção." });
  } finally {
    conn.release();
  }
}

/**
 * POST /external-games/import/wishlist
 */
async function importExternalToWishlist(req, res) {
  const userId = req.userId;
  const { external_id } = req.body || {};

  if (!external_id) return res.status(400).json({ mensagem: "external_id é obrigatório." });

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
    if (e?.code === "ER_DUP_ENTRY") return res.status(409).json({ mensagem: "Já está na tua wishlist." });
    return res.status(500).json({ mensagem: "Falhou ao adicionar à wishlist." });
  } finally {
    conn.release();
  }
}

/**
 * Tenta obter o nome real de um jogo Steam via Steam Store API
 */
async function getRealSteamGameName(steamAppid) {
  const appid = Number(steamAppid);
  if (!appid) return null;

  try {
    const storeRes = await axios.get(
      `https://store.steampowered.com/api/appdetails?appids=${appid}`,
      { timeout: 5000 }
    );
    const data = storeRes.data[appid];
    if (data && data.success && data.data && data.data.name) {
      return data.data.name;
    }
  } catch (e) {
    console.error(`Erro ao obter nome Steam para appid ${appid}:`, e.message);
  }
  return null;
}

/**
 * ✅ POST /external-games/link-rawg
 * body: { game_id }  (ou { wishlist_entry_id })
 *
 * - se o jogo já tiver external_id/rawg_id, devolve logo
 * - se não tiver, pesquisa RAWG pelo title e grava no games
 * - se for jogo Steam com nome "Steam Game XXXXX", primeiro tenta obter nome real da Steam
 */
async function linkRawg(req, res) {
  const { game_id, wishlist_entry_id } = req.body || {};

  if (!game_id && !wishlist_entry_id) {
    return res.status(400).json({ mensagem: "Falta game_id ou wishlist_entry_id." });
  }

  const conn = await pool.getConnection();
  try {
    // 1) ir buscar o jogo local (incluindo steam_appid)
    let rows;

    if (game_id) {
      [rows] = await conn.query(
        "SELECT id, title, rawg_id, external_id, steam_appid FROM games WHERE id = ? LIMIT 1",
        [Number(game_id)]
      );
    } else {
      // via wishlist entry
      [rows] = await conn.query(
        `SELECT g.id, g.title, g.rawg_id, g.external_id, g.steam_appid
         FROM wishlist_entries w
         JOIN games g ON g.id = w.game_id
         WHERE w.id = ? LIMIT 1`,
        [Number(wishlist_entry_id)]
      );
    }

    if (!rows || !rows.length) {
      return res.status(404).json({ mensagem: "Jogo local não encontrado." });
    }

    const game = rows[0];

    // 2) já ligado?
    const already = Number(game.external_id || game.rawg_id);
    if (already) {
      return res.json({ external_id: already, rawg_id: already, linked: true });
    }

    let title = String(game.title || "").trim();
    
    // 3) Se for jogo Steam com nome genérico, tenta obter nome real da Steam Store API
    const isSteamGenericName = /^Steam Game \d+$/i.test(title);
    if (game.steam_appid && isSteamGenericName) {
      const realName = await getRealSteamGameName(game.steam_appid);
      if (realName) {
        title = realName;
        // Atualizar o título na BD também
        try {
          await conn.query(
            "UPDATE games SET title = ?, slug = ? WHERE id = ?",
            [realName, realName.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, ""), game.id]
          );
        } catch (e) {
          console.error("Erro ao atualizar título:", e.message);
        }
      }
    }
    
    if (!title) {
      return res.status(400).json({ mensagem: "Este jogo não tem título para pesquisar na RAWG." });
    }

    // 4) pesquisar na RAWG pelo título
    const results = await externalGamesService.searchGames(title, 1);
    const list = Array.isArray(results) ? results : [];
    
    // Tentar encontrar match exato primeiro
    const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const target = norm(title);
    const exactMatch = list.find((g) => norm(g.title || g.name) === target);
    const first = exactMatch || list[0] || null;

    const rawgId = Number(first?.id || first?.external_id || 0);
    if (!rawgId) {
      return res.status(404).json({
        mensagem: "Não encontrei match na RAWG para este título. Tenta outro nome.",
      });
    }

    // 5) gravar no games
    // tenta com rawg_id + external_id
    try {
      await conn.query(
        "UPDATE games SET rawg_id = ?, external_id = ?, source = COALESCE(source,'rawg') WHERE id = ?",
        [rawgId, rawgId, game.id]
      );
    } catch (e) {
      // se não existir rawg_id na tua tabela
      if (e?.code === "ER_BAD_FIELD_ERROR") {
        await conn.query(
          "UPDATE games SET external_id = ?, source = COALESCE(source,'rawg') WHERE id = ?",
          [rawgId, game.id]
        );
      } else {
        throw e;
      }
    }

    return res.json({ external_id: rawgId, rawg_id: rawgId, linked: true });
  } catch (e) {
    console.error("linkRawg error:", e);
    return res.status(500).json({ mensagem: "Falhou a ligação à RAWG." });
  } finally {
    conn.release();
  }
}

module.exports = {
  searchExternalGames,
  getExternalGameDetails,
  importExternalToCollection,
  importExternalToWishlist,
  linkRawg, // ✅ IMPORTANTE
};
