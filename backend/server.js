// server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const pool = require("./src/config/db");

// --- IMPORTS DE ROTAS ---
const authRoutes = require("./src/routes/authRoutes");
const gameRoutes = require("./src/routes/gameRoutes");
const collectionRoutes = require("./src/routes/collectionRoutes");
const statsRoutes = require("./src/routes/statsRoutes");
const wishlistRoutes = require("./src/routes/wishlistRoutes");
const externalGamesRoutes = require("./src/routes/externalGamesRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const reviewRoutes = require("./src/routes/reviewRoutes");
const achievementRoutes = require("./src/routes/achievementRoutes");
const profileRoutes = require("./src/routes/profileRoutes");
const followRoutes = require("./src/routes/followRoutes");
const activityRoutes = require("./src/routes/activityRoutes");
const adminRoutes = require("./src/routes/adminRoutes");

// NOVO: Rota da Steam
const steamRoutes = require("./src/routes/steamRoutes");

const authMiddleware = require("./src/middleware/authMiddleware");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Servir ficheiros de imagem estáticos (uploads)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- HEALTHCHECK ---
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    console.error("Erro conexão BD:", err);
    res.status(500).json({ status: "error", db: "failed" });
  }
});

// --- DEFINIÇÃO DE ROTAS ---

// Rotas Públicas (ou mistas)
app.use("/api/auth", authRoutes);
app.use("/api/external-games", externalGamesRoutes);
app.use("/api", dashboardRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/follows", followRoutes);
app.use("/api/activity", activityRoutes);

// Rotas Protegidas (Exigem Login)
// Nota: O authMiddleware é passado aqui para proteger todas as sub-rotas
app.use("/api/games", authMiddleware, gameRoutes);
app.use("/api/collection", authMiddleware, collectionRoutes);
app.use("/api/stats", authMiddleware, statsRoutes);
app.use("/api/wishlist", authMiddleware, wishlistRoutes);

// NOVO: Registar a rota da Steam
// Nota: A proteção (authMiddleware) já está dentro do ficheiro steamRoutes.js, 
// mas podes deixá-lo assim:
app.use("/api/steam", steamRoutes);

// ADMIN: Rotas de administração
app.use("/api/admin", adminRoutes);

// --- 404 HANDLER ---
app.use((req, res) => {
  res.status(404).json({ mensagem: "Rota não encontrada." });
});

// --- INICIAR SERVIDOR ---
app.listen(PORT, () => {
  console.log(`GameVault API a correr em http://localhost:${PORT}`);
});