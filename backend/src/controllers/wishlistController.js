const wishlistModel = require("../models/wishlistModel");

// GET /api/wishlist
async function listarWishlist(req, res) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ mensagem: "Não autenticado." });
    }

    const wishlist = await wishlistModel.listarWishlistPorUtilizador(userId);
    return res.json({ wishlist });
  } catch (err) {
    console.error("ERRO listarWishlist:", err.sqlMessage || err);
    return res.status(500).json({ mensagem: "Erro ao carregar wishlist." });
  }
}

// POST /api/wishlist
async function adicionarWishlist(req, res) {
  try {
    const userId = req.userId;
    const { jogo_id } = req.body;

    if (!userId) return res.status(401).json({ mensagem: "Não autenticado." });
    if (!jogo_id) return res.status(400).json({ mensagem: "Falta jogo_id." });

    const item = await wishlistModel.adicionarWishlist(userId, jogo_id);
    return res.status(201).json({ item });
  } catch (err) {
    console.error("ERRO adicionarWishlist:", err.sqlMessage || err);

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ mensagem: "Já está na wishlist." });
    }

    return res.status(500).json({ mensagem: "Erro ao adicionar." });
  }
}

// DELETE /api/wishlist/:id
async function removerWishlist(req, res) {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) return res.status(401).json({ mensagem: "Não autenticado." });

    await wishlistModel.removerWishlist(id, userId);
    return res.json({ mensagem: "Removido." });
  } catch (err) {
    console.error("ERRO removerWishlist:", err.sqlMessage || err);
    return res.status(500).json({ mensagem: "Erro ao remover." });
  }
}

module.exports = {
  listarWishlist,
  adicionarWishlist,
  removerWishlist,
};
