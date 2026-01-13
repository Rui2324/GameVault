// src/pages/PublicProfilePage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

// Componente RetroCard
function RetroCard({ children, className = "", color = "fuchsia" }) {
  const colors = {
    fuchsia: "border-fuchsia-500 shadow-[4px_4px_0px_0px_rgba(217,70,239,0.8)]",
    cyan: "border-cyan-400 shadow-[4px_4px_0px_0px_rgba(34,211,238,0.8)]",
    yellow: "border-yellow-400 shadow-[4px_4px_0px_0px_rgba(250,204,21,0.8)]",
    green: "border-green-400 shadow-[4px_4px_0px_0px_rgba(74,222,128,0.8)]",
    rose: "border-rose-500 shadow-[4px_4px_0px_0px_rgba(244,63,94,0.8)]",
    purple: "border-purple-500 shadow-[4px_4px_0px_0px_rgba(168,85,247,0.8)]",
    amber: "border-amber-400 shadow-[4px_4px_0px_0px_rgba(251,191,36,0.8)]"
  };

  return (
    <div className={`bg-slate-900 border-2 ${colors[color]} ${className}`}>
      {children}
    </div>
  );
}

// Componente RetroButton
function RetroButton({ children, onClick, className = "", color = "fuchsia", disabled = false }) {
  const colors = {
    fuchsia: "border-fuchsia-500 text-fuchsia-400 hover:bg-fuchsia-500 hover:text-white shadow-[3px_3px_0px_0px_rgba(217,70,239,0.8)]",
    cyan: "border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-slate-900 shadow-[3px_3px_0px_0px_rgba(34,211,238,0.8)]",
    yellow: "border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-slate-900 shadow-[3px_3px_0px_0px_rgba(250,204,21,0.8)]",
    green: "border-green-400 text-green-400 hover:bg-green-400 hover:text-slate-900 shadow-[3px_3px_0px_0px_rgba(74,222,128,0.8)]",
    rose: "border-rose-500 text-rose-400 hover:bg-rose-500 hover:text-white shadow-[3px_3px_0px_0px_rgba(244,63,94,0.8)]"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`border-2 bg-slate-900/50 font-bold px-4 py-2 transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none disabled:opacity-50 ${colors[color]} ${className}`}
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
  
  // Estado de follow
  const [isFollowing, setIsFollowing] = useState(false);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnProfile = user && profile && user.id === profile.id;

  useEffect(() => {
    fetchProfile();
  }, [identifier]);

  // Verificar se está a seguir e obter contagens
  useEffect(() => {
    if (profile?.id) {
      fetchFollowData();
    }
  }, [profile?.id, user]);

  async function fetchFollowData() {
    try {
      // Obter contagens
      const countsRes = await api.get(`/follows/user/${profile.id}/counts`);
      setFollowCounts(countsRes.data);
      
      // Verificar se está a seguir (só se estiver logado e não for o próprio perfil)
      if (user && !isOwnProfile) {
        const checkRes = await api.get(`/follows/check/${profile.id}`);
        setIsFollowing(checkRes.data.isFollowing);
      }
    } catch (err) {
      console.error("Erro ao carregar dados de follow:", err);
    }
  }

  async function handleFollow() {
    if (!user) {
      navigate("/login");
      return;
    }
    
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
    } catch (err) {
      console.error("Erro ao seguir/desseguir:", err);
    } finally {
      setFollowLoading(false);
    }
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
      console.error("Erro ao carregar perfil:", err);
      if (err.response?.status === 404) {
        setError("Perfil não encontrado.");
      } else if (err.response?.status === 403) {
        setError("Este perfil é privado.");
      } else {
        setError("Erro ao carregar perfil.");
      }
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("pt-PT", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  async function copyProfileLink() {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    alert("Link copiado para a área de transferência!");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-fuchsia-500/30 border-t-fuchsia-500 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl animate-pulse">🎮</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <RetroCard color="rose" className="p-8 max-w-md mx-4 text-center">
          <div className="w-20 h-20 mx-auto mb-4 border-2 border-rose-500 bg-rose-500/20 flex items-center justify-center">
            <span className="text-4xl">😕</span>
          </div>
          <h2 className="text-xl font-bold text-rose-400 mb-2">{error}</h2>
          <p className="text-sm text-slate-400 mb-6 font-mono">O perfil que procuras pode ser privado ou não existir.</p>
          <RetroButton onClick={() => navigate(-1)} color="cyan">
            ← Voltar
          </RetroButton>
        </RetroCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header do Perfil - Estilo Retro */}
      <RetroCard color="fuchsia" className="overflow-hidden">
        {/* Banner com padrão retro */}
        <div className="h-32 md:h-40 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 via-purple-600 to-cyan-500" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.3)_1px,transparent_1px)] bg-[size:20px_20px]" />
          
          {/* Decorative pixels */}
          <div className="absolute top-4 right-4 flex gap-1">
            <div className="w-3 h-3 bg-fuchsia-400" />
            <div className="w-3 h-3 bg-cyan-400" />
            <div className="w-3 h-3 bg-yellow-400" />
          </div>
          <div className="absolute bottom-4 left-4 flex gap-1">
            <div className="w-2 h-2 bg-white/50" />
            <div className="w-2 h-2 bg-white/30" />
            <div className="w-2 h-2 bg-white/20" />
          </div>
        </div>
        
        {/* Info do Perfil */}
        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12 md:-mt-16">
            {/* Avatar com borda retro */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 md:w-28 md:h-28 border-4 border-cyan-400 bg-slate-900 p-1 shadow-[4px_4px_0px_0px_rgba(34,211,238,0.8)]">
                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-4xl font-bold text-cyan-400 overflow-hidden">
                  {profile.avatar_url ? (
                    <img
                      src={
                        profile.avatar_url.startsWith("data:") || profile.avatar_url.startsWith("http")
                          ? profile.avatar_url
                          : `http://localhost:4000${profile.avatar_url}`
                      }
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    profile.name?.charAt(0).toUpperCase()
                  )}
                </div>
              </div>
              {/* Level badge */}
              <div className="absolute -bottom-2 -right-2 px-2.5 py-1 bg-yellow-400 border-2 border-yellow-500 text-xs font-bold text-slate-900 shadow-[2px_2px_0px_0px_rgba(250,204,21,0.8)]">
                Nv. {profile.level}
              </div>
            </div>
            
            <div className="flex-1 pt-4 md:pt-6 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold text-fuchsia-400 truncate uppercase tracking-wide">{profile.name}</h1>
                {!profile.is_public && (
                  <span className="px-2.5 py-1 bg-slate-800 border-2 border-rose-500 text-rose-400 text-xs font-medium flex items-center gap-1 shrink-0">
                    🔒 Privado
                  </span>
                )}
              </div>
              {profile.bio && (
                <p className="text-slate-400 text-sm mt-2 max-w-lg font-mono">{profile.bio}</p>
              )}
              <div className="flex items-center gap-6 mt-3">
                <button
                  onClick={() => setActiveTab("followers")}
                  className="group text-sm text-slate-400 hover:text-fuchsia-400 transition"
                >
                  <span className="font-bold text-fuchsia-400 text-lg group-hover:text-fuchsia-300">{followCounts.followers}</span>
                  <span className="ml-1">seguidores</span>
                </button>
                <button
                  onClick={() => setActiveTab("following")}
                  className="group text-sm text-slate-400 hover:text-cyan-400 transition"
                >
                  <span className="font-bold text-cyan-400 text-lg group-hover:text-cyan-300">{followCounts.following}</span>
                  <span className="ml-1">a seguir</span>
                </button>
                <span className="text-xs text-slate-500 hidden md:inline font-mono">
                  📅 Membro desde {formatDate(profile.member_since)}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2 md:pt-0">
              {/* Botão Seguir */}
              {!isOwnProfile && (
                <RetroButton
                  onClick={handleFollow}
                  disabled={followLoading}
                  color={isFollowing ? "rose" : "fuchsia"}
                  className="flex items-center gap-2"
                >
                  {followLoading ? (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : isFollowing ? (
                    <>✓ A seguir</>
                  ) : (
                    <>➕ Seguir</>
                  )}
                </RetroButton>
              )}
              <RetroButton onClick={copyProfileLink} color="cyan" className="flex items-center gap-2">
                🔗 Partilhar
              </RetroButton>
              {isOwnProfile && (
                <Link
                  to="/app/settings"
                  className="border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-slate-900 shadow-[3px_3px_0px_0px_rgba(250,204,21,0.8)] bg-slate-900/50 font-bold px-4 py-2 transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none flex items-center gap-2"
                >
                  ⚙️ Editar
                </Link>
              )}
            </div>
          </div>
        </div>
      </RetroCard>

      {/* Stats Cards - Estilo Retro */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon="🎮" label="Jogos" value={stats.totalGames} tone="cyan" />
        <StatCard icon="✅" label="Concluídos" value={stats.completedGames} tone="green" />
        <StatCard icon="⏱️" label="Horas" value={`${stats.totalHours.toFixed(0)}h`} tone="yellow" />
        <StatCard icon="✍️" label="Reviews" value={stats.totalReviews} tone="purple" />
        <StatCard icon="⭐" label="Média" value={stats.averageRating || "-"} tone="amber" />
        <StatCard icon="🏆" label="Conquistas" value={stats.totalAchievements} tone="fuchsia" />
      </div>

      {/* Tabs - Estilo Retro */}
      <div className="flex gap-2 p-2 bg-slate-900 border-2 border-fuchsia-500/30 overflow-x-auto">
        <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")}>
          📊 Visão Geral
        </TabButton>
        <TabButton active={activeTab === "games"} onClick={() => setActiveTab("games")}>
          🎮 Jogos
        </TabButton>
        <TabButton active={activeTab === "achievements"} onClick={() => setActiveTab("achievements")}>
          🏆 Conquistas
        </TabButton>
        <TabButton active={activeTab === "reviews"} onClick={() => setActiveTab("reviews")}>
          ✍️ Reviews
        </TabButton>
        <TabButton active={activeTab === "followers"} onClick={() => setActiveTab("followers")}>
          👥 Seguidores
        </TabButton>
        <TabButton active={activeTab === "following"} onClick={() => setActiveTab("following")}>
          ➡️ A Seguir
        </TabButton>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Jogos Favoritos */}
          <RetroCard color="yellow" className="p-5">
            <h2 className="text-sm font-bold text-yellow-400 mb-4 flex items-center gap-2 uppercase tracking-wide">
              <span className="w-8 h-8 border-2 border-yellow-400 bg-yellow-400/20 flex items-center justify-center text-base">⭐</span>
              Jogos Favoritos
            </h2>
            {favoriteGames.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6 font-mono">Sem jogos favoritos ainda</p>
            ) : (
              <div className="space-y-2">
                {favoriteGames.map((game) => (
                  <GameCard key={game.id} game={game} navigate={navigate} />
                ))}
              </div>
            )}
          </RetroCard>

          {/* Jogos Recentes */}
          <RetroCard color="cyan" className="p-5">
            <h2 className="text-sm font-bold text-cyan-400 mb-4 flex items-center gap-2 uppercase tracking-wide">
              <span className="w-8 h-8 border-2 border-cyan-400 bg-cyan-400/20 flex items-center justify-center text-base">🕐</span>
              Adicionados Recentemente
            </h2>
            {recentGames.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6 font-mono">Sem jogos recentes</p>
            ) : (
              <div className="space-y-2">
                {recentGames.map((game) => (
                  <GameCard key={game.id} game={game} navigate={navigate} showDate />
                ))}
              </div>
            )}
          </RetroCard>

          {/* Conquistas Recentes */}
          <RetroCard color="fuchsia" className="p-5">
            <h2 className="text-sm font-bold text-fuchsia-400 mb-4 flex items-center gap-2 uppercase tracking-wide">
              <span className="w-8 h-8 border-2 border-fuchsia-500 bg-fuchsia-500/20 flex items-center justify-center text-base">🏆</span>
              Conquistas Recentes
            </h2>
            {achievements.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6 font-mono">Sem conquistas ainda</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {achievements.slice(0, 8).map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex items-center gap-2 bg-slate-800/50 border-2 border-fuchsia-500/30 px-3 py-2 hover:border-fuchsia-500 transition-all"
                    title={achievement.description}
                  >
                    <span className="text-lg">{achievement.icon}</span>
                    <span className="text-xs font-medium text-slate-300">{achievement.name}</span>
                  </div>
                ))}
                {achievements.length > 8 && (
                  <button
                    onClick={() => setActiveTab("achievements")}
                    className="px-3 py-2 text-xs text-fuchsia-400 hover:text-fuchsia-300 font-bold bg-fuchsia-500/20 border-2 border-fuchsia-500/50 transition"
                  >
                    +{achievements.length - 8} mais
                  </button>
                )}
              </div>
            )}
          </RetroCard>

          {/* Reviews Recentes */}
          <RetroCard color="green" className="p-5">
            <h2 className="text-sm font-bold text-green-400 mb-4 flex items-center gap-2 uppercase tracking-wide">
              <span className="w-8 h-8 border-2 border-green-400 bg-green-400/20 flex items-center justify-center text-base">✍️</span>
              Reviews Recentes
            </h2>
            {recentReviews.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6 font-mono">Sem reviews ainda</p>
            ) : (
              <div className="space-y-2">
                {recentReviews.slice(0, 3).map((review) => (
                  <div key={review.id} className="bg-slate-800/50 border-2 border-green-400/30 p-3 hover:border-green-400 transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm text-slate-200 truncate">{review.game_title}</span>
                      <span className={`font-bold text-sm px-2 py-0.5 border-2 ${
                        review.rating >= 8 ? "border-green-400 bg-green-400/20 text-green-400" :
                        review.rating >= 6 ? "border-yellow-400 bg-yellow-400/20 text-yellow-400" :
                        "border-rose-500 bg-rose-500/20 text-rose-400"
                      }`}>
                        {review.rating}/10
                      </span>
                    </div>
                    {review.title && (
                      <p className="text-xs text-slate-400">{review.title}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </RetroCard>
        </div>
      )}

      {activeTab === "games" && (
        <RetroCard color="cyan" className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...favoriteGames, ...recentGames]
              .filter((game, index, self) => 
                index === self.findIndex(g => g.id === game.id)
              )
              .map((game) => (
                <div
                  key={game.id}
                  onClick={() => navigate(`/app/jogo/${game.id}`)}
                  className="cursor-pointer group overflow-hidden bg-slate-800 border-2 border-cyan-400/30 hover:border-cyan-400 transition-all shadow-[2px_2px_0px_0px_rgba(34,211,238,0.4)] hover:shadow-[4px_4px_0px_0px_rgba(34,211,238,0.8)]"
                >
                  <div className="aspect-[3/4] overflow-hidden bg-slate-700">
                    {game.cover_url ? (
                      <img
                        src={game.cover_url}
                        alt={game.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-cyan-500 to-fuchsia-500">🎮</div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-semibold text-slate-200 truncate">{game.title}</p>
                    {game.rating && (
                      <p className={`text-[10px] font-bold mt-0.5 ${
                        game.rating >= 8 ? "text-green-400" :
                        game.rating >= 6 ? "text-yellow-400" :
                        "text-rose-400"
                      }`}>⭐ {game.rating}/10</p>
                    )}
                  </div>
                </div>
              ))}
          </div>
          {favoriteGames.length === 0 && recentGames.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-8 font-mono">Este utilizador ainda não tem jogos na coleção.</p>
          )}
        </RetroCard>
      )}

      {activeTab === "achievements" && (
        <RetroCard color="fuchsia" className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-center gap-4 bg-slate-800/50 border-2 border-fuchsia-500/30 p-4 hover:border-fuchsia-500 transition-all"
              >
                <div className="w-12 h-12 border-2 border-fuchsia-500 bg-fuchsia-500/20 flex items-center justify-center text-xl shadow-[2px_2px_0px_0px_rgba(217,70,239,0.8)]">
                  {achievement.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-200">{achievement.name}</p>
                  <p className="text-xs text-slate-500 truncate">{achievement.description}</p>
                  <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 font-mono">
                    <span>🗓️</span> {formatDate(achievement.unlocked_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {achievements.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-8 font-mono">Este utilizador ainda não desbloqueou conquistas.</p>
          )}
        </RetroCard>
      )}

      {activeTab === "reviews" && (
        <RetroCard color="green" className="p-6">
          <div className="space-y-4">
            {recentReviews.map((review) => (
              <div key={review.id} className="bg-slate-800/50 border-2 border-green-400/30 p-5 hover:border-green-400 transition-all">
                <div className="flex items-center gap-4 mb-3">
                  {review.game_cover ? (
                    <img
                      src={review.game_cover}
                      alt={review.game_title}
                      className="w-12 h-16 object-cover border-2 border-cyan-400/50"
                    />
                  ) : (
                    <div className="w-12 h-16 border-2 border-cyan-400/50 bg-cyan-400/20 flex items-center justify-center text-xl">🎮</div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-slate-200">{review.game_title}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                      <span>📅</span> {formatDate(review.created_at)}
                    </p>
                  </div>
                  <div className={`text-xl font-bold px-3 py-1.5 border-2 ${
                    review.rating >= 8 ? "border-green-400 bg-green-400/20 text-green-400" :
                    review.rating >= 6 ? "border-yellow-400 bg-yellow-400/20 text-yellow-400" :
                    "border-rose-500 bg-rose-500/20 text-rose-400"
                  }`}>
                    {review.rating}/10
                  </div>
                </div>
                {review.title && (
                  <h5 className="font-semibold text-sm text-slate-200 mb-2">{review.title}</h5>
                )}
                {review.content && (
                  <p className="text-sm text-slate-400 leading-relaxed">{review.content}</p>
                )}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-green-400/30">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <span className="text-rose-500">❤️</span> {review.likes_count || 0} likes
                  </span>
                  {review.spoiler && (
                    <span className="text-xs text-yellow-400 flex items-center gap-1 bg-yellow-400/20 border border-yellow-400/50 px-2 py-0.5">
                      ⚠️ Spoilers
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {recentReviews.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-8 font-mono">Este utilizador ainda não escreveu reviews.</p>
          )}
        </RetroCard>
      )}

      {/* Tab Seguidores */}
      {activeTab === "followers" && (
        <FollowList userId={profile.id} type="followers" navigate={navigate} />
      )}

      {/* Tab A Seguir */}
      {activeTab === "following" && (
        <FollowList userId={profile.id} type="following" navigate={navigate} />
      )}
    </div>
  );
}

// Componente para listar seguidores/seguindo
function FollowList({ userId, type, navigate }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, [userId, type]);

  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await api.get(`/follows/user/${userId}/${type}`);
      setUsers(type === "followers" ? res.data.followers : res.data.following);
      setTotal(res.data.total);
    } catch (err) {
      console.error(`Erro ao carregar ${type}:`, err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <RetroCard color="cyan" className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-700 w-1/3" />
                <div className="h-3 bg-slate-700 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </RetroCard>
    );
  }

  return (
    <RetroCard color={type === "followers" ? "fuchsia" : "green"} className="p-6">
      <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2 uppercase tracking-wide">
        <span className={`w-8 h-8 border-2 ${type === "followers" ? "border-fuchsia-500 bg-fuchsia-500/20" : "border-green-400 bg-green-400/20"} flex items-center justify-center text-base`}>
          {type === "followers" ? "👥" : "➡️"}
        </span>
        <span className={type === "followers" ? "text-fuchsia-400" : "text-green-400"}>
          {type === "followers" ? `${total} Seguidores` : `A seguir ${total}`}
        </span>
      </h3>
      
      {users.length > 0 ? (
        <div className="space-y-3">
          {users.map((u) => (
            <div
              key={u.id}
              onClick={() => navigate(`/app/perfil/${u.id}`)}
              className={`flex items-center gap-4 p-3 bg-slate-800/50 border-2 ${type === "followers" ? "border-fuchsia-500/30 hover:border-fuchsia-500" : "border-green-400/30 hover:border-green-400"} cursor-pointer transition-all`}
            >
              <div className="w-12 h-12 border-2 border-cyan-400 bg-slate-800 flex items-center justify-center text-cyan-400 font-bold text-sm overflow-hidden">
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
                <p className="font-semibold text-sm text-slate-200 truncate">{u.name}</p>
                {u.bio && (
                  <p className="text-xs text-slate-500 truncate font-mono">{u.bio}</p>
                )}
              </div>
              <span className="text-cyan-400">→</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <span className="text-4xl mb-3 block">👀</span>
          <p className="text-slate-500 text-sm font-mono">
            {type === "followers" ? "Ainda não tem seguidores." : "Ainda não segue ninguém."}
          </p>
        </div>
      )}
    </RetroCard>
  );
}

function StatCard({ icon, label, value, tone = "cyan" }) {
  const borderColors = {
    cyan: "border-cyan-400",
    green: "border-green-400",
    yellow: "border-yellow-400",
    purple: "border-purple-500",
    amber: "border-amber-400",
    fuchsia: "border-fuchsia-500"
  };
  const shadowColors = {
    cyan: "shadow-[3px_3px_0px_0px_rgba(34,211,238,0.6)]",
    green: "shadow-[3px_3px_0px_0px_rgba(74,222,128,0.6)]",
    yellow: "shadow-[3px_3px_0px_0px_rgba(250,204,21,0.6)]",
    purple: "shadow-[3px_3px_0px_0px_rgba(168,85,247,0.6)]",
    amber: "shadow-[3px_3px_0px_0px_rgba(251,191,36,0.6)]",
    fuchsia: "shadow-[3px_3px_0px_0px_rgba(217,70,239,0.6)]"
  };
  const textColors = {
    cyan: "text-cyan-400",
    green: "text-green-400",
    yellow: "text-yellow-400",
    purple: "text-purple-400",
    amber: "text-amber-400",
    fuchsia: "text-fuchsia-400"
  };
  
  return (
    <div className={`bg-slate-900 border-2 ${borderColors[tone]} ${shadowColors[tone]} p-4`}>
      <div className="flex flex-col items-center text-center">
        <div className={`w-10 h-10 border-2 ${borderColors[tone]} bg-slate-800 flex items-center justify-center text-lg mb-2`}>
          {icon}
        </div>
        <p className={`text-xl font-bold ${textColors[tone]}`}>{value}</p>
        <p className="text-[10px] font-medium text-slate-500 mt-0.5 uppercase tracking-wide">{label}</p>
      </div>
    </div>
  );
}

function TabButton({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap uppercase tracking-wide ${
        active
          ? "bg-fuchsia-500 text-white border-2 border-fuchsia-400 shadow-[2px_2px_0px_0px_rgba(217,70,239,0.8)]"
          : "text-slate-400 border-2 border-transparent hover:text-fuchsia-400 hover:border-fuchsia-500/50 bg-slate-800/50"
      }`}
    >
      {children}
    </button>
  );
}

function GameCard({ game, navigate, showDate }) {
  return (
    <div
      onClick={() => navigate(`/app/jogo/${game.id}`)}
      className="flex items-center gap-3 bg-slate-800/50 border-2 border-cyan-400/30 p-3 cursor-pointer hover:border-cyan-400 transition-all"
    >
      <div className="w-12 h-16 overflow-hidden bg-slate-700 flex-shrink-0 border-2 border-cyan-400/50">
        {game.cover_url ? (
          <img
            src={game.cover_url}
            alt={game.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl">🎮</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-slate-200 truncate">{game.title}</p>
        {game.rating && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-yellow-400">★</span>
            <span className="text-xs font-medium text-yellow-400">{game.rating}/10</span>
          </div>
        )}
        {showDate && game.created_at && (
          <p className="text-[10px] text-slate-500 mt-1 font-mono">
            {new Date(game.created_at).toLocaleDateString("pt-PT")}
          </p>
        )}
      </div>
      {game.hours_played > 0 && (
        <span className="text-xs font-medium text-cyan-400 bg-cyan-400/20 border border-cyan-400/50 px-2 py-1">{game.hours_played}h</span>
      )}
    </div>
  );
}
