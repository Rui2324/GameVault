// src/pages/CollectionPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AddGameModal from "../components/AddGameModal";
import api from "../services/api";

function EstadoBadge({ estado }) {
  if (!estado) return null;

  const map = {
    por_jogar: {
      label: "Por jogar",
      classes: "bg-slate-100 text-slate-700 border-slate-200",
    },
    a_jogar: {
      label: "A jogar",
      classes: "bg-sky-100 text-sky-800 border-sky-200",
    },
    concluido: {
      label: "Concluído",
      classes: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
    abandonado: {
      label: "Abandonado",
      classes: "bg-rose-100 text-rose-800 border-rose-200",
    },
  };

  const cfg = map[estado] || {
    label: estado,
    classes: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <span
      className={
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium " +
        cfg.classes
      }
    >
      {cfg.label}
    </span>
  );
}

function RatingChip({ rating }) {
  if (rating == null) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
        Sem rating
      </span>
    );
  }

  const valor = Number(rating);
  let cor = "bg-emerald-100 text-emerald-800";
  if (valor <= 4) cor = "bg-rose-100 text-rose-800";
  else if (valor <= 7) cor = "bg-amber-100 text-amber-800";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${cor}`}
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
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700">
      {children}
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="rounded-full border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-600 hover:bg-slate-50"
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
        "group inline-flex items-center gap-1 text-left hover:text-slate-600 " +
        (alignRight ? "justify-end w-full" : "")
      }
      title="Clica para ordenar"
    >
      <span>{label}</span>
      <span className="text-[10px] text-slate-300 group-hover:text-slate-400">
        {active ? (dir === "asc" ? "▲" : "▼") : "↕"}
      </span>
    </button>
  );
}

export default function CollectionPage() {
  const navigate = useNavigate();

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
  const PER_PAGE = 20;
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

  async function handleRemover(id) {
    const confirma = window.confirm(
      "Tens a certeza que queres remover este jogo da tua coleção?"
    );
    if (!confirma) return;

    try {
      await api.delete(`/collection/${id}`);
      setJogos((prev) => prev.filter((j) => j.id !== id));
    } catch (err) {
      console.error(err);
      alert("Erro ao remover o jogo da coleção.");
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
      {/* Título + ações */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Minha Coleção</h1>
          <p className="mt-1 text-sm text-slate-500">
            Filtra, pesquisa e ordena ao clicar nos cabeçalhos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setMostrarModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition shadow-sm"
        >
          <span className="text-lg">＋</span>
          Adicionar jogo
        </button>
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
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Plataforma</span>
              <select
                value={filtroPlataforma}
                onChange={(e) => setFiltroPlataforma(e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="todas">Todas</option>
                <option value="pc">PC</option>
                <option value="playstation">PlayStation</option>
                <option value="xbox">Xbox</option>
                <option value="nintendo">Nintendo</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Estado</span>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="todos">Todos</option>
                <option value="por_jogar">Por jogar</option>
                <option value="a_jogar">A jogar</option>
                <option value="concluido">Concluído</option>
                <option value="abandonado">Abandonado</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Género</span>
              <select
                value={filtroGenero}
                onChange={(e) => setFiltroGenero(e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Limpar filtros
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <input
              type="text"
              placeholder="Procurar por título, plataforma ou género..."
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              className="w-64 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-[11px] text-slate-500">{rangeText}</span>
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
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="px-4 py-6 text-sm text-slate-500">A carregar coleção...</div>
        ) : erro ? (
          <div className="px-4 py-6 text-sm text-red-600">{erro}</div>
        ) : total === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-slate-500">
            <p className="font-medium text-slate-600 mb-1">
              Ainda não há jogos que correspondam a este filtro.
            </p>
            <p className="text-xs text-slate-400">
              Tenta limpar os filtros ou adiciona novos jogos pela RAWG.
            </p>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setMostrarModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition shadow-sm"
              >
                <span className="text-lg">＋</span>
                Adicionar jogo
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {/* Cabeçalho "sticky" */}
              <div className="sticky top-0 z-10 grid grid-cols-12 gap-3 bg-white/95 backdrop-blur px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 border-b border-slate-100">
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
                    className="grid grid-cols-12 gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer"
                    onClick={() => navigate(`/app/jogo/${jogo.id}`)}
                  >
                    <div className="col-span-5 flex items-center gap-3">
                      <div className="h-14 w-10 overflow-hidden rounded-md bg-slate-200 flex-shrink-0">
                        {capa ? (
                          <img
                            src={capa}
                            alt={jogo.titulo}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-[10px] text-slate-500">
                            Sem capa
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">
                          {jogo.titulo}
                        </div>
                        {jogo.notas && (
                          <div className="mt-0.5 text-[11px] text-slate-500 line-clamp-1">
                            {jogo.notas}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-span-2 flex flex-col justify-center gap-1">
                      <div className="text-xs text-slate-700">{jogo.plataforma || "-"}</div>
                      <div className="text-[11px] text-slate-400">{jogo.genero || "-"}</div>
                    </div>

                    <div className="col-span-2 flex items-center">
                      <EstadoBadge estado={jogo.estado} />
                    </div>

                    <div className="col-span-2 flex flex-col justify-center gap-1">
                      <RatingChip rating={jogo.rating} />
                      <div className="text-[11px] text-slate-500 text-right">
                        {formatHoras(jogo.horas_jogadas)}h
                      </div>
                    </div>

                    <div className="col-span-1 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemover(jogo.id);
                        }}
                        className="rounded-md border border-rose-100 bg-rose-50 px-2 py-1 text-[11px] text-rose-700 hover:bg-rose-100"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Paginação */}
            <div className="flex items-center justify-between px-4 py-3 text-xs border-t border-slate-100">
              <div className="text-slate-500">
                Página {paginaAtual} de {totalPaginas}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={paginaAtual <= 1}
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  ◀ Anterior
                </button>

                <button
                  type="button"
                  disabled={paginaAtual >= totalPaginas}
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Seguinte ▶
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
