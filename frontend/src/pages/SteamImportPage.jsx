import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useToast } from "../components/Toast";

// --- Componentes Visuais ---
function RetroCard({ children, className = "" }) {
  return (
    <div className={`bg-white dark:bg-slate-900 border-2 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)] p-6 ${className}`}>
      {children}
    </div>
  );
}

function RetroButton({ children, onClick, disabled, className = "" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-2 border-2 border-cyan-400 bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400 font-bold uppercase hover:bg-cyan-400 hover:text-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

export default function SteamImportPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [steamInput, setSteamInput] = useState("");
  const [steamId64, setSteamId64] = useState(""); // ✅ guardar steamId devolvido
  const [loading, setLoading] = useState(false);
  const [gamesFound, setGamesFound] = useState([]);
  const [selectedGames, setSelectedGames] = useState(new Set());

  // 1. Procurar Jogos na Steam
  async function fetchSteamLibrary(e) {
    e.preventDefault();
    if (!steamInput) return;

    setLoading(true);
    try {
      const res = await api.get("/steam/library", { params: { steamUrl: steamInput } });

      setGamesFound(res.data.games || []);
      setSteamId64(res.data.steamId || ""); // ✅ aqui

      setSelectedGames(new Set((res.data.games || []).map((g) => g.steam_appid)));
      toast.success(`${res.data.count} jogos encontrados!`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.mensagem || "Erro ao ler a Steam.");
    } finally {
      setLoading(false);
    }
  }

  function toggleGame(id) {
    const newSet = new Set(selectedGames);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedGames(newSet);
  }

  // 3. Enviar para a Base de Dados
  async function handleImport() {
    if (selectedGames.size === 0) return;

    const gamesToImport = gamesFound.filter((g) => selectedGames.has(g.steam_appid));

    try {
      setLoading(true);

      // ✅ manda steamId junto
      const res = await api.post("/steam/import", {
        steamId: steamId64,
        games: gamesToImport,
      });

      toast.success(res.data.mensagem || "Import feito!");
      navigate("/app/colecao");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.mensagem || "Erro ao importar jogos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <span className="text-4xl">☁️</span> Importar da Steam
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Sincroniza a tua biblioteca e horas jogadas automaticamente.</p>
        </div>
        <button onClick={() => navigate("/app/colecao")} className="text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold">
          VOLTAR
        </button>
      </div>

      <RetroCard>
        <form onSubmit={fetchSteamLibrary} className="flex gap-4 flex-col md:flex-row">
          <input
            type="text"
            placeholder="O teu Username ou Steam ID (ex: gaben)"
            className="flex-1 bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white px-4 py-3 focus:border-cyan-400 outline-none font-mono"
            value={steamInput}
            onChange={(e) => setSteamInput(e.target.value)}
          />
          <RetroButton onClick={fetchSteamLibrary} disabled={loading}>
            {loading ? "A carregar..." : "Procurar Biblioteca"}
          </RetroButton>
        </form>

        <div className="mt-4 p-3 bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-200 dark:border-cyan-900/50 text-xs text-cyan-700 dark:text-cyan-200">
          <strong>Nota:</strong> O teu perfil da Steam tem de estar definido como <strong>"Público"</strong> (incluindo{" "}
          <strong>"Detalhes do jogo"</strong>) para isto funcionar.
        </div>

        {!!steamId64 && (
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
            steamId64: <span className="text-cyan-600 dark:text-cyan-300 font-bold">{steamId64}</span>
          </div>
        )}
      </RetroCard>

      {gamesFound.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="sticky top-4 z-10 flex items-center justify-between bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 border-2 border-slate-200 dark:border-slate-700 shadow-xl">
            <span className="text-cyan-700 dark:text-cyan-400 font-bold">{selectedGames.size} jogos selecionados</span>
            <div className="flex gap-3">
              <button onClick={() => setSelectedGames(new Set())} className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold uppercase">
                Desmarcar Todos
              </button>
              <button
                onClick={() => setSelectedGames(new Set(gamesFound.map((g) => g.steam_appid)))}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold uppercase"
              >
                Marcar Todos
              </button>
              <button
                onClick={handleImport}
                disabled={loading || selectedGames.size === 0 || !steamId64}
                className="bg-green-500 text-black font-bold px-6 py-2 hover:bg-green-400 transition-colors uppercase disabled:opacity-50"
              >
                {loading ? "A Importar..." : "Confirmar Importação"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {gamesFound.map((game) => {
              const isSelected = selectedGames.has(game.steam_appid);
              return (
                <div
                  key={game.steam_appid}
                  onClick={() => toggleGame(game.steam_appid)}
                  className={`cursor-pointer border-2 transition-all relative group overflow-hidden ${
                    isSelected
                      ? "border-cyan-400 bg-cyan-50 dark:bg-cyan-900/20"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 opacity-80 hover:opacity-100 hover:border-slate-300 dark:hover:border-slate-500"
                  }`}
                >
                  <div className="aspect-[16/9] bg-slate-900 relative">
                    <img src={game.cover_url} alt={game.title} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 right-0 bg-black/80 text-white text-[10px] font-mono px-2 py-0.5">
                      {game.hours_played}h
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate leading-tight" title={game.title}>
                      {game.title}
                    </h4>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-cyan-400 text-black w-6 h-6 flex items-center justify-center font-bold text-xs shadow-lg">
                      ✓
                    </div>
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
