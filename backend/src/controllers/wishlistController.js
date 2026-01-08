// src/controllers/wishlistController.js
const {
  listarWishlistPorUtilizador,
  adicionarWishlist: adicionarWishlistModel,
  removerWishlist,
} = require("../models/wishlistModel");

// Lista wishlist do utilizador autenticado
async function listarWishlist(req, res) {
  try {
    // tenta obter o id a partir de vários sítios
    const userId = req.user?.id || req.userId;

    if (!userId) {
      return res
        .status(401)
        .json({ mensagem: "Utilizador não autenticado." });
    }

    const wishlist = await listarWishlistPorUtilizador(userId);
    res.json({ wishlist });
  } catch (err) {
    console.error("Erro a listar wishlist:", err);
    res.status(500).json({ mensagem: "Erro ao listar wishlist." });
  }
}

// Adiciona jogo à wishlist do utilizador autenticado
async function adicionarWishlist(req, res) {
  try {
    const userId = req.user?.id || req.userId;

    if (!userId) {
      return res
        .status(401)
        .json({ mensagem: "Utilizador não autenticado." });
    }

    const { game_id } = req.body;

    if (!game_id) {
      return res
        .status(400)
        .json({ mensagem: "É obrigatório indicar o game_id." });
    }

    const entrada = await adicionarWishlistModel(userId, game_id);
    res.status(201).json({ mensagem: "Jogo adicionado à wishlist.", entrada });
  } catch (err) {
    console.error("Erro a adicionar à wishlist:", err);
    res.status(500).json({ mensagem: "Erro ao adicionar jogo à wishlist." });
  }
}

// Remove entrada da wishlist (só do utilizador autenticado)
async function removerWishlistController(req, res) {
  try {
    const userId = req.user?.id || req.userId;

    if (!userId) {
      return res
        .status(401)
        .json({ mensagem: "Utilizador não autenticado." });
    }

    const { id } = req.params;

    await removerWishlist(id, userId);

    res.json({ mensagem: "Entrada removida da wishlist." });
  } catch (err) {
    console.error("Erro a remover da wishlist:", err);
    res.status(500).json({ mensagem: "Erro ao remover jogo da wishlist." });
  }
}

module.exports = {
  listarWishlist,
  adicionarWishlist,
  removerWishlist: removerWishlistController,
};
