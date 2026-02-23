const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const externalGamesController = require("../controllers/externalGamesController");
const dashboardController = require("../controllers/externalGamesDashboardController");

// --- Dashboard lists (PRIVADAS - requer login) ---
router.get("/featured", authMiddleware, dashboardController.featured);
router.get("/upcoming", authMiddleware, dashboardController.upcoming);
router.get("/releases", authMiddleware, dashboardController.releases);
router.get("/list", authMiddleware, dashboardController.list);

// --- RAWG / external (PRIVADAS - pesquisa e detalhes requerem login) ---
router.get("/search", authMiddleware, externalGamesController.searchExternalGames);
router.get("/game-id/:externalId", authMiddleware, externalGamesController.getGameIdByExternalId);
router.get("/:externalId", authMiddleware, externalGamesController.getExternalGameDetails);

// --- Ações que requerem autenticação ---
router.post("/import/collection", authMiddleware, externalGamesController.importExternalToCollection);
router.post("/import/wishlist", authMiddleware, externalGamesController.importExternalToWishlist);
router.post("/link-rawg", authMiddleware, externalGamesController.linkRawg);

module.exports = router;
