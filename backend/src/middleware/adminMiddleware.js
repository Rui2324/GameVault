// src/middleware/adminMiddleware.js
function requireAdmin(req, res, next) {
  // authMiddleware já validou o user e colocou em req.user
  if (!req.user) {
    return res.status(401).json({ error: "Não autenticado" });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Acesso negado. Apenas administradores." });
  }

  next();
}

module.exports = requireAdmin;