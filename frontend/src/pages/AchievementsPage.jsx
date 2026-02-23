import { useState, useEffect } from "react";
import api from "../services/api";
import { useToast } from "../components/Toast";
import { 
  Trophy, 
  Award, 
  Unlock, 
  Lock,
  Search,
  X
} from "lucide-react";

// ============ COMPONENTES  ============

function RetroCard({ children, color = "fuchsia", className = "" }) {
  const colors = {
    fuchsia: "border-fuchsia-500 shadow-[4px_4px_0px_0px_rgba(217,70,239,0.5)]",
    cyan: "border-cyan-400 shadow-[4px_4px_0px_0px_rgba(34,211,238,0.5)]",
    yellow: "border-yellow-400 shadow-[4px_4px_0px_0px_rgba(250,204,21,0.5)]",
    green: "border-green-400 shadow-[4px_4px_0px_0px_rgba(74,222,128,0.5)]",
    rose: "border-rose-500 shadow-[4px_4px_0px_0px_rgba(244,63,94,0.5)]",
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border-2 ${colors[color]} ${className}`}>
      {children}
    </div>
  );
}

function RetroButton({ children, color = "fuchsia", onClick, className = "", disabled = false, active = false }) {
  const colors = {
    fuchsia: active 
      ? "border-fuchsia-500 bg-fuchsia-500 text-white shadow-none translate-x-[2px] translate-y-[2px]"
      : "border-fuchsia-500 bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/20 dark:text-fuchsia-400 hover:bg-fuchsia-500 hover:text-white shadow-[3px_3px_0px_0px_rgba(217,70,239,0.6)]",
    cyan: active
      ? "border-cyan-400 bg-cyan-400 text-slate-900 shadow-none translate-x-[2px] translate-y-[2px]"
      : "border-cyan-400 bg-cyan-50 text-cyan-600 dark:bg-cyan-400/20 dark:text-cyan-400 hover:bg-cyan-400 hover:text-slate-900 shadow-[3px_3px_0px_0px_rgba(34,211,238,0.6)]",
    yellow: active
      ? "border-yellow-400 bg-yellow-400 text-slate-900 shadow-none translate-x-[2px] translate-y-[2px]"
      : "border-yellow-400 bg-yellow-50 text-yellow-600 dark:bg-yellow-400/20 dark:text-yellow-400 hover:bg-yellow-400 hover:text-slate-900 shadow-[3px_3px_0px_0px_rgba(250,204,21,0.6)]",
    green: active
      ? "border-green-400 bg-green-400 text-slate-900 shadow-none translate-x-[2px] translate-y-[2px]"
      : "border-green-400 bg-green-50 text-green-600 dark:bg-green-400/20 dark:text-green-400 hover:bg-green-400 hover:text-slate-900 shadow-[3px_3px_0px_0px_rgba(74,222,128,0.6)]",
    rose: active
      ? "border-rose-500 bg-rose-500 text-white shadow-none translate-x-[2px] translate-y-[2px]"
      : "border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 hover:bg-rose-500 hover:text-white shadow-[3px_3px_0px_0px_rgba(244,63,94,0.6)]",
    slate: active
      ? "border-slate-500 bg-slate-500 text-white shadow-none translate-x-[2px] translate-y-[2px]"
      : "border-slate-500 bg-slate-200 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400 hover:bg-slate-500 hover:text-white shadow-[3px_3px_0px_0px_rgba(100,116,139,0.6)]",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1.5 border-2 font-bold text-xs uppercase tracking-wide transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-50 disabled:cursor-not-allowed ${colors[color]} ${className}`}
    >
      {children}
    </button>
  );
}

