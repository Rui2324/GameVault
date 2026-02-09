// backend/src/controllers/steamController.js
const axios = require("axios");
const pool = require("../config/db");
const steamAchievementsService = require("../services/steamAchievementsService");
const collectionModel = require("../models/collectionModel");
const externalGamesService = require("../services/externalGamesService");

const STEAM_KEY = process.env.STEAM_API_KEY;

// --- FUNÇÕES AUXILIARES ---

function createSlug(title) {
  return (title || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function resolveSteamId(input) {
  if (/^\d{17}$/.test(input)) return input;

  try {
    const res = await axios.get(
      `http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/`,
      { params: { key: STEAM_KEY, vanityurl: input } }
    );
    return res.data.response.success === 1 ? res.data.response.steamid : null;
  } catch (err) {
    console.error("Erro Steam Resolve:", err.message);
    return null;
  }
}

// Tenta mapear um título Steam para um id da RAWG (best effort).
// Devolve { id, cover_url, platforms, genres } ou null se não encontrar.
async function findRawgByTitle(title) {
  const q = String(title || "").trim();
  if (!q) return null;

  try {
    const results = await externalGamesService.searchGames(q, 1);
    const list = Array.isArray(results) ? results : [];
    if (!list.length) return null;

    // tenta match mais exato pelo nome (case-insensitive) antes do 1º
    const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const target = norm(q);
    const exact = list.find((g) => norm(g.title || g.name) === target);
    const best = exact || list[0];

    return {
      id: best?.external_id || best?.id || null,
      cover_url: best?.cover_url || best?.background_image || null,
      platforms: best?.platforms || null,
      genres: best?.genres || null
    };
  } catch (e) {
    return null;
  }
}

// Wrapper para manter compatibilidade
async function findRawgIdByTitle(title) {
  const result = await findRawgByTitle(title);
  return result?.id || null;
}

/**
 * ✅ Garante que existe game na BD com steam_appid.
 *
 * REGRAS IMPORTANTES:
 * - NÃO meter rawg_id nem external_id com appid da steam.
 * - rawg_id/external_id só vêm da RAWG.
 */
async function ensureSteamGame(conn, { steam_appid, title, cover_url }) {
  const appid = Number(steam_appid);
  if (!appid) throw new Error("steam_appid inválido");

  // 1) Já existe por steam_appid?
  const [bySteam] = await conn.query(
    "SELECT id FROM games WHERE steam_appid = ? LIMIT 1",
    [appid]
  );
  if (bySteam.length) return bySteam[0].id;

  // 2) Tenta por slug (para reaproveitar um jogo que já existia da RAWG/manual)
  const slug = createSlug(title || `steam-${appid}`);
  const [bySlug] = await conn.query(
    "SELECT id, steam_appid FROM games WHERE slug = ? LIMIT 1",
    [slug]
  );

  if (bySlug.length) {
    const gameId = bySlug[0].id;

    // Só mete steam_appid se ainda não tiver
    await conn.query(
      `
      UPDATE games
      SET steam_appid = COALESCE(steam_appid, ?),
          source = COALESCE(source, 'steam'),
          cover_url = COALESCE(cover_url, ?),
          updated_at = NOW()
      WHERE id = ?
      `,
      [
        appid,
        cover_url ||
          `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`,
        gameId,
      ]
    );

    return gameId;
  }

  // 3) Não existe: cria novo
  // Tenta buscar plataformas e gêneros da RAWG para enriquecer o jogo
  let platform = "PC";
  let genre = null;
  let rawgId = null;

  const rawgInfo = await findRawgByTitle(title);
  if (rawgInfo) {
    platform = rawgInfo.platforms || "PC";
    genre = rawgInfo.genres || null;
    rawgId = rawgInfo.id || null;
    // Usa cover da RAWG se não tiver cover do Steam
    if (!cover_url && rawgInfo.cover_url) {
      cover_url = rawgInfo.cover_url;
    }
  }

  // ✅ NOTA: external_id/rawg_id ficam preenchidos se encontrou na RAWG.
  const [ins] = await conn.query(
    `
    INSERT INTO games (steam_appid, source, title, slug, platform, genre, cover_url, external_id, rawg_id)
    VALUES (?, 'steam', ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      appid,
      title || `Steam Game ${appid}`,
      slug,
      platform,
      genre,
      cover_url ||
        `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`,
      rawgId,
      rawgId,
    ]
  );

  return ins.insertId;
}

// --- CONTROLADORES ---

// 1) Obter Biblioteca Steam
exports.getSteamLibrary = async (req, res) => {
  const steamUrl = req.query.steamUrl || req.params.steamUrl;

  if (!STEAM_KEY) return res.status(500).json({ mensagem: "Falta a STEAM_API_KEY no .env" });
  if (!steamUrl) return res.status(400).json({ mensagem: "Indica o teu Steam ID ou Username." });

  try {
    const steamId = await resolveSteamId(steamUrl);
    if (!steamId) return res.status(404).json({ mensagem: "Utilizador Steam não encontrado." });

    const response = await axios.get(
      `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/`,
      {
        params: {
          key: STEAM_KEY,
          steamid: steamId,
          include_appinfo: true,
          include_played_free_games: true,
        },
      }
    );

    const games = response.data.response.games || [];

    const formattedGames = games
      .map((g) => ({
        steam_appid: g.appid,
        title: g.name,
        cover_url: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${g.appid}/header.jpg`,
        hours_played: Math.round((g.playtime_forever / 60) * 10) / 10,
      }))
      .sort((a, b) => b.hours_played - a.hours_played);

    return res.json({ steamId, count: formattedGames.length, games: formattedGames });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ mensagem: "Erro ao comunicar com a Steam. O perfil é público?" });
  }
};

