// src/routes/externalGamesRoutes.js
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  searchExternalGames,
  importExternalToCollection,
} = require("../controllers/externalGamesController");

// se quiseres a pesquisa protegida, mete também o middleware aqui
router.get("/search", authMiddleware, searchExternalGames);

// importar para a coleção TEM MESMO de estar protegido
router.post(
  "/import/collection",
  authMiddleware,
  importExternalToCollection
);

module.exports = router;
