// src/routes/profileRoutes.js
const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const { verifyToken, optionalAuth } = require("../middleware/authMiddleware");

// Descobrir utilizadores para seguir (deve vir ANTES de /:identifier)
router.get("/users/discover", optionalAuth, profileController.discoverUsers);

// Pesquisar utilizadores
router.get("/users/search", profileController.searchUsers);

// Perfil público de um utilizador (por ID ou nome)
router.get("/:identifier", optionalAuth, profileController.getPublicProfile);

// Coleção pública de um utilizador
router.get("/:userId/collection", optionalAuth, profileController.getPublicCollection);

// Alterar visibilidade do próprio perfil (autenticado)
router.patch("/visibility", verifyToken, profileController.updateVisibility);

module.exports = router;
