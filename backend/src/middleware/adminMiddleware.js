function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Não autenticado" });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Acesso negado. Apenas administradores." });
  }

  next();
}

module.exports = requireAdmin;