export default function AchievementsPage() {
  const toast = useToast();
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState({ totalXP: 0, level: 1, xpToNextLevel: 100, unlockedCount: 0, totalCount: 0, completionPercentage: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [checking, setChecking] = useState(false);
  const [newUnlocks, setNewUnlocks] = useState([]);

  useEffect(() => { fetchAchievements(); }, []);

  async function fetchAchievements() {
    try {
      setLoading(true);
      const res = await api.get("/achievements/me");
      setAchievements(res.data.achievements || []);
      setStats(res.data.stats);
    } catch (err) { console.error("Erro ao carregar conquistas:", err); } finally { setLoading(false); }
  }

  async function checkForNewAchievements() {
    try {
      setChecking(true);
      const res = await api.post("/achievements/check");
      if (res.data.newAchievements?.length > 0) {
        setNewUnlocks(res.data.newAchievements);
        fetchAchievements();
        res.data.newAchievements.forEach((ach) => toast.achievement(`${ach.name} - ${ach.xp_reward} XP`, { title: "Nova Conquista!", icon: ach.icon }));
      } else {
        toast.info("Nenhuma nova conquista encontrada.", { title: "Verificação completa" });
        setNewUnlocks([]);
      }
    } catch (err) { console.error("Erro ao verificar conquistas:", err); } finally { setChecking(false); }
  }

  function getCategoryLabel(category) {
    const labels = { collection: "Coleção", playtime: "Tempo de Jogo", social: "Social", special: "Especial" };
    return labels[category] || category;
  }

  function getCategoryColor(category) {
    const colors = { collection: "cyan", playtime: "yellow", social: "rose", special: "green" };
    return colors[category] || "fuchsia";
  }

  function getCategoryBorderColor(category) {
    const colors = { collection: "border-cyan-400", playtime: "border-yellow-400", social: "border-rose-500", special: "border-green-400" };
    return colors[category] || "border-fuchsia-500";
  }

  const filteredAchievements = achievements.filter(a => {
    if (filter === "all") return true;
    if (filter === "unlocked") return a.unlocked_at !== null;
    if (filter === "locked") return a.unlocked_at === null;
    return a.category === filter;
  });

  const categories = ["collection", "playtime", "social", "special"];

  if (loading) return <div className="flex items-center justify-center py-20"><Trophy size={48} className="animate-pulse text-yellow-500" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <RetroCard color="yellow" className="p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(250,204,21,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(250,204,21,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
        
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 text-sm font-bold uppercase tracking-widest mb-2">
              <span className="inline-block w-3 h-3 bg-yellow-500 animate-pulse" />
              Conquistas
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-1 flex items-center gap-2"><Trophy size={28} /> Conquistas</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Desbloqueia conquistas ao jogar e interagir com a comunidade
            </p>
          </div>
          <RetroButton color="cyan" onClick={checkForNewAchievements} disabled={checking}>
            {checking ? <><Search size={14} className="animate-spin" /> A verificar...</> : <><Search size={14} /> Verificar Novas</>}
          </RetroButton>
        </div>

        {/* Barra de Progresso */}
        <div className="relative mt-5 border-2 border-yellow-400/50 bg-white dark:bg-slate-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-400/20 flex items-center justify-center text-xl font-black text-yellow-600 dark:text-yellow-400">
                {stats.level}
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Nível {stats.level}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{stats.totalXP} XP total</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-cyan-600 dark:text-cyan-400">{stats.unlockedCount}/{stats.totalCount}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{stats.completionPercentage}% completo</p>
            </div>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 mt-3 border border-slate-300 dark:border-slate-600">
            <div className="bg-yellow-400 h-full transition-all duration-500" style={{ width: `${100 - (stats.xpToNextLevel)}%` }} />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
            {stats.xpToNextLevel} XP para o próximo nível
          </p>
        </div>
      </RetroCard>

      {/* Notificação de novas conquistas */}
      {newUnlocks.length > 0 && (
        <RetroCard color="green" className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🎉</span>
            <h3 className="font-bold text-green-600 dark:text-green-400">
              {newUnlocks.length} Nova{newUnlocks.length > 1 ? "s" : ""} Conquista{newUnlocks.length > 1 ? "s" : ""} Desbloqueada{newUnlocks.length > 1 ? "s" : ""}!
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {newUnlocks.map(a => (
              <div key={a.id} className="flex items-center gap-2 bg-white dark:bg-slate-800 border-2 border-green-400/50 px-3 py-2">
                <span className="text-lg">{a.icon}</span>
                <span className="font-bold text-slate-900 dark:text-white">{a.name}</span>
                <span className="text-yellow-600 dark:text-yellow-400 text-xs font-bold">+{a.xp_reward} XP</span>
              </div>
            ))}
          </div>
        </RetroCard>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <RetroButton color="fuchsia" onClick={() => setFilter("all")} active={filter === "all"}>
          Todas ({achievements.length})
        </RetroButton>
        <RetroButton color="green" onClick={() => setFilter("unlocked")} active={filter === "unlocked"}>
          <Unlock size={14} className="inline" /> Desbloqueadas ({achievements.filter(a => a.unlocked_at).length})
        </RetroButton>
        <RetroButton color="slate" onClick={() => setFilter("locked")} active={filter === "locked"}>
          <Lock size={14} className="inline" /> Bloqueadas ({achievements.filter(a => !a.unlocked_at).length})
        </RetroButton>
        <div className="w-px bg-slate-300 dark:bg-slate-700 mx-1 hidden md:block" />
        {categories.map(cat => (
          <RetroButton key={cat} color={getCategoryColor(cat)} onClick={() => setFilter(cat)} active={filter === cat}>
            {getCategoryLabel(cat)}
          </RetroButton>
        ))}
      </div>

      {/* Grid de Conquistas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((achievement) => {
          const isUnlocked = achievement.unlocked_at !== null;
          const catColor = getCategoryBorderColor(achievement.category);
          
          return (
            <div
              key={achievement.id}
              className={`relative p-4 border-2 transition-all bg-white dark:bg-slate-900 ${
                isUnlocked
                  ? `${catColor} shadow-[4px_4px_0px_0px_rgba(34,211,238,0.5)]`
                  : "border-slate-300 dark:border-slate-700 opacity-70"
              }`}
            >
              <div className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 border-2 border-yellow-400/50 bg-yellow-50 dark:bg-yellow-400/20 text-yellow-600 dark:text-yellow-400">
                +{achievement.xp_reward} XP
              </div>
              
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 border-2 flex items-center justify-center text-xl ${
                  isUnlocked
                    ? `${catColor} bg-slate-50 dark:bg-slate-800`
                    : "border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 grayscale"
                }`}>
                  {achievement.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold text-sm ${isUnlocked ? "text-slate-900 dark:text-white" : "text-slate-500"}`}>
                    {achievement.name}
                  </h3>
                  <p className={`text-xs mt-0.5 ${isUnlocked ? "text-slate-500 dark:text-slate-400" : "text-slate-400 dark:text-slate-500"}`}>
                    {achievement.description}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[10px] px-2 py-0.5 border ${
                      isUnlocked ? `${catColor} text-slate-500 dark:text-slate-300` : "border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500"
                    }`}>
                      {getCategoryLabel(achievement.category)}
                    </span>
                    
                    {isUnlocked && (
                      <span className="text-[10px] text-green-600 dark:text-green-400 font-bold">
                        ✓ {new Date(achievement.unlocked_at).toLocaleDateString("pt-PT")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {isUnlocked && (
                <div className={`absolute top-0 left-0 w-full h-1 ${catColor.replace('border-', 'bg-')}`} />
              )}
            </div>
          );
        })}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Search size={48} className="mx-auto mb-2" />
          <p className="text-sm">Nenhuma conquista encontrada com este filtro.</p>
        </div>
      )}
    </div>
  );
}