const {
  followUser,
  unfollowUser,
  isFollowing,
  getFollowing,
  getFollowers,
  getFollowCounts,
  getMutualFollows
} = require("../models/followModel");
const pool = require("../config/db");

// POST /api/follows/:userId - Seguir utilizador
async function follow(req, res) {
  try {
    const followerId = req.userId;
    const followingId = parseInt(req.params.userId, 10);

    if (!followingId || isNaN(followingId)) {
      return res.status(400).json({ mensagem: "ID de utilizador inválido" });
    }

    if (followerId === followingId) {
      return res.status(400).json({ mensagem: "Não podes seguir-te a ti próprio" });
    }

    // Verificar se o utilizador existe
    const [users] = await pool.query("SELECT id FROM users WHERE id = ?", [followingId]);
    if (users.length === 0) {
      return res.status(404).json({ mensagem: "Utilizador não encontrado" });
    }

    // Verificar se já segue
    const alreadyFollowing = await isFollowing(followerId, followingId);
    if (alreadyFollowing) {
      return res.status(409).json({ mensagem: "Já segues este utilizador" });
    }

    await followUser(followerId, followingId);

    return res.status(201).json({ mensagem: "Agora estás a seguir este utilizador" });
  } catch (err) {
    console.error("Erro ao seguir:", err);
    return res.status(500).json({ mensagem: "Erro ao seguir utilizador" });
  }
}

// DELETE /api/follows/:userId - Deixar de seguir
async function unfollow(req, res) {
  try {
    const followerId = req.userId;
    const followingId = parseInt(req.params.userId, 10);

    if (!followingId || isNaN(followingId)) {
      return res.status(400).json({ mensagem: "ID de utilizador inválido" });
    }

    const removed = await unfollowUser(followerId, followingId);
    
    if (!removed) {
      return res.status(404).json({ mensagem: "Não estavas a seguir este utilizador" });
    }

    return res.status(200).json({ mensagem: "Deixaste de seguir este utilizador" });
  } catch (err) {
    console.error("Erro ao deixar de seguir:", err);
    return res.status(500).json({ mensagem: "Erro ao deixar de seguir" });
  }
}

// GET /api/follows/check/:userId - Verificar se estou a seguir
async function checkFollowing(req, res) {
  try {
    const followerId = req.userId;
    const followingId = parseInt(req.params.userId, 10);

    if (!followingId || isNaN(followingId)) {
      return res.status(400).json({ mensagem: "ID de utilizador inválido" });
    }

    const following = await isFollowing(followerId, followingId);

    return res.json({ isFollowing: following });
  } catch (err) {
    console.error("Erro ao verificar follow:", err);
    return res.status(500).json({ mensagem: "Erro ao verificar" });
  }
}

// GET /api/follows/following - Quem eu sigo
async function myFollowing(req, res) {
  try {
    const userId = req.userId;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const offset = parseInt(req.query.offset, 10) || 0;

    const following = await getFollowing(userId, limit, offset);
    const counts = await getFollowCounts(userId);

    return res.json({ 
      following,
      total: counts.following 
    });
  } catch (err) {
    console.error("Erro ao obter following:", err);
    return res.status(500).json({ mensagem: "Erro ao obter lista" });
  }
}

// GET /api/follows/followers - Meus seguidores
async function myFollowers(req, res) {
  try {
    const userId = req.userId;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const offset = parseInt(req.query.offset, 10) || 0;

    const followers = await getFollowers(userId, limit, offset);
    const counts = await getFollowCounts(userId);

    return res.json({ 
      followers,
      total: counts.followers 
    });
  } catch (err) {
    console.error("Erro ao obter followers:", err);
    return res.status(500).json({ mensagem: "Erro ao obter lista" });
  }
}

// GET /api/follows/user/:userId/following - Quem um utilizador segue (público)
async function userFollowing(req, res) {
  try {
    const userId = parseInt(req.params.userId, 10);
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const offset = parseInt(req.query.offset, 10) || 0;

    const following = await getFollowing(userId, limit, offset);
    const counts = await getFollowCounts(userId);

    return res.json({ 
      following,
      total: counts.following 
    });
  } catch (err) {
    console.error("Erro ao obter following:", err);
    return res.status(500).json({ mensagem: "Erro ao obter lista" });
  }
}

// GET /api/follows/user/:userId/followers - Seguidores de um utilizador (público)
async function userFollowers(req, res) {
  try {
    const userId = parseInt(req.params.userId, 10);
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const offset = parseInt(req.query.offset, 10) || 0;

    const followers = await getFollowers(userId, limit, offset);
    const counts = await getFollowCounts(userId);

    return res.json({ 
      followers,
      total: counts.followers 
    });
  } catch (err) {
    console.error("Erro ao obter followers:", err);
    return res.status(500).json({ mensagem: "Erro ao obter lista" });
  }
}

// GET /api/follows/user/:userId/counts - Contagens de um utilizador
async function userCounts(req, res) {
  try {
    const userId = parseInt(req.params.userId, 10);
    const counts = await getFollowCounts(userId);

    return res.json(counts);
  } catch (err) {
    console.error("Erro ao obter contagens:", err);
    return res.status(500).json({ mensagem: "Erro ao obter contagens" });
  }
}

// GET /api/follows/mutuals - Amigos mútuos
async function mutuals(req, res) {
  try {
    const userId = req.userId;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

    const mutualFollows = await getMutualFollows(userId, limit);

    return res.json({ mutuals: mutualFollows });
  } catch (err) {
    console.error("Erro ao obter mútuos:", err);
    return res.status(500).json({ mensagem: "Erro ao obter amigos mútuos" });
  }
}

module.exports = {
  follow,
  unfollow,
  checkFollowing,
  myFollowing,
  myFollowers,
  userFollowing,
  userFollowers,
  userCounts,
  mutuals
};
