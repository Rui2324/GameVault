// src/pages/CollectionPage.jsx
import { useEffect, useState } from "react";
import api from "../services/api";

const ESTADO_LABEL = {
  por_jogar: "Por jogar",
  a_jogar: "A jogar",
  concluido: "Concluído",
  abandonado: "Abandonado",
};

export default function CollectionPage() {
  const [colecao, setColecao] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  // modal pesquisa externa
  const [mostrarModal, setMostrarModal] = useState(false);
  const [termoPesquisa, setTermoPesquisa] = useState("");
  const [resultadosExternos, setResultadosExternos] = useState([]);
  const [loadingPesquisa, setLoadingPesquisa] = useState(false);
  const [erroPesquisa, setErroPesquisa] = useState("");
  const [aImportarId, setAImportarId] = useState(null);

  // filtros
  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  // modal editar entrada
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [entradaEditar, setEntradaEditar] = useState(null);
  const [formEditar, setFormEditar] = useState({
    rating: "",
    horas_jogadas: "",
    estado: "por_jogar",
    notas: "",
  });
  const [savingEditar, setSavingEditar] = useState(false);
  const [erroEditar, setErroEditar] = useState("");

  // modal detalhe
  const [mostrarModalDetalhe, setMostrarModalDetalhe] = useState(false);
  const [jogoDetalhe, setJogoDetalhe] = useState(null);

  async function carregarColecao() {
    try {
      setLoading(true);
      setErro("");
      const res = await api.get("/collection");
      setColecao(res.data.colecao || []);
    } catch (err) {
      console.error("Erro a carregar coleção:", err);
      setErro("Não foi possível carregar a tua coleção.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarColecao();
  }, []);

  const colecaoFiltrada = colecao.filter((item) => {
    const titulo = item.titulo || item.title || "";
    const estado = item.estado || item.status || "por_jogar";

    const passaTexto =
      !filtroTexto ||
      titulo.toLowerCase().includes(filtroTexto.toLowerCase());

    const passaEstado =
      filtroEstado === "todos" ? true : estado === filtroEstado;

    return passaTexto && passaEstado;
  });

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

  async function importarJogoParaColecao(jogo) {
    try {
      setAImportarId(jogo.external_id);
      setErroPesquisa("");

      await api.post("/external-games/import/collection", {
        external_id: jogo.external_id,
        rating: null,
        hours_played: 0,
        status: "por_jogar",
        notes: null,
      });

      await carregarColecao();
      fecharModal();
    } catch (err) {
      console.error("Erro a importar jogo:", err);
      setErroPesquisa("Falha ao importar o jogo para a coleção.");
    } finally {
      setAImportarId(null);
    }
  }

  // ------- EDITAR ENTRADA -------

  function abrirModalEditarEntrada(item) {
    setEntradaEditar(item);
    setErroEditar("");

    setFormEditar({
      rating:
        item.rating === null || item.rating === undefined
          ? ""
          : String(item.rating),
      horas_jogadas:
        item.horas_jogadas ??
        item.hours_played ??
        "",
      estado: item.estado || item.status || "por_jogar",
      notas: item.notas || item.notes || "",
    });

    setMostrarModalEditar(true);
  }

  function fecharModalEditar() {
    setMostrarModalEditar(false);
    setEntradaEditar(null);
    setErroEditar("");
    setFormEditar({
      rating: "",
      horas_jogadas: "",
      estado: "por_jogar",
      notas: "",
    });
  }

  function alterarCampoEditar(campo, valor) {
    setFormEditar((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  async function guardarEdicao(e) {
    e.preventDefault();
    if (!entradaEditar) return;

    try {
      setSavingEditar(true);
      setErroEditar("");

      const payload = {
        rating:
          formEditar.rating === "" ? null : Number(formEditar.rating),
        horas_jogadas:
          formEditar.horas_jogadas === ""
            ? null
            : Number(formEditar.horas_jogadas),
        estado: formEditar.estado,
        notas: formEditar.notas || null,
      };

      await api.put(`/collection/${entradaEditar.id}`, payload);

      await carregarColecao();
      fecharModalEditar();
    } catch (err) {
      console.error("Erro a guardar edição:", err);
      setErroEditar("Não foi possível guardar as alterações.");
    } finally {
      setSavingEditar(false);
    }
  }

  // ------- DETALHES DO JOGO -------

  function abrirModalDetalhe(item) {
    setJogoDetalhe(item);
    setMostrarModalDetalhe(true);
  }

  function fecharModalDetalhe() {
    setMostrarModalDetalhe(false);
    setJogoDetalhe(null);
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho + ações */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Minha Coleção
          </h2>
        <p className="text-sm text-slate-600">
            Lista dos jogos que tens associados à tua conta GameVault.
          </p>
        </div>

        <button
          onClick={abrirModal}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition"
        >
          <span className="text-lg">＋</span>
          Adicionar jogo
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
        <input
          type="text"
          placeholder="Procurar na tua coleção..."
          value={filtroTexto}
          onChange={(e) => setFiltroTexto(e.target.value)}
          className="flex-1 min-w-[180px] rounded-lg bg-slate-50 border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="rounded-lg bg-slate-50 border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="todos">Todos os estados</option>
          <option value="por_jogar">Por jogar</option>
          <option value="a_jogar">A jogar</option>
          <option value="concluido">Concluídos</option>
          <option value="abandonado">Abandonados</option>
        </select>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-slate-600 text-sm">
            A carregar coleção...
          </div>
        ) : erro ? (
          <div className="flex items-center justify-center h-40 text-red-600 text-sm bg-red-50 border-y border-red-200">
            {erro}
          </div>
        ) : colecaoFiltrada.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-600 text-sm gap-2">
            <span>A tua coleção ainda está vazia.</span>
            <button
              onClick={abrirModal}
              className="text-indigo-600 hover:text-indigo-500 text-xs underline"
            >
              Importar jogos da RAWG
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Jogo
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Plataforma
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Género
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Estado
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Rating
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Horas
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {colecaoFiltrada.map((item) => {
                  const titulo = item.titulo || item.title || "Sem título";
                  const plataforma =
                    item.plataforma || item.platform || "—";
                  const genero = item.genero || item.genre || "—";
                  const estado = item.estado || item.status || "por_jogar";
                  const rating = item.rating ?? "—";
                  const horas =
                    item.horas_jogadas ??
                    item.hours_played ??
                    "—";
                  const capa =
                    item.capa_url || item.url_capa || item.cover_url || null;

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-slate-100 hover:bg-slate-50/80 transition"
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-3">
                          {capa ? (
                            <img
                              src={capa}
                              alt={titulo}
                              className="w-10 h-14 object-cover rounded-md border border-slate-300"
                            />
                          ) : (
                            <div className="w-10 h-14 rounded-md bg-slate-100 border border-slate-300 flex items-center justify-center text-[10px] text-slate-400">
                              sem capa
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-slate-900 font-medium">
                              {titulo}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              ID #{item.id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-slate-800">
                        {plataforma}
                      </td>
                      <td className="px-3 py-2 text-slate-800">
                        {genero}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                          {ESTADO_LABEL[estado] || estado}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center text-slate-800">
                        {rating === null || rating === "—" ? "—" : rating}
                      </td>
                      <td className="px-3 py-2 text-center text-slate-800">
                        {horas === null || horas === "—" ? "—" : horas}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => abrirModalDetalhe(item)}
                            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                          >
                            Detalhes
                          </button>
                          <button
                            onClick={() => abrirModalEditarEntrada(item)}
                            className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                          >
                            Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL de pesquisa externa */}
      {mostrarModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-700 shadow-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-slate-100">
                Procurar jogos (RAWG)
              </h3>
              <button
                onClick={fecharModal}
                className="text-slate-400 hover:text-slate-200 text-xl leading-none"
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
                placeholder="Ex.: Baldur's Gate 3, Elden Ring, Hades..."
                className="flex-1 rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              <div className="mb-3 text-sm text-red-400">
                {erroPesquisa}
              </div>
            )}

            <div className="max-h-[340px] overflow-y-auto space-y-2">
              {loadingPesquisa ? (
                <div className="text-sm text-slate-400">
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
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      {jogo.cover_url ? (
                        <img
                          src={jogo.cover_url}
                          alt={jogo.title}
                          className="w-10 h-12 object-cover rounded-md border border-slate-700/80"
                        />
                      ) : (
                        <div className="w-10 h-12 rounded-md bg-slate-800 border border-slate-700/80 flex items-center justify-center text-[10px] text-slate-500">
                          sem capa
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-100">
                          {jogo.title}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {jogo.platforms || "Plataformas desconhecidas"}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {jogo.genres || "Género desconhecido"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => importarJogoParaColecao(jogo)}
                      disabled={aImportarId === jogo.external_id}
                      className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {aImportarId === jogo.external_id
                        ? "A adicionar..."
                        : "Adicionar à coleção"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR ENTRADA */}
      {mostrarModalEditar && entradaEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-slate-100">
                Editar entrada
              </h3>
              <button
                onClick={fecharModalEditar}
                className="text-slate-400 hover:text-slate-200 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              {entradaEditar.titulo || entradaEditar.title}
            </p>

            <form onSubmit={guardarEdicao} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Rating (0-10)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step={0.5}
                    value={formEditar.rating}
                    onChange={(e) =>
                      alterarCampoEditar("rating", e.target.value)
                    }
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="ex.: 8.5"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Horas jogadas
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={formEditar.horas_jogadas}
                    onChange={(e) =>
                      alterarCampoEditar("horas_jogadas", e.target.value)
                    }
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="ex.: 25"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Estado
                </label>
                <select
                  value={formEditar.estado}
                  onChange={(e) =>
                    alterarCampoEditar("estado", e.target.value)
                  }
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="por_jogar">Por jogar</option>
                  <option value="a_jogar">A jogar</option>
                  <option value="concluido">Concluído</option>
                  <option value="abandonado">Abandonado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Notas
                </label>
                <textarea
                  rows={3}
                  value={formEditar.notas}
                  onChange={(e) =>
                    alterarCampoEditar("notas", e.target.value)
                  }
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Comentários pessoais sobre este jogo..."
                />
              </div>

              {erroEditar && (
                <div className="text-xs text-red-400">{erroEditar}</div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={fecharModalEditar}
                  className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEditar}
                  className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {savingEditar ? "A guardar..." : "Guardar alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALHE JOGO */}
      {mostrarModalDetalhe && jogoDetalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">
                  {jogoDetalhe.titulo || jogoDetalhe.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {jogoDetalhe.genero || jogoDetalhe.genre || "Género desconhecido"}{" "}
                  •{" "}
                  {jogoDetalhe.plataforma ||
                    jogoDetalhe.platform ||
                    "Plataformas desconhecidas"}
                </p>
              </div>
              <button
                onClick={fecharModalDetalhe}
                className="text-slate-400 hover:text-slate-200 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-5">
              {/* Capa */}
              <div className="w-full md:w-1/3 flex justify-center">
                {jogoDetalhe.capa_url ||
                jogoDetalhe.url_capa ||
                jogoDetalhe.cover_url ? (
                  <img
                    src={
                      jogoDetalhe.capa_url ||
                      jogoDetalhe.url_capa ||
                      jogoDetalhe.cover_url
                    }
                    alt={jogoDetalhe.titulo || jogoDetalhe.title}
                    className="w-40 h-56 object-cover rounded-xl border border-slate-700 shadow-lg"
                  />
                ) : (
                  <div className="w-40 h-56 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-slate-500">
                    sem capa
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2">
                    <span className="block text-slate-400 mb-1">
                      Estado
                    </span>
                    <span className="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-100">
                      {ESTADO_LABEL[jogoDetalhe.estado || jogoDetalhe.status] ||
                        jogoDetalhe.estado ||
                        jogoDetalhe.status ||
                        "Por jogar"}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2">
                    <span className="block text-slate-400 mb-1">
                      Rating
                    </span>
                    <span className="text-slate-100 text-sm">
                      {jogoDetalhe.rating === null ||
                      jogoDetalhe.rating === undefined
                        ? "—"
                        : jogoDetalhe.rating}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2">
                    <span className="block text-slate-400 mb-1">
                      Horas jogadas
                    </span>
                    <span className="text-slate-100 text-sm">
                      {jogoDetalhe.horas_jogadas ??
                      jogoDetalhe.hours_played ??
                      "—"}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2">
                    <span className="block text-slate-400 mb-1">
                      ID interno
                    </span>
                    <span className="text-slate-100 text-sm">
                      #{jogoDetalhe.id}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-3 text-xs">
                  <span className="block text-slate-400 mb-1">
                    Notas pessoais
                  </span>
                  <p className="text-slate-100 whitespace-pre-wrap">
                    {jogoDetalhe.notas ||
                    jogoDetalhe.notes ||
                    "Ainda não escreveste notas sobre este jogo."}
                  </p>
                </div>

                {/* placeholder para descrição mais rica no futuro */}
                <div className="bg-slate-950/40 border border-dashed border-slate-800 rounded-lg px-3 py-3 text-xs text-slate-400">
                  Podes futuramente adicionar aqui uma descrição mais detalhada
                  vindo da RAWG (sinopse, tags, developers, etc.), mas neste
                  momento o foco está nos teus dados pessoais (rating, horas,
                  estado e notas).
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={fecharModalDetalhe}
                className="rounded-lg border border-slate-600 px-4 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
