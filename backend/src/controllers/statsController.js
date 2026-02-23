const db = require("../config/db");

const TABLE = "collection_entries";

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
    const total_jogos = Number(totalRows?.[0]?.total ?? 0);

    // 2) distribuição por estado
    const statusRows = await safeQuery(
      `SELECT status, COUNT(*) AS count
       FROM \`${TABLE}\`
       WHERE user_id = ?
       GROUP BY status
       ORDER BY count DESC`,
      [userId]
    );

    // Converter para objeto { status: count }
    const jogos_por_estado = {};
    for (const row of statusRows) {
      const status = row.status || "sem_estado";
      jogos_por_estado[status] = Number(row.count ?? 0);
    }

    // 3) horas totais
    const hoursRows = await safeQuery(
      `SELECT COALESCE(SUM(hours_played), 0) AS hours
       FROM \`${TABLE}\`
       WHERE user_id = ?`,
      [userId]
    );
    const total_horas_jogadas = Number(hoursRows?.[0]?.hours ?? 0);

    // 4) média rating 
    const ratingRows = await safeQuery(
      `SELECT COALESCE(AVG(rating), NULL) AS avgRating
       FROM \`${TABLE}\`
       WHERE user_id = ? AND rating IS NOT NULL`,
      [userId]
    );
    const avgRatingRaw = ratingRows?.[0]?.avgRating;
    const media_rating = avgRatingRaw == null ? null : Number(avgRatingRaw);

    // 5) Taxa de conclusão (jogos completos / total * 100)
    const completosCount = jogos_por_estado["concluido"] || jogos_por_estado["completed"] || jogos_por_estado["completo"] || 0;
    const taxa_conclusao_percent = total_jogos > 0 
      ? Math.round((completosCount / total_jogos) * 100) 
      : 0;

    // 6) Jogos por género 
    let jogos_por_genero = {};
    try {
      const genreRows = await safeQuery(
        `SELECT g.genre, COUNT(*) AS count
         FROM \`${TABLE}\` c
         JOIN games g ON c.game_id = g.id
         WHERE c.user_id = ? AND g.genre IS NOT NULL AND g.genre != ''
         GROUP BY g.genre`,
        [userId]
      );

      // Processar géneros (podem ser separados por vírgula)
      const genreCount = {};
      for (const row of genreRows) {
        const genres = (row.genre || "").split(",").map((s) => s.trim()).filter(Boolean);
        for (const genre of genres) {
          genreCount[genre] = (genreCount[genre] || 0) + Number(row.count ?? 0);
        }
      }
      // Ordenar por contagem e pegar top 6
      jogos_por_genero = Object.fromEntries(
        Object.entries(genreCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
      );
    } catch {
      // Se falhar (tabela games não existe ou não tem coluna genres), ignora
    }

    // 7) Jogos por plataforma
    let jogos_por_plataforma = {};
    try {
      const platRows = await safeQuery(
        `SELECT g.platform, COUNT(*) AS count
         FROM \`${TABLE}\` c
         JOIN games g ON c.game_id = g.id
         WHERE c.user_id = ? AND g.platform IS NOT NULL AND g.platform != ''
         GROUP BY g.platform`,
        [userId]
      );

      // Processar plataformas 
      const platCount = {};
      for (const row of platRows) {
        const platforms = (row.platform || "").split(",").map((s) => s.trim()).filter(Boolean);
        for (const plat of platforms) {
          platCount[plat] = (platCount[plat] || 0) + Number(row.count ?? 0);
        }
      }
      // Ordenar por contagem e pegar top 5
      jogos_por_plataforma = Object.fromEntries(
        Object.entries(platCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
      );
    } catch {
      
    }

    return res.json({
      total_jogos,
      total_horas_jogadas,
      taxa_conclusao_percent,
      media_rating,
      jogos_por_estado,
      jogos_por_genero,
      jogos_por_plataforma,
      // manter compatibilidade com formato antigo
      total: total_jogos,
      totalHours: total_horas_jogadas,
      avgRating: media_rating,
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

// GET /api/stats/top-games - Ranking global dos jogos mais bem avaliados por todos os utilizadores
exports.getTopGames = async (req, res) => {
  try {
    const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 10), 50);

    // Primeiro, calcular a média global de todos os ratings (C na fórmula IMDB)
    const [globalAvgResult] = await db.query(
      `SELECT AVG(rating) AS global_avg FROM collection_entries WHERE rating IS NOT NULL AND rating > 0`
    );
    const globalAvg = globalAvgResult[0]?.global_avg || 7.0; // fallback para 7.0

    // Mínimo de votos para ter peso total (m na fórmula IMDB)
    // Jogos com menos votos são "puxados" para a média global
    const minVotes = 3;

    // Fórmula IMDB: score = (v/(v+m)) × R + (m/(v+m)) × C
    // v = total_users (número de votos)
    // m = minVotes (mínimo de votos)
    // R = media_rating (média do jogo)
    // C = globalAvg (média global)
    const [rows] = await db.query(
      `SELECT 
        g.id,
        g.external_id,
        g.title,
        g.platform,
        g.genre,
        g.cover_url,
        COUNT(c.id) AS total_users,
        AVG(c.rating) AS media_rating,
        SUM(c.hours_played) AS total_horas,
        (COUNT(c.id) / (COUNT(c.id) + ${minVotes})) * AVG(c.rating) + 
        (${minVotes} / (COUNT(c.id) + ${minVotes})) * ${globalAvg} AS weighted_score
      FROM games g
      JOIN collection_entries c ON g.id = c.game_id
      WHERE c.rating IS NOT NULL AND c.rating > 0
      GROUP BY g.id
      ORDER BY weighted_score DESC, total_users DESC, total_horas DESC
      LIMIT ${limit}`
    );

    const topGames = rows.map((r) => ({
      id: r.id,
      external_id: r.external_id,
      titulo: r.title,
      title: r.title,
      plataforma: r.platform,
      genero: r.genre,
      url_capa: r.cover_url,
      cover_url: r.cover_url,
      total_utilizadores: Number(r.total_users ?? 0),
      media_rating: r.media_rating ? Number(r.media_rating).toFixed(1) : null,
      rating: r.media_rating ? Number(r.media_rating) : null,
      weighted_score: r.weighted_score ? Number(r.weighted_score).toFixed(2) : null,
      total_horas: Number(r.total_horas ?? 0),
    }));

    return res.json({ topGames });
  } catch (err) {
    console.error("getTopGames error:", err);
    return res.status(500).json({ message: "Erro ao buscar ranking global." });
  }
};
