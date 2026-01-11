// src/controllers/achievementController.js
const achievementModel = require("../models/achievementModel");
const achievementService = require("../services/achievementService");

// GET /api/achievements - Todas as conquistas disponíveis
async function getAllAchievements(req, res) {
  try {
    const achievements = await achievementModel.getAllAchievements();
    res.json({ achievements });
  } catch (err) {
    console.error("Erro ao buscar conquistas:", err);
    res.status(500).json({ mensagem: "Erro ao buscar conquistas." });
  }
}

// GET /api/achievements/me - Conquistas do utilizador autenticado
async function getMyAchievements(req, res) {
  try {
    const userId = req.userId;
    
    const achievements = await achievementModel.getUserAchievements(userId);
    const totalXP = await achievementModel.getUserXP(userId);
    const unlockedCount = await achievementModel.countUserAchievements(userId);
    const totalCount = achievements.length;
    
    // Calcular nível baseado no XP (100 XP por nível)
    const level = Math.floor(totalXP / 100) + 1;
    const xpToNextLevel = 100 - (totalXP % 100);
    
    res.json({
      achievements,
      stats: {
        totalXP,
        level,
        xpToNextLevel,
        unlockedCount,
        totalCount,
        completionPercentage: Math.round((unlockedCount / totalCount) * 100)
      }
    });
  } catch (err) {
    console.error("Erro ao buscar minhas conquistas:", err);
    res.status(500).json({ mensagem: "Erro ao buscar conquistas." });
  }
}

// GET /api/achievements/user/:userId - Conquistas de um utilizador específico
async function getUserAchievements(req, res) {
  try {
    const { userId } = req.params;
    
    const achievements = await achievementModel.getUserAchievements(userId);
    const totalXP = await achievementModel.getUserXP(userId);
    const unlockedCount = await achievementModel.countUserAchievements(userId);
    
    const level = Math.floor(totalXP / 100) + 1;
    
    res.json({
      achievements: achievements.filter(a => a.unlocked_at !== null), // Só as desbloqueadas
      stats: {
        totalXP,
        level,
        unlockedCount
      }
    });
  } catch (err) {
    console.error("Erro ao buscar conquistas do utilizador:", err);
    res.status(500).json({ mensagem: "Erro ao buscar conquistas." });
  }
}

// GET /api/achievements/recent - Conquistas recentes do utilizador
async function getRecentAchievements(req, res) {
  try {
    const userId = req.userId;
    const recent = await achievementModel.getRecentUnlocks(userId, 5);
    res.json({ achievements: recent });
  } catch (err) {
    console.error("Erro ao buscar conquistas recentes:", err);
    res.status(500).json({ mensagem: "Erro ao buscar conquistas." });
  }
}

// POST /api/achievements/check - Verificar e desbloquear conquistas pendentes
async function checkAchievements(req, res) {
  try {
    const userId = req.userId;
    
    // Buscar conquistas antes
    const beforeCount = await achievementModel.countUserAchievements(userId);
    
    // Verificar todas as conquistas
    await achievementService.checkAllAchievements(userId);
    
    // Buscar conquistas depois
    const afterCount = await achievementModel.countUserAchievements(userId);
    const newUnlocks = afterCount - beforeCount;
    
    if (newUnlocks > 0) {
      const recent = await achievementModel.getRecentUnlocks(userId, newUnlocks);
      res.json({ 
        mensagem: `${newUnlocks} nova(s) conquista(s) desbloqueada(s)!`,
        newAchievements: recent
      });
    } else {
      res.json({ mensagem: "Nenhuma nova conquista desbloqueada.", newAchievements: [] });
    }
  } catch (err) {
    console.error("Erro ao verificar conquistas:", err);
    res.status(500).json({ mensagem: "Erro ao verificar conquistas." });
  }
}

module.exports = {
  getAllAchievements,
  getMyAchievements,
  getUserAchievements,
  getRecentAchievements,
  checkAchievements,
};
