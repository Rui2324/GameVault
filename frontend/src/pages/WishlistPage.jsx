// src/pages/WishlistPage.jsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useToast } from "../components/Toast";

// ============ COMPONENTES VISUAIS (Estilo Retro da Coleção) ============

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

  // --- 1. BLOQUEAR SCROLL QUANDO O MODAL ABRE ---
  useEffect(() => {
    if (mostrarModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [mostrarModal]);

  useEffect(() => {
    carregarWishlist();
  }, []);

  // Lista de IDs para saber o que já temos (evita duplicados)
  const wishlistIds = useMemo(() => {
    return new Set(wishlist.map(item => Number(item.external_id || item.game?.external_id)).filter(Boolean));
  }, [wishlist]);

  async function carregarWishlist() {
    try {
      setLoading(true);
      const res = await api.get("/wishlist");
      // Suporta várias estruturas de resposta do backend
      const lista = res.data.wishlist || res.data.items || res.data || [];
      console.log("📦 Wishlist carregada:", lista); 
      setWishlist(lista);
    } catch (err) {
      console.error("Erro wishlist:", err);
      toast.error("Não foi possível carregar a wishlist.");
    } finally {
      setLoading(false);
    }
  }

  // --- 2. LÓGICA DE PESQUISA AUTOMÁTICA (LIVE SEARCH) ---
  
  async function executarPesquisa(termo) {
    try {
      setLoadingPesquisa(true);
      setErroPesquisa("");
      
      const res = await api.get("/external-games/search", { 
        params: { q: termo, page: 1 } 
      });

      // Backend envia { jogos: [...] } ou fallback para results
      const lista = res.data.jogos || res.data.results || res.data.resultados || [];
      
      if (Array.isArray(lista)) {
        setResultadosExternos(lista);
      } else {
        setResultadosExternos([]);
        if(termo.length > 0) setErroPesquisa("Formato de resposta inválido.");
      }

    } catch (err) {
      console.error("Erro pesquisa:", err);
      setErroPesquisa("Erro ao pesquisar jogos.");
    } finally {
      setLoadingPesquisa(false);
    }
  }

  // O Efeito que ouve o que escreves
  useEffect(() => {
    if (termoPesquisa.trim().length < 2) {
        setResultadosExternos([]);
        return;
    }
    const timer = setTimeout(() => {
        executarPesquisa(termoPesquisa);
    }, 500); // Espera 500ms
    return () => clearTimeout(timer);
  }, [termoPesquisa]);

  // Submit manual (Enter)
  function handleManualSearch(e) {
    e.preventDefault();
    if(termoPesquisa.trim().length >= 2) {
        executarPesquisa(termoPesquisa);
    }
  }

  // --- AÇÕES DO MODAL ---

  function abrirModal() {
    setMostrarModal(true);
    setTermoPesquisa("");
    setResultadosExternos([]);
    setErroPesquisa("");
  }

  function fecharModal() {
    setMostrarModal(false);
    setTermoPesquisa("");
    setResultadosExternos([]);
    setAImportarId(null);
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
      if(err.response?.status === 409) toast.info("Já está na lista.");
      else toast.error("Erro ao adicionar.");
    } finally {
      setAImportarId(null);
    }
  }

  // --- GESTÃO DA LISTA PRINCIPAL ---
  
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
      if(err.response?.status === 409) {
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
    } catch(err) {
      console.error(err);
      toast.error("Erro ao remover.");
    } finally {
      setARemoverId(null);
    }
  }

  function irParaDetalhes(idOuItem) {
    if (typeof idOuItem === 'object') {
        const extId = idOuItem.external_id || idOuItem.game?.external_id || idOuItem.game?.id;
        if (extId) navigate(`/app/explorar/${extId}`);
        else toast.error("Detalhes indisponíveis");
        return;
    }
    if (idOuItem) {
        navigate(`/app/explorar/${idOuItem}`);
    }
  }

  return (
    <div className="h-full flex flex-col gap-6">
      
      {/* HEADER - Estilo Retro */}
      <RetroCard color="rose" className="p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(244,63,94,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(244,63,94,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-sm font-bold uppercase tracking-widest mb-1">
              <span className="inline-block w-3 h-3 bg-rose-500 animate-pulse" />
              Lista de Desejos
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <span className="text-rose-500">💝</span> Wishlist
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 font-mono">
              {wishlist.length} jogos que queres comprar.
            </p>
          </div>
          <RetroButton color="cyan" onClick={abrirModal}>
            ➕ Adicionar jogo
          </RetroButton>
        </div>
      </RetroCard>

      {/* LISTA DE JOGOS NA WISHLIST */}
      <RetroCard color="fuchsia" className="flex-1 p-5">
        {loading ? <div className="text-center py-10 text-slate-500">A carregar...</div> :
         wishlist.length === 0 ? (
           <div className="text-center py-20 text-slate-500">
             <div className="text-6xl mb-4 opacity-50 grayscale">💝</div>
             <p className="font-bold text-lg">A tua wishlist está vazia.</p>
             <p className="text-sm">Adiciona jogos para começar.</p>
           </div>
         ) : (
           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
             {wishlist.map(item => {
                const game = item.game || item; 
                
                const titulo = item.titulo || item.title || game.title || game.titulo || "Sem título";
                const capa = item.url_capa || item.cover_url || item.capa_url || game.cover_url || game.url_capa || game.background_image;
                const plataforma = item.plataforma || game.plataforma || "—";

                return (
                  <div key={item.id} className="group relative flex gap-3 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 hover:border-rose-400 transition-all shadow-sm">
                    {/* Imagem */}
                    <div className="w-20 h-28 bg-slate-200 shrink-0 cursor-pointer overflow-hidden border border-slate-300 dark:border-slate-600 relative" onClick={() => irParaDetalhes(item)}>
                       {capa ? <img src={capa} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={titulo} /> : <div className="w-full h-full flex items-center justify-center text-2xl text-slate-300">🎮</div>}
                    </div>
                    
                    {/* Info */}
                    <div className="flex flex-col justify-between flex-1 min-w-0">
                       <div>
                         <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 cursor-pointer hover:text-rose-500" onClick={() => irParaDetalhes(item)}>{titulo}</h3>
                         <p className="text-[10px] uppercase font-bold text-slate-500 mt-1">{plataforma}</p>
                       </div>
                       
                       <div className="flex gap-2 mt-2">
                          <RetroButton color="green" className="flex-1 text-[10px] px-1 h-8 flex items-center justify-center" onClick={() => moverParaColecao(item)} disabled={aMoverId === item.id}>
                             {aMoverId === item.id ? "..." : "📥 Mover"}
                          </RetroButton>
                          <button onClick={() => removerDaWishlist(item)} disabled={aRemoverId === item.id} className="w-8 h-8 border-2 border-slate-300 dark:border-slate-600 hover:bg-rose-500 hover:text-white transition-colors flex items-center justify-center font-bold">🗑️</button>
                       </div>
                    </div>
                  </div>
                )
             })}
           </div>
         )}
      </RetroCard>

      {/* --- MODAL DE PESQUISA (Estilo Retro) --- */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <RetroCard color="cyan" className="w-full max-w-4xl max-h-[85vh] flex flex-col relative shadow-2xl">
            
            {/* Header Modal */}
            <div className="p-4 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-black text-cyan-600 dark:text-cyan-400 flex items-center gap-2 uppercase tracking-wide">
                <span>🔍</span> Adicionar à Wishlist
              </h3>
              <button onClick={fecharModal} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/20 font-bold text-xl transition-colors">✕</button>
            </div>

            {/* Corpo Modal */}
            <div className="p-6 flex flex-col flex-1 overflow-hidden bg-white dark:bg-slate-900">
              <form onSubmit={handleManualSearch} className="flex gap-3 mb-6">
                <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🎮</span>
                    <input 
                      type="text" 
                      autoFocus
                      placeholder="Escreve o nome do jogo (ex: Zelda)..." 
                      className="w-full border-2 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors font-mono text-slate-900 dark:text-white"
                      value={termoPesquisa}
                      onChange={e => setTermoPesquisa(e.target.value)}
                    />
                </div>
                <RetroButton type="submit" color="cyan" disabled={loadingPesquisa}>
                  {loadingPesquisa ? "A PROCURAR..." : "PESQUISAR"}
                </RetroButton>
              </form>

              {/* Lista de Resultados */}
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {erroPesquisa && <div className="p-3 bg-rose-50 dark:bg-rose-900/30 border-2 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 mb-2 font-bold text-sm">⚠️ {erroPesquisa}</div>}
                
                {!loadingPesquisa && resultadosExternos.length === 0 && termoPesquisa && !erroPesquisa && (
                   <div className="text-center py-10 text-slate-500 border-2 border-dashed border-slate-300 dark:border-slate-700">
                     <p className="font-mono text-sm">Sem resultados encontrados.</p>
                   </div>
                )}

                {resultadosExternos.map(jogo => {
                   const idReal = jogo.external_id || jogo.id;
                   const jaTem = wishlistIds.has(Number(idReal));
                   
                   const capa = jogo.background_image || jogo.cover_url || jogo.url_capa;
                   const nome = jogo.name || jogo.title;
                   const rawDate = jogo.release_date || jogo.released;
                   const ano = rawDate ? rawDate.split('-')[0] : "----";
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
                           <button 
                              onClick={() => { setMostrarModal(false); irParaDetalhes(idReal); }} 
                              className="px-3 py-1.5 text-xs font-bold text-slate-500 border-2 border-slate-200 dark:border-slate-600 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 transition-colors"
                           >
                              Detalhes
                           </button>
                           <RetroButton 
                              color={jaTem ? "slate" : "rose"} 
                              onClick={() => importarParaWishlist(jogo)} 
                              disabled={jaTem || aImportarId === idReal} 
                              className="min-w-[110px]"
                           >
                              {aImportarId === idReal ? "A guardar..." : jaTem ? "✓ Na Lista" : "💝 Adicionar"}
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