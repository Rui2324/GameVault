import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { rawgOriginal } from "../utils/rawgImages";

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function formatCompactNumber(n) {
  const num = toNumber(n);
  return num.toLocaleString("pt-PT");
}

function formatDateShort(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function timeAgoLabel(dateValue) {
  if (!dateValue) return "—";
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "—";

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  return `Há ${diffDays} dias`;
}

function safeImg(url) {
  const u = rawgOriginal(url || "");
  return u || "";
}

async function fetchFirstOk(candidates, config) {
  for (const path of candidates) {
    try {
      const res = await api.get(path, config);
      return { path, data: res?.data };
    } catch (_) {
      // tenta o próximo
    }
  }
  throw new Error("Nenhuma rota funcionou");
}

function StatCard({ value, label, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    orange: "bg-orange-50 text-orange-700",
    purple: "bg-purple-50 text-purple-700",
  };
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`rounded-md px-3 py-2 text-center ${tones[tone] || tones.blue}`}>
        <div className="text-2xl font-bold leading-tight">{value}</div>
        <div className="mt-1 text-xs font-medium opacity-90">{label}</div>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, right }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
      <div className="flex items-center gap-2">
        <span className="text-sm">{icon}</span>
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      </div>
      {right}
    </div>
  );
}

function FeaturedCard({ game, onClick }) {
  const title = game?.title || game?.name || "Sem título";
  const img = safeImg(game?.cover_url || game?.background_image);
  const rating = game?.user_rating ?? game?.rating ?? game?.metacritic ?? null;

  const genres = Array.isArray(game?.genres) ? game.genres : [];
  const status = game?.status || game?.estado || "";

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-[320px] shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white text-left shadow-sm hover:shadow-md transition"
      title={title}
    >
      <div className="relative h-40 w-full bg-slate-100">
        {img ? (
          <img
            src={img}
            alt={title}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-500">
            Sem imagem
          </div>
        )}

        {rating != null && (
          <div className="absolute right-2 top-2 rounded-md bg-blue-600 px-2 py-1 text-xs font-bold text-white shadow">
            ★ {Number(rating).toFixed(1)}
          </div>
        )}
      </div>

      <div className="p-3">
        <div className="line-clamp-1 text-sm font-semibold text-slate-800">{title}</div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {genres?.[0] && (
            <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
              {genres[0]}
            </span>
          )}
          {status && (
            <span className="rounded bg-indigo-50 px-2 py-0.5 text-[11px] text-indigo-700">
              {status}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function ProgressRow({ game, maxHours = 1 }) {
  const title = game?.title || game?.name || "Sem título";
  const platform = game?.platform || game?.plataforma || "—";
  const last = game?.last_played_at || game?.lastPlayedAt || game?.updated_at || game?.updatedAt || null;

  const hours = toNumber(game?.hours_played ?? game?.hoursPlayed ?? game?.hours ?? 0);
  const pct = Math.min(100, Math.round((hours / Math.max(1, maxHours)) * 100));

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-800">{title}</div>
            <div className="mt-0.5 text-[11px] text-slate-500">
              {platform} • {timeAgoLabel(last)}
            </div>
          </div>
          <div className="text-[11px] font-semibold text-slate-600">{hours}h</div>
        </div>

        <div className="mt-2 h-2 w-full overflow-hidden rounded bg-slate-200">
          <div className="h-full rounded bg-indigo-600" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

function UpcomingItem({ item, onWishlist }) {
  const title = item?.title || item?.name || "Sem título";
  const released = item?.release_date || item?.released || null;
  const platforms = Array.isArray(item?.platforms) ? item.platforms : [];

  return (
    <div className="py-3">
      <div className="text-sm font-semibold text-indigo-700">{title}</div>
      <div className="mt-1 text-[11px] text-slate-500">
        {released ? formatDateShort(released) : "TBA"} • {platforms?.length ? platforms.slice(0, 2).join(" / ") : "Multi"}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  // Coleção / Wishlist (para os 4 cards + top + recentemente)
  const [collection, setCollection] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  // RAWG (para próximos lançamentos e (se quiseres) fallback)
  const [featuredRawg, setFeaturedRawg] = useState([]);
  const [upcomingRawg, setUpcomingRawg] = useState([]);

  async function loadDashboard() {
    setLoading(true);

    try {
      // Coleção (tenta várias rotas, porque cada projeto chama isto de maneira diferente)
      const col = await fetchFirstOk(
        ["/collection", "/colecao", "/games", "/jogos"],
        { params: { page_size: 500 } }
      );

      // Normaliza: às vezes vem { jogos: [] } ou { games: [] } ou array direto
      const colList =
        Array.isArray(col?.data) ? col.data :
        Array.isArray(col?.data?.jogos) ? col.data.jogos :
        Array.isArray(col?.data?.games) ? col.data.games :
        Array.isArray(col?.data?.collection) ? col.data.collection :
        [];

      setCollection(colList);

      // Wishlist
      try {
        const wl = await fetchFirstOk(
          ["/wishlist", "/wish", "/lista-desejos"],
          { params: { page_size: 500 } }
        );

        const wlList =
          Array.isArray(wl?.data) ? wl.data :
          Array.isArray(wl?.data?.jogos) ? wl.data.jogos :
          Array.isArray(wl?.data?.games) ? wl.data.games :
          Array.isArray(wl?.data?.wishlist) ? wl.data.wishlist :
          [];

        setWishlist(wlList);
      } catch (_) {
        setWishlist([]);
      }

      // RAWG: featured + upcoming (se o teu backend já tem isto, top)
      try {
        const [a, b] = await Promise.all([
          api.get("/external-games/featured", { params: { page_size: 12 } }),
          api.get("/external-games/upcoming", { params: { page_size: 3 } }),
        ]);

        setFeaturedRawg(a?.data?.jogos || []);
        setUpcomingRawg(b?.data?.jogos || []);
      } catch (_) {
        setFeaturedRawg([]);
        setUpcomingRawg([]);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = useMemo(() => {
    const total = collection.length;

    const concluded = collection.filter((g) => {
      const s = String(g?.status || g?.estado || "").toLowerCase();
      return ["concluido", "concluído", "completed", "done", "terminado"].includes(s);
    }).length;

    const hours = collection.reduce((acc, g) => {
      return acc + toNumber(g?.hours_played ?? g?.hoursPlayed ?? g?.hours ?? g?.playtime ?? 0);
    }, 0);

    const wishlistCount = wishlist.length || collection.filter((g) => !!g?.in_wishlist || !!g?.wishlist).length;

    return { total, concluded, hours, wishlistCount };
  }, [collection, wishlist]);

  const topGames = useMemo(() => {
    const list = [...collection];
    list.sort((a, b) => {
      const ra = toNumber(a?.user_rating ?? a?.rating ?? a?.score ?? 0);
      const rb = toNumber(b?.user_rating ?? b?.rating ?? b?.score ?? 0);
      if (rb !== ra) return rb - ra;
      const ha = toNumber(a?.hours_played ?? a?.hoursPlayed ?? a?.hours ?? 0);
      const hb = toNumber(b?.hours_played ?? b?.hoursPlayed ?? b?.hours ?? 0);
      return hb - ha;
    });
    return list.slice(0, 5);
  }, [collection]);

  const featured = useMemo(() => {
    // se tiveres jogos na coleção com rating, usa isso (fica como na tua print)
    const byRating = [...collection].filter((g) => toNumber(g?.user_rating ?? g?.rating ?? 0) > 0);
    byRating.sort((a, b) => toNumber(b?.user_rating ?? b?.rating ?? 0) - toNumber(a?.user_rating ?? a?.rating ?? 0));

    const pick = byRating.slice(0, 3);
    if (pick.length >= 3) return pick;

    // fallback: RAWG featured
    return (featuredRawg || []).slice(0, 3);
  }, [collection, featuredRawg]);

  const recentlyPlayed = useMemo(() => {
    const list = [...collection];
    list.sort((a, b) => {
      const da = new Date(a?.last_played_at || a?.updated_at || 0).getTime();
      const db = new Date(b?.last_played_at || b?.updated_at || 0).getTime();
      return db - da;
    });
    return list.slice(0, 3);
  }, [collection]);

  const maxRecentHours = useMemo(() => {
    return Math.max(
      1,
      ...recentlyPlayed.map((g) => toNumber(g?.hours_played ?? g?.hoursPlayed ?? g?.hours ?? 0))
    );
  }, [recentlyPlayed]);

  return (
    <div className="space-y-6">
      {/* HEADER AZUL (como na tua print) */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="bg-indigo-700 px-6 py-6 text-white">
          <h1 className="text-2xl font-bold">Bem-vindo de volta!</h1>
          <p className="mt-1 text-sm opacity-90">
            Continue a jogar onde parou ou descubra novos jogos
          </p>
        </div>

        {/* 4 CARDS */}
        <div className="grid gap-4 px-6 py-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard value={formatCompactNumber(summary.total)} label="Total Jogos" tone="blue" />
          <StatCard value={formatCompactNumber(summary.concluded)} label="Concluídos" tone="green" />
          <StatCard value={formatCompactNumber(summary.hours)} label="Horas Jogadas" tone="orange" />
          <StatCard value={formatCompactNumber(summary.wishlistCount)} label="Na Wishlist" tone="purple" />
        </div>
      </div>

      {/* GRID PRINCIPAL: esquerda (destaque + recentemente) / direita (top + próximos + ações) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* ESQUERDA (2 colunas) */}
        <div className="space-y-6 lg:col-span-2">
          {/* JOGOS EM DESTAQUE */}
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <SectionHeader
              icon="🔥"
              title="Jogos em Destaque"
              right={
                <button
                  type="button"
                  onClick={loadDashboard}
                  className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Atualizar
                </button>
              }
            />

            <div className="px-5 py-5">
              {loading ? (
                <div className="text-sm text-slate-500">A carregar…</div>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {featured?.length ? (
                    featured.map((g) => (
                      <FeaturedCard
                        key={g?.id || g?.external_id || g?.externalId || Math.random()}
                        game={g}
                        onClick={() => {
                          // se vier da coleção e tiver id interno, manda para detalhe interno;
                          // se vier do RAWG, manda para detalhe externo
                          const externalId = g?.external_id ?? g?.id;
                          if (g?.is_external || g?.external_id) {
                            navigate(`/app/external/${externalId}`);
                          } else if (g?.id) {
                            navigate(`/app/colecao/${g.id}`);
                          } else {
                            navigate(`/app/external/${externalId}`);
                          }
                        }}
                      />
                    ))
                  ) : (
                    <div className="text-sm text-slate-500">Sem destaques para mostrar.</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* JOGADOS RECENTEMENTE */}
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <SectionHeader
              icon="🕹️"
              title="Jogados Recentemente"
              right={
                <button
                  type="button"
                  onClick={() => navigate("/app/colecao")}
                  className="text-xs font-semibold text-indigo-700 hover:underline"
                >
                  Ver todos ›
                </button>
              }
            />

            <div className="px-5 py-2">
              {loading ? (
                <div className="py-5 text-sm text-slate-500">A carregar…</div>
              ) : recentlyPlayed?.length ? (
                <div className="divide-y divide-slate-200">
                  {recentlyPlayed.map((g) => (
                    <ProgressRow key={g?.id || g?.game_id || Math.random()} game={g} maxHours={maxRecentHours} />
                  ))}
                </div>
              ) : (
                <div className="py-5 text-sm text-slate-500">Ainda não tens jogos recentes.</div>
              )}
            </div>
          </div>
        </div>

        {/* DIREITA */}
        <div className="space-y-6">
          {/* TOP JOGOS */}
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <SectionHeader icon="📈" title="Top Jogos" />

            <div className="px-4 py-3">
              {loading ? (
                <div className="py-4 text-sm text-slate-500">A carregar…</div>
              ) : topGames?.length ? (
                <div className="space-y-2">
                  {topGames.map((g, idx) => {
                    const title = g?.title || g?.name || "Sem título";
                    const rating = toNumber(g?.user_rating ?? g?.rating ?? g?.score ?? 0);
                    const hours = toNumber(g?.hours_played ?? g?.hoursPlayed ?? g?.hours ?? 0);

                    return (
                      <div
                        key={g?.id || g?.game_id || Math.random()}
                        className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-slate-50"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-100 text-xs font-bold text-slate-700">
                            {idx + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-800">{title}</div>
                            <div className="mt-0.5 text-[11px] text-slate-500">
                              ★ {rating ? rating.toFixed(1) : "—"} • {hours ? `${hours}h` : "—"}
                            </div>
                          </div>
                        </div>

                        <div className="text-xs font-semibold text-green-600">
                          {hours ? `↗ +${Math.max(1, Math.round(hours / 10))}` : ""}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-4 text-sm text-slate-500">Sem dados para mostrar.</div>
              )}
            </div>
          </div>

          {/* PRÓXIMOS LANÇAMENTOS */}
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <SectionHeader
              icon="🗓️"
              title="Próximos Lançamentos"
              right={
                <button
                  type="button"
                  onClick={() => navigate("/app/wishlist")}
                  className="text-xs font-semibold text-indigo-700 hover:underline"
                >
                  Wishlist
                </button>
              }
            />

            <div className="px-4 py-1">
              {(upcomingRawg || []).length ? (
                <div className="divide-y divide-slate-200">
                  {upcomingRawg.slice(0, 3).map((g) => (
                    <UpcomingItem
                      key={g?.external_id ?? g?.id}
                      item={g}
                      onWishlist={() => navigate(`/app/external/${g?.external_id ?? g?.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-4 text-sm text-slate-500">Sem lançamentos para mostrar.</div>
              )}
            </div>
          </div>

          {/* AÇÕES RÁPIDAS */}
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="bg-indigo-700 px-5 py-4 text-white">
              <div className="text-sm font-semibold">Ações Rápidas</div>
            </div>

            <div className="space-y-3 px-5 py-5">
              <button
                type="button"
                onClick={() => navigate("/app/colecao/novo")}
                className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                + Adicionar Jogo
              </button>

              <button
                type="button"
                onClick={() => navigate("/app/estatisticas")}
                className="w-full rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Ver Estatísticas
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
