// src/controllers/authController.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {
  findUserByEmail,
  findUserById,
  createUser,
} = require("../models/userModel");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

function generateToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// POST /api/auth/register
async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Nome, email e password são obrigatórios." });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res
        .status(409)
        .json({ message: "Já existe um utilizador com esse email." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await createUser({
      name,
      email,
      passwordHash,
    });

    const token = generateToken(newUser);

    return res.status(201).json({
      user: newUser,
      token,
    });
  } catch (err) {
    console.error("Erro no register:", err);
    return res.status(500).json({ message: "Erro interno no servidor." });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email e password são obrigatórios." });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res
        .status(401)
        .json({ message: "Credenciais inválidas." });
    }

    const passwordOk = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordOk) {
      return res
        .status(401)
        .json({ message: "Credenciais inválidas." });
    }

    const publicUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar_url: user.avatar_url,
      bio: user.bio,
    };

    const token = generateToken(publicUser);

    return res.json({
      user: publicUser,
      token,
    });
  } catch (err) {
    console.error("Erro no login:", err);
    return res.status(500).json({ message: "Erro interno no servidor." });
  }
}

// GET /api/auth/me
async function me(req, res) {
  try {
    const userId = req.userId;

    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilizador não encontrado." });
    }

    return res.json({ user });
  } catch (err) {
    console.error("Erro no me:", err);
    return res.status(500).json({ message: "Erro interno no servidor." });
  }
}

module.exports = {
  register,
  login,
  me,
};
