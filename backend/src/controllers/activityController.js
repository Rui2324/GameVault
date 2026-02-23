const pool = require("../config/db");

// GET /api/activity/feed - Feed de atividade da comunidade
async function getFeed(req, res) {
  try {
    const currentUserId = req.userId;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const onlyFollowing = req.query.following === "true";

    let followingFilter = "";
    const params = [];

    if (onlyFollowing && currentUserId) {
      followingFilter = `AND user_id IN (SELECT following_id FROM follows WHERE follower_id = ?)`;
      params.push(currentUserId, currentUserId, currentUserId); 
    }

    const query = `
      (
        SELECT 
          'game_added' as type,
          ce.user_id,
          u.name as user_name,
          u.avatar_url as user_avatar,
          g.id as game_id,
          g.title as game_title,
          g.cover_url as game_cover,
          NULL as rating,
          ce.status,
          ce.created_at as activity_date
        FROM collection_entries ce
        JOIN users u ON ce.user_id = u.id
        JOIN games g ON ce.game_id = g.id
        WHERE u.is_public = 1 ${followingFilter}
      )
      UNION ALL
      (
        SELECT 
          'review' as type,
          r.user_id,
          u.name as user_name,
          u.avatar_url as user_avatar,
          g.id as game_id,
          g.title as game_title,
          g.cover_url as game_cover,
          r.rating,
          NULL as status,
          r.created_at as activity_date
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        JOIN games g ON r.game_id = g.id
        WHERE u.is_public = 1 ${followingFilter}
      )
      UNION ALL
      (
        SELECT 
          'status_change' as type,
          ce.user_id,
          u.name as user_name,
          u.avatar_url as user_avatar,
          g.id as game_id,
          g.title as game_title,
          g.cover_url as game_cover,
          NULL as rating,
          ce.status,
          ce.updated_at as activity_date
        FROM collection_entries ce
        JOIN users u ON ce.user_id = u.id
        JOIN games g ON ce.game_id = g.id
        WHERE u.is_public = 1 
          AND ce.status IN ('concluido', 'completed', 'completo')
          AND ce.updated_at > ce.created_at
          ${followingFilter}
      )
      ORDER BY activity_date DESC
      LIMIT ?
    `;

    params.push(limit);

    const [activities] = await pool.query(query, params);

    const seen = new Set();
    const uniqueActivities = [];

    for (const act of activities) {
      const key = `${act.type}-${act.user_id}-${act.game_id}-${act.activity_date}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueActivities.push({
          type: act.type,
          user: {
            id: act.user_id,
            name: act.user_name,
            avatar_url: act.user_avatar
          },
          game: {
            id: act.game_id,
            title: act.game_title,
            cover_url: act.game_cover
          },
          rating: act.rating,
          status: act.status,
          date: act.activity_date
        });
      }
    }

    res.json({ activities: uniqueActivities.slice(0, limit) });
  } catch (err) {
    console.error("Erro ao buscar feed:", err);
    res.status(500).json({ mensagem: "Erro ao buscar atividades." });
  }
}

module.exports = {
  getFeed
};
