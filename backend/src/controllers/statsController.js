// src/controllers/statsController.js
const pool = require("../config/db");

// GET /api/stats
async function getMyStats(req, res) {
  try {
    const userId = req.userId;

    // total de jogos
    const [totalRows] = await pool.query(
      "SELECT COUNT(*) AS total_jogos FROM collection_entries WHERE user_id = ?",
      [userId]
    );
    const totalJogos = totalRows[0].total_jogos || 0;

    // total de horas
    const [horasRows] = await pool.query(
      "SELECT COALESCE(SUM(hours_played), 0) AS total_horas FROM collection_entries WHERE user_id = ?",
      [userId]
    );
    const totalHoras = horasRows[0].total_horas || 0;

    // jogos por estado
    const [estadoRows] = await pool.query(
      `SELECT status, COUNT(*) AS total
       FROM collection_entries
       WHERE user_id = ?
       GROUP BY status`,
      [userId]
    );

    const jogosPorEstado = {
      por_jogar: 0,
      a_jogar: 0,
      concluido: 0,
      abandonado: 0,
    };

    estadoRows.forEach((row) => {
      if (jogosPorEstado.hasOwnProperty(row.status)) {
        jogosPorEstado[row.status] = row.total;
      }
    });

    // taxa de conclusão (percentagem de concluídos)
    const taxaConclusao =
      totalJogos > 0
        ? Math.round((jogosPorEstado.concluido / totalJogos) * 100)
        : 0;

    return res.json({
      total_jogos: totalJogos,
      total_horas_jogadas: totalHoras,
      jogos_por_estado: jogosPorEstado,
      taxa_conclusao_percent: taxaConclusao,
    });
  } catch (err) {
    console.error("Erro ao obter estatísticas:", err);
    return res.status(500).json({
      mensagem: "Ocorreu um erro interno ao calcular as estatísticas.",
    });
  }
}

module.exports = {
  getMyStats,
};
