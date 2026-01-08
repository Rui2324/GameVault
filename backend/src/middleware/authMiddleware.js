// src/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res
      .status(401)
      .json({ message: "Token de autenticação em falta." });
  }

  const [, token] = authHeader.split(" ");

  if (!token) {
    return res
      .status(401)
      .json({ message: "Token de autenticação inválido." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch (err) {
    console.error("Erro a validar token:", err);
    return res
      .status(401)
      .json({ message: "Token de autenticação inválido ou expirado." });
  }
}

module.exports = authMiddleware;