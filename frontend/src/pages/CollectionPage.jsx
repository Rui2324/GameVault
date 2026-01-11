// src/pages/CollectionPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AddGameModal from "../components/AddGameModal";
import api from "../services/api";
import { useToast } from "../components/Toast";

function EstadoBadge({ estado }) {
  if (!estado) return null;

  const map = {
    por_jogar: {
      label: "Por jogar",
      icon: "⏳",
      classes: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600",
    },
    a_jogar: {
      label: "A jogar",
      icon: "🎮",
      classes: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-700",
    },
    concluido: {
      label: "Concluído",
      icon: "✅",
      classes: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
    },
    abandonado: {
      label: "Abandonado",
      icon: "❌",
      classes: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700",
    },
  };

  const cfg = map[estado] || {
    label: estado,
    icon: "📋",
    classes: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600",
  };

  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold " +
        cfg.classes
      }
    >
      <span>{cfg.icon}</span> {cfg.label}
    </span>
  );
}

function RatingChip({ rating }) {
  if (rating == null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-1 text-[11px] text-slate-500 dark:text-slate-400">
        <span>⭐</span> --
      </span>
    );
  }

  const valor = Number(rating);
  let cor = "bg-gradient-to-r from-emerald-400 to-teal-400 text-white";
  if (valor <= 4) cor = "bg-gradient-to-r from-rose-400 to-pink-400 text-white";
  else if (valor <= 7) cor = "bg-gradient-to-r from-amber-400 to-orange-400 text-white";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm ${cor}`}
    >
      ⭐ {valor.toFixed(1)}
    </span>
  );
}

function safeNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function safeDateMs(v) {
  if (!v) return 0;
  const d = new Date(v);
  const ms = d.getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function formatHoras(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "0";
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function Chip({ children, onClear }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-2 py-0.5 text-[11px] text-slate-700 dark:text-slate-300">
      {children}
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-600 px-1.5 py-0.5 text-[10px] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-500"
          title="Remover filtro"
        >
          ✕
        </button>
      )}
    </span>
  );
}

function SortHeader({ label, active, dir, onClick, alignRight = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "group inline-flex items-center gap-1 text-left hover:text-slate-600 dark:hover:text-slate-300 " +
        (alignRight ? "justify-end w-full" : "")
      }
      title="Clica para ordenar"
    >
      <span>{label}</span>
      <span className="text-[10px] text-slate-300 dark:text-slate-500 group-hover:text-slate-400 dark:group-hover:text-slate-400">
        {active ? (dir === "asc" ? "▲" : "▼") : "↕"}
      </span>
    </button>
  );
}

export default function CollectionPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [jogos, setJogos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [filtroPlataforma, setFiltroPlataforma] = useState("todas");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroGenero, setFiltroGenero] = useState("todos");
  const [pesquisa, setPesquisa] = useState("");

  // ordenação por clique nos cabeçalhos
  const [sort, setSort] = useState({ key: "atualizado", dir: "desc" });

  const [mostrarModal, setMostrarModal] = useState(false);

  // Paginação
  const PER_PAGE = 10;
  const [pagina, setPagina] = useState(1);

  async function fetchColecao() {
    try {
      setErro("");
      setLoading(true);
      const res = await api.get("/collection");
      setJogos(res.data.colecao || []);
    } catch (err) {
      console.error(err);
      setErro("Erro ao carregar a tua coleção de jogos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchColecao();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const colecaoExternalIds = useMemo(() => {
    return new Set(
      (jogos || [])
        .map((j) => j.external_id)
        .filter((id) => id !== null && id !== undefined)
    );
  }, [jogos]);

  const generos = useMemo(() => {
    const set = new Set(
      jogos.flatMap((j) =>
        j.genero
          ? String(j.genero)
              .split(",")
              .map((g) => g.trim())
              .filter(Boolean)
          : []
      )
    );
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, "pt-PT", { sensitivity: "base" })
    );
  }, [jogos]);

  const jogosFiltrados = useMemo(() => {
    return jogos.filter((j) => {
      if (filtroPlataforma !== "todas") {
        const plat = String(j.plataforma || "").toLowerCase();
        if (filtroPlataforma === "pc" && !plat.includes("pc")) return false;
        if (filtroPlataforma === "playstation" && !plat.includes("playstation"))
          return false;
        if (filtroPlataforma === "xbox" && !plat.includes("xbox")) return false;
        if (filtroPlataforma === "nintendo" && !plat.includes("nintendo"))
          return false;
      }

      if (filtroEstado !== "todos" && j.estado !== filtroEstado) {
        return false;
      }

      if (filtroGenero !== "todos") {
        const listaGeneros = String(j.genero || "")
          .toLowerCase()
          .split(",")
          .map((g) => g.trim());
        if (!listaGeneros.includes(filtroGenero.toLowerCase())) {
          return false;
        }
      }

      if (pesquisa.trim()) {
        const termo = pesquisa.toLowerCase();
        const texto = `${j.titulo || ""} ${j.plataforma || ""} ${
          j.genero || ""
        }`.toLowerCase();
        if (!texto.includes(termo)) return false;
      }

      return true;
    });
  }, [jogos, filtroPlataforma, filtroEstado, filtroGenero, pesquisa]);

  function toggleSort(key) {
    setSort((prev) => {
      if (prev.key === key) {
        return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
      }
      // defaults por coluna
      const defaultDir = key === "titulo" ? "asc" : "desc";
      return { key, dir: defaultDir };
    });
  }

  const jogosOrdenados = useMemo(() => {
    const arr = [...jogosFiltrados];

    const byTitulo = (a, b) =>
      String(a.titulo || "").localeCompare(String(b.titulo || ""), "pt-PT", {
        sensitivity: "base",
      });

    const byRating = (a, b) => safeNumber(a.rating, -1) - safeNumber(b.rating, -1);
    const byHoras = (a, b) => safeNumber(a.horas_jogadas, 0) - safeNumber(b.horas_jogadas, 0);

    const byAtualizado = (a, b) => {
      const am =
        safeDateMs(a.atualizado_em) ||
        safeDateMs(a.updated_at) ||
        safeDateMs(a.updatedAt);
      const bm =
        safeDateMs(b.atualizado_em) ||
        safeDateMs(b.updated_at) ||
        safeDateMs(b.updatedAt);
      return am - bm;
    };

    let cmp = byAtualizado;
    if (sort.key === "titulo") cmp = byTitulo;
    if (sort.key === "rating") cmp = byRating;
    if (sort.key === "horas") cmp = byHoras;
    if (sort.key === "atualizado") cmp = byAtualizado;

    arr.sort((a, b) => (sort.dir === "asc" ? cmp(a, b) : -cmp(a, b)));
    return arr;
  }, [jogosFiltrados, sort]);

  // Reset página quando mudam filtros/pesquisa/ordenacao
  useEffect(() => {
    setPagina(1);
  }, [filtroPlataforma, filtroEstado, filtroGenero, pesquisa, sort]);

  const total = jogosOrdenados.length;
  const totalPaginas = Math.max(1, Math.ceil(total / PER_PAGE));
  const paginaAtual = Math.min(pagina, totalPaginas);

  const jogosPagina = useMemo(() => {
    const start = (paginaAtual - 1) * PER_PAGE;
    const end = start + PER_PAGE;
    return jogosOrdenados.slice(start, end);
  }, [jogosOrdenados, paginaAtual]);

  const rangeText = useMemo(() => {
    if (total === 0) return "0 resultados";
    const start = (paginaAtual - 1) * PER_PAGE + 1;
    const end = Math.min(paginaAtual * PER_PAGE, total);
    return `${start}–${end} de ${total}`;
  }, [total, paginaAtual]);

  async function handleRemover(id, titulo) {
    const confirma = window.confirm(
      "Tens a certeza que queres remover este jogo da tua coleção?"
    );
    if (!confirma) return;

    try {
      await api.delete(`/collection/${id}`);
      setJogos((prev) => prev.filter((j) => j.id !== id));
      toast.success(`"${titulo}" removido da coleção.`, {
        title: "Jogo Removido 🗑️",
      });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao remover o jogo da coleção.", {
        title: "Erro",
      });
    }
  }

  function limparFiltros() {
    setFiltroPlataforma("todas");
    setFiltroEstado("todos");
    setFiltroGenero("todos");
    setPesquisa("");
    setSort({ key: "atualizado", dir: "desc" });
  }

  const temFiltrosAtivos =
    filtroPlataforma !== "todas" ||
    filtroEstado !== "todos" ||
    filtroGenero !== "todos" ||
    pesquisa.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Header com gradiente */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 animate-gradient opacity-90"></div>
        <div className="relative z-10 p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <span className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">🎮</span>
                Minha Coleção
              </h1>
              <p className="mt-2 text-sm text-white/80">
                📊 {jogos.length} jogos na tua biblioteca • Clica nos cabeçalhos para ordenar
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMostrarModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/30 transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <span className="text-lg">➕</span>
              Adicionar jogo
            </button>
          </div>
        </div>
      </div>

      {/* Modal RAWG */}
      <AddGameModal
        open={mostrarModal}
        onClose={() => setMostrarModal(false)}
        collectionExternalIds={colecaoExternalIds}
        onAddedToCollection={async () => {
          await fetchColecao();
          setPagina(1);
        }}
      />

      {/* Filtros + pesquisa */}
      <div className="rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-5 py-4 shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400 font-medium">🎯 Plataforma</span>
              <select
                value={filtroPlataforma}
                onChange={(e) => setFiltroPlataforma(e.target.value)}
                className="rounded-xl border border-slate-200/50 dark:border-slate-600/50 bg-white/50 dark:bg-slate-700/50 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="todas">Todas</option>
                <option value="pc">💻 PC</option>
                <option value="playstation">🎮 PlayStation</option>
                <option value="xbox">🕹️ Xbox</option>
                <option value="nintendo">🍄 Nintendo</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400 font-medium">📋 Estado</span>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="rounded-xl border border-slate-200/50 dark:border-slate-600/50 bg-white/50 dark:bg-slate-700/50 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="todos">Todos</option>
                <option value="por_jogar">⏳ Por jogar</option>
                <option value="a_jogar">🎮 A jogar</option>
                <option value="concluido">✅ Concluído</option>
                <option value="abandonado">❌ Abandonado</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400 font-medium">🏷️ Género</span>
              <select
                value={filtroGenero}
                onChange={(e) => setFiltroGenero(e.target.value)}
                className="rounded-xl border border-slate-200/50 dark:border-slate-600/50 bg-white/50 dark:bg-slate-700/50 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="todos">Todos</option>
                {generos.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {temFiltrosAtivos && (
              <button
                type="button"
                onClick={limparFiltros}
                className="rounded-xl border border-rose-200/50 dark:border-rose-700/50 bg-rose-50 dark:bg-rose-900/30 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all"
              >
                🗑️ Limpar filtros
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
              <input
                type="text"
                placeholder="Procurar por título, plataforma ou género..."
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                className="w-72 rounded-xl border border-slate-200/50 dark:border-slate-600/50 bg-white/50 dark:bg-slate-700/50 pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-3 py-1.5 rounded-full">{rangeText}</span>
          </div>
        </div>

        {/* Chips de filtros ativos */}
        {temFiltrosAtivos && (
          <div className="flex flex-wrap items-center gap-2">
            {pesquisa.trim() && (
              <Chip onClear={() => setPesquisa("")}>Pesquisa: “{pesquisa.trim()}”</Chip>
            )}
            {filtroPlataforma !== "todas" && (
              <Chip onClear={() => setFiltroPlataforma("todas")}>
                Plataforma: {filtroPlataforma}
              </Chip>
            )}
            {filtroEstado !== "todos" && (
              <Chip onClear={() => setFiltroEstado("todos")}>
                Estado: {filtroEstado}
              </Chip>
            )}
            {filtroGenero !== "todos" && (
              <Chip onClear={() => setFiltroGenero("todos")}>
                Género: {filtroGenero}
              </Chip>
            )}
          </div>
        )}
      </div>

      {/* Lista */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">A carregar coleção...</div>
        ) : erro ? (
          <div className="px-4 py-6 text-sm text-red-600 dark:text-red-400">{erro}</div>
        ) : total === 0 ? (
          <div className="px-4 py-16 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center">
              <span className="text-4xl">🎮</span>
            </div>
            <p className="font-semibold text-lg text-slate-700 dark:text-slate-300 mb-2">
              Nenhum jogo encontrado
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Tenta limpar os filtros ou adiciona novos jogos à tua coleção.
            </p>
            <button
              type="button"
              onClick={() => setMostrarModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:shadow-lg hover:shadow-indigo-500/25 hover:scale-105 transition-all duration-300"
            >
              <span className="text-lg">➕</span>
              Adicionar jogo
            </button>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {/* Cabeçalho "sticky" */}
              <div className="sticky top-0 z-10 grid grid-cols-12 gap-3 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 border-b border-slate-200/50 dark:border-slate-700/50">
                <div className="col-span-5">
                  <SortHeader
                    label="Jogo"
                    active={sort.key === "titulo"}
                    dir={sort.dir}
                    onClick={() => toggleSort("titulo")}
                  />
                </div>
                <div className="col-span-2">Plataforma / Género</div>
                <div className="col-span-2">Estado</div>
                <div className="col-span-2">
                  <div className="flex items-center justify-between">
                    <SortHeader
                      label="Rating"
                      active={sort.key === "rating"}
                      dir={sort.dir}
                      onClick={() => toggleSort("rating")}
                    />
                    <SortHeader
                      label="Horas"
                      active={sort.key === "horas"}
                      dir={sort.dir}
                      onClick={() => toggleSort("horas")}
                      alignRight
                    />
                  </div>
                </div>
                <div className="col-span-1 text-right">
                  <SortHeader
                    label="Atual."
                    active={sort.key === "atualizado"}
                    dir={sort.dir}
                    onClick={() => toggleSort("atualizado")}
                    alignRight
                  />
                </div>
              </div>

              {jogosPagina.map((jogo) => {
                const capa = jogo.url_capa || jogo.cover_url || jogo.capa_url || null;

                return (
                  <div
                    key={jogo.id}
                    className="group grid grid-cols-12 gap-3 px-4 py-3 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 cursor-pointer transition-colors duration-200"
                    onClick={() => navigate(`/app/jogo/${jogo.id}`)}
                  >
                    <div className="col-span-5 flex items-center gap-3">
                      <div className="h-14 w-10 overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-700 flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                        {capa ? (
                          <img
                            src={capa}
                            alt={jogo.titulo}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30">
                            🎮
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {jogo.titulo}
                        </div>
                        {jogo.notas && (
                          <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                            📝 {jogo.notas}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-span-2 flex flex-col justify-center gap-1">
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-300">{jogo.plataforma || "—"}</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">{jogo.genero || "—"}</div>
                    </div>

                    <div className="col-span-2 flex items-center">
                      <EstadoBadge estado={jogo.estado} />
                    </div>

                    <div className="col-span-2 flex flex-col justify-center gap-1.5">
                      <RatingChip rating={jogo.rating} />
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 text-right flex items-center justify-end gap-1">
                        <span>🕐</span> {formatHoras(jogo.horas_jogadas)}h
                      </div>
                    </div>

                    <div className="col-span-1 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemover(jogo.id, jogo.titulo);
                        }}
                        className="opacity-0 group-hover:opacity-100 rounded-lg border border-rose-200/50 dark:border-rose-800/50 bg-rose-50 dark:bg-rose-900/30 px-2.5 py-1.5 text-[11px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all duration-200"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Paginação */}
            <div className="flex items-center justify-between px-4 py-4 text-xs border-t border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="text-slate-500 dark:text-slate-400 font-medium">
                📄 Página {paginaAtual} de {totalPaginas}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={paginaAtual <= 1}
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  className="rounded-xl border border-slate-200/50 dark:border-slate-600/50 bg-white dark:bg-slate-700 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  ← Anterior
                </button>

                <button
                  type="button"
                  disabled={paginaAtual >= totalPaginas}
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  className="rounded-xl border border-slate-200/50 dark:border-slate-600/50 bg-white dark:bg-slate-700 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Seguinte →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