// 2) Importar Jogos da Biblioteca + sync conquistas (novos e existentes)
exports.importGames = async (req, res) => {
  const userId = req.userId;
  const { games, steamId, steamid } = req.body;
  const steamid64 = steamId || steamid || null;

  if (!STEAM_KEY) return res.status(500).json({ mensagem: "Falta a STEAM_API_KEY no .env" });
  if (!games || !Array.isArray(games)) return res.status(400).json({ mensagem: "Nenhum jogo enviado." });
  if (!steamid64) return res.status(400).json({ mensagem: "Falta o steamId (steamid64) no body." });

  const conn = await pool.getConnection();
  const entriesParaSync = []; // [{ id, steam_appid }]
  let importados = 0;
  let jaExistiam = 0;

  try {
    await conn.beginTransaction();

    for (const game of games) {
      const steam_appid = Number(game.steam_appid);
      if (!steam_appid) continue;

      const gameId = await ensureSteamGame(conn, {
        steam_appid,
        title: game.title,
        cover_url: game.cover_url,
      });

      const [existingEntry] = await conn.query(
        "SELECT id FROM collection_entries WHERE user_id = ? AND game_id = ? LIMIT 1",
        [userId, gameId]
      );

      if (!existingEntry.length) {
        // Status inicial baseado nas horas jogadas
        // > 0 horas = a_jogar, 0 horas = por_jogar
        // O status será atualizado para "concluido" depois se tiver todas as conquistas
        const hoursPlayed = game.hours_played ?? 0;
        const status = hoursPlayed > 0 ? "a_jogar" : "por_jogar";

        const [ins] = await conn.query(
          `INSERT INTO collection_entries (user_id, game_id, hours_played, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, NOW(), NOW())`,
          [userId, gameId, hoursPlayed, status]
        );

        entriesParaSync.push({ id: ins.insertId, steam_appid });
        importados++;
      } else {
        // Jogo já existe - atualizar horas se forem maiores
        const hoursPlayed = game.hours_played ?? 0;
        if (hoursPlayed > 0) {
          await conn.query(
            `UPDATE collection_entries 
             SET hours_played = GREATEST(hours_played, ?),
                 status = IF(status = 'por_jogar' AND ? > 0, 'a_jogar', status),
                 updated_at = NOW()
             WHERE id = ? AND user_id = ?`,
            [hoursPlayed, hoursPlayed, existingEntry[0].id, userId]
          );
        }
        entriesParaSync.push({ id: existingEntry[0].id, steam_appid });
        jaExistiam++;
      }
    }

    await conn.commit();

    // ✅ Sync das conquistas (atualiza status para "concluido" se 100%)
    let sync = { updated: 0, completed: 0, errors: 0 };
    if (entriesParaSync.length > 0) {
      const results = await steamAchievementsService.syncManyCollectionEntries({
        steamKey: STEAM_KEY,
        steamid: steamid64,
        userId: userId,
        entries: entriesParaSync,
        collectionModel,
        limit: 4,
      });

      sync.updated = results.filter((r) => r && r.updated).length;
      sync.completed = results.filter((r) => r && r.updated && r.completed).length;
      sync.errors = results.filter((r) => r && r.error).length;
    }

    return res.json({
      mensagem: `Import concluído! ${importados} novos jogos adicionados.`,
      jaExistiam,
      achievements: sync,
    });
  } catch (err) {
    await conn.rollback();
    console.error("ERRO IMPORT:", err.sqlMessage || err);
    return res.status(500).json({ mensagem: "Erro ao importar/sincronizar." });
  } finally {
    conn.release();
  }
};

