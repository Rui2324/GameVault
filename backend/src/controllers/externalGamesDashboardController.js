// backend/src/controllers/externalGamesDashboardController.js
const axios = require("axios");

const RAWG_BASE = "https://api.rawg.io/api";

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function mapGame(g) {
  if (!g) return null;

  return {
    external_id: g.id,
    id: g.id,
    title: g.name,
    name: g.name,
    released: g.released || null,
    release_date: g.released || null,

    // imagens
    background_image: g.background_image || null,
    cover_url: g.background_image || null,

    // extras (às vezes o front também usa isto)
    metacritic: g.metacritic ?? null,
    playtime: g.playtime ?? null,

    // listas “flat” para chips
    platforms: Array.isArray(g.platforms)
      ? g.platforms.map((p) => p?.platform?.name).filter(Boolean).join(", ")
      : "",
    genres: Array.isArray(g.genres)
      ? g.genres.map((x) => x?.name).filter(Boolean).join(", ")
      : "",
  };
}

async function rawgGet(path, params = {}) {
  const key = process.env.RAWG_API_KEY || process.env.RAWG_KEY;

  if (!key) {
    // sem key: não rebenta o dashboard, só devolve vazio
    return { results: [] };
  }

  const res = await axios.get(`${RAWG_BASE}${path}`, {
    params: { key, ...params },
    timeout: 12000,
  });

  return res.data;
}

function okList(res, jogos, meta = {}) {
  return res.json({ jogos, ...meta });
}

// GET /external-games/featured
exports.featured = async (req, res) => {
  try {
    const page_size = Number(req.query.page_size || 6);

    const data = await rawgGet("/games", {
      ordering: "-metacritic",
      page_size,
    });

    const jogos = (data.results || []).map(mapGame).filter(Boolean);
    return okList(res, jogos);
  } catch (e) {
    console.error("[external-games/featured]", e?.response?.data || e?.message || e);
    return okList(res, [], { warning: "RAWG falhou (featured)" });
  }
};

// GET /external-games/upcoming
exports.upcoming = async (req, res) => {
  try {
    const page_size = Number(req.query.page_size || 6);

    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 180);

    const data = await rawgGet("/games", {
      dates: `${isoDate(from)},${isoDate(to)}`,
      ordering: "-added",
      page_size,
    });

    const jogos = (data.results || []).map(mapGame).filter(Boolean);
    return okList(res, jogos);
  } catch (e) {
    console.error("[external-games/upcoming]", e?.response?.data || e?.message || e);
    return okList(res, [], { warning: "RAWG falhou (upcoming)" });
  }
};

// GET /external-games/releases
exports.releases = async (req, res) => {
  try {
    const page_size = Number(req.query.page_size || 6);

    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 120);

    const data = await rawgGet("/games", {
      dates: `${isoDate(from)},${isoDate(to)}`,
      ordering: "-released",
      page_size,
    });

    const jogos = (data.results || []).map(mapGame).filter(Boolean);
    return okList(res, jogos);
  } catch (e) {
    console.error("[external-games/releases]", e?.response?.data || e?.message || e);
    return okList(res, [], { warning: "RAWG falhou (releases)" });
  }
};

// GET /external-games/list (fallback genérico)
exports.list = async (req, res) => {
  try {
    const page_size = Number(req.query.page_size || 12);
    const ordering = req.query.ordering || "-added";

    const data = await rawgGet("/games", {
      ordering,
      page_size,
    });

    const jogos = (data.results || []).map(mapGame).filter(Boolean);
    return okList(res, jogos);
  } catch (e) {
    console.error("[external-games/list]", e?.response?.data || e?.message || e);
    return okList(res, [], { warning: "RAWG falhou (list)" });
  }
};
