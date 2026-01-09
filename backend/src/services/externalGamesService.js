// src/services/externalGamesService.js
const axios = require("axios");

const RAWG_BASE_URL = process.env.RAWG_BASE_URL || "https://api.rawg.io/api";
const RAWG_API_KEY = process.env.RAWG_API_KEY;

if (!RAWG_API_KEY) {
  console.warn(
    "[RAWG] RAWG_API_KEY não está definido no .env. As chamadas à API externa vão falhar."
  );
}

// Normaliza um jogo vindo do RAWG para o formato que queremos
function mapRawgGame(game) {
  return {
    external_id: game.id,
    title: game.name,
    slug: game.slug,
    platforms:
      game.platforms?.map((p) => p.platform.name).join(", ") || null,
    genres: game.genres?.map((g) => g.name).join(", ") || null,
    release_date: game.released || null,
    cover_url: game.background_image || null,
    description:
      game.description_raw?.slice(0, 1000) || null, // limitamos um bocado
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

// Buscar detalhes completos de um jogo específico
async function getGameDetails(externalId) {
  const res = await axios.get(`${RAWG_BASE_URL}/games/${externalId}`, {
    params: {
      key: RAWG_API_KEY,
    },
  });

  return mapRawgGame(res.data);
}

module.exports = {
  searchGames,
  getGameDetails,
};