// 3) Obter Wishlist Steam (como tinhas)
exports.getSteamWishlist = async (req, res) => {
  const { steamUrl } = req.query;

  if (!STEAM_KEY) return res.status(500).json({ mensagem: "Falta a STEAM_API_KEY no .env" });
  if (!steamUrl) return res.status(400).json({ mensagem: "Indica o teu Steam ID." });

  try {
    const steamId = await resolveSteamId(steamUrl);
    if (!steamId) return res.status(404).json({ mensagem: "Utilizador Steam não encontrado." });

    let gamesList = [];

    // Endpoint "mágico"
    try {
      const magicRes = await axios.get(
        `https://store.steampowered.com/wishlist/profiles/${steamId}/wishlistdata/`
      );

      if (magicRes.data && typeof magicRes.data === "object" && !Array.isArray(magicRes.data)) {
        gamesList = Object.values(magicRes.data).map((g) => ({
          steam_appid: g.appid || g.id,
          title: g.name,
          cover_url:
            g.header_image ||
            `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${g.appid || g.id}/header.jpg`,
          hours_played: 0,
        }));
      }
    } catch (e) {}

    // API oficial
    if (gamesList.length === 0) {
      try {
        const officialRes = await axios.get(`https://api.steampowered.com/IWishlistService/GetWishlist/v1/`, {
          params: { steamid: steamId, key: STEAM_KEY },
        });

        const items = officialRes.data.response.items || [];
        if (items.length > 0) {
          gamesList = items.map((item) => ({
            steam_appid: item.appid,
            title: `Steam Game ${item.appid}`,
            cover_url: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${item.appid}/header.jpg`,
            hours_played: 0,
          }));
        }
      } catch (officialErr) {}
    }

    if (gamesList.length > 0) {
      return res.json({ steamId, count: gamesList.length, games: gamesList });
    }

    return res.status(400).json({
      mensagem:
        "Não conseguimos ler a Wishlist. Confirma nas Definições de Privacidade da Steam se 'Detalhes dos Jogos' está PÚBLICO.",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ mensagem: "Erro interno ao comunicar com a Steam." });
  }
};

// 4) Importar Wishlist para BD (por steam_appid) ✅ sem rawg_id/external_id
exports.importWishlistToDb = async (req, res) => {
  const userId = req.userId;
  const { games } = req.body;

  if (!STEAM_KEY) return res.status(500).json({ mensagem: "Falta a STEAM_API_KEY no .env" });
  if (!games || !Array.isArray(games)) return res.status(400).json({ mensagem: "Nenhum jogo enviado." });

  const conn = await pool.getConnection();
  let importados = 0;

  try {
    await conn.beginTransaction();

    for (const game of games) {
      const steam_appid = Number(game.steam_appid);
      if (!steam_appid) continue;

      const gameId = await ensureSteamGame(conn, {
        steam_appid,
        title: game.title,
        cover_url: game.cover_url,
      });

      const [wishlistCheck] = await conn.query(
        "SELECT id FROM wishlist_entries WHERE user_id = ? AND game_id = ? LIMIT 1",
        [userId, gameId]
      );

      const [collectionCheck] = await conn.query(
        "SELECT id FROM collection_entries WHERE user_id = ? AND game_id = ? LIMIT 1",
        [userId, gameId]
      );

      if (!wishlistCheck.length && !collectionCheck.length) {
        await conn.query(
          "INSERT INTO wishlist_entries (user_id, game_id) VALUES (?, ?)",
          [userId, gameId]
        );
        importados++;
      }
    }

    await conn.commit();
    return res.json({ mensagem: `Wishlist sincronizada! ${importados} novos jogos adicionados.` });
  } catch (err) {
    await conn.rollback();
    console.error("ERRO IMPORT WISHLIST:", err.sqlMessage || err);
    return res.status(500).json({ mensagem: "Erro ao gravar wishlist." });
  } finally {
    conn.release();
  }
};

// 5) Corrigir Metadados (Nomes e Capas) + ✅ ligar à RAWG (rawg_id/external_id)
// Agora também corrige jogos da wishlist e atualiza capas!
exports.fixMetadata = async (req, res) => {
  const userId = req.userId;
  const conn = await pool.getConnection();

  try {
    // Buscar jogos Steam com nomes genéricos OU sem rawg_id OU com capas da Steam
    // Inclui jogos da coleção E da wishlist do utilizador
    let [gamesToFix] = await conn.query(
      `SELECT DISTINCT g.id, g.steam_appid, g.title, g.cover_url
       FROM games g
       LEFT JOIN collection_entries ce ON ce.game_id = g.id AND ce.user_id = ?
       LEFT JOIN wishlist_entries we ON we.game_id = g.id AND we.user_id = ?
       WHERE g.steam_appid IS NOT NULL 
         AND (
           g.title LIKE 'Steam Game %' 
           OR g.rawg_id IS NULL 
           OR g.external_id IS NULL
           OR g.cover_url LIKE '%steamstatic.com%'
           OR g.cover_url LIKE '%steam/apps%'
         )
         AND (ce.id IS NOT NULL OR we.id IS NOT NULL)
       LIMIT 50`,
      [userId, userId]
    );

    if (gamesToFix.length === 0) {
      return res.json({ mensagem: "Tudo limpo! Não há mais jogos para corrigir." });
    }

    let corrigidos = 0;
    let erros = 0;

    for (const game of gamesToFix) {
      const appid = Number(game.steam_appid);
      if (!appid) continue;

      await new Promise((r) => setTimeout(r, 150));

      const steamCover = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`;

      try {
        const storeRes = await axios.get(
          `https://store.steampowered.com/api/appdetails?appids=${appid}`,
          { timeout: 5000 }
        );
        const data = storeRes.data[appid];

        if (data && data.success && data.data) {
          const realTitle = data.data.name;
          const realSlug = createSlug(realTitle);

          // ✅ ligar à RAWG e obter capa
          const rawgData = await findRawgByTitle(realTitle);
          const rawgId = rawgData?.id || null;
          // Preferir capa da RAWG, senão usa a da Steam
          const coverUrl = rawgData?.cover_url || steamCover;

          await conn.query(
            `UPDATE games
             SET
               title = ?,
               slug = ?,
               cover_url = ?,
               source='steam',
               rawg_id = COALESCE(rawg_id, ?),
               external_id = COALESCE(external_id, ?)
             WHERE id = ?`,
            [realTitle, realSlug, coverUrl, rawgId, rawgId, game.id]
          );
          corrigidos++;
        } else {
          // Jogo não existe na Steam Store (removido ou privado)
          // Tenta só com o título atual na RAWG
          const rawgData = await findRawgByTitle(game.title);
          if (rawgData?.id) {
            const coverUrl = rawgData.cover_url || steamCover;
            await conn.query(
              `UPDATE games
               SET
                 cover_url = ?,
                 source = 'steam',
                 rawg_id = COALESCE(rawg_id, ?),
                 external_id = COALESCE(external_id, ?)
               WHERE id = ?`,
              [coverUrl, rawgData.id, rawgData.id, game.id]
            );
            corrigidos++;
          } else {
            erros++;
          }
        }
      } catch (e) {
        console.error(`Erro ao corrigir jogo ${appid}:`, e.message);
        // Tenta só com a RAWG em caso de erro
        try {
          const rawgData = await findRawgByTitle(game.title);
          if (rawgData?.id) {
            const coverUrl = rawgData.cover_url || steamCover;
            await conn.query(
              `UPDATE games
               SET
                 cover_url = ?,
                 source = 'steam',
                 rawg_id = COALESCE(rawg_id, ?),
                 external_id = COALESCE(external_id, ?)
               WHERE id = ?`,
              [coverUrl, rawgData.id, rawgData.id, game.id]
            );
            corrigidos++;
          } else {
            erros++;
          }
        } catch (e2) {
          erros++;
        }
      }
    }

    const msg = erros > 0 
      ? `${corrigidos} jogos atualizados (${erros} com erro). Dá F5 na página.`
      : `${corrigidos} jogos atualizados! Dá F5 na página.`;
    
    return res.json({ mensagem: msg, corrigidos, erros });
  } catch (err) {
    console.error("Erro fixMetadata:", err.sqlMessage || err);
    return res.status(500).json({ mensagem: "Erro ao corrigir metadados." });
  } finally {
    conn.release();
  }
};
