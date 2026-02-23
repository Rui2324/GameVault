const axios = require("axios");

const RAWG_BASE_URL = process.env.RAWG_BASE_URL || "https://api.rawg.io/api";
const RAWG_API_KEY = process.env.RAWG_API_KEY;

if (!RAWG_API_KEY) {
  console.warn(
    "[RAWG] RAWG_API_KEY não está definido no .env. As chamadas à API externa vão falhar."
  );
}

function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

// Mapeia resposta do RAWG para formato mais simples usado no frontend
function mapRawgGame(game) {
  return {
    external_id: game.id,
    title: game.name,
    slug: game.slug,

    platforms: game.platforms?.map((p) => p.platform.name).join(", ") || null,
    genres: game.genres?.map((g) => g.name).join(", ") || null,

    release_date: game.released || null,

    cover_url: game.background_image || null,
    background_image: game.background_image || null,
    background_image_additional: game.background_image_additional || null,

    metacritic: game.metacritic ?? null,
    playtime: game.playtime ?? null,

    esrb: game.esrb_rating?.name || null,
    website: game.website || null,
    reddit_url: game.reddit_url || null,

    description: game.description_raw?.slice(0, 2000) || null,

    tags: Array.isArray(game.tags) ? game.tags.map((t) => t?.name).filter(Boolean) : null,
    developers: Array.isArray(game.developers)
      ? game.developers.map((d) => d?.name).filter(Boolean)
      : null,
    publishers: Array.isArray(game.publishers)
      ? game.publishers.map((p) => p?.name).filter(Boolean)
      : null,

    screenshots: Array.isArray(game.short_screenshots)
      ? game.short_screenshots.map((s) => s?.image).filter(Boolean)
      : null,
  };
}

// Procurar jogos por nome
async function searchGames(query, page = 1) {
  const res = await axios.get(`${RAWG_BASE_URL}/games`, {
    params: {
      key: RAWG_API_KEY,
      search: query,
      page,
      page_size: 12,
    },
  });

  const results = res.data.results || [];
  return results.map(mapRawgGame);
}

// Buscar screenshots de um jogo específico
async function getGameScreenshots(externalId) {
  try {
    const res = await axios.get(`${RAWG_BASE_URL}/games/${externalId}/screenshots`, {
      params: {
        key: RAWG_API_KEY,
        page_size: 10,
      },
    });

    const results = res.data.results || [];
    return results.map((s) => s.image).filter(Boolean);
  } catch (error) {
    console.error(`[RAWG] Erro ao buscar screenshots para ${externalId}:`, error.message);
    return [];
  }
}

// Buscar links das lojas de um jogo específico
async function getGameStores(externalId) {
  try {
    const res = await axios.get(`${RAWG_BASE_URL}/games/${externalId}/stores`, {
      params: {
        key: RAWG_API_KEY,
      },
    });

    const results = res.data.results || [];
    return results.map((s) => ({
      store_id: s.store_id,
      url: s.url,
    })).filter((s) => s.url);
  } catch (error) {
    console.error(`[RAWG] Erro ao buscar stores para ${externalId}:`, error.message);
    return [];
  }
}

// Buscar trailers/movies de um jogo específico
async function getGameMovies(externalId) {
  try {
    const res = await axios.get(`${RAWG_BASE_URL}/games/${externalId}/movies`, {
      params: {
        key: RAWG_API_KEY,
      },
    });

    const results = res.data.results || [];
    return results.map((m) => ({
      id: m.id,
      name: m.name,
      preview: m.preview, // imagem de preview
      video_low: m.data?.["480"] || null,
      video_max: m.data?.max || null,
    })).filter((m) => m.video_max || m.video_low);
  } catch (error) {
    console.error(`[RAWG] Erro ao buscar movies para ${externalId}:`, error.message);
    return [];
  }
}

// Buscar detalhes completos de um jogo específico
async function getGameDetails(externalId) {
  // Buscar detalhes, screenshots, stores e movies em paralelo
  const [detailsRes, screenshots, stores, movies] = await Promise.all([
    axios.get(`${RAWG_BASE_URL}/games/${externalId}`, {
      params: {
        key: RAWG_API_KEY,
      },
    }),
    getGameScreenshots(externalId),
    getGameStores(externalId),
    getGameMovies(externalId),
  ]);

  const game = mapRawgGame(detailsRes.data);
  
  // Adicionar screenshots, stores e movies ao resultado
  game.screenshots = screenshots.length > 0 ? screenshots : game.screenshots;
  game.stores = stores;
  game.movies = movies;
  
  return game;
}

// Destaca jogos (ex: para dashboard) - ordenados por metacritic
async function getFeaturedGames(page = 1, pageSize = 6) {
  const res = await axios.get(`${RAWG_BASE_URL}/games`, {
    params: {
      key: RAWG_API_KEY,
      ordering: "-metacritic",
      page,
      page_size: pageSize,
    },
  });

  const results = res.data.results || [];
  return results.filter((g) => !!g.background_image).map(mapRawgGame);
}

// Próximos lançamentos (próximos ~6 meses)
async function getUpcomingGames(page = 1, pageSize = 6) {
  const from = new Date();
  const to = new Date();
  to.setDate(to.getDate() + 180);

  const res = await axios.get(`${RAWG_BASE_URL}/games`, {
    params: {
      key: RAWG_API_KEY,
      dates: `${toISODate(from)},${toISODate(to)}`,
      ordering: "released",
      page,
      page_size: pageSize,
    },
  });

  const results = res.data.results || [];
  return results.filter((g) => !!g.background_image).map(mapRawgGame);
}

module.exports = {
  searchGames,
  getGameDetails,
  getGameScreenshots,
  getGameStores,
  getGameMovies,
  getFeaturedGames,
  getUpcomingGames,
};
