import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useToast } from "../components/Toast";

// --- Componentes Visuais ---
function RetroCard({ children, className = "" }) {
  return <div className={`bg-white dark:bg-slate-900 border-2 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)] p-6 ${className}`}>{children}</div>;
}

function RetroButton({ children, onClick, disabled, type = "button", className="" }) {
  return (
    <button 
      type={type}
      onClick={onClick} disabled={disabled}
      className={`px-6 py-2 border-2 border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 font-bold uppercase hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

export default function SteamWishlistImportPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [steamInput, setSteamInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [gamesFound, setGamesFound] = useState([]);
  const [selectedGames, setSelectedGames] = useState(new Set());

  // 1. Procurar WISHLIST na Steam
  async function fetchSteamWishlist(e) {
    e.preventDefault();
    if (!steamInput) return;

    setLoading(true);
    try {
      // Nota: Rota específica para wishlist
      const res = await api.get("/steam/wishlist", { params: { steamUrl: steamInput } });
      
      if (res.data.games.length === 0) {
        toast.info("Nenhuma wishlist pública encontrada ou está vazia.");
      } else {
        setGamesFound(res.data.games);
        // Seleciona todos por defeito
        setSelectedGames(new Set(res.data.games.map(g => g.steam_appid)));
        toast.success(`${res.data.count} jogos encontrados na Wishlist!`);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.mensagem || "Erro. Verifica se a Wishlist é Pública.");
    } finally {
      setLoading(false);
    }
  }

  // 2. Alternar seleção
  function toggleGame(id) {
    const newSet = new Set(selectedGames);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedGames(newSet);
  }

  // 3. Importar para a Base de Dados (Tabela Wishlist)
  async function handleImport() {
    if (selectedGames.size === 0) return;
    
    const gamesToImport = gamesFound.filter(g => selectedGames.has(g.steam_appid));

    try {
      setLoading(true);
      // Rota de importação da wishlist
      const res = await api.post("/steam/wishlist/import", { games: gamesToImport });
      toast.success(res.data.mensagem);
      navigate("/app/wishlist"); // Volta para a página da wishlist
    } catch (err) {
      console.error(err);
      toast.error("Erro ao importar wishlist.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                <span className="text-4xl">☁️</span> Importar Wishlist Steam
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Sincroniza os teus desejos da Steam para o GameVault.</p>
        </div>
        <button onClick={() => navigate("/app/wishlist")} className="text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold">VOLTAR</button>
      </div>

      {/* Input */}
      <RetroCard>
        <form onSubmit={fetchSteamWishlist} className="flex gap-4 flex-col md:flex-row">
            <input 
                type="text" 
                placeholder="O teu Username ou Steam ID (ex: gaben)"
            className="flex-1 bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white px-4 py-3 focus:border-rose-500 outline-none font-mono"
                value={steamInput}
                onChange={e => setSteamInput(e.target.value)}
            />
            <RetroButton type="submit" disabled={loading}>
                {loading ? "A carregar..." : "Procurar Wishlist"}
            </RetroButton>
        </form>
        <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-200">
            <strong>Nota Importante:</strong> Nas definições de privacidade da Steam, a opção <strong>"Game Details"</strong> (Detalhes dos Jogos) tem de estar como <strong>Pública</strong> para lermos a Wishlist.
        </div>
      </RetroCard>

      {/* Resultados */}
      {gamesFound.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Barra de Ações */}
          <div className="sticky top-4 z-10 flex items-center justify-between bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 border-2 border-slate-200 dark:border-slate-700 shadow-xl">
            <span className="text-rose-700 dark:text-rose-400 font-bold">{selectedGames.size} jogos selecionados</span>
                <div className="flex gap-3">
              <button onClick={() => setSelectedGames(new Set())} className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold uppercase">Desmarcar Todos</button>
              <button onClick={() => setSelectedGames(new Set(gamesFound.map(g => g.steam_appid)))} className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold uppercase">Marcar Todos</button>
                    <button 
                        onClick={handleImport} 
                        disabled={loading || selectedGames.size === 0}
                        className="bg-rose-500 text-white font-bold px-6 py-2 hover:bg-rose-400 transition-colors uppercase disabled:opacity-50"
                    >
                        {loading ? "A Importar..." : "Confirmar Importação"}
                    </button>
                </div>
            </div>

            {/* Grid de Jogos */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {gamesFound.map(game => {
                    const isSelected = selectedGames.has(game.steam_appid);
                    const displayTitle = game.title && !game.title.includes("Steam Game") 
                      ? game.title 
                      : `🎮 Game #${game.steam_appid}`;
                    return (
                        <div 
                            key={game.steam_appid}
                            onClick={() => toggleGame(game.steam_appid)}
                      className={`cursor-pointer border-2 transition-all relative group overflow-hidden ${
                        isSelected
                        ? "border-rose-500 bg-rose-50 dark:bg-rose-900/20"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 opacity-80 hover:opacity-100 hover:border-slate-300 dark:hover:border-slate-500"
                      }`}
                        >
                      <div className="aspect-[16/9] bg-slate-900 relative">
                                <img src={game.cover_url} alt={displayTitle} className="w-full h-full object-cover" />
                            </div>
                            <div className="p-3">
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate leading-tight" title={displayTitle}>{displayTitle}</h4>
                            </div>
                            {/* Checkmark */}
                            {isSelected && (
                                <div className="absolute top-2 right-2 bg-rose-500 text-white w-6 h-6 flex items-center justify-center font-bold text-xs shadow-lg">✓</div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
      )}
    </div>
  );
}