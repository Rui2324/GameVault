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
    } catch {
      // tenta o próximo
    }
  }
  throw new Error("Nenhuma rota funcionou");
}

// Skeleton Loaders
function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-800/90 overflow-hidden">
      <div className="h-44 skeleton" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-3/4 rounded skeleton" />
        <div className="h-3 w-1/2 rounded skeleton" />
      </div>
    </div>
  );
}

function SkeletonStatCard() {
  return (
    <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-4 border border-slate-200/50 dark:border-slate-700/50">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl skeleton" />
        <div className="space-y-2">
          <div className="h-6 w-12 rounded skeleton" />
          <div className="h-3 w-20 rounded skeleton" />
        </div>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-6 h-6 rounded skeleton" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded skeleton" />
        <div className="h-3 w-1/2 rounded skeleton" />
      </div>
    </div>
  );
}

function SkeletonActivityItem() {
  return (
    <div className="flex gap-3 py-3 px-3">
      <div className="w-10 h-10 rounded-full skeleton" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-4/5 rounded skeleton" />
        <div className="h-3 w-1/4 rounded skeleton" />
      </div>
      <div className="w-12 h-16 rounded-lg skeleton" />
    </div>
  );
}

function StatCard({ value, label, tone = "blue", icon }) {
  const tones = {
    blue: "from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700",
    green: "from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700",
    orange: "from-orange-500 to-amber-500 dark:from-orange-600 dark:to-amber-600",
    purple: "from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600",
  };
  const bgTones = {
    blue: "bg-blue-50 dark:bg-blue-900/20",
    green: "bg-emerald-50 dark:bg-emerald-900/20",
    orange: "bg-orange-50 dark:bg-orange-900/20",
    purple: "bg-purple-50 dark:bg-purple-900/20",
  };
  return (
    <div className={`card-3d rounded-xl ${bgTones[tone] || bgTones.blue} p-4 border border-slate-200/50 dark:border-slate-700/50`}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tones[tone] || tones.blue} flex items-center justify-center text-2xl shadow-lg`}>
            {icon}
          </div>
        )}
        <div>
          <div className="text-2xl font-bold text-slate-800 dark:text-white">{value}</div>
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, right }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-5 py-3">
      <div className="flex items-center gap-2">
        <span className="text-sm">{icon}</span>
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h2>
      </div>
      {right}
    </div>
  );
}

function FeaturedCard({ game, onClick }) {
  const title = game?.titulo || game?.title || game?.name || "Sem título";
  const img = safeImg(game?.url_capa || game?.cover_url || game?.background_image);
  const rating = game?.user_rating ?? game?.rating ?? game?.metacritic ?? null;

  const genreRaw = game?.genero || game?.genre || game?.genres || "";
  const genres = Array.isArray(genreRaw) ? genreRaw : (genreRaw ? genreRaw.split(",").map(s => s.trim()) : []);
  const status = game?.estado || game?.status || "";

  return (
    <button
      type="button"
      onClick={onClick}
      className="card-3d group w-full overflow-hidden rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-800/90 text-left shadow-lg backdrop-blur-sm"
      title={title}
    >
      <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        {img ? (
          <img
            src={img}
            alt={title}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-500 dark:text-slate-400">
            Sem imagem
          </div>
        )}
        
        {/* Gradiente overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {rating != null && (
          <div className="absolute right-2 top-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg">
            ★ {Number(rating).toFixed(1)}
          </div>
        )}
        
        {/* Título no hover (sobre a imagem) */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <div className="text-white font-semibold text-sm drop-shadow-lg">{title}</div>
        </div>
      </div>

      <div className="p-3">
        <div className="line-clamp-1 text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{title}</div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {genres?.[0] && (
            <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-400">
              {genres[0]}
            </span>
          )}
          {status && (
            <span className="rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 px-2.5 py-0.5 text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
              {status}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function ProgressRow({ game, maxHours = 1 }) {
  const title = game?.titulo || game?.title || game?.name || "Sem título";
  const platform = game?.plataforma || game?.platform || "—";
  const last = game?.last_played_at || game?.lastPlayedAt || game?.updated_at || game?.updatedAt || null;

  const hours = toNumber(game?.horas_jogadas ?? game?.hours_played ?? game?.hoursPlayed ?? game?.hours ?? 0);
  const pct = Math.min(100, Math.round((hours / Math.max(1, maxHours)) * 100));

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</div>
            <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
              {platform} • {timeAgoLabel(last)}
            </div>
          </div>
          <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">{hours}h</div>
        </div>

        <div className="mt-2 h-2 w-full overflow-hidden rounded bg-slate-200 dark:bg-slate-700">
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
    <button
      type="button"
      onClick={onWishlist}
      className="w-full py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
    >
      <div className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">{title}</div>
      <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
        {released ? formatDateShort(released) : "TBA"} • {platforms?.length ? platforms.slice(0, 2).join(" / ") : "Multi"}
      </div>
    </button>
  );
}

function ActivityFeedItem({ activity, onNavigate }) {
  const { type, user, game, rating, status, date } = activity;

  const getActivityConfig = () => {
    switch (type) {
      case "game_added":
        return {
          text: "adicionou à coleção",
          icon: "🎮",
          borderColor: "border-l-blue-500",
          bgColor: "bg-blue-500/5 dark:bg-blue-500/10",
        };
      case "review":
        return {
          text: rating ? `avaliou com ${Number(rating).toFixed(1)}★` : "escreveu uma review",
          icon: "⭐",
          borderColor: "border-l-amber-500",
          bgColor: "bg-amber-500/5 dark:bg-amber-500/10",
        };
      case "status_change":
        if (["concluido", "completed", "completo"].includes(status?.toLowerCase())) {
          return {
            text: "completou",
            icon: "🏆",
            borderColor: "border-l-emerald-500",
            bgColor: "bg-emerald-500/5 dark:bg-emerald-500/10",
          };
        }
        return {
          text: `marcou como ${status}`,
          icon: "📝",
          borderColor: "border-l-slate-400",
          bgColor: "bg-slate-500/5 dark:bg-slate-500/10",
        };
      default:
        return {
          text: "fez uma atividade",
          icon: "📌",
          borderColor: "border-l-slate-400",
          bgColor: "bg-slate-500/5 dark:bg-slate-500/10",
        };
    }
  };

  const config = getActivityConfig();

  const getTimeAgo = (dateValue) => {
    if (!dateValue) return "";
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return "";

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "agora";
    if (diffMins < 60) return `há ${diffMins}m`;
    if (diffHours < 24) return `há ${diffHours}h`;
    if (diffDays === 1) return "ontem";
    if (diffDays < 7) return `há ${diffDays} dias`;
    return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
  };

  const avatarUrl = user?.avatar_url?.startsWith("http") 
    ? user.avatar_url 
    : user?.avatar_url 
      ? `http://localhost:4000${user.avatar_url}` 
      : null;

  return (
    <div className={`flex gap-3 py-3 px-3 -mx-3 rounded-lg border-l-4 ${config.borderColor} ${config.bgColor} transition-all hover:scale-[1.01]`}>
      {/* Avatar */}
      <button
        type="button"
        onClick={() => onNavigate(`/app/perfil/${user?.id}`)}
        className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-indigo-400 transition shadow-md"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={user?.name}
            className="w-full h-full object-cover"
          />
        ) : (
          user?.name?.charAt(0).toUpperCase() || "?"
        )}
      </button>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-slate-700 dark:text-slate-300">
          <button
            type="button"
            onClick={() => onNavigate(`/app/perfil/${user?.id}`)}
            className="font-semibold text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            {user?.name || "Utilizador"}
          </button>
          {" "}
          <span className="text-slate-600 dark:text-slate-400">{config.text}</span>
          {" "}
          <button
            type="button"
            onClick={() => onNavigate(`/app/explorar/${game?.id}`)}
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {game?.title || "jogo"}
          </button>
          {" "}
          <span className="text-base">{config.icon}</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
          {getTimeAgo(date)}
        </div>
      </div>

      {/* Cover do jogo (mini) */}
      {game?.cover_url && (
        <button
          type="button"
          onClick={() => onNavigate(`/app/explorar/${game?.id}`)}
          className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 hover:opacity-80 transition shadow-md"
        >
          <img
            src={safeImg(game.cover_url)}
            alt={game.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </button>
      )}
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

  // Ranking global de jogos
  const [globalTopGames, setGlobalTopGames] = useState([]);

  // Utilizadores para descobrir
  const [discoverUsers, setDiscoverUsers] = useState([]);

  // Feed de atividade
  const [activityFeed, setActivityFeed] = useState([]);
  const [feedFilter, setFeedFilter] = useState("all"); // "all" ou "following"

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
        Array.isArray(col?.data?.colecao) ? col.data.colecao :
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
      } catch {
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
      } catch {
        setFeaturedRawg([]);
        setUpcomingRawg([]);
      }

      // Ranking global de jogos mais bem avaliados
      try {
        const topRes = await api.get("/stats/top-games", { params: { limit: 5 } });
        setGlobalTopGames(topRes?.data?.topGames || []);
      } catch {
        setGlobalTopGames([]);
      }

      // Utilizadores para descobrir (para seguir)
      try {
        const usersRes = await api.get("/profile/users/discover", { params: { limit: 5 } });
        setDiscoverUsers(usersRes?.data?.users || []);
      } catch {
        setDiscoverUsers([]);
      }

      // Feed de atividade da comunidade
      try {
        const feedRes = await api.get("/activity/feed", { params: { limit: 15 } });
        setActivityFeed(feedRes?.data?.activities || []);
      } catch {
        setActivityFeed([]);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recarregar feed quando o filtro muda
  useEffect(() => {
    async function loadFeed() {
      try {
        const feedRes = await api.get("/activity/feed", { 
          params: { limit: 15, following: feedFilter === "following" ? "true" : "false" } 
        });
        setActivityFeed(feedRes?.data?.activities || []);
      } catch {
        setActivityFeed([]);
      }
    }
    loadFeed();
  }, [feedFilter]);

  const summary = useMemo(() => {
    const total = collection.length;

    const concluded = collection.filter((g) => {
      const s = String(g?.status || g?.estado || "").toLowerCase();
      return ["concluido", "concluído", "completed", "done", "terminado", "completo"].includes(s);
    }).length;

    const hours = collection.reduce((acc, g) => {
      return acc + toNumber(g?.hours_played ?? g?.horas_jogadas ?? g?.hoursPlayed ?? g?.hours ?? g?.playtime ?? 0);
    }, 0);

    const wishlistCount = wishlist.length || collection.filter((g) => !!g?.in_wishlist || !!g?.wishlist).length;

    return { total, concluded, hours, wishlistCount };
  }, [collection, wishlist]);

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
      {/* HEADER COM GRADIENTE ANIMADO */}
      <div className="overflow-hidden rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 dark:from-indigo-700 dark:via-purple-700 dark:to-pink-600 animate-gradient px-6 py-8 text-white relative overflow-hidden">
          {/* Efeito de brilho */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-pulse" style={{ animationDuration: '3s' }} />
          
          <div className="relative z-10">
            <h1 className="text-3xl font-bold tracking-tight">Bem-vindo de volta! 👋</h1>
            <p className="mt-2 text-base text-white/80">
              Continue a jogar onde parou ou descubra novos jogos
            </p>
          </div>
        </div>

        {/* 4 CARDS COM ÍCONES */}
        <div className="grid gap-4 px-6 py-5 sm:grid-cols-2 lg:grid-cols-4 bg-white dark:bg-slate-800">
          <StatCard value={formatCompactNumber(summary.total)} label="Total Jogos" tone="blue" icon="🎮" />
          <StatCard value={formatCompactNumber(summary.concluded)} label="Concluídos" tone="green" icon="✅" />
          <StatCard value={formatCompactNumber(summary.hours)} label="Horas Jogadas" tone="orange" icon="⏱️" />
          <StatCard value={formatCompactNumber(summary.wishlistCount)} label="Na Wishlist" tone="purple" icon="💜" />
        </div>
      </div>

      {/* GRID PRINCIPAL: esquerda (destaque + recentemente) / direita (top + próximos + ações) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* ESQUERDA (2 colunas) */}
        <div className="space-y-6 lg:col-span-2">
          {/* JOGOS EM DESTAQUE */}
          <div className="rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
            <SectionHeader
              icon="🔥"
              title="Jogos em Destaque"
              right={
                <button
                  type="button"
                  onClick={loadDashboard}
                  className="rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600"
                >
                  Atualizar
                </button>
              }
            />

            <div className="px-5 py-5">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                            navigate(`/app/explorar/${externalId}`);
                          } else if (g?.id) {
                            navigate(`/app/jogo/${g.id}`);
                          } else {
                            navigate(`/app/explorar/${externalId}`);
                          }
                        }}
                      />
                    ))
                  ) : (
                    <div className="text-sm text-slate-500 dark:text-slate-400">Sem destaques para mostrar.</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* JOGADOS RECENTEMENTE */}
          <div className="rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
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
                <div className="space-y-1">
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </div>
              ) : recentlyPlayed?.length ? (
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {recentlyPlayed.map((g) => (
                    <ProgressRow key={g?.id || g?.game_id || Math.random()} game={g} maxHours={maxRecentHours} />
                  ))}
                </div>
              ) : (
                <div className="py-5 text-sm text-slate-500">Ainda não tens jogos recentes.</div>
              )}
            </div>
          </div>

          {/* FEED DE ATIVIDADE */}
          <div className="rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
            <SectionHeader
              icon="📰"
              title="Atividade da Comunidade"
              right={
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFeedFilter("all")}
                    className={`px-2 py-1 text-xs font-medium rounded transition ${
                      feedFilter === "all"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedFilter("following")}
                    className={`px-2 py-1 text-xs font-medium rounded transition ${
                      feedFilter === "following"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    A Seguir
                  </button>
                </div>
              }
            />

            <div className="px-5 py-2 max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="space-y-2">
                  <SkeletonActivityItem />
                  <SkeletonActivityItem />
                  <SkeletonActivityItem />
                </div>
              ) : activityFeed?.length ? (
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {activityFeed.map((act, idx) => (
                    <ActivityFeedItem
                      key={`${act.type}-${act.user?.id}-${act.game?.id}-${idx}`}
                      activity={act}
                      onNavigate={navigate}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-5 text-sm text-slate-500 dark:text-slate-400 text-center">
                  {feedFilter === "following" 
                    ? "Ainda não segues ninguém ou não há atividade recente."
                    : "Não há atividade recente na comunidade."
                  }
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DIREITA */}
        <div className="space-y-6">
          {/* TOP JOGOS - Ranking Global */}
          <div className="rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
            <SectionHeader icon="🏆" title="Top Jogos (Ranking Global)" />

            <div className="px-4 py-3">
              {loading ? (
                <div className="space-y-2">
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </div>
              ) : globalTopGames?.length ? (
                <div className="space-y-2">
                  {globalTopGames.map((g, idx) => {
                    const title = g?.titulo || g?.title || g?.name || "Sem título";
                    const rating = toNumber(g?.rating ?? g?.media_rating ?? 0);
                    const totalUsers = g?.total_utilizadores || 0;
                    const gameId = g?.id || g?.game_id;
                    const externalId = g?.external_id;

                    const handleClick = async () => {
                      if (!gameId) return;
                      try {
                        // Buscar a entrada na coleção do utilizador pelo game_id
                        const res = await api.get(`/collection/by-game/${gameId}`);
                        const entryId = res?.data?.entrada?.id;
                        if (entryId) {
                          navigate(`/app/jogo/${entryId}`);
                          return;
                        }
                      } catch {
                        // Não está na coleção do utilizador - continua para fallback
                      }
                      
                      // Fallback: se tiver external_id, vai para página externa
                      if (externalId) {
                        navigate(`/app/explorar/${externalId}`);
                        return;
                      }
                      
                      // Se não tiver external_id, procura na API RAWG pelo nome
                      try {
                        const searchRes = await api.get("/external-games/search", { params: { query: title } });
                        const games = searchRes?.data?.jogos || searchRes?.data?.results || [];
                        if (games.length > 0) {
                          const firstMatch = games[0];
                          const rawgId = firstMatch?.external_id || firstMatch?.id;
                          if (rawgId) {
                            navigate(`/app/explorar/${rawgId}`);
                            return;
                          }
                        }
                      } catch {
                        // Falhou a pesquisa
                      }
                      
                      // Último fallback: mostra mensagem
                      alert(`O jogo "${title}" não está na tua coleção e não foi encontrado na base de dados externa.`);
                    };

                    return (
                      <div
                        key={gameId || Math.random()}
                        className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-100 dark:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300">
                            {idx + 1}
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={handleClick}
                              className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline text-left"
                            >
                              {title}
                            </button>
                            <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                              ★ {rating ? Number(rating).toFixed(1) : "—"} • {totalUsers} {totalUsers === 1 ? "voto" : "votos"}
                            </div>
                          </div>
                        </div>

                        <div className="text-xs font-semibold text-amber-600">
                          {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : ""}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-4 text-sm text-slate-500">
                  Ainda não há jogos avaliados pelos utilizadores.
                </div>
              )}
            </div>
          </div>

          {/* PRÓXIMOS LANÇAMENTOS */}
          <div className="rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
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
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {upcomingRawg.slice(0, 3).map((g) => (
                    <UpcomingItem
                      key={g?.external_id ?? g?.id}
                      item={g}
                      onWishlist={() => navigate(`/app/explorar/${g?.external_id ?? g?.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-4 text-sm text-slate-500">Sem lançamentos para mostrar.</div>
              )}
            </div>
          </div>

          {/* DESCOBRIR UTILIZADORES */}
          <div className="rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
            <SectionHeader icon="👥" title="Descobrir Utilizadores" />

            <div className="px-4 py-3">
              {loading ? (
                <div className="space-y-2">
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </div>
              ) : discoverUsers?.length ? (
                <div className="space-y-2">
                  {discoverUsers.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => navigate(`/app/perfil/${u.id}`)}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0">
                        {u.avatar_url ? (
                          <img
                            src={u.avatar_url.startsWith("http") ? u.avatar_url : `http://localhost:4000${u.avatar_url}`}
                            alt={u.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          u.name?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{u.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Nível {u.level} • {u.total_games || 0} jogos • {u.followers_count || 0} seguidores
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/app/perfil/${u.id}`);
                        }}
                        className="px-2 py-1 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded transition"
                      >
                        Ver
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-sm text-slate-500 text-center">
                  Não há utilizadores para sugerir de momento.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
