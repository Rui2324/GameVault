// src/pages/PublicProfilePage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

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
          <div className="w-16 h-16 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin"></div>
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
        <div className="text-center bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl max-w-md mx-4">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
            <span className="text-4xl">😕</span>
          </div>
          <h2 className="text-xl font-bold text-slate-200 mb-2">{error}</h2>
          <p className="text-sm text-slate-400 mb-6">O perfil que procuras pode ser privado ou não existir.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-medium rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105"
          >
            ← Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header do Perfil - Redesenhado */}
      <div className="rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm overflow-hidden shadow-xl">
        {/* Banner com overlay gradient */}
        <div className="h-32 md:h-40 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 animate-gradient" style={{ backgroundSize: '200% 200%' }} />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
          
          {/* Floating elements */}
          <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute bottom-4 left-1/4 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl" />
        </div>
        
        {/* Info do Perfil */}
        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12 md:-mt-16">
            {/* Avatar com ring de nível */}
            <div className="relative">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-1 shadow-xl shadow-indigo-500/25">
                <div className="w-full h-full rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-4xl font-bold text-indigo-600 overflow-hidden">
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
              <div className="absolute -bottom-2 -right-2 px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg text-xs font-bold text-white shadow-lg">
                Nv. {profile.level}
              </div>
            </div>
            
            <div className="flex-1 pt-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">{profile.name}</h1>
                {!profile.is_public && (
                  <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-medium flex items-center gap-1">
                    🔒 Privado
                  </span>
                )}
              </div>
              {profile.bio && (
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-2 max-w-lg">{profile.bio}</p>
              )}
              <div className="flex items-center gap-6 mt-3">
                <button
                  onClick={() => setActiveTab("followers")}
                  className="group text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  <span className="font-bold text-slate-800 dark:text-white text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{followCounts.followers}</span>
                  <span className="ml-1">seguidores</span>
                </button>
                <button
                  onClick={() => setActiveTab("following")}
                  className="group text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  <span className="font-bold text-slate-800 dark:text-white text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{followCounts.following}</span>
                  <span className="ml-1">a seguir</span>
                </button>
                <span className="text-xs text-slate-400 dark:text-slate-500 hidden md:inline">
                  📅 Membro desde {formatDate(profile.member_since)}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2 md:pt-0">
              {/* Botão Seguir */}
              {!isOwnProfile && (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center gap-2 ${
                    isFollowing
                      ? "bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-700"
                      : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105"
                  }`}
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
                </button>
              )}
              <button
                onClick={copyProfileLink}
                className="px-4 py-2 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm border border-slate-200 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl transition-all duration-300 flex items-center gap-2 hover:scale-105"
              >
                🔗 Partilhar
              </button>
              {isOwnProfile && (
                <Link
                  to="/app/settings"
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold rounded-xl transition-all duration-300 flex items-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105"
                >
                  ⚙️ Editar
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon="🎮" label="Jogos" value={stats.totalGames} tone="blue" />
        <StatCard icon="✅" label="Concluídos" value={stats.completedGames} tone="green" />
        <StatCard icon="⏱️" label="Horas" value={`${stats.totalHours.toFixed(0)}h`} tone="orange" />
        <StatCard icon="✍️" label="Reviews" value={stats.totalReviews} tone="purple" />
        <StatCard icon="⭐" label="Média" value={stats.averageRating || "-"} tone="amber" />
        <StatCard icon="🏆" label="Conquistas" value={stats.totalAchievements} tone="indigo" />
      </div>

      {/* Tabs - Design pill moderno */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl overflow-x-auto">
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
          <div className="rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-5 shadow-lg">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-base shadow-md">⭐</span>
              Jogos Favoritos
            </h2>
            {favoriteGames.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-6">Sem jogos favoritos ainda</p>
            ) : (
              <div className="space-y-2">
                {favoriteGames.map((game) => (
                  <GameCard key={game.id} game={game} navigate={navigate} />
                ))}
              </div>
            )}
          </div>

          {/* Jogos Recentes */}
          <div className="rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-5 shadow-lg">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-base shadow-md">🕐</span>
              Adicionados Recentemente
            </h2>
            {recentGames.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-6">Sem jogos recentes</p>
            ) : (
              <div className="space-y-2">
                {recentGames.map((game) => (
                  <GameCard key={game.id} game={game} navigate={navigate} showDate />
                ))}
              </div>
            )}
          </div>

          {/* Conquistas Recentes */}
          <div className="rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-5 shadow-lg">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-base shadow-md">🏆</span>
              Conquistas Recentes
            </h2>
            {achievements.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-6">Sem conquistas ainda</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {achievements.slice(0, 8).map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex items-center gap-2 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-600/50 rounded-xl px-3 py-2 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300"
                    title={achievement.description}
                  >
                    <span className="text-lg">{achievement.icon}</span>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{achievement.name}</span>
                  </div>
                ))}
                {achievements.length > 8 && (
                  <button
                    onClick={() => setActiveTab("achievements")}
                    className="px-3 py-2 text-xs text-indigo-600 hover:text-indigo-500 font-semibold bg-indigo-50 dark:bg-indigo-900/30 rounded-xl transition"
                  >
                    +{achievements.length - 8} mais
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Reviews Recentes */}
          <div className="rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-5 shadow-lg">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-base shadow-md">✍️</span>
              Reviews Recentes
            </h2>
            {recentReviews.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-6">Sem reviews ainda</p>
            ) : (
              <div className="space-y-2">
                {recentReviews.slice(0, 3).map((review) => (
                  <div key={review.id} className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-600/50 rounded-xl p-3 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{review.game_title}</span>
                      <span className={`font-bold text-sm px-2 py-0.5 rounded-lg ${
                        review.rating >= 8 ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" :
                        review.rating >= 6 ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600" :
                        "bg-red-100 dark:bg-red-900/30 text-red-600"
                      }`}>
                        {review.rating}/10
                      </span>
                    </div>
                    {review.title && (
                      <p className="text-xs text-slate-600 dark:text-slate-400">{review.title}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "games" && (
        <div className="rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 shadow-lg">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...favoriteGames, ...recentGames]
              .filter((game, index, self) => 
                index === self.findIndex(g => g.id === game.id)
              )
              .map((game) => (
                <div
                  key={game.id}
                  onClick={() => navigate(`/app/jogo/${game.id}`)}
                  className="card-3d cursor-pointer group rounded-xl overflow-hidden bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-600/50 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300"
                >
                  <div className="aspect-[3/4] overflow-hidden bg-slate-100 dark:bg-slate-700">
                    {game.cover_url ? (
                      <img
                        src={game.cover_url}
                        alt={game.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-indigo-500 to-purple-500">🎮</div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{game.title}</p>
                    {game.rating && (
                      <p className={`text-[10px] font-bold mt-0.5 ${
                        game.rating >= 8 ? "text-emerald-600" :
                        game.rating >= 6 ? "text-amber-600" :
                        "text-red-600"
                      }`}>⭐ {game.rating}/10</p>
                    )}
                  </div>
                </div>
              ))}
          </div>
          {favoriteGames.length === 0 && recentGames.length === 0 && (
            <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-8">Este utilizador ainda não tem jogos na coleção.</p>
          )}
        </div>
      )}

      {activeTab === "achievements" && (
        <div className="rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="card-3d flex items-center gap-4 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-600/50 rounded-xl p-4 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xl shadow-lg">
                  {achievement.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{achievement.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{achievement.description}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                    <span>🗓️</span> {formatDate(achievement.unlocked_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {achievements.length === 0 && (
            <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-8">Este utilizador ainda não desbloqueou conquistas.</p>
          )}
        </div>
      )}

      {activeTab === "reviews" && (
        <div className="rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 shadow-lg">
          <div className="space-y-4">
            {recentReviews.map((review) => (
              <div key={review.id} className="card-3d bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-600/50 rounded-xl p-5 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300">
                <div className="flex items-center gap-4 mb-3">
                  {review.game_cover ? (
                    <img
                      src={review.game_cover}
                      alt={review.game_title}
                      className="w-12 h-16 rounded-lg object-cover shadow-md"
                    />
                  ) : (
                    <div className="w-12 h-16 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xl">🎮</div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">{review.game_title}</h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <span>📅</span> {formatDate(review.created_at)}
                    </p>
                  </div>
                  <div className={`text-xl font-bold px-3 py-1.5 rounded-xl ${
                    review.rating >= 8 ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" :
                    review.rating >= 6 ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600" :
                    "bg-red-100 dark:bg-red-900/30 text-red-600"
                  }`}>
                    {review.rating}/10
                  </div>
                </div>
                {review.title && (
                  <h5 className="font-semibold text-sm text-slate-800 dark:text-slate-200 mb-2">{review.title}</h5>
                )}
                {review.content && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{review.content}</p>
                )}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-600/50">
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <span className="text-red-500">❤️</span> {review.likes_count || 0} likes
                  </span>
                  {review.spoiler && (
                    <span className="text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                      ⚠️ Spoilers
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {recentReviews.length === 0 && (
            <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-8">Este utilizador ainda não escreveu reviews.</p>
          )}
        </div>
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
      <div className="rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 shadow-lg">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full skeleton" />
              <div className="flex-1 space-y-2">
                <div className="h-4 skeleton rounded-lg w-1/3" />
                <div className="h-3 skeleton rounded-lg w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 shadow-lg">
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
        <span className={`w-8 h-8 rounded-lg ${type === "followers" ? "bg-gradient-to-br from-indigo-500 to-purple-500" : "bg-gradient-to-br from-emerald-500 to-teal-500"} flex items-center justify-center text-base shadow-md`}>
          {type === "followers" ? "👥" : "➡️"}
        </span>
        {type === "followers" ? `${total} Seguidores` : `A seguir ${total}`}
      </h3>
      
      {users.length > 0 ? (
        <div className="space-y-3">
          {users.map((u) => (
            <div
              key={u.id}
              onClick={() => navigate(`/app/perfil/${u.id}`)}
              className="card-3d flex items-center gap-4 p-3 rounded-xl bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-600/50 hover:border-indigo-300 dark:hover:border-indigo-600 cursor-pointer transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden shadow-lg">
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
                <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{u.name}</p>
                {u.bio && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.bio}</p>
                )}
              </div>
              <span className="text-slate-400 dark:text-slate-500">→</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <span className="text-4xl mb-3 block">👀</span>
          <p className="text-slate-400 dark:text-slate-500 text-sm">
            {type === "followers" ? "Ainda não tem seguidores." : "Ainda não segue ninguém."}
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, tone = "blue" }) {
  const gradients = {
    blue: "from-blue-500 to-cyan-500",
    green: "from-emerald-500 to-teal-500",
    orange: "from-orange-500 to-amber-500",
    purple: "from-purple-500 to-pink-500",
    amber: "from-amber-500 to-yellow-500",
    indigo: "from-indigo-500 to-violet-500",
  };
  const bgTones = {
    blue: "bg-blue-50 dark:bg-blue-900/20",
    green: "bg-emerald-50 dark:bg-emerald-900/20",
    orange: "bg-orange-50 dark:bg-orange-900/20",
    purple: "bg-purple-50 dark:bg-purple-900/20",
    amber: "bg-amber-50 dark:bg-amber-900/20",
    indigo: "bg-indigo-50 dark:bg-indigo-900/20",
  };
  return (
    <div className={`card-3d rounded-xl ${bgTones[tone]} border border-slate-200/50 dark:border-slate-700/50 p-4`}>
      <div className="flex flex-col items-center text-center">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradients[tone]} flex items-center justify-center text-lg shadow-lg mb-2`}>
          {icon}
        </div>
        <p className="text-xl font-bold text-slate-800 dark:text-white">{value}</p>
        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function TabButton({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-xs font-semibold rounded-xl transition-all duration-300 whitespace-nowrap ${
        active
          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
          : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50"
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
      className="card-3d flex items-center gap-3 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-600/50 rounded-xl p-3 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300"
    >
      <div className="w-12 h-16 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-600 flex-shrink-0 shadow-md">
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
        <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{game.title}</p>
        {game.rating && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-amber-500">★</span>
            <span className="text-xs font-medium text-amber-600 dark:text-amber-500">{game.rating}/10</span>
          </div>
        )}
        {showDate && game.created_at && (
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
            {new Date(game.created_at).toLocaleDateString("pt-PT")}
          </p>
        )}
      </div>
      {game.hours_played > 0 && (
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-600 px-2 py-1 rounded-lg">{game.hours_played}h</span>
      )}
    </div>
  );
}
