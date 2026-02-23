const pool = require("../config/db");
const { logAdminAction, getAdminLogs, getLogStats } = require("../services/adminLogService");
const { 
  getUnreadNotifications, 
  getAllNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification 
} = require("../services/adminNotificationService");
const externalGamesService = require("../services/externalGamesService");

// ========== LOGS ==========

async function getLogs(req, res) {
  try {
    const { page = 1, limit = 50, adminId, action, startDate, endDate } = req.query;
    
    const result = await getAdminLogs({
      page: parseInt(page),
      limit: parseInt(limit),
      adminId,
      action,
      startDate,
      endDate
    });
    
    res.json(result);
  } catch (error) {
    console.error("Erro ao buscar logs:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

async function getLogsStats(req, res) {
  try {
    const stats = await getLogStats();
    res.json(stats);
  } catch (error) {
    console.error("Erro ao buscar stats de logs:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// ========== MODERAÇÃO DE REVIEWS ==========

async function getAllReviews(req, res) {
  try {
    const { page = 1, limit = 20, userId, gameId } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        r.id,
        r.user_id,
        r.game_id,
        r.rating,
        r.content as review_text,
        r.created_at,
        r.updated_at,
        u.name as user_name,
        u.email as user_email,
        g.title as game_title
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN games g ON r.game_id = g.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (userId) {
      query += " AND r.user_id = ?";
      params.push(userId);
    }
    
    if (gameId) {
      query += " AND r.game_id = ?";
      params.push(gameId);
    }
    
    query += " ORDER BY r.created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), offset);
    
    const [reviews] = await pool.query(query, params);
    
    // Contagem total
    let countQuery = "SELECT COUNT(*) as total FROM reviews WHERE 1=1";
    const countParams = [];
    
    if (userId) {
      countQuery += " AND user_id = ?";
      countParams.push(userId);
    }
    
    if (gameId) {
      countQuery += " AND game_id = ?";
      countParams.push(gameId);
    }
    
    const [countResult] = await pool.query(countQuery, countParams);
    
    res.json({
      reviews,
      total: countResult[0].total,
      page: parseInt(page),
      totalPages: Math.ceil(countResult[0].total / limit)
    });
  } catch (error) {
    console.error("Erro ao buscar reviews:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

async function deleteReview(req, res) {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;
    
    // Buscar info da review antes de eliminar
    const [review] = await pool.query("SELECT user_id, game_id FROM reviews WHERE id = ?", [reviewId]);
    
    if (review.length === 0) {
      return res.status(404).json({ error: "Review não encontrada" });
    }
    
    await pool.query("DELETE FROM reviews WHERE id = ?", [reviewId]);
    
    await logAdminAction(
      req.user.id, 
      'DELETE_REVIEW', 
      'review', 
      reviewId, 
      reason || 'Review eliminada pelo admin',
      req.ip
    );
    
    res.json({ message: "Review eliminada com sucesso" });
  } catch (error) {
    console.error("Erro ao eliminar review:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// ========== GESTÃO DE ACHIEVEMENTS ==========

async function getUserAchievements(req, res) {
  try {
    const { userId } = req.params;
    
    const [achievements] = await pool.query(`
      SELECT 
        a.id,
        a.name as title,
        a.description,
        a.icon as icon_url,
        a.xp_reward,
        ua.unlocked_at,
        ua.id as user_achievement_id
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
      ORDER BY a.name
    `, [userId]);
    
    res.json({ achievements });
  } catch (error) {
    console.error("Erro ao buscar achievements:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

async function forceUnlockAchievement(req, res) {
  try {
    const { userId, achievementId } = req.params;
    
    // Verificar se já tem
    const [existing] = await pool.query(
      "SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ?",
      [userId, achievementId]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({ error: "Achievement já desbloqueado" });
    }
    
    // Buscar XP do achievement
    const [achievement] = await pool.query("SELECT xp_reward, name as title FROM achievements WHERE id = ?", [achievementId]);
    
    if (achievement.length === 0) {
      return res.status(404).json({ error: "Achievement não encontrado" });
    }
    
    await pool.query(
      "INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)",
      [userId, achievementId]
    );
    
    // Adicionar XP ao user
    await pool.query(
      "UPDATE users SET total_xp = total_xp + ? WHERE id = ?",
      [achievement[0].xp_reward, userId]
    );
    
    await logAdminAction(
      req.user.id,
      'FORCE_UNLOCK_ACHIEVEMENT',
      'achievement',
      achievementId,
      `Desbloqueado para user ${userId}: ${achievement[0].title}`,
      req.ip
    );
    
    res.json({ message: "Achievement desbloqueado", xp_reward: achievement[0].xp_reward });
  } catch (error) {
    console.error("Erro ao desbloquear achievement:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

async function forceLockAchievement(req, res) {
  try {
    const { userId, achievementId } = req.params;
    
    // Buscar achievement e XP
    const [userAchievement] = await pool.query(`
      SELECT ua.id, a.xp_reward, a.name as title
      FROM user_achievements ua
      LEFT JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = ? AND ua.achievement_id = ?
    `, [userId, achievementId]);
    
    if (userAchievement.length === 0) {
      return res.status(404).json({ error: "Achievement não está desbloqueado" });
    }
    
    await pool.query(
      "DELETE FROM user_achievements WHERE user_id = ? AND achievement_id = ?",
      [userId, achievementId]
    );
    
    // Remover XP do user
    await pool.query(
      "UPDATE users SET total_xp = GREATEST(0, total_xp - ?) WHERE id = ?",
      [userAchievement[0].xp_reward, userId]
    );
    
    await logAdminAction(
      req.user.id,
      'FORCE_LOCK_ACHIEVEMENT',
      'achievement',
      achievementId,
      `Bloqueado para user ${userId}: ${userAchievement[0].title}`,
      req.ip
    );
    
    res.json({ message: "Achievement bloqueado", xp_removed: userAchievement[0].xp_reward });
  } catch (error) {
    console.error("Erro ao bloquear achievement:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// ========== ANALYTICS ==========

async function getAnalytics(req, res) {
  try {
    // Jogos mais populares
    const [popularGames] = await pool.query(`
      SELECT 
        g.id,
        g.title,
        g.cover_url,
        COUNT(DISTINCT ce.user_id) as user_count,
        AVG(r.rating) as avg_rating,
        COUNT(DISTINCT r.id) as review_count
      FROM games g
      LEFT JOIN collection_entries ce ON g.id = ce.game_id
      LEFT JOIN reviews r ON g.id = r.game_id
      GROUP BY g.id
      ORDER BY user_count DESC
      LIMIT 10
    `);
    
    // Novos users por mês (últimos 6 meses)
    const [newUsersByMonth] = await pool.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count
      FROM users
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY month
      ORDER BY month
    `);
    
    // Reviews por dia (últimos 30 dias)
    const [reviewsByDay] = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM reviews
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY date
      ORDER BY date
    `);
    
    // Estatísticas gerais
    const [generalStats] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM games) as total_games,
        (SELECT COUNT(*) FROM collection_entries) as total_collection_entries,
        (SELECT COUNT(*) FROM reviews) as total_reviews,
        (SELECT COUNT(*) FROM user_achievements) as total_achievements_unlocked
    `);
    
    // Distribuição de status de jogos
    const [statusDistribution] = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM collection_entries
      GROUP BY status
    `);
    
    res.json({
      popularGames,
      newUsersByMonth,
      reviewsByDay,
      generalStats: generalStats[0],
      statusDistribution
    });
  } catch (error) {
    console.error("Erro ao buscar analytics:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// ========== NOTIFICAÇÕES ==========

async function getNotifications(req, res) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await getAllNotifications(parseInt(page), parseInt(limit));
    res.json(result);
  } catch (error) {
    console.error("Erro ao buscar notificações:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

async function getUnread(req, res) {
  try {
    const notifications = await getUnreadNotifications();
    res.json({ notifications, count: notifications.length });
  } catch (error) {
    console.error("Erro ao buscar notificações não lidas:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

async function markNotificationAsRead(req, res) {
  try {
    const { notificationId } = req.params;
    await markAsRead(notificationId);
    res.json({ message: "Notificação marcada como lida" });
  } catch (error) {
    console.error("Erro ao marcar notificação:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

async function markAllNotificationsAsRead(req, res) {
  try {
    await markAllAsRead();
    res.json({ message: "Todas as notificações marcadas como lidas" });
  } catch (error) {
    console.error("Erro ao marcar notificações:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

async function deleteNotificationById(req, res) {
  try {
    const { notificationId } = req.params;
    await deleteNotification(notificationId);
    res.json({ message: "Notificação eliminada" });
  } catch (error) {
    console.error("Erro ao eliminar notificação:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// ========== ENRIQUECER JOGOS STEAM COM RAWG ==========


async function enrichSteamGames(req, res) {
  try {
    // Buscar jogos Steam com dados incompletos
    const [games] = await pool.query(`
      SELECT id, title, steam_appid, platform, genre, external_id
      FROM games
      WHERE steam_appid IS NOT NULL
        AND (external_id IS NULL OR genre IS NULL OR platform = 'PC')
      ORDER BY id
    `);

    if (!games.length) {
      return res.json({
        message: "Nenhum jogo para atualizar",
        updated: 0,
        failed: 0,
        total: 0
      });
    }

    let updated = 0;
    let failed = 0;
    const errors = [];

    // Função para normalizar nomes para comparação
    const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

    for (const game of games) {
      try {
        // Buscar na RAWG pelo título
        const results = await externalGamesService.searchGames(game.title, 1);
        
        if (!results || !results.length) {
          failed++;
          errors.push({ id: game.id, title: game.title, reason: "Não encontrado na RAWG" });
          continue;
        }

        // Tentar match exato primeiro
        const target = norm(game.title);
        const exact = results.find((g) => norm(g.title || g.name) === target);
        const best = exact || results[0];

        if (!best) {
          failed++;
          errors.push({ id: game.id, title: game.title, reason: "Nenhum resultado válido" });
          continue;
        }

        // Atualizar o jogo com dados da RAWG
        await pool.query(`
          UPDATE games
          SET 
            platform = COALESCE(?, platform),
            genre = COALESCE(?, genre),
            external_id = COALESCE(external_id, ?),
            rawg_id = COALESCE(rawg_id, ?),
            cover_url = COALESCE(cover_url, ?),
            updated_at = NOW()
          WHERE id = ?
        `, [
          best.platforms || null,
          best.genres || null,
          best.external_id || best.id || null,
          best.external_id || best.id || null,
          best.cover_url || null,
          game.id
        ]);

        updated++;

        await new Promise(resolve => setTimeout(resolve, 250));

      } catch (err) {
        failed++;
        errors.push({ id: game.id, title: game.title, reason: err.message });
      }
    }

    await logAdminAction(
      req.user.id, 
      'ENRICH_STEAM_GAMES', 
      'games', 
      null, 
      `Enriqueceu ${updated} jogos Steam com dados RAWG`, 
      req.ip
    );

    res.json({
      message: `Atualização concluída: ${updated} jogos atualizados, ${failed} falharam`,
      updated,
      failed,
      total: games.length,
      errors: errors.slice(0, 20) 
    });

  } catch (error) {
    console.error("Erro ao enriquecer jogos:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

module.exports = {
  getLogs,
  getLogsStats,
  getAllReviews,
  deleteReview,
  getUserAchievements,
  forceUnlockAchievement,
  forceLockAchievement,
  getAnalytics,
  getNotifications,
  getUnread,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotificationById,
  enrichSteamGames
};
