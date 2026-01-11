// server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const pool = require("./src/config/db");

const authRoutes = require("./src/routes/authRoutes");
const gameRoutes = require("./src/routes/gameRoutes");
const collectionRoutes = require("./src/routes/collectionRoutes");
const statsRoutes = require("./src/routes/statsRoutes");
const wishlistRoutes = require("./src/routes/wishlistRoutes");
const authMiddleware = require("./src/middleware/authMiddleware");
const externalGamesRoutes = require("./src/routes/externalGamesRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");


const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// servir ficheiros de imagem
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// healthcheck
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    console.error("Erro conexão BD:", err);
    res.status(500).json({ status: "error", db: "failed" });
  }
});

// públicas
app.use("/api/auth", authRoutes);
app.use("/api/external-games", externalGamesRoutes);
app.use("/api", dashboardRoutes);


// protegidas
app.use("/api/games", authMiddleware, gameRoutes);
app.use("/api/collection", authMiddleware, collectionRoutes);
app.use("/api/stats", authMiddleware, statsRoutes);
app.use("/api/wishlist", authMiddleware, wishlistRoutes);

app.use((req, res) => {
  res.status(404).json({ mensagem: "Rota não encontrada." });
});

app.listen(PORT, () => {
  console.log(`GameVault API a correr em http://localhost:${PORT}`);
});
