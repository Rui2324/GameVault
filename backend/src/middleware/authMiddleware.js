// backend/src/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

// Middleware de autenticação obrigatória
function verifyToken(req, res, next) {
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

    // id pode vir em campos diferentes dependendo de quem gerou o token
    const userId = payload.id ?? payload.userId ?? payload.sub;

    // mete o que o teu projeto usa (id, email, user_type, etc.)
    req.user = {
      id: userId,
      email: payload.email,
      user_type: payload.user_type,
    };

    // compatibilidade com controladores que usam req.userId (authController.me, updateProfile, etc.)
    req.userId = userId;

    if (!req.user.id) {
      return res.status(401).json({ message: "Token inválido." });
    }

    return next();
  } catch (err) {
    return res.status(401).json({ message: "Token inválido ou expirado." });
  }
}

// Middleware de autenticação opcional (não falha se não houver token)
function optionalAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const [type, token] = auth.split(" ");

    if (type === "Bearer" && token) {
      const secret = process.env.JWT_SECRET;
      if (secret) {
        const payload = jwt.verify(token, secret);
        const userId = payload.id ?? payload.userId ?? payload.sub;
        req.user = {
          id: userId,
          email: payload.email,
          user_type: payload.user_type,
        };
        req.userId = userId;
      }
    }
  } catch {
    // Token inválido, mas não bloqueamos - apenas não definimos req.userId
  }
  return next();
}

// Exportar ambos os middlewares
module.exports = verifyToken;
module.exports.verifyToken = verifyToken;
module.exports.optionalAuth = optionalAuth;
