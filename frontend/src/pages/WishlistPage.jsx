// src/pages/WishlistPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useToast } from "../components/Toast";

// ============ COMPONENTES RETRO ADAPTADOS ============

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

function RetroButton({ children, color = "fuchsia", onClick, className = "", disabled = false, type = "button" }) {
  const colors = {
    fuchsia: "border-fuchsia-500 bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/20 dark:text-fuchsia-400 hover:bg-fuchsia-500 hover:text-white shadow-[3px_3px_0px_0px_rgba(217,70,239,0.6)]",
    cyan: "border-cyan-400 bg-cyan-50 text-cyan-600 dark:bg-cyan-400/20 dark:text-cyan-400 hover:bg-cyan-400 hover:text-slate-900 shadow-[3px_3px_0px_0px_rgba(34,211,238,0.6)]",
    yellow: "border-yellow-400 bg-yellow-50 text-yellow-600 dark:bg-yellow-400/20 dark:text-yellow-400 hover:bg-yellow-400 hover:text-slate-900 shadow-[3px_3px_0px_0px_rgba(250,204,21,0.6)]",
    green: "border-green-400 bg-green-50 text-green-600 dark:bg-green-400/20 dark:text-green-400 hover:bg-green-400 hover:text-slate-900 shadow-[3px_3px_0px_0px_rgba(74,222,128,0.6)]",
    rose: "border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 hover:bg-rose-500 hover:text-white shadow-[3px_3px_0px_0px_rgba(244,63,94,0.6)]",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 border-2 font-bold text-sm uppercase tracking-wide transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 ${colors[color]} ${className}`}
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
  const [erro, setErro] = useState("");

  const [mostrarModal, setMostrarModal] = useState(false);
  const [termoPesquisa, setTermoPesquisa] = useState("");
  const [resultadosExternos, setResultadosExternos] = useState([]);
  const [loadingPesquisa, setLoadingPesquisa] = useState(false);
  const [erroPesquisa, setErroPesquisa] = useState("");
  const [aImportarId, setAImportarId] = useState(null);

  const [aMoverId, setAMoverId] = useState(null);
  const [aRemoverId, setARemoverId] = useState(null);

  async function carregarWishlist() {
    try {
      setLoading(true);
      setErro("");
      const res = await api.get("/wishlist");
      setWishlist(res.data.wishlist || []);
    } catch (err) {
      console.error("Erro a carregar wishlist:", err);
      setErro("Não foi possível carregar a tua wishlist.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarWishlist();
  }, []);

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
    setErroPesquisa("");
    setAImportarId(null);
  }

  async function tratarSubmitPesquisa(e) {
    e.preventDefault();
    if (!termoPesquisa.trim()) return;

    try {
      setLoadingPesquisa(true);
      setErroPesquisa("");
      setResultadosExternos([]);
      const res = await api.get("/external-games/search", { params: { q: termoPesquisa.trim(), page: 1 } });
      setResultadosExternos(res.data.resultados || []);
    } catch (err) {
      console.error("Erro na pesquisa externa:", err);
      setErroPesquisa("Não foi possível pesquisar jogos externos.");
    } finally {
      setLoadingPesquisa(false);
    }
  }

  async function importarJogoParaWishlist(jogo) {
    try {
      setAImportarId(jogo.external_id);
      setErroPesquisa("");
      await api.post("/external-games/import/wishlist", { external_id: jogo.external_id });
      await carregarWishlist();
      fecharModal();
    } catch (err) {
      console.error("Erro a importar jogo para wishlist:", err);
      setErroPesquisa("Falha ao adicionar o jogo à wishlist.");
    } finally {
      setAImportarId(null);
    }
  }

  async function adicionarDaWishlistParaColecao(item) {
    const titulo = item.titulo || item.title || "Jogo";
    try {
      setAMoverId(item.id);
      await api.post("/collection", { jogo_id: item.jogo_id, rating: null, horas_jogadas: 0, estado: "por_jogar", notas: null });
      await api.delete(`/wishlist/${item.id}`);
      await carregarWishlist();
      toast.game(`${titulo} adicionado à coleção!`);
    } catch (err) {
      console.error("Erro ao mover para coleção:", err);
      toast.error("Não foi possível mover para a coleção.");
    } finally {
      setAMoverId(null);
    }
  }

  async function removerDaWishlist(item) {
    const titulo = item.titulo || item.title || "Jogo";
    try {
      setARemoverId(item.id);
      await api.delete(`/wishlist/${item.id}`);
      await carregarWishlist();
      toast.info(`${titulo} removido da wishlist.`);
    } catch (err) {
      console.error("Erro ao remover da wishlist:", err);
      toast.error("Não foi possível remover da wishlist.");
    } finally {
      setARemoverId(null);
    }
  }

  function verDetalhesJogo(item) {
    const externalId = item.external_id || item.jogo?.external_id;
    const jogoId = item.jogo_id || item.game_id;
    if (externalId) navigate(`/app/explorar/${externalId}`);
    else if (jogoId) navigate(`/app/jogo/${jogoId}`);
  }

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header Retro */}
      <RetroCard color="rose" className="p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(244,63,94,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(244,63,94,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
        
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-sm font-bold uppercase tracking-widest mb-2">
              <span className="inline-block w-3 h-3 bg-rose-500 animate-pulse" />
              Lista de Desejos
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              Wishlist
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              Jogos que queres jogar/comprar mais tarde
            </p>
          </div>
          <RetroButton color="cyan" onClick={abrirModal}>✨ Adicionar jogo</RetroButton>
        </div>

        {/* Estatística rápida */}
        <div className="relative mt-4 flex gap-4">
          <div className="border-2 border-yellow-400/50 bg-yellow-50 dark:bg-yellow-400/10 px-4 py-2">
            <div className="text-2xl font-black text-yellow-600 dark:text-yellow-400">{wishlist.length}</div>
            <div className="text-[11px] text-slate-500 font-bold uppercase">jogos na lista</div>
          </div>
        </div>
      </RetroCard>

      {/* Conteúdo principal */}
      <RetroCard color="fuchsia" className="flex-1 p-5">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse border-2 border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 p-4 rounded">
                <div className="flex gap-3">
                  <div className="w-16 h-24 bg-slate-300 dark:bg-slate-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-300 dark:bg-slate-700 w-3/4" />
                    <div className="h-3 bg-slate-300 dark:bg-slate-700 w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : erro ? (
          <div className="flex items-center justify-center h-40 text-rose-500 text-sm border-2 border-rose-500/50 bg-rose-50 dark:bg-rose-500/10">
            <span className="mr-2">⚠️</span> {erro}
          </div>
        ) : wishlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <div className="text-6xl mb-4">🎮</div>
            <span className="text-lg font-bold text-slate-900 dark:text-white">A tua wishlist está vazia</span>
            <span className="text-sm mt-1">Adiciona jogos que queres jogar no futuro!</span>
            <RetroButton color="rose" onClick={abrirModal} className="mt-4">✨ Explorar jogos</RetroButton>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {wishlist.map((item) => {
              const titulo = item.titulo || item.title || "Sem título";
              const plataforma = item.plataforma || item.platform || "—";
              const genero = item.genero || item.genre || "—";
              const capa = item.capa_url || item.url_capa || item.cover_url || null;

              return (
                <div
                  key={item.id}
                  className="group relative flex gap-4 border-2 border-slate-300 bg-white dark:border-cyan-400/50 dark:bg-slate-800 p-4 hover:border-cyan-400 dark:hover:border-cyan-400 hover:shadow-md transition-all duration-200"
                >
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs">💝</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => verDetalhesJogo(item)}
                    className="shrink-0 cursor-pointer group/img"
                    title="Ver detalhes do jogo"
                  >
                    {capa ? (
                      <img src={capa} alt={titulo} className="w-16 h-24 object-cover border-2 border-slate-200 dark:border-fuchsia-500/50 group-hover/img:border-fuchsia-500 transition-all" />
                    ) : (
                      <div className="w-16 h-24 border-2 border-slate-300 dark:border-fuchsia-500/50 bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-2xl group-hover/img:border-fuchsia-500 transition-all text-slate-400">🎮</div>
                    )}
                  </button>
                  <div className="flex flex-col justify-between flex-1 min-w-0">
                    <div>
                      <button type="button" onClick={() => verDetalhesJogo(item)} className="text-left w-full">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                          {titulo}
                        </h3>
                      </button>
                      <div className="mt-2 space-y-1">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-bold"><span>🎯</span> {plataforma}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-bold"><span>🏷️</span> {genero}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <RetroButton
                        color="green"
                        onClick={() => adicionarDaWishlistParaColecao(item)}
                        disabled={aMoverId === item.id}
                        className="flex-1 text-[10px] px-2 py-1"
                      >
                        {aMoverId === item.id ? "⏳ A mover..." : "✅ Coleção"}
                      </RetroButton>
                      <button
                        onClick={() => removerDaWishlist(item)}
                        disabled={aRemoverId === item.id}
                        className="border-2 border-rose-500/50 bg-rose-50 dark:bg-rose-500/20 px-3 py-1 text-[11px] font-bold text-rose-500 dark:text-rose-400 hover:bg-rose-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {aRemoverId === item.id ? "⏳" : "🗑️"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </RetroCard>

      {/* MODAL de pesquisa externa */}
      {mostrarModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <RetroCard color="cyan" className="w-full max-w-3xl p-6 relative bg-white dark:bg-slate-900 shadow-2xl">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="text-2xl">🔍</span> Procurar jogos
                </h3>
                <button
                  onClick={fecharModal}
                  className="w-8 h-8 border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-rose-500 hover:bg-rose-500/20 text-slate-500 dark:text-slate-400 hover:text-rose-500 transition-all flex items-center justify-center text-lg font-bold"
                >
                  ×
                </button>
              </div>

              <form onSubmit={tratarSubmitPesquisa} className="flex gap-3 mb-5">
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🎮</span>
                  <input
                    type="text"
                    value={termoPesquisa}
                    onChange={(e) => setTermoPesquisa(e.target.value)}
                    placeholder="Ex.: Hades, Hollow Knight..."
                    className="w-full border-2 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-fuchsia-500 transition-colors rounded-sm"
                  />
                </div>
                <RetroButton type="submit" color="fuchsia" disabled={loadingPesquisa || !termoPesquisa.trim()}>
                  {loadingPesquisa ? "⏳..." : "✨ Pesquisar"}
                </RetroButton>
              </form>

              {erroPesquisa && (
                <div className="mb-4 text-sm text-rose-500 border-2 border-rose-500/50 bg-rose-50 dark:bg-rose-500/10 px-4 py-2">
                  ⚠️ {erroPesquisa}
                </div>
              )}

              <div className="max-h-[380px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {loadingPesquisa ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse flex items-center gap-3 border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-3">
                        <div className="w-12 h-16 bg-slate-300 dark:bg-slate-700" />
                        <div className="flex-1 space-y-2"><div className="h-4 bg-slate-300 dark:bg-slate-700 w-2/3" /><div className="h-3 bg-slate-300 dark:bg-slate-700 w-1/2" /></div>
                      </div>
                    ))}
                  </div>
                ) : resultadosExternos.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <div className="text-4xl mb-2">🎯</div>
                    <p className="text-sm">Escreve um título e carrega em "Pesquisar"</p>
                  </div>
                ) : (
                  resultadosExternos.map((jogo) => (
                    <div
                      key={jogo.external_id}
                      className="flex items-center justify-between gap-4 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 hover:border-fuchsia-400 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        {jogo.cover_url ? (
                          <img src={jogo.cover_url} alt={jogo.title} className="w-12 h-16 object-cover border-2 border-slate-200 dark:border-slate-600" />
                        ) : (
                          <div className="w-12 h-16 border-2 border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xl text-slate-400">🎮</div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{jogo.title}</span>
                          <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1"><span>🎯</span> {jogo.platforms || "Plataformas desconhecidas"}</span>
                          <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1"><span>🏷️</span> {jogo.genres || "Género desconhecido"}</span>
                        </div>
                      </div>
                      <RetroButton
                        color="rose"
                        onClick={() => importarJogoParaWishlist(jogo)}
                        disabled={aImportarId === jogo.external_id}
                        className="text-[10px] px-3 py-1"
                      >
                        {aImportarId === jogo.external_id ? "⏳..." : "💝 Adicionar"}
                      </RetroButton>
                    </div>
                  ))
                )}
              </div>
            </div>
          </RetroCard>
        </div>
      )}
    </div>
  );
}