import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { rawgOriginal } from "../utils/rawgImages";

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

// ============ COMPONENTES RETRO ============

function RetroCard({ children, color = "fuchsia", className = "" }) {
  const colors = {
    fuchsia: "border-fuchsia-500 shadow-[4px_4px_0px_0px_rgba(217,70,239,0.8)]",
    cyan: "border-cyan-400 shadow-[4px_4px_0px_0px_rgba(34,211,238,0.8)]",
    yellow: "border-yellow-400 shadow-[4px_4px_0px_0px_rgba(250,204,21,0.8)]",
    green: "border-green-400 shadow-[4px_4px_0px_0px_rgba(74,222,128,0.8)]",
  };

  return (
    <div className={`bg-slate-900 border-2 ${colors[color]} ${className}`}>
      {children}
    </div>
  );
}

function RetroButton({ children, color = "fuchsia", onClick, className = "" }) {
  const colors = {
    fuchsia: "border-fuchsia-500 bg-fuchsia-500/20 text-fuchsia-400 hover:bg-fuchsia-500 hover:text-white shadow-[3px_3px_0px_0px_rgba(217,70,239,0.6)]",
    cyan: "border-cyan-400 bg-cyan-400/20 text-cyan-400 hover:bg-cyan-400 hover:text-slate-900 shadow-[3px_3px_0px_0px_rgba(34,211,238,0.6)]",
    yellow: "border-yellow-400 bg-yellow-400/20 text-yellow-400 hover:bg-yellow-400 hover:text-slate-900 shadow-[3px_3px_0px_0px_rgba(250,204,21,0.6)]",
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

function SectionTitle({ children, icon }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="text-2xl">{icon}</span>
      <h2 className="text-xl font-black uppercase tracking-wider text-white">
        {children}
      </h2>
      <div className="flex-1 h-0.5 bg-gradient-to-r from-fuchsia-500 via-cyan-400 to-transparent" />
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
        <div className="relative aspect-[4/3] w-full bg-slate-800 overflow-hidden">
          {img ? (
            <img
              src={img}
              alt={title}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-110"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-600">
              <span className="text-4xl">🎮</span>
            </div>
          )}

          {rating != null && (
            <div className="absolute top-2 right-2 bg-yellow-400 text-slate-900 text-xs font-black px-2 py-1 border-2 border-yellow-300">
              ★ {Number(rating).toFixed(1)}
            </div>
          )}

          {/* Scanline effect */}
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.1)_2px,rgba(0,0,0,0.1)_4px)] pointer-events-none" />
        </div>

        <div className="p-3 bg-slate-900">
          <div className="text-sm font-bold text-white truncate group-hover:text-cyan-400 transition-colors">
            {title}
          </div>
          <div className="flex items-center justify-between mt-1">
            {genres?.[0] ? (
              <div className="text-xs text-fuchsia-400 font-medium truncate">{genres[0]}</div>
            ) : <span />}
            {totalUsers && (
              <div className="text-xs text-slate-500">
                {totalUsers} {totalUsers === 1 ? "voto" : "votos"}
              </div>
            )}
          </div>
        </div>
      </RetroCard>
    </button>
  );
}

function UpcomingCard({ game, onClick }) {
  const title = game?.title || game?.name || "Sem título";
  const released = game?.release_date || game?.released || null;
  const img = safeImg(game?.background_image || game?.cover_url);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left w-full"
    >
      <RetroCard color="yellow" className="overflow-hidden flex transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
        <div className="w-20 h-24 bg-slate-800 flex-shrink-0 overflow-hidden">
          {img ? (
            <img
              src={img}
              alt={title}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-2xl">📅</div>
          )}
        </div>
        <div className="p-3 flex-1 min-w-0">
          <div className="text-sm font-bold text-white truncate group-hover:text-yellow-400 transition-colors">
            {title}
          </div>
          <div className="text-xs text-yellow-400/70 mt-1 font-medium">
            {released ? formatDateShort(released) : "A confirmar"}
          </div>
        </div>
      </RetroCard>
    </button>
  );
}

