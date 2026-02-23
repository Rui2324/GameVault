import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { rawgOriginal } from "../utils/rawgImages";
import { 
  Calendar,
  Star,
  Users,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  Library,
  Loader2,
} from "lucide-react";

function safeImg(url) {
  const u = rawgOriginal(url || "");
  return u || "";
}

function formatDateShort(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
}

function getTimeAgo(dateValue) {
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
}

// ============ HOOK: INTERSECTION OBSERVER ============

function useInView(options = {}) {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: "50px", ...options }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, isInView];
}

// ============ COMPONENTES ============

function RetroCard({ children, color = "fuchsia", className = "" }) {
  const colors = {
    fuchsia: "border-fuchsia-500 shadow-[4px_4px_0px_0px_rgba(217,70,239,0.5)]",
    cyan: "border-cyan-400 shadow-[4px_4px_0px_0px_rgba(34,211,238,0.5)]",
    yellow: "border-yellow-400 shadow-[4px_4px_0px_0px_rgba(250,204,21,0.5)]",
    green: "border-green-400 shadow-[4px_4px_0px_0px_rgba(74,222,128,0.5)]",
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border-2 ${colors[color]} ${className}`}>
      {children}
    </div>
  );
}

function RetroButton({ children, color = "fuchsia", onClick, className = "" }) {
  const colors = {
    fuchsia: "border-fuchsia-500 bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/20 dark:text-fuchsia-400 hover:bg-fuchsia-500 hover:text-white shadow-[3px_3px_0px_0px_rgba(217,70,239,0.6)]",
    cyan: "border-cyan-400 bg-cyan-50 text-cyan-600 dark:bg-cyan-400/20 dark:text-cyan-400 hover:bg-cyan-400 hover:text-slate-900 shadow-[3px_3px_0px_0px_rgba(34,211,238,0.6)]",
    yellow: "border-yellow-400 bg-yellow-50 text-yellow-600 dark:bg-yellow-400/20 dark:text-yellow-400 hover:bg-yellow-400 hover:text-slate-900 shadow-[3px_3px_0px_0px_rgba(250,204,21,0.6)]",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 border-2 font-bold text-sm uppercase tracking-wide transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none ${colors[color]} ${className}`}
    >
      {children}
    </button>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <h2 className="text-xl font-black uppercase tracking-wider text-slate-900 dark:text-white">
        {children}
      </h2>
      <div className="flex-1 h-0.5 bg-gradient-to-r from-fuchsia-500 via-cyan-400 to-transparent opacity-50" />
    </div>
  );
}

function AnimatedSection({ children, className = "", delay = 0 }) {
  const [ref, isInView] = useInView();

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isInView
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function GameCard({ game, onClick }) {
  const title = game?.titulo || game?.title || game?.name || "Sem título";
  const img = safeImg(game?.url_capa || game?.cover_url || game?.background_image);
  const rating = game?.media_rating ?? game?.user_rating ?? game?.rating ?? game?.metacritic ?? null;
  const totalUsers = game?.total_utilizadores || null;
  const genreRaw = game?.genero || game?.genre || game?.genres || "";
  const genres = Array.isArray(genreRaw) ? genreRaw : (genreRaw ? genreRaw.split(",").map(s => s.trim()) : []);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left w-full"
    >
      <RetroCard color="cyan" className="overflow-hidden transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
        <div className="relative aspect-video w-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          {img ? (
            <img
              src={img}
              alt={title}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400 dark:text-slate-600 font-bold text-xs">
              SEM IMAGEM
            </div>
          )}

          {rating != null && (
            <div className="absolute top-2 right-2 bg-yellow-400 text-slate-900 text-xs font-black px-2 py-1 border-2 border-yellow-300 shadow-md flex items-center gap-1">
              <Star size={12} fill="currentColor" /> {Number(rating).toFixed(1)}
            </div>
          )}
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 border-t-2 border-cyan-400/20">
          <div className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
            {title}
          </div>
          <div className="flex items-center justify-between mt-1">
            {genres?.[0] ? (
              <div className="text-xs text-fuchsia-600 dark:text-fuchsia-400 font-bold truncate">{genres[0]}</div>
            ) : <span />}
            {totalUsers && (
              <div className="text-xs text-slate-500 font-medium">
                {totalUsers} {totalUsers === 1 ? "voto" : "votos"}
              </div>
            )}
          </div>
        </div>
      </RetroCard>
    </button>
  );
}

