// src/routes/wishlistRoutes.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const wishlistController = require("../controllers/wishlistController");

// todas as rotas de wishlist exigem autenticação
router.use(authMiddleware);

router.get("/", wishlistController.listarWishlist);
router.post("/", wishlistController.adicionarWishlist);
router.delete("/:id", wishlistController.removerWishlist);

module.exports = router;
