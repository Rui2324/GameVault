// src/controllers/collectionController.js
const {
  addToCollection,
  listCollectionForUser,
  updateCollectionEntry,
  removeFromCollection,
  getCollectionEntryById,
  getCollectionEntryByGameId,
} = require("../models/collectionModel");
const { getGameById } = require("../models/gameModel");

// GET /api/collection
async function listMyCollection(req, res) {
  try {
    const userId = req.userId;
    const entries = await listCollectionForUser(userId);

    const colecao = entries.map((e) => ({
      id: e.id,
      jogo_id: e.game_id,
      rating: e.rating,
      horas_jogadas: e.hours_played,
      estado: e.status,
      notas: e.notes,
      titulo: e.title,
      plataforma: e.platform,
      genero: e.genre,
      url_capa: e.cover_url,
    }));

    return res.json({ colecao });
  } catch (err) {
    console.error("Erro ao listar coleção:", err);
    return res
      .status(500)
      .json({ mensagem: "Ocorreu um erro interno ao listar a coleção." });
  }
}

// GET /api/collection/:id  → detalhes de uma entrada
async function getMyCollectionEntry(req, res) {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const entry = await getCollectionEntryById(id, userId);
    if (!entry) {
      return res
        .status(404)
        .json({ mensagem: "Entrada da coleção não encontrada." });
    }

    const resposta = {
      id: entry.id,
      game_id: entry.game_id,
      jogo_id: entry.game_id,
      rating: entry.rating,
      horas_jogadas: entry.hours_played,
      estado: entry.status,
      notas: entry.notes,
      titulo: entry.title,
      plataforma: entry.platform,
      genero: entry.genre,
      url_capa: entry.cover_url,
      descricao: entry.description,
      criado_em: entry.created_at,
      atualizado_em: entry.updated_at,
    };

    return res.json({ entrada: resposta });
  } catch (err) {
    console.error("Erro ao obter detalhes da coleção:", err);
    return res.status(500).json({
      mensagem: "Ocorreu um erro interno ao obter os detalhes do jogo.",
    });
  }
}

// POST /api/collection
async function addToMyCollection(req, res) {
  try {
    const userId = req.userId;
    const { jogo_id, rating, horas_jogadas, estado, notas } = req.body;

    if (!jogo_id) {
      return res
        .status(400)
        .json({ mensagem: "O campo 'jogo_id' é obrigatório." });
    }

    const game = await getGameById(jogo_id);
    if (!game) {
      return res.status(404).json({ mensagem: "O jogo indicado não existe." });
    }

    const entry = await addToCollection({
      user_id: userId,
      game_id: jogo_id,
      rating,
      hours_played: horas_jogadas,
      status: estado || "por_jogar",
      notes: notas,
    });

    const resposta = {
      id: entry.id,
      jogo_id: entry.game_id,
      rating: entry.rating,
      horas_jogadas: entry.hours_played,
      estado: entry.status,
      notas: entry.notes,
      titulo: entry.title,
      plataforma: entry.platform,
      genero: entry.genre,
      url_capa: entry.cover_url,
      descricao: entry.description,
      criado_em: entry.created_at,
      atualizado_em: entry.updated_at,
    };

    return res.status(201).json({ entrada: resposta });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        mensagem: "Este jogo já foi adicionado à tua coleção.",
      });
    }

    console.error("Erro ao adicionar à coleção:", err);
    return res.status(500).json({
      mensagem: "Ocorreu um erro interno ao adicionar o jogo à coleção.",
    });
  }
}

// PUT /api/collection/:id
async function updateMyCollectionEntry(req, res) {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { rating, horas_jogadas, estado, notas } = req.body;

    const updated = await updateCollectionEntry(id, userId, {
      rating,
      hours_played: horas_jogadas,
      status: estado,
      notes: notas,
    });

    if (!updated) {
      return res
        .status(404)
        .json({ mensagem: "Entrada da coleção não encontrada." });
    }

    const resposta = {
      id: updated.id,
      jogo_id: updated.game_id,
      rating: updated.rating,
      horas_jogadas: updated.hours_played,
      estado: updated.status,
      notas: updated.notes,
      titulo: updated.title,
      plataforma: updated.platform,
      genero: updated.genre,
      url_capa: updated.cover_url,
      descricao: updated.description,
      criado_em: updated.created_at,
      atualizado_em: updated.updated_at,
    };

    return res.json({ entrada: resposta });
  } catch (err) {
    console.error("Erro ao atualizar coleção:", err);
    return res.status(500).json({
      mensagem: "Ocorreu um erro interno ao atualizar a coleção.",
    });
  }
}

// DELETE /api/collection/:id
async function removeMyCollectionEntry(req, res) {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const ok = await removeFromCollection(id, userId);
    if (!ok) {
      return res
        .status(404)
        .json({ mensagem: "Entrada da coleção não encontrada." });
    }

    return res.status(204).send();
  } catch (err) {
    console.error("Erro ao remover da coleção:", err);
    return res.status(500).json({
      mensagem: "Ocorreu um erro interno ao remover o jogo da coleção.",
    });
  }
}

// GET /api/collection/by-game/:gameId - Obter entrada pelo game_id
async function getMyCollectionEntryByGameId(req, res) {
  try {
    const userId = req.userId;
    const { gameId } = req.params;

    const entry = await getCollectionEntryByGameId(gameId, userId);
    if (!entry) {
      return res
        .status(404)
        .json({ mensagem: "Jogo não encontrado na tua coleção." });
    }

    const resposta = {
      id: entry.id,
      game_id: entry.game_id,
      jogo_id: entry.game_id,
      rating: entry.rating,
      horas_jogadas: entry.hours_played,
      estado: entry.status,
      notas: entry.notes,
      titulo: entry.title,
      plataforma: entry.platform,
      genero: entry.genre,
      url_capa: entry.cover_url,
      descricao: entry.description,
      criado_em: entry.created_at,
      atualizado_em: entry.updated_at,
    };

    return res.json({ entrada: resposta });
  } catch (err) {
    console.error("Erro ao obter detalhes por game_id:", err);
    return res.status(500).json({
      mensagem: "Ocorreu um erro interno ao obter os detalhes do jogo.",
    });
  }
}

module.exports = {
  listMyCollection,
  getMyCollectionEntry,
  getMyCollectionEntryByGameId,
  addToMyCollection,
  updateMyCollectionEntry,
  removeMyCollectionEntry,
};