function UpcomingCardCompact({ game, onClick, onWishlist, isInWishlist, wishlistLoading, showDivider = false }) {
  const title = game?.title || game?.name || "Sem título";
  const released = game?.release_date || game?.released || null;
  const img = safeImg(game?.background_image || game?.cover_url);

  return (
    <button type="button" onClick={onClick} className="group text-left w-full">
      <div className="relative flex items-center gap-3 py-3 px-3 border-b border-yellow-400/10 last:border-0 hover:bg-yellow-400/5 transition rounded">
        <div className="w-18 h-14 bg-slate-200 dark:bg-slate-800 overflow-hidden border border-yellow-400/30 flex-shrink-0 rounded-sm">
          {img ? (
            <img src={img} alt={title} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center font-bold text-[9px] text-slate-400">—</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-yellow-500 dark:group-hover:text-yellow-400 transition-colors">{title}</div>
          <div className="text-[11px] text-yellow-500 dark:text-yellow-400/70 font-bold uppercase">{released ? formatDateShort(released) : "TBA"}</div>
        </div>
        {onWishlist && (
          <button
            type="button"
            title={isInWishlist ? "Na tua wishlist" : "Adicionar à wishlist"}
            onClick={(e) => { e.stopPropagation(); if (!isInWishlist && !wishlistLoading) onWishlist(game); }}
            className={`p-1 transition-all flex-shrink-0 ${isInWishlist ? "text-green-400" : "text-slate-500 hover:text-yellow-400"}`}
          >
            {wishlistLoading ? <Loader2 size={13} className="animate-spin" /> : isInWishlist ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
          </button>
        )}
        {showDivider && (
          <span className="pointer-events-none absolute left-3 right-3 -bottom-px h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-70" aria-hidden="true" />
        )}
      </div>
    </button>
  );
}

function ActivityItem({ activity, onNavigate }) {
  const { type, user, game, rating, status, date } = activity;

  const getConfig = () => {
    switch (type) {
      case "game_added": return { text: "adicionou", color: "text-cyan-600 dark:text-cyan-400" };
      case "review": return { text: rating ? <>avaliou <Star size={12} className="inline" /> {Number(rating).toFixed(1)}</> : "review", color: "text-yellow-600 dark:text-yellow-400" };
      case "status_change":
        if (["concluido", "completed", "completo"].includes(status?.toLowerCase())) {
          return { text: "completou", color: "text-green-600 dark:text-green-400" };
        }
        return { text: status, color: "text-slate-500 dark:text-slate-400" };
      default: return { text: "atividade", color: "text-slate-500 dark:text-slate-400" };
    }
  };

  const config = getConfig();
  const avatarUrl = user?.avatar_url?.startsWith("http") ? user.avatar_url : user?.avatar_url ? `http://localhost:4000${user.avatar_url}` : null;

  // Função helper para decidir o link correto do jogo na atividade
  const handleGameClick = () => {
    // Tenta usar external_id primeiro para ir para explorar
    if (game?.external_id) {
        onNavigate(`/app/explorar/${game.external_id}`);
    } else if (game?.id) {
        onNavigate(`/app/explorar/${game.id}`); 
    }
  };

  return (
    <div className="flex gap-3 py-3 border-b border-slate-200 dark:border-slate-700/50 last:border-0 group hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded transition">
      <button
        type="button"
        onClick={() => onNavigate(`/app/perfil/${user?.id}`)}
        className="w-10 h-10 border-2 border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-500/20 flex items-center justify-center text-fuchsia-600 dark:text-fuchsia-400 font-bold text-sm overflow-hidden flex-shrink-0 hover:bg-fuchsia-500 hover:text-white transition rounded-full"
      >
        {avatarUrl ? <img src={avatarUrl} alt={user?.name} className="w-full h-full object-cover" /> : user?.name?.charAt(0).toUpperCase() || "?"}
      </button>

      <div className="flex-1 min-w-0">
        <div className="text-sm">
          <button type="button" onClick={() => onNavigate(`/app/perfil/${user?.id}`)} className="font-bold text-slate-900 dark:text-white hover:text-fuchsia-600 dark:hover:text-fuchsia-400 transition">
            {user?.name || "User"}
          </button>
          {" "}<span className={`${config.color} font-medium`}>{config.text}</span>{" "}
          <button type="button" onClick={handleGameClick} className="font-bold text-cyan-600 dark:text-cyan-400 hover:underline">
            {game?.title || "jogo"}
          </button>
        </div>
        <div className="text-xs text-slate-400 mt-1 font-bold">{getTimeAgo(date)}</div>
      </div>
    </div>
  );
}

function UserCard({ user, onClick }) {
  const avatarUrl = user?.avatar_url?.startsWith("http") ? user.avatar_url : user?.avatar_url ? `http://localhost:4000${user.avatar_url}` : null;

  return (
    <button type="button" onClick={onClick} className="group text-left w-full">
      <RetroCard color="green" className="p-4 flex items-center gap-3 transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
        <div className="w-12 h-12 border-2 border-green-400 bg-green-50 dark:bg-green-400/20 flex items-center justify-center text-green-600 dark:text-green-400 font-bold overflow-hidden flex-shrink-0 group-hover:bg-green-400 group-hover:text-slate-900 transition rounded-full">
          {avatarUrl ? <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover" /> : user.name?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-900 dark:text-white truncate group-hover:text-green-600 dark:group-hover:text-green-400 transition">{user.name}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Lv.{user.level} · {user.total_games || 0} jogos</div>
        </div>
      </RetroCard>
    </button>
  );
}

function SkeletonRetro({ className = "" }) {
  return <div className={`bg-slate-200 dark:bg-slate-800 animate-pulse border-2 border-slate-300 dark:border-slate-700 ${className}`} />;
}



function RecentGameCard({ game, onClick }) {
  const title = game?.titulo || game?.title || game?.name || "Sem título";
  const img = safeImg(game?.url_capa || game?.cover_url || game?.background_image);
  const status = game?.estado || game?.status || "";

  const statusColors = {
    concluido: "bg-green-400 text-slate-900",
    completed: "bg-green-400 text-slate-900",
    "a jogar": "bg-cyan-400 text-slate-900",
    a_jogar: "bg-cyan-400 text-slate-900",
    playing: "bg-cyan-400 text-slate-900",
    "por jogar": "bg-yellow-400 text-slate-900",
    por_jogar: "bg-yellow-400 text-slate-900",
    backlog: "bg-yellow-400 text-slate-900",
    abandonado: "bg-red-400 text-white",
    dropped: "bg-red-400 text-white",
  };

  const statusLabel = {
    concluido: "Concluído",
    completed: "Concluído",
    "a jogar": "A Jogar",
    a_jogar: "A Jogar",
    playing: "A Jogar",
    "por jogar": "Por Jogar",
    por_jogar: "Por Jogar",
    backlog: "Backlog",
    abandonado: "Abandonado",
    dropped: "Abandonado",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left flex-shrink-0 w-32 sm:w-36"
    >
      <div className="relative aspect-video w-full bg-slate-200 dark:bg-slate-800 overflow-hidden border-2 border-fuchsia-500/40 group-hover:border-fuchsia-500 transition-all shadow-[3px_3px_0px_0px_rgba(217,70,239,0.3)] group-hover:shadow-none group-hover:translate-x-[2px] group-hover:translate-y-[2px]">
        {img ? (
          <img
            src={img}
            alt={title}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400 dark:text-slate-600 font-bold text-xs">
            SEM IMAGEM
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {/* Status badge */}
        {status && statusColors[status.toLowerCase()] && (
          <div className={`absolute top-2 left-2 text-[10px] font-black px-1.5 py-0.5 uppercase tracking-wider ${statusColors[status.toLowerCase()]}`}>
            {statusLabel[status.toLowerCase()] || status}
          </div>
        )}

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-2.5">
          <div className="text-xs font-bold text-white truncate drop-shadow-lg">
            {title}
          </div>
        </div>
      </div>
    </button>
  );
}

// ============ PÁGINA PRINCIPAL ============

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const [featuredGames, setFeaturedGames] = useState([]);
  const [upcomingGames, setUpcomingGames] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [discoverUsers, setDiscoverUsers] = useState([]);
  const [recentGames, setRecentGames] = useState([]);

  // Wishlist state for upcoming cards
  const [wishlistedIds, setWishlistedIds] = useState(new Set());
  const [wishlistLoadingId, setWishlistLoadingId] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [topRated, upcoming, feed, users, collection] = await Promise.allSettled([
          api.get("/stats/top-games", { params: { limit: 8 } }),
          api.get("/external-games/upcoming", { params: { page_size: 6 } }),
          api.get("/activity/feed", { params: { limit: 10 } }),
          api.get("/profile/users/discover", { params: { limit: 4 } }),
          api.get("/collection"),
        ]);

        if (topRated.status === "fulfilled") setFeaturedGames(topRated.value?.data?.topGames || []);
        if (upcoming.status === "fulfilled") setUpcomingGames(upcoming.value?.data?.jogos || []);
        if (feed.status === "fulfilled") setActivityFeed(feed.value?.data?.activities || []);
        if (users.status === "fulfilled") setDiscoverUsers(users.value?.data?.users || []);

        if (collection.status === "fulfilled") {
          const colecao = collection.value?.data?.colecao || [];
          const sorted = [...colecao].sort((a, b) => {
            const da = new Date(a.criado_em || 0).getTime();
            const db = new Date(b.criado_em || 0).getTime();
            return db - da;
          });
          setRecentGames(sorted.slice(0, 10));
        }

        try {
          const wlRes = await api.get("/wishlist");
          const wlExternalIds = new Set(
            (wlRes.data?.wishlist || [])
              .map(w => w.external_id)
              .filter(Boolean)
          );
          setWishlistedIds(wlExternalIds);
        } catch { /* ignore */ }

      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user?.id]);

  // Handler seguro para navegação
  const handleGameClick = (game) => {
    const targetId = game.external_id || game.id;
    navigate(`/app/explorar/${targetId}`);
  };

  // Handler para adicionar upcoming game à wishlist
  const handleAddToWishlist = useCallback(async (game) => {
    const externalId = game.external_id || game.id;
    if (!externalId || wishlistedIds.has(externalId)) return;

    setWishlistLoadingId(externalId);
    try {
      await api.post("/external-games/import/wishlist", { external_id: externalId });
      setWishlistedIds(prev => new Set([...prev, externalId]));
    } catch (err) {
      if (err?.response?.status === 409) {
        setWishlistedIds(prev => new Set([...prev, externalId]));
      }
      console.error("Erro ao adicionar à wishlist:", err);
    } finally {
      setWishlistLoadingId(null);
    }
  }, [wishlistedIds]);

  const userName = user?.name || "Jogador";

  return (
    <div className="space-y-10 pb-10">
      {/* ========== HERO BANNER PERSONALIZADO ========== */}
      <AnimatedSection>
        <RetroCard color="fuchsia" className="p-4 sm:p-6 md:p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(217,70,239,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(217,70,239,0.1)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-fuchsia-600 dark:text-fuchsia-400 text-xs sm:text-sm font-bold uppercase tracking-widest mb-2">
              <span className="inline-block w-2 h-2 sm:w-3 sm:h-3 bg-fuchsia-500 animate-pulse" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-2 sm:mb-4 tracking-tight drop-shadow-sm">
              Bem-vindo de volta, <span className="text-fuchsia-500 dark:text-fuchsia-400">{userName}</span>!
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base max-w-xl font-medium">
              Descobre novos jogos, acompanha a comunidade e expande a tua coleção.
            </p>
          </div>

          <div className="absolute top-4 right-4 w-3 h-3 sm:w-4 sm:h-4 bg-cyan-400 shadow-lg" />
          <div className="absolute top-4 right-10 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-400 shadow-lg" />
          <div className="absolute bottom-4 right-6 w-2 h-2 sm:w-3 sm:h-3 bg-fuchsia-500 shadow-lg" />
        </RetroCard>
      </AnimatedSection>

      

      {/* ========== TOP AVALIADOS + EM BREVE ========== */}
      <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
        {/* COLUNA ESQUERDA - JOGOS */}
        <div className="lg:col-span-2 space-y-8 md:space-y-10">
          <AnimatedSection delay={200}>
            <section>
              <SectionTitle>Top Avaliados</SectionTitle>
              
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                {[...Array(8)].map((_, i) => <SkeletonRetro key={i} className="aspect-video" />)}
                </div>
              ) : featuredGames.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                  {featuredGames.slice(0, 8).map((game) => (
                    <GameCard 
                      key={game.id || game.external_id} 
                      game={game} 
                      onClick={() => handleGameClick(game)} 
                    />
                  ))}
                </div>
              ) : (
                <RetroCard color="cyan" className="p-6 sm:p-8 text-center text-slate-500 font-medium">
                  Ainda não há jogos avaliados.
                </RetroCard>
              )}
            </section>
          </AnimatedSection>
        </div>

        {/* COLUNA DIREITA */}
        <div className="space-y-8">
          <AnimatedSection delay={300}>
            <section>
              <SectionTitle>Em Breve</SectionTitle>
              <div className="space-y-2">
                {loading ? (
                  <>
                    {[...Array(6)].map((_, i) => <SkeletonRetro key={i} className="h-14" />)}
                  </>
                ) : upcomingGames.length > 0 ? (
                  <RetroCard color="yellow" className="overflow-hidden">
                    {upcomingGames.slice(0, 6).map((game, idx, arr) => {
                      const eid = game.external_id || game.id;
                      return (
                        <UpcomingCardCompact
                          key={eid}
                          game={game}
                          onClick={() => navigate(`/app/explorar/${eid}`)}
                          onWishlist={handleAddToWishlist}
                          isInWishlist={wishlistedIds.has(eid)}
                          wishlistLoading={wishlistLoadingId === eid}
                          showDivider={idx < arr.length - 1}
                        />
                      );
                    })}
                  </RetroCard>
                ) : (
                  <div className="text-center py-6 text-slate-500">Sem lançamentos próximos</div>
                )}
              </div>
            </section>
          </AnimatedSection>
        </div>
      </div>

      {/* ========== ATIVIDADE + DESCOBRIR ========== */}
      <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
        {/* ATIVIDADE - 2/3 da largura */}
        <AnimatedSection delay={100} className="lg:col-span-2">
          <section>
            <SectionTitle>Atividade</SectionTitle>
            <RetroCard color="fuchsia" className="p-3 sm:p-4">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <SkeletonRetro className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-2"><SkeletonRetro className="h-4 w-3/4" /><SkeletonRetro className="h-3 w-1/4" /></div>
                    </div>
                  ))}
                </div>
              ) : activityFeed.length > 0 ? (
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {activityFeed.map((act, idx) => (
                    <ActivityItem key={`${act.type}-${act.user?.id}-${act.game?.id}-${idx}`} activity={act} onNavigate={navigate} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">Sem atividade recente</div>
              )}
            </RetroCard>
          </section>
        </AnimatedSection>

        {/* DESCOBRIR - 1/3 da largura */}
        <AnimatedSection delay={200}>
          <section>
            <SectionTitle>Descobrir</SectionTitle>
            <RetroCard color="green" className="p-3 sm:p-4">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => <SkeletonRetro key={i} className="h-16" />)}
                </div>
              ) : discoverUsers.length > 0 ? (
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar pr-2 space-y-2">
                  {discoverUsers.map((user) => (
                    <UserCard key={user.id} user={user} onClick={() => navigate(`/app/perfil/${user.id}`)} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">Sem sugestões de momento</div>
              )}
            </RetroCard>
          </section>
        </AnimatedSection>
      </div>
    </div>
  );
}