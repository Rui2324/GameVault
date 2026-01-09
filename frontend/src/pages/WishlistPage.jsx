// src/pages/WishlistPage.jsx
import { useEffect, useState } from "react";
import api from "../services/api";

export default function WishlistPage() {
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
    } catch (err) {
      console.error("Erro ao mover para coleção:", err);
      // aqui podes adicionar um toast/erro se quiseres
    } finally {
      setAMoverId(null);
    }
  }

  async function removerDaWishlist(item) {
    try {
      setARemoverId(item.id);
      await api.delete(`/wishlist/${item.id}`);
      await carregarWishlist();
    } catch (err) {
      console.error("Erro ao remover da wishlist:", err);
    } finally {
      setARemoverId(null);
    }
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Cabeçalho + ações */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Wishlist</h2>
          <p className="text-sm text-slate-500">
            Jogos que queres jogar/comprar mais tarde.
          </p>
        </div>

        <button
          onClick={abrirModal}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition shadow-sm"
        >
          <span className="text-lg">＋</span>
          Adicionar jogo
        </button>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
            A carregar wishlist...
          </div>
        ) : erro ? (
          <div className="flex items-center justify-center h-40 text-red-500 text-sm">
            {erro}
          </div>
        ) : wishlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-sm gap-2">
            <span>A tua wishlist está vazia.</span>
            <button
              onClick={abrirModal}
              className="text-indigo-600 hover:text-indigo-500 text-xs underline"
            >
              Adicionar jogos da RAWG
            </button>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
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
                  className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:bg-slate-50 transition shadow-sm"
                >
                  <div className="shrink-0">
                    {capa ? (
                      <img
                        src={capa}
                        alt={titulo}
                        className="w-16 h-24 object-cover rounded-md border border-slate-200"
                      />
                    ) : (
                      <div className="w-16 h-24 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] text-slate-400">
                        sem capa
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-between flex-1">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 line-clamp-2">
                        {titulo}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {plataforma}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {genero}
                      </p>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => adicionarDaWishlistParaColecao(item)}
                        disabled={aMoverId === item.id}
                        className="flex-1 rounded-lg bg-emerald-600 px-2 py-1.5 text-[11px] font-medium text-white hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {aMoverId === item.id
                          ? "A mover..."
                          : "Adicionar à coleção"}
                      </button>
                      <button
                        onClick={() => removerDaWishlist(item)}
                        disabled={aRemoverId === item.id}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-red-50 hover:border-red-300 hover:text-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {aRemoverId === item.id ? "A remover..." : "Remover"}
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
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-3xl rounded-2xl bg-white border border-slate-200 shadow-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-slate-900">
                Procurar jogos (RAWG) para wishlist
              </h3>
              <button
                onClick={fecharModal}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={tratarSubmitPesquisa}
              className="flex gap-3 mb-4"
            >
              <input
                type="text"
                value={termoPesquisa}
                onChange={(e) => setTermoPesquisa(e.target.value)}
                placeholder="Ex.: Hades, Hollow Knight, Elden Ring..."
                className="flex-1 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={loadingPesquisa || !termoPesquisa.trim()}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingPesquisa ? "A pesquisar..." : "Pesquisar"}
              </button>
            </form>

            {erroPesquisa && (
              <div className="mb-3 text-sm text-red-500">
                {erroPesquisa}
              </div>
            )}

            <div className="max-h-[340px] overflow-y-auto space-y-2">
              {loadingPesquisa ? (
                <div className="text-sm text-slate-500">
                  A contactar a API da RAWG...
                </div>
              ) : resultadosExternos.length === 0 ? (
                <div className="text-sm text-slate-500">
                  Sem resultados ainda. Escreve um título e carrega em
                  &quot;Pesquisar&quot;.
                </div>
              ) : (
                resultadosExternos.map((jogo) => (
                  <div
                    key={jogo.external_id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      {jogo.cover_url ? (
                        <img
                          src={jogo.cover_url}
                          alt={jogo.title}
                          className="w-10 h-12 object-cover rounded-md border border-slate-200"
                        />
                      ) : (
                        <div className="w-10 h-12 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] text-slate-400">
                          sem capa
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900">
                          {jogo.title}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {jogo.platforms || "Plataformas desconhecidas"}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {jogo.genres || "Género desconhecido"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => importarJogoParaWishlist(jogo)}
                      disabled={aImportarId === jogo.external_id}
                      className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {aImportarId === jogo.external_id
                        ? "A adicionar..."
                        : "Adicionar à wishlist"}
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
