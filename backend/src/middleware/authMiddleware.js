// src/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];

  // Sem header Authorization -> 401
  if (!authHeader) {
    return res
      .status(401)
      .json({ message: "Token de autenticação em falta." });
  }

  const [scheme, token] = authHeader.split(" ");

  // Tem de ser "Bearer <token>"
  if (scheme !== "Bearer" || !token) {
    return res
      .status(401)
      .json({ message: "Token de autenticação inválido." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // No login provavelmente fizeste algo tipo:
    // jwt.sign({ sub: user.id, email: user.email }, ...)
    const userId = payload.sub || payload.id;

    // muitos controladores esperam req.userId
    req.userId = userId;

    // e alguns usam req.user
    req.user = {
      id: userId,
      email: payload.email,
    };

    return next();
  } catch (err) {
    console.error("Erro a validar token:", err);
    return res
      .status(401)
      .json({ message: "Token de autenticação inválido ou expirado." });
  }
}

module.exports = authMiddleware;
