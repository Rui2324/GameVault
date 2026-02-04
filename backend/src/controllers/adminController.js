// src/controllers/adminController.js
const userModel = require("../models/userModel");
const pool = require("../config/db");
const { logAdminAction, getAdminLogs, getLogStats } = require("../services/adminLogService");

// Dashboard stats
async function getDashboardStats(req, res) {
  try {
    const stats = await userModel.getUserStats();
    res.json(stats);
  } catch (error) {
    console.error("Erro ao buscar stats:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// Listar todos os users
async function getAllUsers(req, res) {
  try {
    const users = await userModel.getAllUsers();
    res.json({ users });
  } catch (error) {
    console.error("Erro ao buscar users:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// Obter detalhes completos de um user
async function getUserDetails(req, res) {
  try {
    const { userId } = req.params;
    
    // Info do user
    const [userRows] = await pool.query(
      "SELECT id, name, email, avatar_url, bio, role, is_public, total_xp, created_at FROM users WHERE id = ?",
      [userId]
    );
    
    if (userRows.length === 0) {
      return res.status(404).json({ error: "User não encontrado" });
    }
    
    // Contagem de jogos e wishlist
    const [collectionCount] = await pool.query(
      "SELECT COUNT(*) as count FROM collection_entries WHERE user_id = ?",
      [userId]
    );
    
    const [wishlistCount] = await pool.query(
      "SELECT COUNT(*) as count FROM wishlist_entries WHERE user_id = ?",
      [userId]
    );
    
    res.json({
      user: userRows[0],
      stats: {
        totalGames: collectionCount[0].count,
        totalWishlist: wishlistCount[0].count
      }
    });
  } catch (error) {
    console.error("Erro ao buscar user:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// Atualizar info de um user
async function updateUserInfo(req, res) {
  try {
    const { userId } = req.params;
    const { name, email, bio, is_public } = req.body;
    
    // Não pode editar admins se não for o próprio
    const [userCheck] = await pool.query("SELECT role FROM users WHERE id = ?", [userId]);
    if (userCheck.length === 0) {
      return res.status(404).json({ error: "User não encontrado" });
    }
    
    await pool.query(
      "UPDATE users SET name = ?, email = ?, bio = ?, is_public = ? WHERE id = ?",
      [name, email, bio || null, is_public ? 1 : 0, userId]
    );
    
    await logAdminAction(req.user.id, 'UPDATE_USER_INFO', 'user', userId, `Atualizou info de ${name}`, req.ip);
    
    res.json({ message: "User atualizado com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar user:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// Alterar role de um user
async function updateUserRole(req, res) {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: "Role inválido" });
    }

    // Não pode alterar o próprio role
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ error: "Não pode alterar o próprio role" });
    }

    const success = await userModel.updateUserRole(userId, role);
    
    if (!success) {
      return res.status(404).json({ error: "User não encontrado" });
    }

    await logAdminAction(req.user.id, 'UPDATE_USER_ROLE', 'user', userId, `Role alterado para ${role}`, req.ip);

    res.json({ message: `Role alterado para ${role}` });
  } catch (error) {
    console.error("Erro ao alterar role:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// Eliminar user
async function deleteUser(req, res) {
  try {
    const { userId } = req.params;

    // Não pode eliminar a própria conta
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ error: "Não pode eliminar a própria conta" });
    }

    const success = await userModel.deleteUser(userId);
    
    if (!success) {
      return res.status(404).json({ error: "User não encontrado" });
    }

    await logAdminAction(req.user.id, 'DELETE_USER', 'user', userId, 'User eliminado', req.ip);

    res.json({ message: "User eliminado com sucesso" });
  } catch (error) {
    console.error("Erro ao eliminar user:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// ========== COLEÇÃO ==========

// Listar coleção de um user
async function getUserCollection(req, res) {
  try {
    const { userId } = req.params;
    
    const [games] = await pool.query(`
      SELECT 
        ce.id,
        ce.game_id,
        ce.status,
        ce.rating,
        ce.hours_played,
        ce.notes,
        ce.created_at,
        g.title,
        g.cover_url,
        g.platform,
        g.genre,
        g.external_id
      FROM collection_entries ce
      LEFT JOIN games g ON ce.game_id = g.id
      WHERE ce.user_id = ?
      ORDER BY ce.created_at DESC
    `, [userId]);
    
    res.json({ games });
  } catch (error) {
    console.error("Erro ao buscar coleção:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// Atualizar jogo na coleção
async function updateCollectionEntry(req, res) {
  try {
    const { entryId } = req.params;
    const { status, rating, hours_played, notes } = req.body;
    
    await pool.query(`
      UPDATE collection_entries 
      SET status = ?, rating = ?, hours_played = ?, notes = ?
      WHERE id = ?
    `, [status, rating, hours_played, notes, entryId]);
    
    await logAdminAction(req.user.id, 'UPDATE_COLLECTION', 'collection_entry', entryId, `Status: ${status}`, req.ip);
    
    res.json({ message: "Jogo atualizado" });
  } catch (error) {
    console.error("Erro ao atualizar jogo:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// Remover jogo da coleção
async function removeFromCollection(req, res) {
  try {
    const { entryId } = req.params;
    
    await pool.query("DELETE FROM collection_entries WHERE id = ?", [entryId]);

    await logAdminAction(req.user.id, 'DELETE_COLLECTION_ENTRY', 'collection_entry', entryId, null, req.ip);

    res.json({ message: "Jogo removido da coleção" });
  } catch (error) {
    console.error("Erro ao remover jogo:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// ========== WISHLIST ==========

// Listar wishlist de um user
async function getUserWishlist(req, res) {
  try {
    const { userId } = req.params;
    
    const [items] = await pool.query(`
      SELECT 
        we.id,
        we.game_id,
        we.created_at,
        g.title,
        g.cover_url,
        g.platform,
        g.genre,
        g.external_id
      FROM wishlist_entries we
      LEFT JOIN games g ON we.game_id = g.id
      WHERE we.user_id = ?
      ORDER BY we.created_at DESC
    `, [userId]);
    
    res.json({ items });
  } catch (error) {
    console.error("Erro ao buscar wishlist:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// Atualizar item na wishlist (não há campos editáveis atualmente)
async function updateWishlistEntry(req, res) {
  try {
    // A tabela wishlist_entries só tem id, user_id, game_id, created_at, updated_at
    // Não há campos editáveis, retornar sucesso
    res.json({ message: "Item atualizado" });
  } catch (error) {
    console.error("Erro ao atualizar item:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// Remover item da wishlist
async function removeFromWishlist(req, res) {
  try {
    const { entryId } = req.params;
    
    await pool.query("DELETE FROM wishlist_entries WHERE id = ?", [entryId]);
    
    await logAdminAction(req.user.id, 'DELETE_WISHLIST_ENTRY', 'wishlist_entry', entryId, null, req.ip);
    
    res.json({ message: "Item removido da wishlist" });
  } catch (error) {
    console.error("Erro ao remover item:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// Mover item da wishlist para coleção
async function moveWishlistToCollection(req, res) {
  try {
    const { entryId } = req.params;
    const { status = 'por_jogar' } = req.body;
    
    // Buscar dados do wishlist entry
    const [wishlistItem] = await pool.query(
      "SELECT * FROM wishlist_entries WHERE id = ?",
      [entryId]
    );
    
    if (wishlistItem.length === 0) {
      return res.status(404).json({ error: "Item não encontrado" });
    }
    
    const item = wishlistItem[0];
    
    // Verificar se já existe na coleção
    const [existing] = await pool.query(
      "SELECT id FROM collection_entries WHERE user_id = ? AND game_id = ?",
      [item.user_id, item.game_id]
    );
    
    if (existing.length > 0) {
      // Remover da wishlist
      await pool.query("DELETE FROM wishlist_entries WHERE id = ?", [entryId]);
      return res.json({ message: "Jogo já estava na coleção, removido da wishlist" });
    }
    
    // Adicionar à coleção
    await pool.query(`
      INSERT INTO collection_entries (user_id, game_id, status)
      VALUES (?, ?, ?)
    `, [item.user_id, item.game_id, status]);
    
    // Remover da wishlist
    await pool.query("DELETE FROM wishlist_entries WHERE id = ?", [entryId]);
    
    await logAdminAction(req.user.id, 'MOVE_WISHLIST_TO_COLLECTION', 'wishlist_entry', entryId, `Movido para coleção`, req.ip);
    
    res.json({ message: "Jogo movido para a coleção" });
  } catch (error) {
    console.error("Erro ao mover item:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// Adicionar jogo à coleção de um user
async function addGameToCollection(req, res) {
  try {
    const { userId } = req.params;
    const { external_id, title, cover_url, platform, status = 'por_jogar' } = req.body;
    
    if (!external_id || !title) {
      return res.status(400).json({ error: "external_id e title são obrigatórios" });
    }
    
    // Verificar se o jogo já existe na tabela games
    let [existingGame] = await pool.query(
      "SELECT id FROM games WHERE external_id = ?",
      [external_id]
    );
    
    let gameId;
    
    if (existingGame.length === 0) {
      // Criar slug a partir do título
      const slug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      
      // Criar o jogo
      const [result] = await pool.query(
        "INSERT INTO games (external_id, title, slug, cover_url, platform, source) VALUES (?, ?, ?, ?, ?, 'rawg')",
        [external_id, title, slug, cover_url || null, platform || null]
      );
      gameId = result.insertId;
    } else {
      gameId = existingGame[0].id;
    }
    
    // Verificar se já está na coleção do user
    const [existingEntry] = await pool.query(
      "SELECT id FROM collection_entries WHERE user_id = ? AND game_id = ?",
      [userId, gameId]
    );
    
    if (existingEntry.length > 0) {
      return res.status(409).json({ error: "Jogo já está na coleção" });
    }
    
    // Adicionar à coleção
    await pool.query(
      "INSERT INTO collection_entries (user_id, game_id, status) VALUES (?, ?, ?)",
      [userId, gameId, status]
    );
    
    await logAdminAction(req.user.id, 'ADD_GAME_TO_COLLECTION', 'game', gameId, `Adicionado a user ${userId}`, req.ip);
    
    res.json({ message: "Jogo adicionado à coleção" });
  } catch (error) {
    console.error("Erro ao adicionar jogo:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

module.exports = {
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  updateUserInfo,
  updateUserRole,
  deleteUser,
  getUserCollection,
  updateCollectionEntry,
  removeFromCollection,
  getUserWishlist,
  updateWishlistEntry,
  removeFromWishlist,
  moveWishlistToCollection,
  addGameToCollection,
};