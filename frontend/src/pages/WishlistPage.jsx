import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useToast } from "../components/Toast";
import { 
  Heart, 
  Wrench, 
  Cloud, 
  Plus, 
  Search, 
  Gamepad2, 
  Download,
  Trash2,
  X
} from "lucide-react";

// ============ COMPONENTES VISUAIS ============

function RetroCard({ children, color = "fuchsia", className = "" }) {
  const colors = {
    fuchsia: "border-fuchsia-500 shadow-[4px_4px_0px_0px_rgba(217,70,239,0.5)]",
    cyan: "border-cyan-400 shadow-[4px_4px_0px_0px_rgba(34,211,238,0.5)]",
    rose: "border-rose-500 shadow-[4px_4px_0px_0px_rgba(244,63,94,0.5)]",
    green: "border-green-400 shadow-[4px_4px_0px_0px_rgba(74,222,128,0.5)]",
    yellow: "border-yellow-400 shadow-[4px_4px_0px_0px_rgba(250,204,21,0.5)]",
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border-2 ${colors[color]} ${className}`}>
      {children}
    </div>
  );
}

function RetroButton({ children, color = "fuchsia", onClick, className = "", disabled = false, type = "button" }) {
  const colors = {
    fuchsia: "border-fuchsia-500 bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/20 dark:text-fuchsia-400 hover:bg-fuchsia-500 hover:text-white",
    cyan: "border-cyan-400 bg-cyan-50 text-cyan-600 dark:bg-cyan-400/20 dark:text-cyan-400 hover:bg-cyan-400 hover:text-slate-900",
    green: "border-green-400 bg-green-50 text-green-600 dark:bg-green-400/20 dark:text-green-400 hover:bg-green-400 hover:text-slate-900",
    rose: "border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 hover:bg-rose-500 hover:text-white",
    slate: "border-slate-400 bg-slate-50 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-500 hover:text-white",
    yellow: "border-yellow-400 bg-yellow-50 text-yellow-600 dark:bg-yellow-400/20 dark:text-yellow-400 hover:bg-yellow-400 hover:text-slate-900",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 border-2 font-bold text-xs uppercase tracking-wide transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-50 disabled:cursor-not-allowed ${colors[color]} ${className}`}
    >
      {children}
    </button>
  );
}

