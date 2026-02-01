// backend/src/services/steamAchievementsService.js
// Sync de conquistas da Steam para a tua tabela collection_entries.

const axios = require("axios");

async function fetchPlayerAchievements({ steamKey, steamid, appid }) {
  const res = await axios.get(
    "https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/",
    {
      params: {
        key: steamKey,
        steamid,
        appid,
        l: "en",
      },
      timeout: 15000,
    }
  );

  const ps = res?.data?.playerstats;

  // Se a Steam não devolver achievements, tratamos como 0/0.
  const ach = Array.isArray(ps?.achievements) ? ps.achievements : [];
  const total = ach.length;
  const unlocked = ach.reduce((acc, a) => acc + (Number(a.achieved) === 1 ? 1 : 0), 0);

  // Só marca concluído se houver conquistas e estiverem todas feitas
  const completed = total > 0 && unlocked === total;

  return { total, unlocked, completed };
}

// Concurrency simples
async function runPool(items, limit, worker) {
  const results = new Array(items.length);
  let i = 0;

  const runners = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) break;
      try {
        results[idx] = await worker(items[idx], idx);
      } catch (e) {
        results[idx] = { error: e?.message || String(e) };
      }
    }
  });

  await Promise.all(runners);
  return results;
}

/**
 * entries: [{ id: collection_entry_id, steam_appid }]
 * collectionModel tem updateAchievements(entryId, userId, { total, unlocked, completed })
 */
async function syncManyCollectionEntries({
  steamKey,
  steamid,
  userId,
  entries,
  collectionModel,
  limit = 4,
}) {
  if (!steamKey || !steamid) return [];
  if (!userId) return [];
  if (!Array.isArray(entries) || entries.length === 0) return [];

  return runPool(entries, limit, async (entry) => {
    const appid = Number(entry.steam_appid);
    const entryId = Number(entry.id);

    if (!appid || !entryId) {
      return { id: entryId, steam_appid: appid, updated: false };
    }

    try {
      const stats = await fetchPlayerAchievements({ steamKey, steamid, appid });

      // ✅ chama o método certo do teu model
      const ok = await collectionModel.updateAchievements(entryId, userId, {
        total: stats.total,
        unlocked: stats.unlocked,
        completed: stats.completed,
      });

      return {
        id: entryId,
        steam_appid: appid,
        updated: Boolean(ok),
        completed: stats.completed,
        total: stats.total,
        unlocked: stats.unlocked,
      };
    } catch (e) {
      return {
        id: entryId,
        steam_appid: appid,
        updated: false,
        error: e?.response?.data || e?.message || String(e),
      };
    }
  });
}

module.exports = {
  syncManyCollectionEntries,
};
