// backend/src/routes/externalGamesRoutes.js
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

// controller que já tinhas (search/details/imports)
const externalGamesController = require("../controllers/externalGamesController");

// NOVO controller só para o dashboard (featured/upcoming/releases/list)
const dashboardController = require("../controllers/externalGamesDashboardController");

// --- Dashboard lists ---
router.get("/featured", authMiddleware, dashboardController.featured);
router.get("/upcoming", authMiddleware, dashboardController.upcoming);
router.get("/releases", authMiddleware, dashboardController.releases);

// opcional (caso o teu front ainda chame /list?page_size=6)
router.get("/list", authMiddleware, dashboardController.list);

// --- Já existiam no teu controller ---
router.get("/search", authMiddleware, externalGamesController.searchExternalGames);
router.get("/:externalId", authMiddleware, externalGamesController.getExternalGameDetails);

router.post("/import/collection", authMiddleware, externalGamesController.importExternalToCollection);
router.post("/import/wishlist", authMiddleware, externalGamesController.importExternalToWishlist);

module.exports = router;