function ActivityItem({ activity, onNavigate }) {
  const { type, user, game, rating, status, date } = activity;

  const getConfig = () => {
    switch (type) {
      case "game_added":
        return { text: "adicionou", icon: "🎮", color: "text-cyan-400" };
      case "review":
        return { text: rating ? `avaliou ${Number(rating).toFixed(1)}★` : "review", icon: "⭐", color: "text-yellow-400" };
      case "status_change":
        if (["concluido", "completed", "completo"].includes(status?.toLowerCase())) {
          return { text: "completou", icon: "🏆", color: "text-green-400" };
        }
        return { text: status, icon: "📝", color: "text-slate-400" };
      default:
        return { text: "atividade", icon: "📌", color: "text-slate-400" };
    }
  };

  const config = getConfig();
  const avatarUrl = user?.avatar_url?.startsWith("http") 
    ? user.avatar_url 
    : user?.avatar_url 
      ? `http://localhost:4000${user.avatar_url}` 
      : null;

  return (
    <div className="flex gap-3 py-3 border-b border-slate-700/50 last:border-0 group">
      <button
        type="button"
        onClick={() => onNavigate(`/app/perfil/${user?.id}`)}
        className="w-10 h-10 border-2 border-fuchsia-500 bg-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 font-bold text-sm overflow-hidden flex-shrink-0 hover:bg-fuchsia-500 hover:text-white transition"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={user?.name} className="w-full h-full object-cover" />
        ) : (
          user?.name?.charAt(0).toUpperCase() || "?"
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="text-sm">
          <button
            type="button"
            onClick={() => onNavigate(`/app/perfil/${user?.id}`)}
            className="font-bold text-white hover:text-fuchsia-400 transition"
          >
            {user?.name || "User"}
          </button>
          {" "}
          <span className={config.color}>{config.text}</span>
          {" "}
          <button
            type="button"
            onClick={() => onNavigate(`/app/explorar/${game?.id}`)}
            className="font-bold text-cyan-400 hover:underline"
          >
            {game?.title || "jogo"}
          </button>
          {" "}{config.icon}
        </div>
        <div className="text-xs text-slate-500 mt-1">{getTimeAgo(date)}</div>
      </div>
    </div>
  );
}

