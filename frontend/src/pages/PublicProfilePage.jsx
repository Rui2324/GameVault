// src/pages/PublicProfilePage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

// Componente RetroCard
function RetroCard({ children, className = "", color = "fuchsia" }) {
  const colors = {
    fuchsia: "border-fuchsia-500 shadow-[4px_4px_0px_0px_rgba(217,70,239,0.5)]",
    cyan: "border-cyan-400 shadow-[4px_4px_0px_0px_rgba(34,211,238,0.5)]",
    yellow: "border-yellow-400 shadow-[4px_4px_0px_0px_rgba(250,204,21,0.5)]",
    green: "border-green-400 shadow-[4px_4px_0px_0px_rgba(74,222,128,0.5)]",
    rose: "border-rose-500 shadow-[4px_4px_0px_0px_rgba(244,63,94,0.5)]",
    purple: "border-purple-500 shadow-[4px_4px_0px_0px_rgba(168,85,247,0.5)]",
    amber: "border-amber-400 shadow-[4px_4px_0px_0px_rgba(251,191,36,0.5)]"
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border-2 ${colors[color]} ${className}`}>
      {children}
    </div>
  );
}

// Componente RetroButton
function RetroButton({ children, onClick, className = "", color = "fuchsia", disabled = false }) {
  const colors = {
    fuchsia: "border-fuchsia-500 bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/20 dark:text-fuchsia-400 hover:bg-fuchsia-500 hover:text-white shadow-[3px_3px_0px_0px_rgba(217,70,239,0.6)]",
    cyan: "border-cyan-400 bg-cyan-50 text-cyan-600 dark:bg-cyan-400/20 dark:text-cyan-400 hover:bg-cyan-400 hover:text-slate-900 shadow-[3px_3px_0px_0px_rgba(34,211,238,0.6)]",
    yellow: "border-yellow-400 bg-yellow-50 text-yellow-600 dark:bg-yellow-400/20 dark:text-yellow-400 hover:bg-yellow-400 hover:text-slate-900 shadow-[3px_3px_0px_0px_rgba(250,204,21,0.6)]",
    green: "border-green-400 bg-green-50 text-green-600 dark:bg-green-400/20 dark:text-green-400 hover:bg-green-400 hover:text-slate-900 shadow-[3px_3px_0px_0px_rgba(74,222,128,0.6)]",
    rose: "border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 hover:bg-rose-500 hover:text-white shadow-[3px_3px_0px_0px_rgba(244,63,94,0.6)]"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`border-2 font-bold px-4 py-2 transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none disabled:opacity-50 ${colors[color]} ${className}`}
    >
      {children}
    </button>
  );
}

export default function PublicProfilePage() {
  const { identifier } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [favoriteGames, setFavoriteGames] = useState([]);
  const [recentGames, setRecentGames] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Estado para todos os jogos
  const [allGames, setAllGames] = useState([]);
  const [allGamesLoading, setAllGamesLoading] = useState(false);
  const [allGamesTotal, setAllGamesTotal] = useState(0);
  const [showAllGames, setShowAllGames] = useState(false);
  
  // Estado para mostrar todos os recentes
  const [showAllRecents, setShowAllRecents] = useState(false);
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnProfile = user && profile && user.id === profile.id;

  useEffect(() => { fetchProfile(); }, [identifier]);

  useEffect(() => {
    if (profile?.id) fetchFollowData();
  }, [profile?.id, user]);

  async function fetchFollowData() {
    try {
      const countsRes = await api.get(`/follows/user/${profile.id}/counts`);
      setFollowCounts(countsRes.data);
      if (user && !isOwnProfile) {
        const checkRes = await api.get(`/follows/check/${profile.id}`);
        setIsFollowing(checkRes.data.isFollowing);
      }
    } catch (err) { console.error(err); }
  }

  // Carregar todos os jogos da coleção
  async function fetchAllGames() {
    if (!profile?.id) return;
    try {
      setAllGamesLoading(true);
      const res = await api.get(`/profile/${profile.id}/collection`, { params: { limit: 100 } });
      setAllGames(res.data.games || []);
      setAllGamesTotal(res.data.total || 0);
    } catch (err) { 
      console.error(err); 
    } finally { 
      setAllGamesLoading(false); 
    }
  }

  // Carregar todos os jogos quando mudar para a tab "games"
  useEffect(() => {
    if (activeTab === "games" && profile?.id && allGames.length === 0) {
      fetchAllGames();
    }
  }, [activeTab, profile?.id]);

  async function handleFollow() {
    if (!user) return navigate("/login");
    try {
      setFollowLoading(true);
      if (isFollowing) {
        await api.delete(`/follows/${profile.id}`);
        setIsFollowing(false);
        setFollowCounts(prev => ({ ...prev, followers: prev.followers - 1 }));
      } else {
        await api.post(`/follows/${profile.id}`);
        setIsFollowing(true);
        setFollowCounts(prev => ({ ...prev, followers: prev.followers + 1 }));
      }
    } catch (err) { console.error(err); } finally { setFollowLoading(false); }
  }

  async function fetchProfile() {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/profile/${identifier}`);
      setProfile(res.data.profile);
      setStats(res.data.stats);
      setFavoriteGames(res.data.favoriteGames || []);
      setRecentGames(res.data.recentGames || []);
      setAchievements(res.data.achievements || []);
      setRecentReviews(res.data.recentReviews || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.status === 404 ? "Perfil não encontrado." : err.response?.status === 403 ? "Este perfil é privado." : "Erro ao carregar perfil.");
    } finally { setLoading(false); }
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" });
  }

  async function copyProfileLink() {
    await navigator.clipboard.writeText(window.location.href);
    alert("Link copiado para a área de transferência!");
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-16 h-16 border-4 border-fuchsia-500/30 border-t-fuchsia-500 animate-spin"></div></div>;

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <RetroCard color="rose" className="p-8 max-w-md mx-4 text-center">
          <div className="w-20 h-20 mx-auto mb-4 border-2 border-rose-500 bg-rose-50 dark:bg-rose-500/20 flex items-center justify-center">
            <span className="text-4xl">😕</span>
          </div>
          <h2 className="text-xl font-bold text-rose-500 dark:text-rose-400 mb-2">{error}</h2>
          <RetroButton onClick={() => navigate(-1)} color="cyan">← Voltar</RetroButton>
        </RetroCard>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header do Perfil */}
      <RetroCard color="fuchsia" className="overflow-hidden">
        {/* Banner */}
        <div className="h-24 md:h-36 relative overflow-hidden bg-slate-900">
          <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 via-purple-600 to-cyan-500" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.3)_1px,transparent_1px)] bg-[size:20px_20px]" />
        </div>
        
        <div className="px-5 pb-5">
          <div className="flex flex-col md:flex-row md:items-end gap-5 -mt-12 md:-mt-14">
            
            {/* AVATAR: object-cover object-center para preencher sem deformar */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 md:w-32 md:h-32 border-4 border-cyan-400 bg-white dark:bg-slate-950 p-1 shadow-[4px_4px_0px_0px_rgba(34,211,238,0.8)]">
                <div className="w-full h-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-4xl font-bold text-cyan-500 dark:text-cyan-400 overflow-hidden">
                  {profile.avatar_url ? (
                    <img 
                      src={profile.avatar_url.startsWith("http") ? profile.avatar_url : `http://localhost:4000${profile.avatar_url}`} 
                      alt={profile.name} 
                      className="w-full h-full object-cover object-center" 
                    />
                  ) : profile.name?.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="absolute -bottom-3 -right-3 px-3 py-1 bg-yellow-400 border-2 border-yellow-500 text-xs font-black text-slate-900 shadow-sm uppercase tracking-wide">
                Lv. {profile.level}
              </div>
            </div>
            
            <div className="flex-1 pt-3 md:pt-4 min-w-0">
              <div className="flex flex-col gap-1">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white truncate uppercase tracking-tighter drop-shadow-sm leading-none">
                  {profile.name}
                </h1>

                <div className="flex items-center gap-2 mt-1">
                    {!profile.is_public && (
                    <span className="px-2.5 py-1 bg-rose-50 dark:bg-slate-800 border-2 border-rose-500 text-rose-500 dark:text-rose-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
                        🔒 Privado
                    </span>
                    )}
                    <span className="text-xs text-slate-400 font-mono font-bold uppercase">
                        Membro desde {new Date(profile.member_since).getFullYear()}
                    </span>
                </div>
              </div>

              {profile.bio && (
                <p className="text-slate-600 dark:text-slate-300 text-sm mt-3 max-w-2xl font-medium leading-relaxed border-l-4 border-slate-200 dark:border-slate-700 pl-3">
                  {profile.bio}
                </p>
              )}
              
              <div className="flex items-center gap-6 mt-4">
                <button onClick={() => setActiveTab("followers")} className="group text-sm text-slate-500 dark:text-slate-400 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 transition">
                  <span className="font-black text-fuchsia-600 dark:text-fuchsia-400 text-xl mr-1">{followCounts.followers}</span> 
                  <span className="uppercase text-xs font-bold tracking-wide">Seguidores</span>
                </button>
                <button onClick={() => setActiveTab("following")} className="group text-sm text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition">
                  <span className="font-black text-cyan-600 dark:text-cyan-400 text-xl mr-1">{followCounts.following}</span> 
                  <span className="uppercase text-xs font-bold tracking-wide">A Seguir</span>
                </button>
              </div>
            </div>
            
            <div className="flex gap-2 pt-4 md:pt-0">
              {!isOwnProfile && (
                <RetroButton onClick={handleFollow} disabled={followLoading} color={isFollowing ? "rose" : "fuchsia"} className="flex items-center gap-2">
                  {followLoading ? "..." : isFollowing ? "✓ A seguir" : "➕ Seguir"}
                </RetroButton>
              )}
              <RetroButton onClick={copyProfileLink} color="cyan" className="flex items-center gap-2">🔗</RetroButton>
              {isOwnProfile && (
                <Link to="/app/settings" className="border-2 border-yellow-400 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-400 hover:text-slate-900 bg-yellow-50 dark:bg-slate-900/50 font-bold px-4 py-2 transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none flex items-center gap-2">
                  ⚙️ Editar
                </Link>
              )}
            </div>
          </div>
        </div>
      </RetroCard>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon="🎮" label="Jogos" value={stats.totalGames} tone="cyan" />
        <StatCard icon="✅" label="Concluídos" value={stats.completedGames} tone="green" />
        <StatCard icon="⏱️" label="Horas" value={`${stats.totalHours.toFixed(0)}h`} tone="yellow" />
        <StatCard icon="✍️" label="Reviews" value={stats.totalReviews} tone="purple" />
        <StatCard icon="⭐" label="Média" value={stats.averageRating || "-"} tone="amber" />
        <StatCard icon="🏆" label="Conquistas" value={stats.totalAchievements} tone="fuchsia" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-2 bg-white dark:bg-slate-900 border-2 border-fuchsia-500/30 overflow-x-auto">
        {["overview", "games", "achievements", "reviews", "followers", "following"].map(tab => (
          <TabButton key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)}>
            {tab === "overview" && "📊 Visão Geral"}
            {tab === "games" && "🎮 Jogos"}
            {tab === "achievements" && "🏆 Conquistas"}
            {tab === "reviews" && "✍️ Reviews"}
            {tab === "followers" && "👥 Seguidores"}
            {tab === "following" && "➡️ A Seguir"}
          </TabButton>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RetroCard color="yellow" className="p-5">
            <h2 className="text-sm font-bold text-yellow-600 dark:text-yellow-400 mb-4 flex items-center gap-2 uppercase tracking-wide">
              <span className="w-8 h-8 border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-400/20 flex items-center justify-center text-base">⭐</span> Jogos Favoritos
            </h2>
            {favoriteGames.length === 0 ? <p className="text-slate-500 text-sm text-center py-6 font-mono">Sem jogos favoritos</p> : 
              <div className="space-y-2">{favoriteGames.map(g => <GameCard key={g.id} game={g} navigate={navigate} />)}</div>}
          </RetroCard>

          <RetroCard color="cyan" className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-2 uppercase tracking-wide">
                <span className="w-8 h-8 border-2 border-cyan-400 bg-cyan-50 dark:bg-cyan-400/20 flex items-center justify-center text-base">🕐</span> Recentes
              </h2>
              {!showAllRecents && recentGames.length > 4 && (
                <button 
                  onClick={() => setShowAllRecents(true)} 
                  className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
                >
                  Ver mais →
                </button>
              )}
              {showAllRecents && recentGames.length > 4 && (
                <button 
                  onClick={() => setShowAllRecents(false)} 
                  className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
                >
                  Mostrar menos ↑
                </button>
              )}
            </div>
            {recentGames.length === 0 ? <p className="text-slate-500 text-sm text-center py-6 font-mono">Sem jogos recentes</p> : (
              <div className="space-y-2">
                {(showAllRecents ? recentGames : recentGames.slice(0, 4)).map(g => 
                  <GameCard key={g.id} game={g} navigate={navigate} showDate />
                )}
              </div>
            )}
            
            {!showAllRecents && recentGames.length > 4 && (
              <div className="text-center mt-4">
                <button 
                  onClick={() => setShowAllRecents(true)} 
                  className="px-4 py-2 border-2 border-cyan-400 text-cyan-600 dark:text-cyan-400 font-bold text-xs hover:bg-cyan-400 hover:text-slate-900 transition-all"
                >
                  Ver todos os {recentGames.length} recentes
                </button>
              </div>
            )}
          </RetroCard>

          <RetroCard color="fuchsia" className="p-5">
            <h2 className="text-sm font-bold text-fuchsia-600 dark:text-fuchsia-400 mb-4 flex items-center gap-2 uppercase tracking-wide">
              <span className="w-8 h-8 border-2 border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-500/20 flex items-center justify-center text-base">🏆</span> Conquistas Recentes
            </h2>
            {achievements.length === 0 ? <p className="text-slate-500 text-sm text-center py-6 font-mono">Sem conquistas</p> : (
              <div className="flex flex-wrap gap-2">
                {achievements.slice(0, 8).map(a => (
                  <div key={a.id} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 border-2 border-fuchsia-500/30 px-3 py-2 hover:border-fuchsia-500 transition-all" title={a.description}>
                    <span className="text-lg">{a.icon}</span>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{a.name}</span>
                  </div>
                ))}
              </div>
            )}
          </RetroCard>

          <RetroCard color="green" className="p-5">
            <h2 className="text-sm font-bold text-green-600 dark:text-green-400 mb-4 flex items-center gap-2 uppercase tracking-wide">
              <span className="w-8 h-8 border-2 border-green-400 bg-green-50 dark:bg-green-400/20 flex items-center justify-center text-base">✍️</span> Reviews Recentes
            </h2>
            {recentReviews.length === 0 ? <p className="text-slate-500 text-sm text-center py-6 font-mono">Sem reviews</p> : (
              <div className="space-y-2">
                {recentReviews.slice(0, 3).map(r => (
                  <div key={r.id} className="bg-slate-50 dark:bg-slate-800/50 border-2 border-green-400/30 p-3 hover:border-green-400 transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{r.game_title}</span>
                      <span className={`font-bold text-sm px-2 py-0.5 border-2 ${r.rating >= 8 ? "border-green-400 bg-green-100 dark:bg-green-400/20 text-green-600 dark:text-green-400" : "border-yellow-400 bg-yellow-100 dark:bg-yellow-400/20 text-yellow-600 dark:text-yellow-400"}`}>{r.rating}/10</span>
                    </div>
                    {r.title && <p className="text-xs text-slate-500 dark:text-slate-400">{r.title}</p>}
                  </div>
                ))}
              </div>
            )}
          </RetroCard>
        </div>
      )}

      {activeTab === "games" && (
        <RetroCard color="cyan" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-2 uppercase tracking-wide">
              <span className="w-8 h-8 border-2 border-cyan-400 bg-cyan-50 dark:bg-cyan-400/20 flex items-center justify-center text-base">🎮</span>
              {allGamesLoading ? "A carregar..." : `${allGamesTotal || stats?.totalGames || 0} Jogos na Coleção`}
            </h2>
            {!showAllGames && allGames.length > 0 && (
              <button 
                onClick={() => setShowAllGames(true)} 
                className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                Ver todos →
              </button>
            )}
          </div>
          
          {allGamesLoading ? (
            <div className="text-center py-10">
              <div className="w-14 h-10 border-4 border-cyan-400/30 border-t-cyan-400 animate-spin mx-auto"></div>
              <p className="text-slate-500 text-sm mt-3">A carregar jogos...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4">
              {(showAllGames ? allGames : allGames.slice(0, 12)).map(g => (
                <div key={g.id} onClick={() => navigate(`/app/explorar/${g.external_id || g.id}`)} className="cursor-pointer group bg-white dark:bg-slate-800 border-2 border-cyan-400/30 hover:border-cyan-400 transition-all shadow-sm hover:shadow-md">
                  <div className="aspect-video overflow-hidden bg-slate-200 dark:bg-slate-700">
                    {g.cover_url ? <img src={g.cover_url} alt={g.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" /> : <div className="w-full h-full flex items-center justify-center text-3xl">🎮</div>}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-200 truncate">{g.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      {g.rating && <span className="text-[10px] font-bold text-yellow-500 dark:text-yellow-400">⭐ {g.rating}/10</span>}
                      {g.hours_played > 0 && <span className="text-[10px] text-cyan-500">{g.hours_played}h</span>}
                    </div>
                    {g.status && (
                      <span className={`text-[9px] font-bold uppercase mt-1 inline-block px-1.5 py-0.5 border ${
                        g.status === 'concluido' ? 'border-green-400 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-400/20' :
                        g.status === 'a_jogar' ? 'border-cyan-400 text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-400/20' :
                        'border-slate-300 text-slate-500 bg-slate-50 dark:bg-slate-700'
                      }`}>
                        {g.status === 'concluido' ? '✓ Concluído' : g.status === 'a_jogar' ? '▶ A Jogar' : '○ Por Jogar'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!showAllGames && allGames.length > 12 && (
            <div className="text-center mt-6">
              <button 
                onClick={() => setShowAllGames(true)} 
                className="px-6 py-2 border-2 border-cyan-400 text-cyan-600 dark:text-cyan-400 font-bold text-sm hover:bg-cyan-400 hover:text-slate-900 transition-all"
              >
                Ver todos os {allGamesTotal} jogos
              </button>
            </div>
          )}
        </RetroCard>
      )}

      {activeTab === "achievements" && (
        <RetroCard color="fuchsia" className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map(a => (
              <div key={a.id} className="flex items-center gap-4 bg-white dark:bg-slate-800/50 border-2 border-fuchsia-500/30 p-4 hover:border-fuchsia-500 transition-all shadow-sm">
                <div className="w-12 h-12 border-2 border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-500/20 flex items-center justify-center text-xl">{a.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-900 dark:text-slate-200">{a.name}</p>
                  <p className="text-xs text-slate-500 truncate">{a.description}</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">🗓️ {formatDate(a.unlocked_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </RetroCard>
      )}

      {activeTab === "reviews" && (
        <RetroCard color="green" className="p-6">
          <div className="space-y-4">
            {recentReviews.map(r => (
              <div key={r.id} className="bg-white dark:bg-slate-800/50 border-2 border-green-400/30 p-5 hover:border-green-400 transition-all shadow-sm">
                <div className="flex items-center gap-4 mb-3">
                  {r.game_cover ? <img src={r.game_cover} className="w-12 h-16 object-cover border-2 border-cyan-400/50" /> : <div className="w-12 h-16 border-2 border-cyan-400/50 flex items-center justify-center text-xl">🎮</div>}
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-200">{r.game_title}</h4>
                    <p className="text-xs text-slate-500 font-mono">📅 {formatDate(r.created_at)}</p>
                  </div>
                  <div className="text-xl font-bold px-3 py-1.5 border-2 border-green-400 bg-green-50 dark:bg-green-400/20 text-green-600 dark:text-green-400">{r.rating}/10</div>
                </div>
                {r.title && <h5 className="font-semibold text-sm text-slate-900 dark:text-slate-200 mb-2">{r.title}</h5>}
                {r.content && <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{r.content}</p>}
              </div>
            ))}
          </div>
        </RetroCard>
      )}

      {(activeTab === "followers" || activeTab === "following") && (
        <FollowList userId={profile.id} type={activeTab} navigate={navigate} />
      )}
    </div>
  );
}

function FollowList({ userId, type, navigate }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => { fetchUsers(); }, [userId, type]);

  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await api.get(`/follows/user/${userId}/${type}`);
      setUsers(type === "followers" ? res.data.followers : res.data.following);
      setTotal(res.data.total);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  if (loading) return <RetroCard color="cyan" className="p-6"><div className="animate-pulse space-y-4">Loading...</div></RetroCard>;

  return (
    <RetroCard color={type === "followers" ? "fuchsia" : "green"} className="p-6">
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 mb-4 flex items-center gap-2 uppercase tracking-wide">
        <span className={`w-8 h-8 border-2 flex items-center justify-center text-base ${type === "followers" ? "border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-500/20" : "border-green-400 bg-green-50 dark:bg-green-400/20"}`}>
          {type === "followers" ? "👥" : "➡️"}
        </span>
        {type === "followers" ? `${total} Seguidores` : `A seguir ${total}`}
      </h3>
      
      {users.length > 0 ? (
        <div className="space-y-3">
          {users.map(u => (
            <div key={u.id} onClick={() => navigate(`/app/perfil/${u.id}`)} className={`flex items-center gap-4 p-3 bg-white dark:bg-slate-800/50 border-2 cursor-pointer transition-all ${type === "followers" ? "border-fuchsia-200 dark:border-fuchsia-500/30 hover:border-fuchsia-500" : "border-green-200 dark:border-green-400/30 hover:border-green-400"}`}>
              <div className="w-12 h-12 border-2 border-cyan-400 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-bold text-sm overflow-hidden">
                {u.avatar_url ? <img src={u.avatar_url.startsWith("http") ? u.avatar_url : `http://localhost:4000${u.avatar_url}`} className="w-full h-full object-cover" /> : u.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-900 dark:text-slate-200 truncate">{u.name}</p>
                {u.bio && <p className="text-xs text-slate-500 truncate font-mono">{u.bio}</p>}
              </div>
              <span className="text-cyan-500">→</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8"><span className="text-4xl mb-3 block">👀</span><p className="text-slate-500 text-sm font-mono">{type === "followers" ? "Ainda não tem seguidores." : "Ainda não segue ninguém."}</p></div>
      )}
    </RetroCard>
  );
}

function StatCard({ icon, label, value, tone = "cyan" }) {
  const styles = {
    cyan: "border-cyan-400 text-cyan-600 dark:text-cyan-400 shadow-[3px_3px_0px_0px_rgba(34,211,238,0.5)]",
    green: "border-green-400 text-green-600 dark:text-green-400 shadow-[3px_3px_0px_0px_rgba(74,222,128,0.5)]",
    yellow: "border-yellow-400 text-yellow-600 dark:text-yellow-400 shadow-[3px_3px_0px_0px_rgba(250,204,21,0.5)]",
    purple: "border-purple-500 text-purple-600 dark:text-purple-400 shadow-[3px_3px_0px_0px_rgba(168,85,247,0.5)]",
    amber: "border-amber-400 text-amber-600 dark:text-amber-400 shadow-[3px_3px_0px_0px_rgba(251,191,36,0.5)]",
    fuchsia: "border-fuchsia-500 text-fuchsia-600 dark:text-fuchsia-400 shadow-[3px_3px_0px_0px_rgba(217,70,239,0.5)]"
  };
  return (
    <div className={`bg-white dark:bg-slate-900 border-2 p-4 ${styles[tone].split(' ')[0]} ${styles[tone].split(' ').pop()}`}>
      <div className="flex flex-col items-center text-center">
        <div className={`w-10 h-10 border-2 flex items-center justify-center text-lg mb-2 bg-slate-50 dark:bg-slate-800 ${styles[tone].split(' ')[0]}`}>{icon}</div>
        <p className={`text-xl font-bold ${styles[tone].split(' ').slice(1, -1).join(' ')}`}>{value}</p>
        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      </div>
    </div>
  );
}

function TabButton({ children, active, onClick }) {
  return (
    <button onClick={onClick} className={`px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap uppercase tracking-wide ${active ? "bg-fuchsia-500 text-white border-2 border-fuchsia-400 shadow-md" : "text-slate-500 dark:text-slate-400 border-2 border-transparent hover:text-fuchsia-500 dark:hover:text-fuchsia-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
      {children}
    </button>
  );
}

// CORREÇÃO: Função atualizada para usar /explorar
function GameCard({ game, navigate, showDate }) {
  // Tenta usar external_id primeiro (jogos API), senão usa o id (jogos BD)
  // E navega para /app/explorar/:id
  const targetId = game.external_id || game.id;

  return (
    <div 
      onClick={() => navigate(`/app/explorar/${targetId}`)} 
      className="flex items-center gap-3 bg-white dark:bg-slate-800/50 border-2 border-cyan-400/30 p-3 cursor-pointer hover:border-cyan-400 transition-all shadow-sm"
    >
      <div className="w-12 h-16 overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0 border-2 border-cyan-400/50">
        {game.cover_url ? <img src={game.cover_url} alt={game.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">🎮</div>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-slate-900 dark:text-slate-200 truncate">{game.title}</p>
        {game.rating && <div className="flex items-center gap-1 mt-1"><span className="text-yellow-500 dark:text-yellow-400">★</span><span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">{game.rating}/10</span></div>}
        {showDate && game.created_at && <p className="text-[10px] text-slate-500 mt-1 font-mono">{new Date(game.created_at).toLocaleDateString("pt-PT")}</p>}
      </div>
      {game.hours_played > 0 && <span className="text-xs font-medium text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-400/20 border border-cyan-200 dark:border-cyan-400/50 px-2 py-1">{game.hours_played}h</span>}
    </div>
  );
}