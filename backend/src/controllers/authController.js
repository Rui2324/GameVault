const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

function gerarToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "24h",
    }
  );
}

// POST /api/auth/register
async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ mensagem: "Nome, email e password são obrigatórios." });
    }

    const [existe] = await pool.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    if (existe.length > 0) {
      return res
        .status(409)
        .json({ mensagem: "Já existe um utilizador com esse email." });
    }

    const hash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users (name, email, password_hash, created_at, updated_at)
       VALUES (?, ?, ?, NOW(), NOW())`,
      [name, email, hash]
    );

    const novoUser = {
      id: result.insertId,
      name,
      email,
      avatar_url: null,
      bio: null,
    };

    const token = gerarToken(novoUser);

    return res.status(201).json({
      mensagem: "Registo efetuado com sucesso.",
      user: novoUser,
      token,
    });
  } catch (err) {
    console.error("Erro no register:", err);
    return res
      .status(500)
      .json({ mensagem: "Ocorreu um erro ao criar a conta." });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ mensagem: "Email e password são obrigatórios." });
    }

    const [rows] = await pool.query(
      "SELECT id, name, email, password_hash, avatar_url, bio FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ mensagem: "Credenciais inválidas." });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ mensagem: "Credenciais inválidas." });
    }

    const userPublico = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar_url: user.avatar_url,
      bio: user.bio,
    };

    const token = gerarToken(userPublico);

    return res.json({
      mensagem: "Login efetuado com sucesso.",
      user: userPublico,
      token,
    });
  } catch (err) {
    console.error("Erro no login:", err);
    return res
      .status(500)
      .json({ mensagem: "Ocorreu um erro ao efetuar login." });
  }
}

// GET /api/auth/me
async function me(req, res) {
  try {
    const userId = req.userId;

    const [rows] = await pool.query(
      "SELECT id, name, email, avatar_url, bio, role, created_at, updated_at FROM users WHERE id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ mensagem: "Utilizador não encontrado." });
    }

    return res.json({ user: rows[0] });
  } catch (err) {
    console.error("Erro no /me:", err);
    return res
      .status(500)
      .json({ mensagem: "Ocorreu um erro ao obter o utilizador." });
  }
}

// PUT /api/auth/profile
async function updateProfile(req, res) {
  try {
    const userId = req.userId; 

    if (!userId) {
      return res.status(401).json({ mensagem: "Não autenticado." });
    }

    const { name, bio } = req.body;
    let avatarUrl = req.body.avatar_url || null;

    if (req.file) {
      avatarUrl = `/uploads/avatars/${req.file.filename}`;
    }

    await pool.query(
      "UPDATE users SET name = ?, bio = ?, avatar_url = ?, updated_at = NOW() WHERE id = ?",
      [name, bio, avatarUrl, userId]
    );

    const [rows] = await pool.query(
      "SELECT id, name, email, bio, avatar_url, created_at, updated_at FROM users WHERE id = ?",
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ mensagem: "Utilizador não encontrado." });
    }

    const user = rows[0];
    return res.json({ user });
  } catch (err) {
    console.error("Erro a atualizar perfil:", err);
    return res
      .status(500)
      .json({ mensagem: "Erro ao atualizar perfil do utilizador." });
  }
}

module.exports = {
  register,
  login,
  me,
  updateProfile,
};
