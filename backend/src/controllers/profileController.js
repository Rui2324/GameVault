// src/controllers/profileController.js
const profileModel = require("../models/profileModel");
const achievementModel = require("../models/achievementModel");
const reviewModel = require("../models/reviewModel");

// GET /api/profile/:identifier - Perfil público de um utilizador
async function getPublicProfile(req, res) {
  try {
    const { identifier } = req.params;
    
    const profile = await profileModel.findProfileByNameOrId(identifier);
    
    if (!profile) {
      return res.status(404).json({ mensagem: "Perfil não encontrado." });
    }
    
    // Verificar se o perfil é público ou se é o próprio utilizador
    const isOwner = req.userId && req.userId === profile.id;
    if (!profile.is_public && !isOwner) {
      return res.status(403).json({ mensagem: "Este perfil é privado." });
    }
    
    // Buscar estatísticas
    const stats = await profileModel.getProfileStats(profile.id);
    
    // Calcular nível
    const level = Math.floor(profile.total_xp / 100) + 1;
    
    // Buscar jogos favoritos e recentes (12 cada para mostrar mais)
    const favoriteGames = await profileModel.getFavoriteGames(profile.id, 12);
    const recentGames = await profileModel.getRecentGames(profile.id, 12);
    
    // Buscar conquistas desbloqueadas
    const achievements = await achievementModel.getUnlockedAchievements(profile.id);
    
    // Buscar reviews recentes
    const reviews = await reviewModel.getUserReviews(profile.id, 5, 0);
    
    res.json({
      profile: {
        id: profile.id,
        name: profile.name,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        total_xp: profile.total_xp,
        level,
        member_since: profile.created_at,
        is_public: profile.is_public
      },
      stats,
      favoriteGames,
      recentGames,
      achievements: achievements.slice(0, 10), // Últimas 10
      recentReviews: Array.isArray(reviews) ? reviews : (reviews.reviews || [])
    });
  } catch (err) {
    console.error("Erro ao buscar perfil:", err);
    res.status(500).json({ mensagem: "Erro ao buscar perfil." });
  }
}

// GET /api/profile/:userId/collection - Coleção pública de um utilizador
async function getPublicCollection(req, res) {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0, status } = req.query;
    
    const profile = await profileModel.getPublicProfile(userId);
    
    if (!profile) {
      return res.status(404).json({ mensagem: "Perfil não encontrado." });
    }
    
    const isOwner = req.userId && req.userId === parseInt(userId);
    if (!profile.is_public && !isOwner) {
      return res.status(403).json({ mensagem: "Esta coleção é privada." });
    }
    
    // Buscar coleção com filtro opcional de status
    const pool = require("../config/db");
    let query = `
      SELECT g.id, g.title, g.cover_url, g.external_id, g.release_date,
             ce.rating, ce.hours_played, ce.status, ce.created_at
      FROM collection_entries ce
      JOIN games g ON ce.game_id = g.id
      WHERE ce.user_id = ?
    `;
    const params = [userId];
    
    if (status) {
      query += " AND ce.status = ?";
      params.push(status);
    }
    
    query += " ORDER BY ce.created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));
    
    const [games] = await pool.query(query, params);
    
    // Contar total
    let countQuery = "SELECT COUNT(*) as total FROM collection_entries WHERE user_id = ?";
    const countParams = [userId];
    if (status) {
      countQuery += " AND status = ?";
      countParams.push(status);
    }
    const [countResult] = await pool.query(countQuery, countParams);
    
    res.json({
      games,
      total: countResult[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    console.error("Erro ao buscar coleção pública:", err);
    res.status(500).json({ mensagem: "Erro ao buscar coleção." });
  }
}

// PATCH /api/profile/visibility - Alterar visibilidade do perfil
async function updateVisibility(req, res) {
  try {
    const userId = req.userId;
    const { is_public } = req.body;
    
    if (typeof is_public !== "boolean") {
      return res.status(400).json({ mensagem: "is_public deve ser true ou false." });
    }
    
    await profileModel.updateProfileVisibility(userId, is_public);
    
    res.json({ mensagem: `Perfil agora é ${is_public ? "público" : "privado"}.` });
  } catch (err) {
    console.error("Erro ao atualizar visibilidade:", err);
    res.status(500).json({ mensagem: "Erro ao atualizar visibilidade." });
  }
}

// GET /api/profile/users/discover - Descobrir utilizadores para seguir
async function discoverUsers(req, res) {
  try {
    const currentUserId = req.userId;
    const { limit = 10, search } = req.query;
    
    const pool = require("../config/db");
    
    let query = `
      SELECT 
        u.id, u.name, u.avatar_url, u.bio, u.total_xp,
        (SELECT COUNT(*) FROM collection_entries WHERE user_id = u.id) as total_games,
        (SELECT COUNT(*) FROM reviews WHERE user_id = u.id) as total_reviews,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count
      FROM users u
      WHERE u.is_public = 1
    `;
    const params = [];
    
    // Excluir o próprio utilizador se estiver logado
    if (currentUserId) {
      query += ` AND u.id != ?`;
      params.push(currentUserId);
      
      // Excluir quem já segue
      query += ` AND u.id NOT IN (SELECT following_id FROM follows WHERE follower_id = ?)`;
      params.push(currentUserId);
    }
    
    // Pesquisa por nome
    if (search) {
      query += ` AND u.name LIKE ?`;
      params.push(`%${search}%`);
    }
    
    // Ordenar por atividade (mais jogos + reviews)
    query += ` ORDER BY (total_games + total_reviews) DESC, followers_count DESC LIMIT ?`;
    params.push(parseInt(limit));
    
    const [users] = await pool.query(query, params);
    
    // Calcular nível para cada utilizador
    const usersWithLevel = users.map(u => ({
      ...u,
      level: Math.floor((u.total_xp || 0) / 100) + 1
    }));
    
    res.json({ users: usersWithLevel });
  } catch (err) {
    console.error("Erro ao descobrir utilizadores:", err);
    res.status(500).json({ mensagem: "Erro ao buscar utilizadores." });
  }
}

// GET /api/profile/users/search - Pesquisar utilizadores
async function searchUsers(req, res) {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json({ users: [] });
    }
    
    const pool = require("../config/db");
    
    const [users] = await pool.query(`
      SELECT 
        u.id, u.name, u.avatar_url, u.bio, u.total_xp,
        (SELECT COUNT(*) FROM collection_entries WHERE user_id = u.id) as total_games
      FROM users u
      WHERE u.is_public = 1 AND u.name LIKE ?
      ORDER BY 
        CASE WHEN u.name LIKE ? THEN 0 ELSE 1 END,
        u.name
      LIMIT ?
    `, [`%${q}%`, `${q}%`, parseInt(limit)]);
    
    const usersWithLevel = users.map(u => ({
      ...u,
      level: Math.floor((u.total_xp || 0) / 100) + 1
    }));
    
    res.json({ users: usersWithLevel });
  } catch (err) {
    console.error("Erro ao pesquisar utilizadores:", err);
    res.status(500).json({ mensagem: "Erro ao pesquisar." });
  }
}

module.exports = {
  getPublicProfile,
  getPublicCollection,
  updateVisibility,
  discoverUsers,
  searchUsers,
};
