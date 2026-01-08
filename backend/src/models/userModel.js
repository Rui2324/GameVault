// src/models/userModel.js
const pool = require("../config/db");

async function findUserByEmail(email) {
  const [rows] = await pool.query(
    "SELECT * FROM users WHERE email = ? LIMIT 1",
    [email]
  );
  return rows[0] || null;
}

async function findUserById(id) {
  const [rows] = await pool.query(
    "SELECT id, name, email, avatar_url, bio, created_at, updated_at FROM users WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] || null;
}

async function createUser({ name, email, passwordHash }) {
  const [result] = await pool.query(
    "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
    [name, email, passwordHash]
  );

  return {
    id: result.insertId,
    name,
    email,
  };
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
};
