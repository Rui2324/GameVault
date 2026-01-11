// backend/src/controllers/statsController.js
const db = require("../db");

const TABLE = process.env.COLLECTION_TABLE || "collection";

async function safeQuery(sql, params) {
  const [rows] = await db.execute(sql, params);
  return rows;
}

exports.getStats = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Não autenticado." });
    }

    // 1) total jogos
    const totalRows = await safeQuery(
      `SELECT COUNT(*) AS total FROM \`${TABLE}\` WHERE user_id = ?`,
      [userId]
    );
    const total = Number(totalRows?.[0]?.total ?? 0);

    // 2) distribuição por estado
    const statusRows = await safeQuery(
      `SELECT status, COUNT(*) AS count
       FROM \`${TABLE}\`
       WHERE user_id = ?
       GROUP BY status
       ORDER BY count DESC`,
      [userId]
    );

    // 3) horas totais
    const hoursRows = await safeQuery(
      `SELECT COALESCE(SUM(hours_played), 0) AS hours
       FROM \`${TABLE}\`
       WHERE user_id = ?`,
      [userId]
    );
    const totalHours = Number(hoursRows?.[0]?.hours ?? 0);

    // 4) média rating (ignora null)
    const ratingRows = await safeQuery(
      `SELECT COALESCE(AVG(rating), NULL) AS avgRating
       FROM \`${TABLE}\`
       WHERE user_id = ? AND rating IS NOT NULL`,
      [userId]
    );
    const avgRatingRaw = ratingRows?.[0]?.avgRating;
    const avgRating = avgRatingRaw == null ? null : Number(avgRatingRaw);

    return res.json({
      total,
      totalHours,
      avgRating,
      byStatus: statusRows.map((r) => ({
        status: r.status ?? "—",
        count: Number(r.count ?? 0),
      })),
    });
  } catch (err) {
    console.error("getStats error:", err);
    return res.status(500).json({ message: "Erro interno nas estatísticas." });
  }
};
