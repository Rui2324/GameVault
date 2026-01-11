// src/pages/AchievementsPage.jsx
import { useState, useEffect } from "react";
import api from "../services/api";
import { useToast } from "../components/Toast";

export default function AchievementsPage() {
  const toast = useToast();
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState({
    totalXP: 0,
    level: 1,
    xpToNextLevel: 100,
    unlockedCount: 0,
    totalCount: 0,
    completionPercentage: 0
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [checking, setChecking] = useState(false);
  const [newUnlocks, setNewUnlocks] = useState([]);

  useEffect(() => {
    fetchAchievements();
  }, []);

  async function fetchAchievements() {
    try {
      setLoading(true);
      const res = await api.get("/achievements/me");
      setAchievements(res.data.achievements || []);
      setStats(res.data.stats);
    } catch (err) {
      console.error("Erro ao carregar conquistas:", err);
    } finally {
      setLoading(false);
    }
  }

  async function checkForNewAchievements() {
    try {
      setChecking(true);
      const res = await api.post("/achievements/check");
      
      if (res.data.newAchievements?.length > 0) {
        setNewUnlocks(res.data.newAchievements);
        fetchAchievements();
        
        // Toast para cada conquista nova
        res.data.newAchievements.forEach((ach) => {
          toast.achievement(`${ach.name} - ${ach.xp_reward} XP`, {
            title: "Nova Conquista! 🏆",
            icon: ach.icon,
          });
        });
      } else {
        toast.info("Nenhuma nova conquista encontrada.", {
          title: "Verificação completa",
        });
        setNewUnlocks([]);
      }
    } catch (err) {
      console.error("Erro ao verificar conquistas:", err);
    } finally {
      setChecking(false);
    }
  }

  function getCategoryLabel(category) {
    const labels = {
      collection: "Coleção",
      playtime: "Tempo de Jogo",
      social: "Social",
      special: "Especial"
    };
    return labels[category] || category;
  }

  function getCategoryColor(category) {
    const colors = {
      collection: "from-blue-500 to-indigo-500",
      playtime: "from-orange-400 to-amber-500",
      social: "from-pink-400 to-rose-500",
      special: "from-emerald-400 to-teal-500"
    };
    return colors[category] || "from-slate-400 to-slate-500";
  }

  function getCategoryBg(category) {
    const colors = {
      collection: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
      playtime: "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800",
      social: "bg-pink-50 border-pink-200 dark:bg-pink-900/20 dark:border-pink-800",
      special: "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
    };
    return colors[category] || "bg-slate-50 border-slate-200 dark:bg-slate-700 dark:border-slate-600";
  }

  const filteredAchievements = achievements.filter(a => {
    if (filter === "all") return true;
    if (filter === "unlocked") return a.unlocked_at !== null;
    if (filter === "locked") return a.unlocked_at === null;
    return a.category === filter;
  });

  const categories = ["collection", "playtime", "social", "special"];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Stats */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">🏆 Conquistas</h1>
            <p className="text-indigo-100 text-sm">
              Desbloqueia conquistas ao jogar e interagir com a comunidade
            </p>
          </div>
          <button
            onClick={checkForNewAchievements}
            disabled={checking}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition flex items-center gap-2 self-start border border-white/30"
          >
            {checking ? (
              <>
                <span className="animate-spin">🔄</span> A verificar...
              </>
            ) : (
              <>🔍 Verificar Novas</>
            )}
          </button>
        </div>

        {/* Barra de Progresso */}
        <div className="mt-5 bg-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                {stats.level}
              </div>
              <div>
                <p className="font-semibold">Nível {stats.level}</p>
                <p className="text-xs text-indigo-200">{stats.totalXP} XP total</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold">{stats.unlockedCount}/{stats.totalCount}</p>
              <p className="text-xs text-indigo-200">{stats.completionPercentage}% completo</p>
            </div>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2 mt-3">
            <div
              className="bg-white rounded-full h-2 transition-all duration-500"
              style={{ width: `${100 - (stats.xpToNextLevel)}%` }}
            />
          </div>
          <p className="text-xs text-indigo-200 mt-1 text-center">
            {stats.xpToNextLevel} XP para o próximo nível
          </p>
        </div>
      </div>

      {/* Notificação de novas conquistas */}
      {newUnlocks.length > 0 && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🎉</span>
            <h3 className="font-semibold text-amber-800 dark:text-amber-300">
              {newUnlocks.length} Nova{newUnlocks.length > 1 ? "s" : ""} Conquista{newUnlocks.length > 1 ? "s" : ""} Desbloqueada{newUnlocks.length > 1 ? "s" : ""}!
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {newUnlocks.map(a => (
              <div key={a.id} className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-lg px-3 py-2 border border-amber-200 dark:border-amber-700">
                <span className="text-lg">{a.icon}</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">{a.name}</span>
                <span className="text-amber-600 dark:text-amber-400 text-xs font-medium">+{a.xp_reward} XP</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
            filter === "all"
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
          }`}
        >
          Todas ({achievements.length})
        </button>
        <button
          onClick={() => setFilter("unlocked")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
            filter === "unlocked"
              ? "bg-emerald-600 text-white border-emerald-600"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
          }`}
        >
          ✅ Desbloqueadas ({achievements.filter(a => a.unlocked_at).length})
        </button>
        <button
          onClick={() => setFilter("locked")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
            filter === "locked"
              ? "bg-slate-600 text-white border-slate-600"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
          }`}
        >
          🔒 Bloqueadas ({achievements.filter(a => !a.unlocked_at).length})
        </button>
        <div className="w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block" />
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
              filter === cat
                ? `bg-gradient-to-r ${getCategoryColor(cat)} text-white border-transparent`
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
          >
            {getCategoryLabel(cat)}
          </button>
        ))}
      </div>

      {/* Grid de Conquistas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((achievement) => {
          const isUnlocked = achievement.unlocked_at !== null;
          
          return (
            <div
              key={achievement.id}
              className={`relative rounded-xl p-4 border transition-all ${
                isUnlocked
                  ? getCategoryBg(achievement.category)
                  : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60"
              }`}
            >
              {/* Badge de XP */}
              <div className="absolute top-3 right-3 text-[10px] font-medium px-2 py-0.5 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300">
                +{achievement.xp_reward} XP
              </div>
              
              <div className="flex items-start gap-3">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${
                    isUnlocked
                      ? `bg-gradient-to-br ${getCategoryColor(achievement.category)} text-white`
                      : "bg-slate-200 dark:bg-slate-700 grayscale"
                  }`}
                >
                  {achievement.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold text-sm ${isUnlocked ? "text-slate-800 dark:text-slate-200" : "text-slate-500 dark:text-slate-400"}`}>
                    {achievement.name}
                  </h3>
                  <p className={`text-xs mt-0.5 ${isUnlocked ? "text-slate-600 dark:text-slate-400" : "text-slate-400 dark:text-slate-500"}`}>
                    {achievement.description}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      isUnlocked ? "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300" : "bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-400"
                    }`}>
                      {getCategoryLabel(achievement.category)}
                    </span>
                    
                    {isUnlocked && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        ✓ {new Date(achievement.unlocked_at).toLocaleDateString("pt-PT")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Indicador de status */}
              {isUnlocked && (
                <div 
                  className={`absolute top-0 left-0 w-full h-1 rounded-t-xl bg-gradient-to-r ${getCategoryColor(achievement.category)}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          <p className="text-4xl mb-2">🔍</p>
          <p className="text-sm">Nenhuma conquista encontrada com este filtro.</p>
        </div>
      )}
    </div>
  );
}
