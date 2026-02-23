const axios = require("axios");

const RAWG_BASE = "https://api.rawg.io/api";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

exports.listForDashboard = async (req, res) => {
  try {
    const key = process.env.RAWG_API_KEY;
    if (!key) {
      return res.status(500).json({ message: "RAWG_API_KEY em falta no .env" });
    }

    const pageSize = Number(req.query.page_size || 6);
    const kind = String(req.query.kind || "featured"); 

    const params = {
      key,
      page_size: pageSize,
    };

    if (kind === "upcoming") {
      // próximos ~90 dias
      params.dates = `${todayISO()},${addDaysISO(90)}`;
      params.ordering = "released";
    } else {
      // destaque (popular/rating)
      params.ordering = "-rating";
    }

    const { data } = await axios.get(`${RAWG_BASE}/games`, { params });

    // devolve só o que precisas no frontend
    const items = (data?.results || []).map((g) => ({
      id: g.id,
      name: g.name,
      released: g.released,
      background_image: g.background_image,
      rating: g.rating,
      ratings_count: g.ratings_count,
    }));

    return res.json({ items });
  } catch (err) {
    console.error("listForDashboard error:", err?.response?.data || err);
    return res.status(500).json({ message: "Erro ao carregar lista RAWG." });
  }
};
