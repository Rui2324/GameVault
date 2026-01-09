// src/routes/externalGamesRoutes.js
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  searchExternalGames,
  importExternalToCollection,
  importExternalToWishlist,
} = require("../controllers/externalGamesController");

// Todas estas rotas são protegidas (precisam de token)
router.get("/search", authMiddleware, searchExternalGames);
router.post("/import/collection", authMiddleware, importExternalToCollection);
router.post("/import/wishlist", authMiddleware, importExternalToWishlist);

module.exports = router;
