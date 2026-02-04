// src/pages/CollectionPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useToast } from "../components/Toast";
import { 
  Gamepad2, 
  Check, 
  X, 
  Clock, 
  Star, 
  Trash2, 
  Search, 
  Cloud, 
  Plus, 
  FileText,
  List,
  Grid3x3
} from "lucide-react";

// ============ COMPONENTES VISUAIS (RETRO) ============

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
    fuchsia: "border-fuchsia-500 bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/20 dark:text-fuchsia-400 hover:bg-fuchsia-500 hover:text-white",
    cyan: "border-cyan-400 bg-cyan-50 text-cyan-600 dark:bg-cyan-400/20 dark:text-cyan-400 hover:bg-cyan-400 hover:text-slate-900",
    green: "border-green-400 bg-green-50 text-green-600 dark:bg-green-400/20 dark:text-green-400 hover:bg-green-400 hover:text-slate-900",
    rose: "border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 hover:bg-rose-500 hover:text-white",
    yellow: "border-yellow-400 bg-yellow-50 text-yellow-600 dark:bg-yellow-400/20 dark:text-yellow-400 hover:bg-yellow-400 hover:text-slate-900",
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

function EstadoBadge({ estado }) {
  if (!estado) return null;
  const map = {
    por_jogar: { label: "Por jogar", Icon: Clock, classes: "border-slate-400 text-slate-500 bg-slate-100 dark:bg-slate-800" },
    a_jogar: { label: "A jogar", Icon: Gamepad2, classes: "border-cyan-400 text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20" },
    em_pausa: { label: "Em Pausa", Icon: Clock, classes: "border-amber-400 text-amber-600 bg-amber-50 dark:bg-amber-900/20" },
    concluido: { label: "Concluído", Icon: Check, classes: "border-green-400 text-green-600 bg-green-50 dark:bg-green-900/20" },
    abandonado: { label: "Abandonado", Icon: X, classes: "border-rose-500 text-rose-600 bg-rose-50 dark:bg-rose-900/20" },
  };
  const cfg = map[estado] || map.por_jogar;
  const IconComponent = cfg.Icon;
  return (
    <span className={`inline-flex items-center gap-1 border-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cfg.classes}`}>
      <IconComponent size={12} /> {cfg.label}
    </span>
  );
}

function RatingChip({ rating }) {
  if (rating == null) {
    return (
      <span className="inline-flex items-center gap-1 border-2 border-slate-300 bg-slate-100 text-slate-500 dark:border-slate-600 dark:bg-slate-700/50 px-2 py-1 text-[10px] font-bold">
        <Star size={12} /> --
      </span>
    );
  }
  const n = Number(rating);
  let classes = "border-green-400 bg-green-50 text-green-700 dark:bg-green-400/20 dark:text-green-400";
  if (n <= 4) classes = "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400";
  else if (n <= 7) classes = "border-yellow-400 bg-yellow-50 text-yellow-700 dark:bg-yellow-400/20 dark:text-yellow-400";

  return (
    <span className={`inline-flex items-center gap-1 border-2 px-2 py-0.5 text-[10px] font-bold ${classes}`}>
      <Star size={12} fill="currentColor" /> {n.toFixed(1)}
    </span>
  );
}

function SortHeader({ label, active, dir, onClick, alignRight = false }) {
  return (
    <button
      onClick={onClick}
      className={`group inline-flex items-center gap-1 ${alignRight ? "justify-end w-full" : ""} ${active ? "text-cyan-600 dark:text-cyan-400 font-bold" : "text-slate-500 font-bold"}`}
    >
      <span>{label}</span>
      <span className="text-[10px]">{active ? (dir === "asc" ? "▲" : "▼") : "↕"}</span>
    </button>
  );
}

// Helpers
function safeNumber(v, fallback = 0) { const n = Number(v); return Number.isFinite(n) ? n : fallback; }
function safeDateMs(v) { if (!v) return 0; const d = new Date(v); return Number.isFinite(d.getTime()) ? d.getTime() : 0; }
function formatHoras(v) { const n = Number(v); if (!Number.isFinite(n)) return "0"; return Number.isInteger(n) ? String(n) : n.toFixed(1); }

