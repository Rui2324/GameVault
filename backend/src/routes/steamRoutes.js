// /GameVault/backend/src/routes/steamRoutes.js
const express = require("express");
const router = express.Router();

const steamController = require("../controllers/steamController");
const authMiddleware = require("../middleware/authMiddleware");

// Biblioteca
router.get("/library", steamController.getSteamLibrary);
router.get("/library/:steamUrl", steamController.getSteamLibrary);

// Import biblioteca
router.post("/import", authMiddleware, steamController.importGames);

// Wishlist
router.get("/wishlist", steamController.getSteamWishlist);
router.get("/wishlist/:steamUrl", steamController.getSteamWishlist);

// Import wishlist
router.post("/wishlist/import", authMiddleware, steamController.importWishlistToDb);

// Fix metadata
router.post("/fix-metadata", authMiddleware, steamController.fixMetadata);

module.exports = router;
