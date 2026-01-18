// src/pages/CollectionPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AddGameModal from "../components/AddGameModal";
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

function RetroButton({ children, color = "fuchsia", onClick, className = "", disabled = false }) {
  const colors = {
    fuchsia: "border-fuchsia-500 bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/20 dark:text-fuchsia-400 hover:bg-fuchsia-500 hover:text-white shadow-[3px_3px_0px_0px_rgba(217,70,239,0.6)]",
    cyan: "border-cyan-400 bg-cyan-50 text-cyan-600 dark:bg-cyan-400/20 dark:text-cyan-400 hover:bg-cyan-400 hover:text-slate-900 shadow-[3px_3px_0px_0px_rgba(34,211,238,0.6)]",
    yellow: "border-yellow-400 bg-yellow-50 text-yellow-600 dark:bg-yellow-400/20 dark:text-yellow-400 hover:bg-yellow-400 hover:text-slate-900 shadow-[3px_3px_0px_0px_rgba(250,204,21,0.6)]",
    green: "border-green-400 bg-green-50 text-green-600 dark:bg-green-400/20 dark:text-green-400 hover:bg-green-400 hover:text-slate-900 shadow-[3px_3px_0px_0px_rgba(74,222,128,0.6)]",
    rose: "border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 hover:bg-rose-500 hover:text-white shadow-[3px_3px_0px_0px_rgba(244,63,94,0.6)]",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 border-2 font-bold text-sm uppercase tracking-wide transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 ${colors[color]} ${className}`}
    >
      {children}
    </button>
  );
}

function EstadoBadge({ estado }) {
  if (!estado) return null;

  const map = {
    por_jogar: {
      label: "Por jogar",
      icon: "⏳",
      classes: "border-slate-400 bg-slate-100 text-slate-600 dark:border-slate-500 dark:bg-slate-500/20 dark:text-slate-300",
    },
    a_jogar: {
      label: "A jogar",
      icon: "🎮",
      classes: "border-cyan-400 bg-cyan-50 text-cyan-700 dark:bg-cyan-400/20 dark:text-cyan-400",
    },
    concluido: {
      label: "Concluído",
      icon: "✅",
      classes: "border-green-400 bg-green-50 text-green-700 dark:bg-green-400/20 dark:text-green-400",
    },
    abandonado: {
      label: "Abandonado",
      icon: "❌",
      classes: "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400",
    },
  };

  const cfg = map[estado] || {
    label: estado,
    icon: "📋",
    classes: "border-slate-400 bg-slate-100 text-slate-600 dark:border-slate-500 dark:bg-slate-500/20 dark:text-slate-300",
  };

  return (
    <span className={`inline-flex items-center gap-1 border-2 px-2 py-1 text-[11px] font-bold uppercase tracking-wide ${cfg.classes}`}>
      <span>{cfg.icon}</span> {cfg.label}
    </span>
  );
}

function RatingChip({ rating }) {
  if (rating == null) {
    return (
      <span className="inline-flex items-center gap-1 border-2 border-slate-300 bg-slate-100 text-slate-500 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-400 px-2 py-1 text-[11px] font-bold">
        ⭐ --
      </span>
    );
  }

  const valor = Number(rating);
  let classes = "border-green-400 bg-green-50 text-green-700 dark:bg-green-400/20 dark:text-green-400";
  if (valor <= 4) classes = "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400";
  else if (valor <= 7) classes = "border-yellow-400 bg-yellow-50 text-yellow-700 dark:bg-yellow-400/20 dark:text-yellow-400";

  return (
    <span className={`inline-flex items-center gap-1 border-2 px-2 py-1 text-[11px] font-bold ${classes}`}>
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
    <span className="inline-flex items-center gap-2 border-2 border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-500/50 dark:bg-fuchsia-500/10 dark:text-fuchsia-400 px-2 py-1 text-[11px] font-bold">
      {children}
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="border border-fuchsia-300 bg-fuchsia-100 text-fuchsia-700 dark:border-fuchsia-500/50 dark:bg-fuchsia-500/20 dark:text-fuchsia-400 px-1.5 py-0.5 text-[10px] hover:bg-fuchsia-500 hover:text-white transition-colors"
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
        "group inline-flex items-center gap-1 text-left hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors " +
        (alignRight ? "justify-end w-full" : "") +
        (active ? " text-cyan-600 dark:text-cyan-400 font-bold" : " text-slate-500 dark:text-slate-400 font-bold")
      }
      title="Clica para ordenar"
    >
      <span>{label}</span>
      <span className="text-[10px]">
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

  const [sort, setSort] = useState({ key: "atualizado", dir: "desc" });
  const [mostrarModal, setMostrarModal] = useState(false);

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
        if (filtroPlataforma === "playstation" && !plat.includes("playstation")) return false;
        if (filtroPlataforma === "xbox" && !plat.includes("xbox")) return false;
        if (filtroPlataforma === "nintendo" && !plat.includes("nintendo")) return false;
      }
      if (filtroEstado !== "todos" && j.estado !== filtroEstado) return false;
      if (filtroGenero !== "todos") {
        const listaGeneros = String(j.genero || "").toLowerCase().split(",").map((g) => g.trim());
        if (!listaGeneros.includes(filtroGenero.toLowerCase())) return false;
      }
      if (pesquisa.trim()) {
        const termo = pesquisa.toLowerCase();
        const texto = `${j.titulo || ""} ${j.plataforma || ""} ${j.genero || ""}`.toLowerCase();
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
      const defaultDir = key === "titulo" ? "asc" : "desc";
      return { key, dir: defaultDir };
    });
  }

  const jogosOrdenados = useMemo(() => {
    const arr = [...jogosFiltrados];
    const byTitulo = (a, b) => String(a.titulo || "").localeCompare(String(b.titulo || ""), "pt-PT", { sensitivity: "base" });
    const byRating = (a, b) => safeNumber(a.rating, -1) - safeNumber(b.rating, -1);
    const byHoras = (a, b) => safeNumber(a.horas_jogadas, 0) - safeNumber(b.horas_jogadas, 0);
    const byAtualizado = (a, b) => {
      const am = safeDateMs(a.atualizado_em) || safeDateMs(a.updated_at) || safeDateMs(a.updatedAt);
      const bm = safeDateMs(b.atualizado_em) || safeDateMs(b.updated_at) || safeDateMs(b.updatedAt);
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
    const confirma = window.confirm("Tens a certeza que queres remover este jogo da tua coleção?");
    if (!confirma) return;

    try {
      await api.delete(`/collection/${id}`);
      setJogos((prev) => prev.filter((j) => j.id !== id));
      toast.success(`"${titulo}" removido da coleção.`, { title: "Jogo Removido 🗑️" });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao remover o jogo da coleção.", { title: "Erro" });
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
      {/* Header Retro */}
      <RetroCard color="fuchsia" className="p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(217,70,239,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(217,70,239,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
        
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-fuchsia-600 dark:text-fuchsia-400 text-sm font-bold uppercase tracking-widest mb-2">
              <span className="inline-block w-3 h-3 bg-fuchsia-500 animate-pulse" />
              Biblioteca
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              🎮 Minha Coleção
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              📊 {jogos.length} jogos na tua biblioteca • Clica nos cabeçalhos para ordenar
            </p>
          </div>

          <RetroButton color="cyan" onClick={() => setMostrarModal(true)}>
            ➕ Adicionar jogo
          </RetroButton>
        </div>
      </RetroCard>

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
      <RetroCard color="cyan" className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-3 text-xs">
            {/* PLATAFORMA */}
            <div className="flex items-center gap-2">
              <span className="text-cyan-600 dark:text-cyan-400 font-bold uppercase text-[10px]">🎯 Plataforma</span>
              <select
                value={filtroPlataforma}
                onChange={(e) => setFiltroPlataforma(e.target.value)}
                className="border-2 border-slate-300 bg-slate-50 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-xs focus:outline-none focus:border-cyan-400 cursor-pointer rounded-sm"
              >
                <option value="todas">Todas</option>
                <option value="pc">💻 PC</option>
                <option value="playstation">🎮 PlayStation</option>
                <option value="xbox">🕹️ Xbox</option>
                <option value="nintendo">🍄 Nintendo</option>
              </select>
            </div>

            {/* ESTADO */}
            <div className="flex items-center gap-2">
              <span className="text-cyan-600 dark:text-cyan-400 font-bold uppercase text-[10px]">📋 Estado</span>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="border-2 border-slate-300 bg-slate-50 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-xs focus:outline-none focus:border-cyan-400 cursor-pointer rounded-sm"
              >
                <option value="todos">Todos</option>
                <option value="por_jogar">⏳ Por jogar</option>
                <option value="a_jogar">🎮 A jogar</option>
                <option value="concluido">✅ Concluído</option>
                <option value="abandonado">❌ Abandonado</option>
              </select>
            </div>

            {/* GÉNERO */}
            <div className="flex items-center gap-2">
              <span className="text-cyan-600 dark:text-cyan-400 font-bold uppercase text-[10px]">🏷️ Género</span>
              <select
                value={filtroGenero}
                onChange={(e) => setFiltroGenero(e.target.value)}
                className="border-2 border-slate-300 bg-slate-50 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-xs focus:outline-none focus:border-cyan-400 cursor-pointer rounded-sm"
              >
                <option value="todos">Todos</option>
                {generos.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {temFiltrosAtivos && (
              <RetroButton color="rose" onClick={limparFiltros} className="text-[10px] px-3 py-1">
                🗑️ Limpar
              </RetroButton>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
              <input
                type="text"
                placeholder="Procurar por título, plataforma..."
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                className="w-72 border-2 border-slate-300 bg-slate-50 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 pl-9 pr-3 py-2.5 text-xs placeholder:text-slate-400 focus:outline-none focus:border-fuchsia-500 transition-colors rounded-sm"
              />
            </div>
            <span className="text-[11px] text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-500/20 border-2 border-fuchsia-300 dark:border-fuchsia-500/50 px-3 py-1.5 font-bold">{rangeText}</span>
          </div>
        </div>

        {/* Chips de filtros ativos */}
        {temFiltrosAtivos && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t-2 border-slate-200 dark:border-slate-700">
            {pesquisa.trim() && <Chip onClear={() => setPesquisa("")}>Pesquisa: “{pesquisa.trim()}”</Chip>}
            {filtroPlataforma !== "todas" && <Chip onClear={() => setFiltroPlataforma("todas")}>Plataforma: {filtroPlataforma}</Chip>}
            {filtroEstado !== "todos" && <Chip onClear={() => setFiltroEstado("todos")}>Estado: {filtroEstado}</Chip>}
            {filtroGenero !== "todos" && <Chip onClear={() => setFiltroGenero("todos")}>Género: {filtroGenero}</Chip>}
          </div>
        )}
      </RetroCard>

      {/* Lista */}
      <RetroCard color="fuchsia" className="overflow-hidden">
        {loading ? (
          <div className="px-4 py-6 text-sm text-slate-500">A carregar coleção...</div>
        ) : erro ? (
          <div className="px-4 py-6 text-sm text-rose-500">{erro}</div>
        ) : total === 0 ? (
          <div className="px-4 py-16 text-center">
            <div className="w-20 h-20 mx-auto mb-4 border-2 border-fuchsia-500/50 bg-fuchsia-50 dark:bg-fuchsia-500/10 flex items-center justify-center rounded-full">
              <span className="text-4xl">🎮</span>
            </div>
            <p className="font-bold text-lg text-slate-900 dark:text-white mb-2">Nenhum jogo encontrado</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Tenta limpar os filtros ou adiciona novos jogos à tua coleção.</p>
            <RetroButton color="cyan" onClick={() => setMostrarModal(true)}>➕ Adicionar jogo</RetroButton>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-200 dark:divide-slate-700/50">
              {/* Cabeçalho "sticky" */}
              <div className="sticky top-0 z-10 grid grid-cols-12 gap-3 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500 border-b-2 border-slate-200 dark:border-slate-700">
                <div className="col-span-5"><SortHeader label="Jogo" active={sort.key === "titulo"} dir={sort.dir} onClick={() => toggleSort("titulo")} /></div>
                <div className="col-span-2 text-slate-500 font-bold">Plataforma / Género</div>
                <div className="col-span-2 text-slate-500 font-bold">Estado</div>
                <div className="col-span-2">
                  <div className="flex items-center justify-between">
                    <SortHeader label="Rating" active={sort.key === "rating"} dir={sort.dir} onClick={() => toggleSort("rating")} />
                    <SortHeader label="Horas" active={sort.key === "horas"} dir={sort.dir} onClick={() => toggleSort("horas")} alignRight />
                  </div>
                </div>
                <div className="col-span-1 text-right"><SortHeader label="Atual." active={sort.key === "atualizado"} dir={sort.dir} onClick={() => toggleSort("atualizado")} alignRight /></div>
              </div>

              {jogosPagina.map((jogo) => {
                const capa = jogo.url_capa || jogo.cover_url || jogo.capa_url || null;
                return (
                  <div
                    key={jogo.id}
                    className="group grid grid-cols-12 gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors duration-200 border-b border-slate-200 dark:border-slate-800 last:border-0"
                    onClick={() => navigate(`/app/jogo/${jogo.id}`)}
                  >
                    <div className="col-span-5 flex items-center gap-3">
                      <div className="h-14 w-10 overflow-hidden border-2 border-slate-300 dark:border-cyan-400/50 bg-slate-200 dark:bg-slate-800 flex-shrink-0">
                        {capa ? (
                          <img src={capa} alt={jogo.titulo} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-2xl text-slate-400">🎮</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                          {jogo.titulo}
                        </div>
                        {jogo.notas && (
                          <div className="mt-0.5 text-[11px] text-slate-500 line-clamp-1">📝 {jogo.notas}</div>
                        )}
                      </div>
                    </div>

                    <div className="col-span-2 flex flex-col justify-center gap-1">
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{jogo.plataforma || "—"}</div>
                      <div className="text-[11px] text-slate-500">{jogo.genero || "—"}</div>
                    </div>

                    <div className="col-span-2 flex items-center">
                      <EstadoBadge estado={jogo.estado} />
                    </div>

                    <div className="col-span-2 flex flex-col justify-center gap-1.5">
                      <RatingChip rating={jogo.rating} />
                      <div className="text-[11px] text-slate-500 text-right flex items-center justify-end gap-1 font-bold">
                        <span>🕐</span> {formatHoras(jogo.horas_jogadas)}h
                      </div>
                    </div>

                    <div className="col-span-1 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemover(jogo.id, jogo.titulo); }}
                        className="opacity-0 group-hover:opacity-100 border-2 border-rose-500/50 bg-rose-50 dark:bg-rose-500/20 px-2 py-1 text-[11px] font-bold text-rose-500 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition-all duration-200"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Paginação */}
            <div className="flex items-center justify-between px-4 py-4 text-xs border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <div className="text-fuchsia-600 dark:text-fuchsia-400 font-bold">
                📄 Página {paginaAtual} de {totalPaginas}
              </div>

              <div className="flex items-center gap-2">
                <RetroButton color="cyan" disabled={paginaAtual <= 1} onClick={() => setPagina((p) => Math.max(1, p - 1))} className="text-[10px] px-3 py-1">← Anterior</RetroButton>
                <RetroButton color="cyan" disabled={paginaAtual >= totalPaginas} onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} className="text-[10px] px-3 py-1">Seguinte →</RetroButton>
              </div>
            </div>
          </>
        )}
      </RetroCard>
    </div>
  );
}