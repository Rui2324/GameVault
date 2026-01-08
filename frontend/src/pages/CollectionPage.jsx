// src/pages/CollectionPage.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const ESTADOS = [
  { value: "", label: "Todos" },
  { value: "por_jogar", label: "Por jogar" },
  { value: "a_jogar", label: "A jogar" },
  { value: "concluido", label: "Concluído" },
  { value: "abandonado", label: "Abandonado" },
];

export default function CollectionPage() {
  const [colecao, setColecao] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  // filtros / pesquisa
  const [pesquisa, setPesquisa] = useState("");
  const [filtroPlataforma, setFiltroPlataforma] = useState("");
  const [filtroGenero, setFiltroGenero] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  // modal de novo jogo
  const [modalAberto, setModalAberto] = useState(false);
  const [tituloNovo, setTituloNovo] = useState("");
  const [plataformaNova, setPlataformaNova] = useState("");
  const [generoNovo, setGeneroNovo] = useState("");
  const [estadoNovo, setEstadoNovo] = useState("por_jogar");
  const [ratingNovo, setRatingNovo] = useState("");
  const [horasNovas, setHorasNovas] = useState("");
  const [notasNovas, setNotasNovas] = useState("");
  const [submeterNovo, setSubmeterNovo] = useState(false);
  const [erroModal, setErroModal] = useState("");

  // carregar coleção do backend
  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      try {
        if (cancelado) return;
        setErro("");
        setLoading(true);

        const res = await api.get("/collection");
        if (!cancelado) {
          setColecao(res.data.colecao || []);
        }
      } catch (err) {
        console.error(err);
        if (!cancelado) {
          setErro(
            err?.response?.data?.mensagem ||
              "Não foi possível carregar a tua coleção."
          );
        }
      } finally {
        if (!cancelado) {
          setLoading(false);
        }
      }
    }

    carregar();

    return () => {
      cancelado = true;
    };
  }, []);

  // opções únicas para selects (plataforma / género)
  const opcoesPlataforma = useMemo(() => {
    const set = new Set(
      colecao
        .map((j) => j.plataforma)
        .filter((p) => p && p.trim().length > 0)
    );
    return ["", ...Array.from(set)];
  }, [colecao]);

  const opcoesGenero = useMemo(() => {
    const set = new Set(
      colecao
        .map((j) => j.genero)
        .filter((g) => g && g.trim().length > 0)
    );
    return ["", ...Array.from(set)];
  }, [colecao]);

  // aplicar filtros e pesquisa
  const filtrados = useMemo(() => {
    return colecao.filter((jogo) => {
      if (
        pesquisa &&
        !jogo.titulo.toLowerCase().includes(pesquisa.toLowerCase())
      ) {
        return false;
      }

      if (filtroPlataforma && jogo.plataforma !== filtroPlataforma) {
        return false;
      }

      if (filtroGenero && jogo.genero !== filtroGenero) {
        return false;
      }

      if (filtroEstado && jogo.estado !== filtroEstado) {
        return false;
      }

      return true;
    });
  }, [colecao, pesquisa, filtroPlataforma, filtroGenero, filtroEstado]);

  function limparFiltros() {
    setPesquisa("");
    setFiltroPlataforma("");
    setFiltroGenero("");
    setFiltroEstado("");
  }

  function limparFormularioNovo() {
    setTituloNovo("");
    setPlataformaNova("");
    setGeneroNovo("");
    setEstadoNovo("por_jogar");
    setRatingNovo("");
    setHorasNovas("");
    setNotasNovas("");
    setErroModal("");
  }

  async function handleSubmeterNovo(e) {
    e.preventDefault();
    setErroModal("");

    if (!tituloNovo.trim()) {
      setErroModal("O título do jogo é obrigatório.");
      return;
    }

    setSubmeterNovo(true);
    try {
      // 1) criar jogo na tabela de jogos
      const gameRes = await api.post("/games", {
        titulo: tituloNovo.trim(),
        plataforma: plataformaNova.trim() || null,
        genero: generoNovo.trim() || null,
        data_lancamento: null,
        url_capa: null,
        descricao: notasNovas.trim() || null,
      });

      const jogoCriado =
        gameRes.data?.jogo || gameRes.data?.game || gameRes.data;
      const jogoId = jogoCriado?.id;

      if (!jogoId) {
        throw new Error("Não foi possível obter o ID do jogo criado.");
      }

      // 2) adicionar esse jogo à coleção do utilizador
      const ratingNum =
        ratingNovo !== "" ? Number(ratingNovo.replace(",", ".")) : null;
      const horasNum =
        horasNovas !== "" ? Number(horasNovas.replace(",", ".")) : 0;

      const collRes = await api.post("/collection", {
        jogo_id: jogoId,
        rating: ratingNum,
        horas_jogadas: horasNum,
        estado: estadoNovo || "por_jogar",
        notas: notasNovas.trim() || null,
      });

      const entrada =
        collRes.data?.entrada || collRes.data;

      // 3) atualizar estado local para aparecer logo na tabela
      if (entrada) {
        setColecao((prev) => [...prev, entrada]);
      }

      // 4) fechar modal e limpar form
      limparFormularioNovo();
      setModalAberto(false);
    } catch (err) {
      console.error(err);
      setErroModal(
        err?.response?.data?.mensagem ||
          err?.response?.data?.message ||
          "Não foi possível adicionar o jogo à coleção."
      );
    } finally {
      setSubmeterNovo(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Minha coleção
          </h2>
          <p className="text-sm text-slate-600">
            Gere os jogos que tens na tua GameVault: progresso, rating e horas jogadas.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            limparFormularioNovo();
            setModalAberto(true);
          }}
          className="self-start text-sm px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500"
        >
          + Adicionar jogo
        </button>
      </div>

      {/* Barra de filtros */}
      <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm space-y-3 text-sm">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                🔍
              </span>
              <input
                type="text"
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                placeholder="Procurar por título..."
                className="w-full pl-7 pr-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Plataforma */}
            <select
              value={filtroPlataforma}
              onChange={(e) => setFiltroPlataforma(e.target.value)}
              className="border border-slate-300 rounded-md px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Todas as plataformas</option>
              {opcoesPlataforma
                .filter((p) => p !== "")
                .map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
            </select>

            {/* Género */}
            <select
              value={filtroGenero}
              onChange={(e) => setFiltroGenero(e.target.value)}
              className="border border-slate-300 rounded-md px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Todos os géneros</option>
              {opcoesGenero
                .filter((g) => g !== "")
                .map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
            </select>

            {/* Estado */}
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="border border-slate-300 rounded-md px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {ESTADOS.map((e) => (
                <option key={e.value || "todos"} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={limparFiltros}
              className="text-xs px-3 py-1 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              Limpar filtros
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          A mostrar{" "}
          <span className="font-semibold">
            {filtrados.length}
          </span>{" "}
          jogo(s) de {colecao.length} no total.
        </p>
      </div>

      {/* Lista / tabela */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {loading && (
          <div className="p-4 text-sm text-slate-600">A carregar...</div>
        )}

        {erro && !loading && (
          <div className="p-4 text-sm text-red-500">{erro}</div>
        )}

        {!loading && !erro && filtrados.length === 0 && (
          <div className="p-4 text-sm text-slate-600">
            Não foram encontrados jogos com os filtros atuais.
          </div>
        )}

        {!loading && !erro && filtrados.length > 0 && (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <Th>Jogo</Th>
                <Th>Plataforma</Th>
                <Th>Género</Th>
                <Th>Estado</Th>
                <Th>Rating</Th>
                <Th>Horas</Th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((jogo) => (
                <tr
                  key={jogo.id}
                  className="border-b border-slate-100 hover:bg-slate-50/80"
                >
                  <Td>
                    <span className="font-medium text-slate-900">
                      {jogo.titulo}
                    </span>
                    {jogo.nota_pessoal && (
                      <span className="ml-2 text-xs text-slate-500">
                        {jogo.nota_pessoal}
                      </span>
                    )}
                  </Td>
                  <Td>{jogo.plataforma || "—"}</Td>
                  <Td>{jogo.genero || "—"}</Td>
                  <Td>{mapEstadoLabel(jogo.estado)}</Td>
                  <Td>{jogo.rating != null ? jogo.rating : "—"}</Td>
                  <Td>
                    {jogo.horas_jogadas != null ? jogo.horas_jogadas : "—"}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de novo jogo */}
      {modalAberto && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg border border-slate-200">
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Adicionar jogo à coleção
              </h3>
              <button
                type="button"
                className="text-xs text-slate-500 hover:text-slate-800"
                onClick={() => {
                  if (!submeterNovo) {
                    setModalAberto(false);
                  }
                }}
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleSubmeterNovo} className="px-5 py-4 space-y-3 text-sm">
              {erroModal && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">
                  {erroModal}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={tituloNovo}
                  onChange={(e) => setTituloNovo(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ex.: Baldur's Gate 3"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Plataforma
                  </label>
                  <input
                    type="text"
                    value={plataformaNova}
                    onChange={(e) => setPlataformaNova(e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="PC, PS5, Switch..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Género
                  </label>
                  <input
                    type="text"
                    value={generoNovo}
                    onChange={(e) => setGeneroNovo(e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="RPG, Aventura, Shooter..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={estadoNovo}
                    onChange={(e) => setEstadoNovo(e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="por_jogar">Por jogar</option>
                    <option value="a_jogar">A jogar</option>
                    <option value="concluido">Concluído</option>
                    <option value="abandonado">Abandonado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Rating (0–10)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={ratingNovo}
                    onChange={(e) => setRatingNovo(e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ex.: 9.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Horas jogadas
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={horasNovas}
                    onChange={(e) => setHorasNovas(e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ex.: 12"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Notas pessoais
                </label>
                <textarea
                  value={notasNovas}
                  onChange={(e) => setNotasNovas(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  rows={3}
                  placeholder="Impressões, objetivos, detalhes sobre a run..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={submeterNovo}
                  onClick={() => {
                    if (!submeterNovo) {
                      setModalAberto(false);
                    }
                  }}
                  className="px-3 py-1.5 text-xs rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submeterNovo}
                  className="px-4 py-1.5 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-60"
                >
                  {submeterNovo ? "A guardar..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ children }) {
  return (
    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
      {children}
    </th>
  );
}

function Td({ children }) {
  return <td className="px-3 py-2 align-middle text-slate-800">{children}</td>;
}

function mapEstadoLabel(estado) {
  switch (estado) {
    case "por_jogar":
      return "Por jogar";
    case "a_jogar":
      return "A jogar";
    case "concluido":
      return "Concluído";
    case "abandonado":
      return "Abandonado";
    default:
      return estado || "—";
  }
}
