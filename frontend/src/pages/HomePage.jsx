// src/pages/HomePage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { rawgOriginal } from "../utils/rawgImages";
import { 
  Calendar,
  Star,
  Users,
  Gamepad2
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

// ============ COMPONENTES RETRO ============

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
        <div className="relative aspect-[4/3] w-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          {img ? (
            <img
              src={img}
              alt={title}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-110"
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
        <div className="w-20 h-24 bg-slate-200 dark:bg-slate-800 flex-shrink-0 overflow-hidden border-r-2 border-yellow-400/20">
          {img ? (
            <img src={img} alt={title} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center font-bold text-xs text-slate-400">DATA</div>
          )}
        </div>
        <div className="p-3 flex-1 min-w-0 bg-white dark:bg-slate-900">
          <div className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
            {title}
          </div>
          <div className="text-xs text-slate-500 dark:text-yellow-400/70 mt-1 font-bold uppercase">
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
        // Se só tiver ID interno, tenta ir, mas pode falhar se o user não tiver o jogo
        // O ideal é o backend enviar external_id nas atividades
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

        if (topRated.status === "fulfilled") setFeaturedGames(topRated.value?.data?.topGames || []);
        if (upcoming.status === "fulfilled") setUpcomingGames(upcoming.value?.data?.jogos || []);
        if (feed.status === "fulfilled") setActivityFeed(feed.value?.data?.activities || []);
        if (users.status === "fulfilled") setDiscoverUsers(users.value?.data?.users || []);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Handler seguro para navegação
  const handleGameClick = (game) => {
    // PRIORIDADE: Usar o external_id para ir para a página pública de detalhes (Explorar)
    // Assim funciona mesmo se o user não tiver o jogo na coleção.
    const targetId = game.external_id || game.id;
    navigate(`/app/explorar/${targetId}`);
  };

  return (
    <div className="space-y-10 pb-10">
      {/* HERO BANNER */}
      <RetroCard color="fuchsia" className="p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(217,70,239,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(217,70,239,0.1)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-fuchsia-600 dark:text-fuchsia-400 text-sm font-bold uppercase tracking-widest mb-2">
            <span className="inline-block w-3 h-3 bg-fuchsia-500 animate-pulse" />
            GameVault
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight drop-shadow-sm">
            Bem-vindo de volta!
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-lg max-w-xl font-medium">
            Descobre novos jogos, acompanha a comunidade e expande a tua coleção.
          </p>
        </div>

        <div className="absolute top-4 right-4 w-4 h-4 bg-cyan-400 shadow-lg" />
        <div className="absolute top-4 right-10 w-2 h-2 bg-yellow-400 shadow-lg" />
        <div className="absolute bottom-4 right-6 w-3 h-3 bg-fuchsia-500 shadow-lg" />
      </RetroCard>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* COLUNA ESQUERDA - JOGOS */}
        <div className="lg:col-span-2 space-y-10">
          <section>
            <SectionTitle>Top Avaliados</SectionTitle>
            
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => <SkeletonRetro key={i} className="aspect-[4/3]" />)}
              </div>
            ) : featuredGames.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {featuredGames.slice(0, 8).map((game) => (
                  <GameCard 
                    key={game.id || game.external_id} 
                    game={game} 
                    // CORREÇÃO AQUI: Usa a função segura que vai para /explorar
                    onClick={() => handleGameClick(game)} 
                  />
                ))}
              </div>
            ) : (
              <RetroCard color="cyan" className="p-8 text-center text-slate-500 font-medium">
                Ainda não há jogos avaliados.
              </RetroCard>
            )}
          </section>

          <section>
            <SectionTitle>Atividade</SectionTitle>
            <RetroCard color="fuchsia" className="p-4">
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
        </div>

        {/* COLUNA DIREITA */}
        <div className="space-y-8">
          <section>
            <SectionTitle>Em Breve</SectionTitle>
            <div className="space-y-3">
              {loading ? (
                [...Array(4)].map((_, i) => <SkeletonRetro key={i} className="h-24" />)
              ) : upcomingGames.length > 0 ? (
                upcomingGames.slice(0, 4).map((game) => (
                  <UpcomingCard 
                    key={game.id || game.external_id} 
                    game={game} 
                    // CORREÇÃO: Garante que vai para /explorar
                    onClick={() => navigate(`/app/explorar/${game.external_id || game.id}`)} 
                  />
                ))
              ) : (
                <div className="text-center py-6 text-slate-500">Sem lançamentos próximos</div>
              )}
            </div>
          </section>

          <section>
            <SectionTitle>Descobrir</SectionTitle>
            <div className="space-y-3">
              {loading ? (
                [...Array(4)].map((_, i) => <SkeletonRetro key={i} className="h-20" />)
              ) : discoverUsers.length > 0 ? (
                discoverUsers.map((user) => (
                  <UserCard key={user.id} user={user} onClick={() => navigate(`/app/perfil/${user.id}`)} />
                ))
              ) : (
                <div className="text-center py-6 text-slate-500">Sem sugestões de momento</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}