function UserCard({ user, onClick }) {
  const avatarUrl = user?.avatar_url?.startsWith("http") 
    ? user.avatar_url 
    : user?.avatar_url 
      ? `http://localhost:4000${user.avatar_url}` 
      : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left w-full"
    >
      <RetroCard color="green" className="p-4 flex items-center gap-3 transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
        <div className="w-12 h-12 border-2 border-green-400 bg-green-400/20 flex items-center justify-center text-green-400 font-bold overflow-hidden flex-shrink-0 group-hover:bg-green-400 group-hover:text-slate-900 transition">
          {avatarUrl ? (
            <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            user.name?.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white truncate group-hover:text-green-400 transition">{user.name}</div>
          <div className="text-xs text-slate-400">
            Lv.{user.level} · {user.total_games || 0} jogos
          </div>
        </div>
      </RetroCard>
    </button>
  );
}

function SkeletonRetro({ className = "" }) {
  return (
    <div className={`bg-slate-800 animate-pulse border-2 border-slate-700 ${className}`} />
  );
}

// ============ PÁGINA PRINCIPAL ============

export default function HomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [featuredGames, setFeaturedGames] = useState([]);
  const [upcomingGames, setUpcomingGames] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [discoverUsers, setDiscoverUsers] = useState([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [topRated, upcoming, feed, users] = await Promise.allSettled([
          api.get("/stats/top-games", { params: { limit: 8 } }),
          api.get("/external-games/upcoming", { params: { page_size: 4 } }),
          api.get("/activity/feed", { params: { limit: 10 } }),
          api.get("/profile/users/discover", { params: { limit: 4 } }),
        ]);

        if (topRated.status === "fulfilled") {
          setFeaturedGames(topRated.value?.data?.topGames || []);
        }
        if (upcoming.status === "fulfilled") {
          setUpcomingGames(upcoming.value?.data?.jogos || []);
        }
        if (feed.status === "fulfilled") {
          setActivityFeed(feed.value?.data?.activities || []);
        }
        if (users.status === "fulfilled") {
          setDiscoverUsers(users.value?.data?.users || []);
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-10">
      {/* HERO */}
      <RetroCard color="fuchsia" className="p-8 relative overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(217,70,239,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(217,70,239,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-fuchsia-400 text-sm font-bold uppercase tracking-widest mb-2">
            <span className="inline-block w-3 h-3 bg-fuchsia-400 animate-pulse" />
            GameVault
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
            Bem-vindo de volta! <span className="text-cyan-400">👾</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl">
            Descobre novos jogos, acompanha a comunidade e expande a tua coleção.
          </p>
        </div>

        {/* Decorative pixels */}
        <div className="absolute top-4 right-4 w-4 h-4 bg-cyan-400" />
        <div className="absolute top-4 right-10 w-2 h-2 bg-yellow-400" />
        <div className="absolute bottom-4 right-6 w-3 h-3 bg-fuchsia-500" />
      </RetroCard>

      {/* GRID PRINCIPAL */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* COLUNA ESQUERDA - JOGOS */}
        <div className="lg:col-span-2 space-y-10">
          {/* JOGOS EM DESTAQUE */}
          <section>
            <SectionTitle icon="⭐">Top Avaliados pela Comunidade</SectionTitle>
            
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <SkeletonRetro key={i} className="aspect-[4/3]" />
                ))}
              </div>
            ) : featuredGames.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {featuredGames.slice(0, 8).map((game) => (
                  <GameCard
                    key={game.id || game.external_id}
                    game={game}
                    onClick={() => navigate(`/app/jogo/${game.id}`)}
                  />
                ))}
              </div>
            ) : (
              <RetroCard color="cyan" className="p-8 text-center">
                <span className="text-4xl block mb-3">🎮</span>
                <p className="text-slate-400">
                  Ainda não há jogos avaliados pela comunidade.
                </p>
                <p className="text-slate-500 text-sm mt-2">
                  Adiciona jogos à tua coleção e avalia-os!
                </p>
              </RetroCard>
            )}
          </section>

          {/* ATIVIDADE DA COMUNIDADE */}
          <section>
            <SectionTitle icon="📡">Atividade da Comunidade</SectionTitle>
            
            <RetroCard color="fuchsia" className="p-4">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <SkeletonRetro className="w-10 h-10" />
                      <div className="flex-1 space-y-2">
                        <SkeletonRetro className="h-4 w-3/4" />
                        <SkeletonRetro className="h-3 w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activityFeed.length > 0 ? (
                <div className="max-h-[400px] overflow-y-auto">
                  {activityFeed.map((act, idx) => (
                    <ActivityItem
                      key={`${act.type}-${act.user?.id}-${act.game?.id}-${idx}`}
                      activity={act}
                      onNavigate={navigate}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <span className="text-4xl block mb-2">📭</span>
                  Sem atividade recente
                </div>
              )}
            </RetroCard>
          </section>
        </div>

        {/* COLUNA DIREITA */}
        <div className="space-y-8">
          {/* PRÓXIMOS LANÇAMENTOS */}
          <section>
            <SectionTitle icon="📅">Em Breve</SectionTitle>
            
            <div className="space-y-3">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <SkeletonRetro key={i} className="h-24" />
                ))
              ) : upcomingGames.length > 0 ? (
                upcomingGames.slice(0, 4).map((game) => (
                  <UpcomingCard
                    key={game.id || game.external_id}
                    game={game}
                    onClick={() => navigate(`/app/explorar/${game.external_id || game.id}`)}
                  />
                ))
              ) : (
                <div className="text-center py-6 text-slate-500">
                  Sem lançamentos próximos
                </div>
              )}
            </div>
          </section>

          {/* DESCOBRIR UTILIZADORES */}
          <section>
            <SectionTitle icon="👥">Descobrir</SectionTitle>
            
            <div className="space-y-3">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <SkeletonRetro key={i} className="h-20" />
                ))
              ) : discoverUsers.length > 0 ? (
                discoverUsers.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    onClick={() => navigate(`/app/perfil/${user.id}`)}
                  />
                ))
              ) : (
                <div className="text-center py-6 text-slate-500">
                  Sem sugestões de momento
                </div>
              )}
            </div>
          </section>

          {/* QUICK ACTIONS */}
          <section>
            <SectionTitle icon="⚡">Ações Rápidas</SectionTitle>
            
            <div className="space-y-3">
              <RetroButton color="cyan" onClick={() => navigate("/app/explorar")} className="w-full justify-center">
                🔍 Explorar Jogos
              </RetroButton>
              <RetroButton color="yellow" onClick={() => navigate("/app/conquistas")} className="w-full justify-center">
                🏆 Conquistas
              </RetroButton>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
