// src/controllers/adminController.js
const userModel = require("../models/userModel");

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

    res.json({ message: "User eliminado com sucesso" });
  } catch (error) {
    console.error("Erro ao eliminar user:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

module.exports = {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
};