export default function WishlistPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados do Modal
  const [mostrarModal, setMostrarModal] = useState(false);
  const [termoPesquisa, setTermoPesquisa] = useState("");
  const [resultadosExternos, setResultadosExternos] = useState([]);
  const [loadingPesquisa, setLoadingPesquisa] = useState(false);
  const [erroPesquisa, setErroPesquisa] = useState("");
  const [aImportarId, setAImportarId] = useState(null);

  // Estados de gestão
  const [aMoverId, setAMoverId] = useState(null);
  const [aRemoverId, setARemoverId] = useState(null);

  // Bloquear Scroll
  useEffect(() => {
    if (mostrarModal) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [mostrarModal]);

  useEffect(() => {
    carregarWishlist();
  }, []);

  const wishlistIds = useMemo(() => {
    return new Set(
      wishlist
        .map(item => Number(item.external_id || item.game?.external_id || item.rawg_id || item.game?.rawg_id))
        .filter(Boolean)
    );
  }, [wishlist]);

  async function carregarWishlist() {
    try {
      setLoading(true);
      const res = await api.get("/wishlist");
      const lista = res.data.wishlist || res.data.items || res.data || [];
      setWishlist(lista);
    } catch (err) {
      console.error("Erro wishlist:", err);
      toast.error("Erro ao carregar wishlist.");
    } finally {
      setLoading(false);
    }
  }

  // --- Reparar Nomes (Fetch Metadata) ---
  async function handleFix() {
    try {
      setLoading(true);
      toast.info("A contactar a loja Steam... isto pode demorar uns segundos.");

      const res = await api.post("/steam/fix-metadata");
      toast.success(res.data.mensagem);
      await carregarWishlist();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao corrigir dados.");
    } finally {
      setLoading(false);
    }
  }

  // --- Live Search ---
  async function executarPesquisa(termo) {
    try {
      setLoadingPesquisa(true);
      setErroPesquisa("");

      const res = await api.get("/external-games/search", {
        params: { q: termo, page: 1 }
      });

      const lista = res.data.jogos || res.data.results || res.data.resultados || [];
      if (Array.isArray(lista)) setResultadosExternos(lista);
      else {
        setResultadosExternos([]);
        if (termo.length > 0) setErroPesquisa("Formato inválido.");
      }

    } catch (err) {
      console.error(err);
      setErroPesquisa("Erro ao pesquisar.");
    } finally {
      setLoadingPesquisa(false);
    }
  }

  useEffect(() => {
    if (termoPesquisa.trim().length < 2) {
      setResultadosExternos([]);
      return;
    }
    const timer = setTimeout(() => executarPesquisa(termoPesquisa), 500);
    return () => clearTimeout(timer);
  }, [termoPesquisa]);

  function handleManualSearch(e) {
    e.preventDefault();
    if (termoPesquisa.trim().length >= 2) executarPesquisa(termoPesquisa);
  }

  async function importarParaWishlist(jogo) {
    const idJogo = jogo.external_id || jogo.id;
    if (wishlistIds.has(Number(idJogo))) return;

    try {
      setAImportarId(idJogo);
      await api.post("/external-games/import/wishlist", { external_id: idJogo });
      toast.success("Adicionado à Wishlist!");
      await carregarWishlist();
    } catch (err) {
      console.error(err);
      if (err.response?.status === 409) toast.info("Já está na lista.");
      else toast.error("Erro ao adicionar.");
    } finally {
      setAImportarId(null);
    }
  }

  async function moverParaColecao(item) {
    const jogoId = item.jogo_id || item.game_id || item.game?.id || item.id;
    if (!jogoId) return toast.error("ID inválido.");

    try {
      setAMoverId(item.id);
      await api.post("/collection", { jogo_id: jogoId, rating: null, hours_jogadas: 0, estado: "por_jogar" });
      await api.delete(`/wishlist/${item.id}`);
      toast.success("Movido para a Coleção!");
      setWishlist(p => p.filter(i => i.id !== item.id));
    } catch (err) {
      console.error(err);
      if (err.response?.status === 409) {
        await api.delete(`/wishlist/${item.id}`);
        setWishlist(p => p.filter(i => i.id !== item.id));
        toast.info("Já estava na coleção. Removido da wishlist.");
      } else {
        toast.error("Erro ao mover.");
      }
    } finally {
      setAMoverId(null);
    }
  }

  async function removerDaWishlist(item) {
    if (!confirm("Remover da Wishlist?")) return;
    try {
      setARemoverId(item.id);
      await api.delete(`/wishlist/${item.id}`);
      setWishlist(p => p.filter(i => i.id !== item.id));
      toast.info("Removido.");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao remover.");
    } finally {
      setARemoverId(null);
    }
  }

  // ✅ AQUI ESTÁ A CORREÇÃO
  async function irParaDetalhes(item) {
    const game = item.game || item;

    // tenta rawg_id primeiro (é o que a tua página /explorar quer)
    let rawgId =
      Number(item.rawg_id || game.rawg_id) ||
      // se for rawg e não tiver rawg_id, o external_id costuma ser rawg
      ((item.source === "rawg" || game.source === "rawg") ? Number(item.external_id || game.external_id) : null);

    if (rawgId) {
      navigate(`/app/explorar/${rawgId}`);
      return;
    }

    // se não tem rawg_id, tenta ligar automaticamente à RAWG
    const localGameId = Number(item.game_id || game.game_id || game.id);

    if (localGameId) {
      try {
        toast.info("A ligar este jogo à RAWG…");
        const res = await api.post("/external-games/link-rawg", { game_id: localGameId });

        const novoRawgId = Number(res.data.rawg_id);
        if (novoRawgId) {
          // Atualizar o item na lista local para evitar nova chamada
          setWishlist(prev => prev.map(w => {
            if ((w.game_id || w.game?.id) === localGameId) {
              return { ...w, rawg_id: novoRawgId, game: { ...w.game, rawg_id: novoRawgId } };
            }
            return w;
          }));
          navigate(`/app/explorar/${novoRawgId}`);
          return;
        }

        toast.error("Não deu para ligar à RAWG.");
        return;
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.mensagem || "Não consegui ligar à RAWG. Tenta clicar em 'Reparar Nomes' primeiro.");
        return;
      }
    }

    // fallback: não dá para abrir detalhes RAWG
    toast.error("Este jogo ainda não tem ligação à RAWG (rawg_id).");
  }


  return (
    <div className="h-full flex flex-col gap-6">

      {/* HEADER */}
      <RetroCard color="rose" className="p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(244,63,94,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(244,63,94,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-sm font-bold uppercase tracking-widest mb-1">
              <span className="inline-block w-3 h-3 bg-rose-500 animate-pulse" />
              Lista de Desejos
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <Heart size={32} className="text-rose-500" /> Wishlist
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 font-mono">
              {wishlist.length} jogos que queres comprar.
            </p>
          </div>

          <div className="flex gap-2">
            <RetroButton color="yellow" onClick={handleFix} disabled={loading}>
              <Wrench size={14} /> Reparar Nomes
            </RetroButton>

            <RetroButton color="slate" onClick={() => navigate("/app/steam-wishlist-import")}>
              <Cloud size={14} /> Steam
            </RetroButton>

            <RetroButton color="cyan" onClick={() => {
              setMostrarModal(true);
              setResultadosExternos([]);
              setTermoPesquisa("");
            }}>
              <Plus size={14} /> Adicionar jogo
            </RetroButton>
          </div>
        </div>
      </RetroCard>

      {/* GRID */}
      <RetroCard color="fuchsia" className="flex-1 overflow-hidden">
        {loading ? <div className="text-center py-10 text-slate-500">A carregar...</div> :
          wishlist.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <Heart size={64} className="mx-auto mb-4 opacity-50 text-slate-400" />
              <p className="font-bold text-lg">A tua wishlist está vazia.</p>
              <p className="text-sm">Adiciona jogos para começar.</p>
            </div>
          ) : (
            <div className="p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {wishlist.map(item => {
                const game = item.game || item;
                const titulo = item.titulo || item.title || game.title || "Sem título";
                const capa = item.url_capa || item.cover_url || game.cover_url;

                return (
                  <div key={item.id} className="group">
                    <div className="border-2 border-rose-400 bg-white dark:bg-slate-900 shadow-[4px_4px_0px_0px_rgba(244,63,94,0.5)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all overflow-hidden">
                      {/* Capa */}
                      <div 
                        className="relative aspect-video w-full bg-slate-900 overflow-hidden cursor-pointer"
                        onClick={() => irParaDetalhes(item)}
                      >
                        {capa ? (
                          <img src={capa} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt={titulo} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400"><Gamepad2 size={48} /></div>
                        )}
                        {/* Badge Wishlist */}
                        <div className="absolute top-2 right-2">
                          <span className="block w-8 h-8 bg-rose-500 border-2 border-white shadow-lg flex items-center justify-center"><Heart size={16} className="text-white" fill="white" /></span>
                        </div>
                      </div>
                      {/* Info */}
                      <div className="p-3 border-t-2 border-rose-400 bg-slate-50 dark:bg-slate-800">
                        <div 
                          className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-rose-500 transition-colors mb-2 cursor-pointer"
                          onClick={() => irParaDetalhes(item)}
                        >
                          {titulo}
                        </div>
                        <div className="flex gap-2">
                          <RetroButton
                            color="green"
                            className="flex-1 text-[10px] px-1 py-1 flex items-center justify-center gap-1"
                            onClick={() => moverParaColecao(item)}
                            disabled={aMoverId === item.id}
                          >
                            {aMoverId === item.id ? "..." : <><Download size={12} /> Coleção</>}
                          </RetroButton>
                          <button
                            onClick={() => removerDaWishlist(item)}
                            disabled={aRemoverId === item.id}
                            className="w-8 h-8 border-2 border-slate-300 dark:border-slate-600 hover:bg-rose-500 hover:text-white transition-colors flex items-center justify-center"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
      </RetroCard>

      {/* MODAL PESQUISA */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <RetroCard color="cyan" className="w-full max-w-4xl max-h-[85vh] flex flex-col relative shadow-2xl">
            <div className="p-4 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-black text-cyan-600 dark:text-cyan-400 flex items-center gap-2 uppercase tracking-wide">
                <Search size={20} /> Adicionar à Wishlist
              </h3>
              <button onClick={() => setMostrarModal(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/20 font-bold text-xl transition-colors"><X size={20} /></button>
            </div>

            <div className="p-6 flex flex-col flex-1 overflow-hidden bg-white dark:bg-slate-900">
              <form onSubmit={handleManualSearch} className="flex gap-3 mb-6">
                <input
                  type="text"
                  autoFocus
                  placeholder="Escreve o nome do jogo..."
                  className="flex-1 border-2 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 pl-4 pr-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors font-mono text-slate-900 dark:text-white"
                  value={termoPesquisa}
                  onChange={e => setTermoPesquisa(e.target.value)}
                />
                <RetroButton type="submit" color="cyan" disabled={loadingPesquisa}>
                  {loadingPesquisa ? "..." : "PESQUISAR"}
                </RetroButton>
              </form>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {erroPesquisa && <div className="p-3 bg-rose-50 dark:bg-rose-900/30 border-2 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 mb-2 font-bold text-sm">⚠️ {erroPesquisa}</div>}

                {!loadingPesquisa && resultadosExternos.length === 0 && termoPesquisa && !erroPesquisa && (
                  <div className="text-center py-10 text-slate-500 border-2 border-dashed border-slate-300 dark:border-slate-700">
                    <p className="font-mono text-sm">Sem resultados.</p>
                  </div>
                )}

                {resultadosExternos.map(jogo => {
                  const idReal = jogo.external_id || jogo.id;
                  const jaTem = wishlistIds.has(Number(idReal));
                  const capa = jogo.background_image || jogo.cover_url;
                  const nome = jogo.name || jogo.title;
                  const ano = jogo.released ? jogo.released.split('-')[0] : "----";
                  const rating = jogo.rating || jogo.metacritic || "-";

                  return (
                    <div key={idReal} className="flex items-center gap-4 p-3 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-cyan-400 transition-colors group">
                      <div className="w-16 h-20 bg-slate-200 shrink-0 overflow-hidden border border-slate-300 dark:border-slate-600">
                        {capa ? <img src={capa} className="w-full h-full object-cover" alt={nome} /> : <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">IMG</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white truncate">{nome}</div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-mono">
                          <span>📅 {ano}</span>
                          <span className="text-yellow-500 font-bold">★ {rating}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setMostrarModal(false); navigate(`/app/explorar/${idReal}`); }} className="px-3 py-1.5 text-xs font-bold text-slate-500 border-2 border-slate-200 dark:border-slate-600 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 transition-colors">Detalhes</button>
                        <RetroButton color={jaTem ? "slate" : "rose"} onClick={() => importarParaWishlist(jogo)} disabled={jaTem || aImportarId === idReal} className="min-w-[110px]">
                          {aImportarId === idReal ? "..." : jaTem ? "✓ Na Lista" : "💝 Adicionar"}
                        </RetroButton>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 border-t-2 border-slate-200 dark:border-slate-700 text-right text-[10px] text-slate-500 font-mono uppercase">
              Powered by RAWG
            </div>
          </RetroCard>
        </div>
      )}
    </div>
  );
}
