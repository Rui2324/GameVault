// src/pages/WishlistPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useToast } from "../components/Toast";

export default function WishlistPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  // modal pesquisa externa
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

  // ------- MODAL ADICIONAR (RAWG) -------

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

      const res = await api.get("/external-games/search", {
        params: { q: termoPesquisa.trim(), page: 1 },
      });

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

      await api.post("/external-games/import/wishlist", {
        external_id: jogo.external_id,
      });

      await carregarWishlist();
      fecharModal();
    } catch (err) {
      console.error("Erro a importar jogo para wishlist:", err);
      setErroPesquisa("Falha ao adicionar o jogo à wishlist.");
    } finally {
      setAImportarId(null);
    }
  }

  // ------- AÇÕES NA WISHLIST -------

  async function adicionarDaWishlistParaColecao(item) {
    const titulo = item.titulo || item.title || "Jogo";
    try {
      setAMoverId(item.id);

      // 1) cria entrada na coleção (usa o jogo_id local)
      await api.post("/collection", {
        jogo_id: item.jogo_id,
        rating: null,
        horas_jogadas: 0,
        estado: "por_jogar",
        notas: null,
      });

      // 2) remove da wishlist
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
    // Se tiver external_id, vai para a página do jogo externo (RAWG)
    const externalId = item.external_id || item.jogo?.external_id;
    const jogoId = item.jogo_id || item.game_id;
    
    if (externalId) {
      navigate(`/app/explorar/${externalId}`);
    } else if (jogoId) {
      // Senão, vai para a página do jogo local na coleção
      navigate(`/app/jogo/${jogoId}`);
    }
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header com gradiente */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-600 via-rose-500 to-orange-500 p-6 shadow-xl">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-3xl">💝</span>
              Wishlist
            </h2>
            <p className="text-rose-100 text-sm mt-1">
              Jogos que queres jogar/comprar mais tarde
            </p>
          </div>

          <button
            onClick={abrirModal}
            className="inline-flex items-center gap-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/30 transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            <span className="text-lg">✨</span>
            Adicionar jogo
          </button>
        </div>

        {/* Estatística rápida */}
        <div className="relative mt-4 flex gap-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
            <div className="text-2xl font-bold text-white">{wishlist.length}</div>
            <div className="text-[11px] text-rose-100">jogos na lista</div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 p-5 shadow-xl">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-slate-100 dark:bg-slate-700/50 p-4">
                <div className="flex gap-3">
                  <div className="w-16 h-24 bg-slate-200 dark:bg-slate-600 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-1/2" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : erro ? (
          <div className="flex items-center justify-center h-40 text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
            <span className="mr-2">⚠️</span> {erro}
          </div>
        ) : wishlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-400">
            <div className="text-6xl mb-4 animate-bounce">🎮</div>
            <span className="text-lg font-medium text-slate-700 dark:text-slate-300">A tua wishlist está vazia</span>
            <span className="text-sm mt-1">Adiciona jogos que queres jogar no futuro!</span>
            <button
              onClick={abrirModal}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-5 py-2.5 text-sm font-medium text-white hover:shadow-lg hover:scale-105 transition-all"
            >
              <span>✨</span> Explorar jogos
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {wishlist.map((item) => {
              const titulo = item.titulo || item.title || "Sem título";
              const plataforma =
                item.plataforma || item.platform || "—";
              const genero = item.genero || item.genre || "—";
              const capa =
                item.capa_url || item.url_capa || item.cover_url || null;

              return (
                <div
                  key={item.id}
                  className="group relative flex gap-4 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-800 dark:to-slate-800/50 p-4 hover:shadow-xl hover:scale-[1.02] hover:border-rose-300/50 dark:hover:border-rose-700/50 transition-all duration-300"
                >
                  {/* Badge decorativo */}
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
                      <img
                        src={capa}
                        alt={titulo}
                        className="w-16 h-24 object-cover rounded-xl border-2 border-slate-200/50 dark:border-slate-600/50 group-hover/img:border-rose-300 dark:group-hover/img:border-rose-600 transition-all shadow-md group-hover/img:shadow-xl"
                      />
                    ) : (
                      <div className="w-16 h-24 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 border-2 border-slate-200/50 dark:border-slate-600/50 flex items-center justify-center text-2xl group-hover/img:border-rose-300 dark:group-hover/img:border-rose-600 transition-all">
                        🎮
                      </div>
                    )}
                  </button>
                  <div className="flex flex-col justify-between flex-1 min-w-0">
                    <div>
                      <button
                        type="button"
                        onClick={() => verDetalhesJogo(item)}
                        className="text-left w-full"
                      >
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2 hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                          {titulo}
                        </h3>
                      </button>
                      <div className="mt-2 space-y-1">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <span>🎯</span> {plataforma}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <span>🏷️</span> {genero}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => adicionarDaWishlistParaColecao(item)}
                        disabled={aMoverId === item.id}
                        className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-2 text-[11px] font-semibold text-white hover:shadow-lg hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
                      >
                        {aMoverId === item.id
                          ? "⏳ A mover..."
                          : "✅ Adicionar à coleção"}
                      </button>
                      <button
                        onClick={() => removerDaWishlist(item)}
                        disabled={aRemoverId === item.id}
                        className="rounded-xl border border-slate-200/50 dark:border-slate-600/50 bg-white dark:bg-slate-700 px-3 py-2 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:border-rose-300 dark:hover:border-rose-700 hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
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
      </div>

      {/* MODAL de pesquisa externa */}
      {mostrarModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-2xl p-6 animate-[fadeIn_0.3s_ease-out]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="text-2xl">🔍</span>
                Procurar jogos para wishlist
              </h3>
              <button
                onClick={fecharModal}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-all flex items-center justify-center text-lg"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={tratarSubmitPesquisa}
              className="flex gap-3 mb-5"
            >
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🎮</span>
                <input
                  type="text"
                  value={termoPesquisa}
                  onChange={(e) => setTermoPesquisa(e.target.value)}
                  placeholder="Ex.: Hades, Hollow Knight, Elden Ring..."
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loadingPesquisa || !termoPesquisa.trim()}
                className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-3 text-sm font-semibold text-white hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
              >
                {loadingPesquisa ? "⏳ A pesquisar..." : "✨ Pesquisar"}
              </button>
            </form>

            {erroPesquisa && (
              <div className="mb-4 text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 rounded-xl px-4 py-2 border border-rose-200/50 dark:border-rose-800/50">
                ⚠️ {erroPesquisa}
              </div>
            )}

            <div className="max-h-[380px] overflow-y-auto space-y-2 pr-2">
              {loadingPesquisa ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex items-center gap-3 rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-slate-100 dark:bg-slate-700/50 px-4 py-3">
                      <div className="w-12 h-16 bg-slate-200 dark:bg-slate-600 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-2/3" />
                        <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : resultadosExternos.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <div className="text-4xl mb-2">🎯</div>
                  <p className="text-sm">Escreve um título e carrega em "Pesquisar"</p>
                </div>
              ) : (
                resultadosExternos.map((jogo) => (
                  <div
                    key={jogo.external_id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-white to-slate-50/50 dark:from-slate-800 dark:to-slate-800/50 px-4 py-3 hover:shadow-md hover:border-rose-300/50 dark:hover:border-rose-700/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      {jogo.cover_url ? (
                        <img
                          src={jogo.cover_url}
                          alt={jogo.title}
                          className="w-12 h-16 object-cover rounded-lg border border-slate-200/50 dark:border-slate-700/50 shadow-sm"
                        />
                      ) : (
                        <div className="w-12 h-16 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 border border-slate-200/50 dark:border-slate-600/50 flex items-center justify-center text-xl">
                          🎮
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {jogo.title}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <span>🎯</span> {jogo.platforms || "Plataformas desconhecidas"}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <span>🏷️</span> {jogo.genres || "Género desconhecido"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => importarJogoParaWishlist(jogo)}
                      disabled={aImportarId === jogo.external_id}
                      className="shrink-0 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-xs font-semibold text-white hover:shadow-lg hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
                    >
                      {aImportarId === jogo.external_id
                        ? "⏳ A adicionar..."
                        : "💝 Adicionar"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
