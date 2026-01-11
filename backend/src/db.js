// backend/src/db.js
const mysql = require("mysql2/promise");

// Lê do .env (ajusta os nomes se os teus forem diferentes)
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "22551",
  database: process.env.DB_NAME || "gamevault",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