// ============ PÁGINA COLEÇÃO ============

export default function CollectionPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [jogos, setJogos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  // Filtros e Ordenação
  const [filtroPlataforma, setFiltroPlataforma] = useState("todas");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroGenero, setFiltroGenero] = useState("todos");
  const [pesquisa, setPesquisa] = useState("");
  const [sort, setSort] = useState({ key: "atualizado", dir: "desc" });
  
  // Paginação
  const PER_PAGE = 10;
  const [pagina, setPagina] = useState(1);
  
  // Vista (Lista vs Grid)
  const [vistaGrid, setVistaGrid] = useState(false);

  // NOVO MODAL
  const [mostrarModal, setMostrarModal] = useState(false);
  const [termoPesquisaModal, setTermoPesquisaModal] = useState("");
  const [resultadosModal, setResultadosModal] = useState([]);
  const [loadingModal, setLoadingModal] = useState(false);
  const [erroModal, setErroModal] = useState("");
  const [aAdicionarId, setAAdicionarId] = useState(null);

  // --- BLOQUEAR SCROLL ---
  useEffect(() => {
    if (mostrarModal) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [mostrarModal]);

  useEffect(() => {
    fetchColecao();
  }, []);

  async function fetchColecao() {
    try {
      setErro("");
      setLoading(true);
      const res = await api.get("/collection?limit=1000");
      setJogos(res.data.colecao || []);
    } catch (err) {
      console.error(err);
      setErro("Erro ao carregar a coleção.");
    } finally {
      setLoading(false);
    }
  }

  const colecaoExternalIds = useMemo(() => {
    return new Set(jogos.map((j) => Number(j.external_id)).filter(Boolean));
  }, [jogos]);

  const generos = useMemo(() => {
    const set = new Set(jogos.flatMap((j) => j.genero ? String(j.genero).split(",").map(g => g.trim()).filter(Boolean) : []));
    return Array.from(set).sort();
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
      if (filtroGenero !== "todos" && !String(j.genero || "").toLowerCase().includes(filtroGenero.toLowerCase())) return false;
      if (pesquisa.trim()) {
        const termo = pesquisa.toLowerCase();
        if (!`${j.titulo} ${j.plataforma} ${j.genero}`.toLowerCase().includes(termo)) return false;
      }
      return true;
    });
  }, [jogos, filtroPlataforma, filtroEstado, filtroGenero, pesquisa]);

  const jogosOrdenados = useMemo(() => {
    const arr = [...jogosFiltrados];
    const byTitulo = (a, b) => String(a.titulo || "").localeCompare(String(b.titulo || ""));
    const byRating = (a, b) => safeNumber(a.rating, -1) - safeNumber(b.rating, -1);
    const byHoras = (a, b) => safeNumber(a.horas_jogadas, 0) - safeNumber(b.horas_jogadas, 0);
    const byAtualizado = (a, b) => {
        const am = safeDateMs(a.atualizado_em) || safeDateMs(a.updated_at);
        const bm = safeDateMs(b.atualizado_em) || safeDateMs(b.updated_at);
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

  useEffect(() => setPagina(1), [filtroPlataforma, filtroEstado, filtroGenero, pesquisa, sort]);
  const total = jogosOrdenados.length;
  const totalPaginas = Math.max(1, Math.ceil(total / PER_PAGE));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const jogosPagina = jogosOrdenados.slice((paginaAtual - 1) * PER_PAGE, paginaAtual * PER_PAGE);
  const rangeText = `${(paginaAtual - 1) * PER_PAGE + 1}–${Math.min(paginaAtual * PER_PAGE, total)} de ${total}`;

  function toggleSort(key) {
    setSort(prev => ({ key, dir: prev.key === key && prev.dir === "desc" ? "asc" : "desc" }));
  }

  async function handleRemover(id, titulo) {
    if (!confirm("Remover da coleção?")) return;
    try {
      await api.delete(`/collection/${id}`);
      setJogos(p => p.filter(j => j.id !== id));
      toast.success(`"${titulo}" removido.`);
    } catch (err) {
      toast.error("Erro ao remover.");
    }
  }

  function limparFiltros() {
    setFiltroPlataforma("todas");
    setFiltroEstado("todos");
    setFiltroGenero("todos");
    setPesquisa("");
    setSort({ key: "atualizado", dir: "desc" });
  }

  // --- LÓGICA DO MODAL (LIVE SEARCH) ---
  
  async function executarPesquisa(termo) {
    try {
        setLoadingModal(true);
        setErroModal("");
        const res = await api.get("/external-games/search", { params: { q: termo, page: 1 } });
        const lista = res.data.jogos || res.data.results || res.data.resultados || [];
        setResultadosModal(Array.isArray(lista) ? lista : []);
        if(lista.length === 0) setErroModal("Sem resultados.");
    } catch (err) {
        console.error(err);
        setErroModal("Erro na pesquisa.");
    } finally {
        setLoadingModal(false);
    }
  }

  // Live Search (debounce)
  useEffect(() => {
    if (termoPesquisaModal.trim().length < 2) {
        setResultadosModal([]);
        return;
    }
    const timer = setTimeout(() => {
        executarPesquisa(termoPesquisaModal);
    }, 500);
    return () => clearTimeout(timer);
  }, [termoPesquisaModal]);

  function handleManualSearch(e) {
    e.preventDefault();
    if(termoPesquisaModal.trim().length >= 2) {
        executarPesquisa(termoPesquisaModal);
    }
  }

  async function adicionarAoCarregar(jogo) {
    const idExterno = jogo.external_id || jogo.id;
    if (colecaoExternalIds.has(Number(idExterno))) return;

    try {
        setAAdicionarId(idExterno);
        await api.post("/external-games/import/collection", {
            external_id: idExterno,
            status: "por_jogar",
            rating: null,
            hours_played: 0
        });
        toast.success("Adicionado à coleção!");
        await fetchColecao();
    } catch (err) {
        console.error(err);
        if (err.response?.status === 409) toast.info("Já tens este jogo.");
        else toast.error("Erro ao adicionar.");
    } finally {
        setAAdicionarId(null);
    }
  }

  function irParaDetalhes(id) {
      setMostrarModal(false);
      navigate(`/app/explorar/${id}`);
  }

  const temFiltros = filtroPlataforma !== "todas" || filtroEstado !== "todos" || filtroGenero !== "todos" || pesquisa !== "";

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <RetroCard color="fuchsia" className="p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(217,70,239,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(217,70,239,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-fuchsia-600 dark:text-fuchsia-400 text-xs sm:text-sm font-bold uppercase tracking-widest mb-2">
              <span className="inline-block w-2 h-2 sm:w-3 sm:h-3 bg-fuchsia-500 animate-pulse" />
              Biblioteca
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2"><Gamepad2 size={24} className="sm:w-8 sm:h-8" /> Minha Coleção</h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1"><FileText size={14} /> {jogos.length} jogos na tua biblioteca</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            {/* BOTÃO DA STEAM MOVIDO PARA DIREITA */}
            <RetroButton color="slate" onClick={() => navigate("/app/steam-import")} className="text-xs sm:text-sm">
                <Cloud size={14} /> Steam
            </RetroButton>

            <RetroButton color="cyan" onClick={() => {
                setMostrarModal(true);
                setResultadosModal([]);
                setTermoPesquisaModal("");
            }} className="text-xs sm:text-sm">
                <Plus size={14} /> Adicionar jogo
            </RetroButton>
          </div>
        </div>
      </RetroCard>

      {/* BARRA DE FILTROS */}
      <RetroCard color="cyan" className="p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Linha Superior: Filtros + Vista */}
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs">
               <div className="flex items-center gap-1 sm:gap-2">
                  <span className="font-bold text-cyan-500 uppercase hidden sm:inline">Estado</span>
                  <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-sm px-1.5 sm:px-2 py-1 focus:border-cyan-400 outline-none text-xs">
                      <option value="todos">Estado</option>
                      <option value="por_jogar">Por Jogar</option>
                      <option value="a_jogar">A Jogar</option>
                      <option value="em_pausa">Em Pausa</option>
                      <option value="concluido">Concluído</option>
                      <option value="abandonado">Abandonado</option>
                  </select>
               </div>
               <div className="flex items-center gap-1 sm:gap-2">
                  <span className="font-bold text-cyan-500 uppercase hidden sm:inline">Plataforma</span>
                  <select value={filtroPlataforma} onChange={e => setFiltroPlataforma(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-sm px-1.5 sm:px-2 py-1 focus:border-cyan-400 outline-none text-xs">
                      <option value="todas">Plataforma</option>
                      <option value="pc">PC</option>
                      <option value="playstation">PlayStation</option>
                      <option value="xbox">Xbox</option>
                      <option value="nintendo">Nintendo</option>
                  </select>
               </div>
               <div className="flex items-center gap-1 sm:gap-2">
                  <span className="font-bold text-cyan-500 uppercase hidden sm:inline">Género</span>
                  <select value={filtroGenero} onChange={e => setFiltroGenero(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-sm px-1.5 sm:px-2 py-1 focus:border-cyan-400 outline-none max-w-[100px] sm:max-w-[120px] text-xs">
                      <option value="todos">Género</option>
                      {generos.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
               </div>
               {temFiltros && <RetroButton color="rose" onClick={limparFiltros} className="px-2 py-1 text-[10px]">Limpar</RetroButton>}
            </div>
            
            {/* Vista */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-cyan-500 uppercase text-[10px] hidden sm:inline">Vista:</span>
                <div className="flex border-2 border-cyan-400 overflow-hidden">
                  <button onClick={() => setVistaGrid(false)} className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold transition-colors flex items-center gap-1 ${
                    !vistaGrid ? 'bg-cyan-400 text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-cyan-50 dark:hover:bg-slate-700'
                  }`}><List size={14} /> <span className="hidden sm:inline">Lista</span></button>
                  <button onClick={() => setVistaGrid(true)} className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold transition-colors border-l-2 border-cyan-400 flex items-center gap-1 ${
                    vistaGrid ? 'bg-cyan-400 text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-cyan-50 dark:hover:bg-slate-700'
                  }`}><Grid3x3 size={14} /> <span className="hidden sm:inline">Grid</span></button>
                </div>
              </div>
              <span className="font-bold text-fuchsia-500 bg-fuchsia-500/10 px-2 sm:px-3 py-1 sm:py-1.5 border border-fuchsia-500/30 text-[10px] sm:text-xs whitespace-nowrap">{total} jogos</span>
            </div>
          </div>

          {/* Linha Inferior: Pesquisa */}
          <div className="flex gap-2 items-center">
             <div className="relative flex-1">
                <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Filtrar coleção..." className="w-full pl-7 pr-2 py-1.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 focus:border-fuchsia-500 outline-none rounded-sm text-xs" value={pesquisa} onChange={e => setPesquisa(e.target.value)} />
             </div>
          </div>
        </div>
      </RetroCard>

      {/* LISTA/GRID */}
      <RetroCard color="fuchsia" className="overflow-hidden">
        {loading ? <div className="p-8 text-center text-slate-500">A carregar...</div> :
         total === 0 ? <div className="p-8 sm:p-16 text-center text-slate-500 font-bold">Nenhum jogo encontrado.</div> :
         vistaGrid ? (
         <div>
            {/* Desktop Table Header - Hidden on mobile */}
            <div className="hidden md:grid sticky top-0 z-10 grid-cols-12 gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b-2 border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
               <div className="col-span-5"><SortHeader label="JOGO" active={sort.key === "titulo"} dir={sort.dir} onClick={() => toggleSort("titulo")} /></div>
               <div className="col-span-2">PLATAFORMA / GÉNERO</div>
               <div className="col-span-2">ESTADO</div>
               <div className="col-span-2">
                  <div className="flex justify-between">
                     <SortHeader label="RATING" active={sort.key === "rating"} dir={sort.dir} onClick={() => toggleSort("rating")} />
                     <SortHeader label="HORAS" active={sort.key === "horas"} dir={sort.dir} onClick={() => toggleSort("horas")} alignRight />
                  </div>
               </div>
               <div className="col-span-1 text-right"><SortHeader label="ATUAL." active={sort.key === "atualizado"} dir={sort.dir} onClick={() => toggleSort("atualizado")} alignRight /></div>
            </div>

            {/* Mobile Sort Buttons */}
            <div className="md:hidden flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-900 border-b-2 border-slate-200 dark:border-slate-700">
               <button onClick={() => toggleSort("titulo")} className={`text-[10px] px-2 py-1 border rounded font-bold ${sort.key === "titulo" ? 'border-cyan-400 bg-cyan-400/20 text-cyan-600' : 'border-slate-300 text-slate-500'}`}>
                  Nome {sort.key === "titulo" && (sort.dir === "asc" ? "▲" : "▼")}
               </button>
               <button onClick={() => toggleSort("rating")} className={`text-[10px] px-2 py-1 border rounded font-bold ${sort.key === "rating" ? 'border-cyan-400 bg-cyan-400/20 text-cyan-600' : 'border-slate-300 text-slate-500'}`}>
                  Rating {sort.key === "rating" && (sort.dir === "asc" ? "▲" : "▼")}
               </button>
               <button onClick={() => toggleSort("atualizado")} className={`text-[10px] px-2 py-1 border rounded font-bold ${sort.key === "atualizado" ? 'border-cyan-400 bg-cyan-400/20 text-cyan-600' : 'border-slate-300 text-slate-500'}`}>
                  Recente {sort.key === "atualizado" && (sort.dir === "asc" ? "▲" : "▼")}
               </button>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-700/50">
               {jogosPagina.map(jogo => {
                  const capa = jogo.url_capa || jogo.cover_url;
                  return (
                    <>
                    {/* Desktop Row */}
                    <div key={jogo.id} className="hidden md:grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer" onClick={() => navigate(`/app/jogo/${jogo.id}`)}>
                       <div className="col-span-5 flex items-center gap-3">
                          <div className="w-10 h-14 bg-slate-200 shrink-0 border border-slate-300 dark:border-slate-600 overflow-hidden">
                             {capa ? <img src={capa} className="w-full h-full object-cover group-hover:scale-110 transition-transform" /> : <div className="flex items-center justify-center h-full text-slate-400"><Gamepad2 size={16} /></div>}
                          </div>
                          <div className="min-w-0">
                             <div className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-fuchsia-500 transition-colors">{jogo.titulo}</div>
                             {jogo.notas && <div className="text-[10px] text-slate-500 truncate flex items-center gap-1"><FileText size={10} /> {jogo.notas}</div>}
                          </div>
                       </div>
                       <div className="col-span-2 flex flex-col justify-center">
                          <div className="text-xs font-bold text-slate-600 dark:text-slate-300">{jogo.plataforma || "-"}</div>
                          <div className="text-[10px] text-slate-500 truncate">{jogo.genero || "—"}</div>
                       </div>
                       <div className="col-span-2"><EstadoBadge estado={jogo.estado} /></div>
                       <div className="col-span-2 flex items-center gap-3">
                          {/* Rating Visual */}
                          <div className="flex-1">
                             {jogo.rating != null ? (
                                <div className="flex items-center gap-1.5">
                                   <div className="flex gap-0.5">
                                      {[1,2,3,4,5].map(star => (
                                         <span key={star} className={`text-xs ${star <= Math.round(jogo.rating / 2) ? 'text-yellow-400' : 'text-slate-600'}`}>★</span>
                                      ))}
                                   </div>
                                   <span className="text-xs font-bold text-yellow-500">{Number(jogo.rating).toFixed(1)}</span>
                                </div>
                             ) : (
                                <span className="text-xs text-slate-500">Sem rating</span>
                             )}
                          </div>
                          {/* Horas */}
                          <div className="text-right">
                             <div className="text-sm font-bold text-cyan-500 font-mono">{formatHoras(jogo.horas_jogadas)}h</div>
                          </div>
                       </div>
                       <div className="col-span-1 text-right">
                          <button onClick={(e) => { e.stopPropagation(); handleRemover(jogo.id, jogo.titulo); }} className="text-slate-400 hover:text-rose-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity border-2 border-transparent hover:border-rose-500/30 bg-transparent hover:bg-rose-500/10"><Trash2 size={16} /></button>
                       </div>
                    </div>

                    {/* Mobile Card Row */}
                    <div key={`mobile-${jogo.id}`} className="md:hidden flex gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => navigate(`/app/jogo/${jogo.id}`)}>
                       <div className="w-16 h-20 bg-slate-200 shrink-0 border border-slate-300 dark:border-slate-600 overflow-hidden rounded">
                          {capa ? <img src={capa} className="w-full h-full object-cover" alt={jogo.titulo} /> : <div className="flex items-center justify-center h-full text-slate-400"><Gamepad2 size={20} /></div>}
                       </div>
                       <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                             <div className="font-bold text-sm text-slate-900 dark:text-white truncate">{jogo.titulo}</div>
                             <div className="text-[10px] text-slate-500 truncate">{jogo.plataforma || "-"} • {jogo.genero || "—"}</div>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                             <EstadoBadge estado={jogo.estado} />
                             <div className="flex items-center gap-2">
                                {jogo.rating != null && (
                                   <span className="text-xs font-bold text-yellow-500 flex items-center gap-0.5">
                                      <Star size={10} fill="currentColor" /> {Number(jogo.rating).toFixed(1)}
                                   </span>
                                )}
                                <button onClick={(e) => { e.stopPropagation(); handleRemover(jogo.id, jogo.titulo); }} className="text-slate-400 hover:text-rose-500 p-1"><Trash2 size={14} /></button>
                             </div>
                          </div>
                       </div>
                    </div>
                    </>
                  )
               })}
            </div>

            <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-900 border-t-2 border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
               <span className="font-bold text-fuchsia-600 text-[10px] sm:text-xs">Pág. {paginaAtual}/{totalPaginas}</span>
               <div className="flex gap-2">
                  <RetroButton color="cyan" disabled={paginaAtual <= 1} onClick={() => setPagina(p => Math.max(1, p-1))} className="px-2 py-1 text-[10px]">Anterior</RetroButton>
                  <RetroButton color="cyan" disabled={paginaAtual >= totalPaginas} onClick={() => setPagina(p => Math.min(totalPaginas, p+1))} className="px-2 py-1 text-[10px]">Seguinte</RetroButton>
               </div>
            </div>
         </div>
         ) : (
         // VISTA GRID
         <div>
            <div className="p-3 sm:p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
               {jogosPagina.map(jogo => {
                  const capa = jogo.url_capa || jogo.cover_url;
                  return (
                    <button key={jogo.id} onClick={() => navigate(`/app/jogo/${jogo.id}`)} className="group text-left">
                       <div className="border-2 border-cyan-400 bg-white dark:bg-slate-900 shadow-[4px_4px_0px_0px_rgba(34,211,238,0.5)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all overflow-hidden">
                          {/* Capa */}
                          <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                             {capa ? (
                                <img src={capa} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt={jogo.titulo} />
                             ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400"><Gamepad2 size={32} className="sm:w-12 sm:h-12" /></div>
                             )}
                             {/* Badge Estado no canto */}
                             <div className="absolute top-1 right-1 sm:top-2 sm:right-2">
                                {jogo.estado === 'concluido' && <span className="block w-6 h-6 sm:w-8 sm:h-8 bg-green-400 border-2 border-white shadow-lg flex items-center justify-center"><Check size={12} className="text-white sm:w-4 sm:h-4" /></span>}
                                {jogo.estado === 'a_jogar' && <span className="block w-6 h-6 sm:w-8 sm:h-8 bg-cyan-400 border-2 border-white shadow-lg flex items-center justify-center"><Gamepad2 size={12} className="text-white sm:w-4 sm:h-4" /></span>}
                                {jogo.estado === 'abandonado' && <span className="block w-6 h-6 sm:w-8 sm:h-8 bg-rose-500 border-2 border-white shadow-lg flex items-center justify-center"><X size={12} className="text-white sm:w-4 sm:h-4" /></span>}
                             </div>
                          </div>
                          {/* Info */}
                          <div className="p-2 sm:p-3 border-t-2 border-cyan-400 bg-slate-50 dark:bg-slate-800">
                             <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors mb-1">{jogo.titulo}</div>
                             <div className="flex items-center justify-between text-[10px]">
                                <div className="flex items-center gap-1">
                                   {jogo.rating != null ? (
                                      <span className="font-bold text-yellow-500 flex items-center gap-0.5"><Star size={10} fill="currentColor" /> {Number(jogo.rating).toFixed(1)}</span>
                                   ) : (
                                      <span className="text-slate-400 flex items-center gap-0.5"><Star size={10} /> --</span>
                                   )}
                                </div>
                                <span className="text-slate-500 font-mono font-bold">{formatHoras(jogo.horas_jogadas)}h</span>
                             </div>
                          </div>
                       </div>
                    </button>
                  )
               })}
            </div>

            <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-900 border-t-2 border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
               <span className="font-bold text-fuchsia-600 text-[10px] sm:text-xs">Pág. {paginaAtual}/{totalPaginas}</span>
               <div className="flex gap-2">
                  <RetroButton color="cyan" disabled={paginaAtual <= 1} onClick={() => setPagina(p => Math.max(1, p-1))} className="px-2 py-1 text-[10px]">Anterior</RetroButton>
                  <RetroButton color="cyan" disabled={paginaAtual >= totalPaginas} onClick={() => setPagina(p => Math.min(totalPaginas, p+1))} className="px-2 py-1 text-[10px]">Seguinte</RetroButton>
               </div>
            </div>
         </div>
         )
        }
      </RetroCard>

      {/* === MODAL DE ADICIONAR === */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <RetroCard color="cyan" className="w-full max-w-4xl max-h-[85vh] flex flex-col relative shadow-2xl">
            <div className="p-4 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-black text-cyan-600 dark:text-cyan-400 flex items-center gap-2 uppercase tracking-wide">
                <Plus size={20} /> Adicionar à Coleção
              </h3>
              <button onClick={() => setMostrarModal(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/20 font-bold text-xl transition-colors">✕</button>
            </div>

            <div className="p-6 flex flex-col flex-1 overflow-hidden bg-white dark:bg-slate-900">
              <form onSubmit={handleManualSearch} className="flex gap-3 mb-6">
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Nome do jogo (ex: Mario, Halo, God of War)..." 
                  className="flex-1 border-2 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 pl-4 pr-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors font-mono text-slate-900 dark:text-white"
                  value={termoPesquisaModal}
                  onChange={e => setTermoPesquisaModal(e.target.value)}
                />
                <RetroButton type="submit" color="cyan" disabled={loadingModal}>
                  {loadingModal ? "A PROCURAR..." : "PESQUISAR"}
                </RetroButton>
              </form>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {erroModal && <div className="p-3 bg-rose-50 dark:bg-rose-900/30 border-2 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 mb-2 font-bold text-sm">⚠️ {erroModal}</div>}
                
                {!loadingModal && resultadosModal.length === 0 && termoPesquisaModal && !erroModal && (
                   <div className="text-center py-10 text-slate-500 border-2 border-dashed border-slate-300 dark:border-slate-700">
                     <p className="font-mono text-sm">A escrever...</p>
                   </div>
                )}

                {resultadosModal.map(jogo => {
                   const idReal = jogo.external_id || jogo.id;
                   const jaTem = colecaoExternalIds.has(Number(idReal));
                   const capa = jogo.background_image || jogo.cover_url;
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
                              <span className="flex items-center gap-1"><Calendar size={12} /> {ano}</span>
                              {rating !== "-" && <span className="text-yellow-500 font-bold">★ {rating}</span>}
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <button onClick={() => irParaDetalhes(idReal)} className="px-3 py-1.5 text-xs font-bold text-slate-500 border-2 border-slate-200 dark:border-slate-600 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 transition-colors">Detalhes</button>
                           <RetroButton color={jaTem ? "slate" : "green"} onClick={() => adicionarAoCarregar(jogo)} disabled={jaTem || aAdicionarId === idReal} className="min-w-[110px]">
                              {aAdicionarId === idReal ? "A guardar..." : jaTem ? "Já tens" : "Importar"}
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

// Fim src/pages/CollectionPage.jsx
// testesfnaliflaifqloiajfajfajfajfajfajfajfajfajfajfajfajfajfajfajfajfajfajfajfajfajfajfajfajfajfajfajfajfajfajfajfajfajfajfajfajfajfajfajfajfajfajfa