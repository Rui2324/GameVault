// src/controllers/gameController.js
const {
  createGame,
  listAllGames,
} = require("../models/gameModel");

// gera um slug técnico a partir do título (ninguém vê isto)
function slugify(titulo) {
  return titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// POST /api/jogos  (a rota ainda está /api/games, já te explico em baixo se quiseres mudar)
async function createGameHandler(req, res) {
  try {
    const {
      titulo,
      plataforma,
      genero,
      data_lancamento,
      url_capa,
      descricao,
    } = req.body;

    if (!titulo) {
      return res.status(400).json({ mensagem: "O título é obrigatório." });
    }

    const slug = slugify(titulo + "-" + (plataforma || ""));

    const game = await createGame({
      title: titulo,                // mapeia para o campo técnico
      platform: plataforma,
      genre: genero,
      release_date: data_lancamento || null,
      cover_url: url_capa,
      description: descricao,
      slug,
    });

    // resposta em PT
    return res.status(201).json({
      jogo: {
        id: game.id,
        titulo,
        plataforma,
        genero,
        data_lancamento,
        url_capa,
        descricao,
      },
    });
  } catch (err) {
    console.error("Erro ao criar jogo:", err);
    return res
      .status(500)
      .json({ mensagem: "Ocorreu um erro interno ao criar o jogo." });
  }
}

// GET /api/games  (lista todos os jogos, resposta em PT)
async function listGamesHandler(req, res) {
  try {
    const games = await listAllGames();

    const jogos = games.map((g) => ({
      id: g.id,
      titulo: g.title,
      plataforma: g.platform,
      genero: g.genre,
      data_lancamento: g.release_date,
      url_capa: g.cover_url,
      descricao: g.description,
    }));

    return res.json({ jogos });
  } catch (err) {
    console.error("Erro ao listar jogos:", err);
    return res
      .status(500)
      .json({ mensagem: "Ocorreu um erro interno ao listar os jogos." });
  }
}

module.exports = {
  createGameHandler,
  listGamesHandler,
};
