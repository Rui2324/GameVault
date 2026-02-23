const jwt = require("jsonwebtoken");
const pool = require("../config/db");

// Middleware de autenticação obrigatória
async function verifyToken(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const [type, token] = auth.split(" ");

    if (type !== "Bearer" || !token) {
      return res.status(401).json({ message: "Token em falta." });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "JWT_SECRET em falta no .env" });
    }

    const payload = jwt.verify(token, secret);

    const userId = payload.id ?? payload.userId ?? payload.sub;

    const [rows] = await pool.query(
      "SELECT id, name, email, role FROM users WHERE id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "User não encontrado." });
    }

    req.user = rows[0];
    req.userId = userId; 

    if (!req.user.id) {
      return res.status(401).json({ message: "Token inválido." });
    }

    return next();
  } catch (err) {
    console.error("Erro no authMiddleware:", err);
    return res.status(401).json({ message: "Token inválido ou expirado." });
  }
}

// Middleware de autenticação opcional
async function optionalAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const [type, token] = auth.split(" ");

    if (type === "Bearer" && token) {
      const secret = process.env.JWT_SECRET;
      if (secret) {
        const payload = jwt.verify(token, secret);
        const userId = payload.id ?? payload.userId ?? payload.sub;
        
        // Buscar dados completos do user também aqui
        const [rows] = await pool.query(
          "SELECT id, name, email, role FROM users WHERE id = ?",
          [userId]
        );

        if (rows.length > 0) {
          req.user = rows[0];
          req.userId = userId;
        }
      }
    }
  } catch (err) {
    console.error("Erro no optionalAuth:", err);
  }
  return next();
}

module.exports = verifyToken;
module.exports.verifyToken = verifyToken;
module.exports.optionalAuth = optionalAuth;
