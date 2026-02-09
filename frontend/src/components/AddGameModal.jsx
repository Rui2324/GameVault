// src/components/AddGameModal.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Calendar, Star } from "lucide-react";
import api from "../services/api";

const retroColors = {
  fuchsia: "border-fuchsia-500 shadow-[4px_4px_0px_0px_rgba(217,70,239,0.5)]",
  cyan: "border-cyan-400 shadow-[4px_4px_0px_0px_rgba(34,211,238,0.5)]",
  yellow: "border-yellow-400 shadow-[4px_4px_0px_0px_rgba(250,204,21,0.5)]",
  green: "border-green-400 shadow-[4px_4px_0px_0px_rgba(74,222,128,0.5)]",
  rose: "border-rose-500 shadow-[4px_4px_0px_0px_rgba(244,63,94,0.5)]",
  slate: "border-slate-400 shadow-[4px_4px_0px_0px_rgba(148,163,184,0.4)]",
};

function RetroCard({ children, color = "fuchsia", className = "" }) {
  const palette = retroColors[color] || retroColors.fuchsia;
  return (
    <div className={`bg-white dark:bg-slate-900 border-2 ${palette} ${className}`}>
      {children}
    </div>
  );
}

function RetroButton({
  children,
  color = "fuchsia",
  className = "",
  disabled = false,
  type = "button",
  onClick,
}) {
  const palettes = {
    fuchsia:
      "border-fuchsia-500 bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/20 dark:text-fuchsia-400 hover:bg-fuchsia-500 hover:text-white",
    cyan:
      "border-cyan-400 bg-cyan-50 text-cyan-600 dark:bg-cyan-400/20 dark:text-cyan-400 hover:bg-cyan-400 hover:text-slate-900",
    green:
      "border-green-400 bg-green-50 text-green-600 dark:bg-green-400/20 dark:text-green-400 hover:bg-green-400 hover:text-slate-900",
    rose:
      "border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 hover:bg-rose-500 hover:text-white",
    yellow:
      "border-yellow-400 bg-yellow-50 text-yellow-600 dark:bg-yellow-400/20 dark:text-yellow-400 hover:bg-yellow-400 hover:text-slate-900",
    slate:
      "border-slate-400 bg-slate-50 text-slate-600 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-500 hover:text-white",
  };

  const scheme = palettes[color] || palettes.fuchsia;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 border-2 font-bold text-[11px] uppercase tracking-wide transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-50 disabled:cursor-not-allowed ${scheme} ${className}`}
    >
      {children}
    </button>
  );
}

function formatDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString("pt-PT");
}

export default function AddGameModal({
  open,
  onClose,
  collectionExternalIds = new Set(),
  onAddedToCollection,
}) {
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [resultados, setResultados] = useState([]);
  const [count, setCount] = useState(0);

  const [aImportarId, setAImportarId] = useState(null);

  const podePesquisar = q.trim().length >= 2;

  // limpar estado quando abre/fecha
  useEffect(() => {
    if (!open) return;
    setErro("");
    setResultados([]);
    setCount(0);
    setPage(1);
    // não limpo q para poderes abrir e continuar a pesquisa
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow || "";
    };
  }, [open]);

  async function pesquisar(p = 1) {
    if (!podePesquisar) return;

    try {
      setLoading(true);
      setErro("");

      const res = await api.get("/external-games/search", {
        // backend espera "query" (também aceita "q" após ajuste)
        params: { query: q.trim(), page: p },
      });

      // tenta apanhar vários formatos (depende do teu backend)
      const data = res.data || {};
      const list =
        data.jogos ||
        data.resultados?.results ||
        data.resultados ||
        data.results ||
        [];

      const total =
        (Array.isArray(data.jogos) ? data.jogos.length : 0) ||
        data.resultados?.count ||
        data.count ||
        list.length ||
        0;

      setResultados(Array.isArray(list) ? list : []);
      setCount(Number(total) || 0);
      setPage(p);
    } catch (e) {
      console.error(e);
      setErro("Falhou a pesquisa. Vê se o backend está a correr.");
      setResultados([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }

  // pesquisa “live” com debounce simples
  useEffect(() => {
    if (!open) return;

    if (!podePesquisar) {
      setResultados([]);
      setCount(0);
      setErro("");
      return;
    }

    const t = setTimeout(() => {
      pesquisar(1);
    }, 350);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, open]);

  const totalResultadosTexto = useMemo(() => {
    if (!podePesquisar) return "Escreve pelo menos 2 letras…";
    if (loading) return "A pesquisar…";
    return `${count} resultado(s)`;
  }, [podePesquisar, loading, count]);

  function getExternalId(item) {
    return item?.external_id ?? item?.id ?? item?.rawg_id;
  }

  function getTitle(item) {
    return item?.title ?? item?.name ?? "Sem título";
  }

  function getCover(item) {
    return item?.cover_url ?? item?.background_image ?? item?.cover ?? null;
  }

  function getPlatforms(item) {
    return item?.platforms ?? item?.platform ?? "";
  }

  function getGenres(item) {
    return item?.genres ?? item?.genre ?? "";
  }

  function getRelease(item) {
    return item?.release_date ?? item?.released ?? null;
  }

  async function importarParaColecao(item) {
    const externalId = getExternalId(item);
    if (!externalId) return;

    try {
      setAImportarId(externalId);

      const res = await api.post("/external-games/import/collection", {
        external_id: externalId,
        rating: null,
        hours_played: 0,
        status: "por_jogar",
        notes: null,
      });

      // callback para o AppLayout dar toast/refresh de ids
      onAddedToCollection?.({ title: getTitle(item), external_id: externalId });

      // se o backend devolver o id da entry, manda para o detalhe da tua coleção
      const entryId = res?.data?.collection_entry_id;
      if (entryId) {
        onClose?.();
        navigate(`/app/jogo/${entryId}`);
        return;
      }

      // fallback: fecha e vai para a coleção
      onClose?.();
      navigate("/app/colecao");
    } catch (e) {
      console.error(e);
      if (e?.response?.status === 409) {
        alert("Esse jogo já está na tua coleção.");
      } else {
        alert("Falhou ao importar para a coleção.");
      }
    } finally {
      setAImportarId(null);
    }
  }

  function verDetalhes(item) {
    const externalId = getExternalId(item);
    if (!externalId) return;

    onClose?.();
    navigate(`/app/explorar/${externalId}`);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (podePesquisar) {
      pesquisar(1);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm"
        aria-label="Fechar"
      />

      <div className="relative z-10 w-full max-w-4xl">
        <RetroCard color="yellow" className="w-full max-h-[85vh] flex flex-col relative shadow-2xl">
          <div className="p-4 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
            <h3 className="text-xl font-black text-yellow-600 dark:text-yellow-300 flex items-center gap-2 uppercase tracking-[0.15em]">
              <Search size={18} /> Pesquisar jogos
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/20 font-bold text-xl transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="p-6 flex flex-col flex-1 overflow-hidden bg-white dark:bg-slate-900">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-4">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Nome do jogo..."
                className="flex-1 border-2 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 pl-4 pr-4 py-2.5 text-sm focus:outline-none focus:border-yellow-400 transition-colors font-mono text-slate-900 dark:text-white"
              />
              <RetroButton type="submit" color="yellow" disabled={!podePesquisar || loading}>
                {loading ? "A pesquisar..." : "Pesquisar"}
              </RetroButton>
            </form>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] sm:text-xs font-mono uppercase text-slate-500 dark:text-slate-400 mb-3">
              <span>{totalResultadosTexto}</span>
              {podePesquisar && resultados.length > 0 && (
                <span>Pág. {page}</span>
              )}
            </div>

            {erro && (
              <div className="p-3 mb-3 bg-rose-50 dark:bg-rose-900/30 border-2 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 font-bold text-sm">
                ⚠️ {erro}
              </div>
            )}

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
              {!podePesquisar && resultados.length === 0 && !loading && !erro && (
                <div className="text-center py-10 text-slate-500 border-2 border-dashed border-slate-300 dark:border-slate-700 font-mono text-sm">
                  Escreve pelo menos 2 letras...
                </div>
              )}

              {loading && resultados.length === 0 && (
                <div className="text-center py-10 text-slate-500 border-2 border-dashed border-slate-300 dark:border-slate-700 font-mono text-sm">
                  A pesquisar...
                </div>
              )}

              {!loading && podePesquisar && resultados.length === 0 && !erro && (
                <div className="text-center py-10 text-slate-500 border-2 border-dashed border-slate-300 dark:border-slate-700 font-mono text-sm">
                  Sem resultados.
                </div>
              )}

              {resultados.length > 0 && (
                resultados.map((item) => {
                  const externalId = getExternalId(item);
                  const title = getTitle(item);
                  const cover = getCover(item);
                  const platforms = getPlatforms(item);
                  const genres = getGenres(item);
                  const released = getRelease(item);
                  const rating = item?.rating ?? item?.metacritic ?? null;

                  const jaNaColecao =
                    externalId != null && collectionExternalIds?.has(externalId);

                  const importing = aImportarId === externalId;

                  return (
                    <div
                      key={String(externalId ?? title)}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-yellow-400 transition-colors"
                    >
                      <div className="w-16 h-20 bg-slate-200 shrink-0 overflow-hidden border border-slate-300 dark:border-slate-600">
                        {cover ? (
                          <img src={cover} className="w-full h-full object-cover" alt={title} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                            IMG
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {title}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-slate-500 font-mono">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} /> {released ? formatDate(released) : "----"}
                          </span>
                          {platforms && <span>{platforms}</span>}
                          {genres && <span>{genres}</span>}
                          {rating != null && (
                            <span className="flex items-center gap-1 text-yellow-500 font-bold">
                              <Star size={12} fill="currentColor" />
                              {Number.isFinite(Number(rating)) ? Number(rating).toFixed(1) : rating}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        <RetroButton
                          color="slate"
                          className="px-3 py-1.5 text-[10px]"
                          onClick={() => verDetalhes(item)}
                        >
                          Detalhes
                        </RetroButton>
                        <RetroButton
                          color={jaNaColecao ? "slate" : "green"}
                          className="px-4 py-1.5 text-[10px] min-w-[120px]"
                          onClick={() => importarParaColecao(item)}
                          disabled={jaNaColecao || importing}
                        >
                          {jaNaColecao ? "Já tens" : importing ? "A importar..." : "Importar"}
                        </RetroButton>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {podePesquisar && resultados.length > 0 && (
              <div className="pt-4 mt-4 border-t-2 border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] sm:text-xs">
                <span className="font-bold text-yellow-500 tracking-[0.35em]">CTRL + K</span>
                <div className="flex gap-2">
                  <RetroButton
                    color="cyan"
                    className="px-3 py-1.5 text-[10px]"
                    disabled={page <= 1 || loading}
                    onClick={() => pesquisar(page - 1)}
                  >
                    ◀ Anterior
                  </RetroButton>
                  <RetroButton
                    color="cyan"
                    className="px-3 py-1.5 text-[10px]"
                    disabled={loading}
                    onClick={() => pesquisar(page + 1)}
                  >
                    Próxima ▶
                  </RetroButton>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800 border-t-2 border-slate-200 dark:border-slate-700 text-right text-[10px] text-slate-500 font-mono uppercase">
            Powered by RAWG
          </div>
        </RetroCard>
      </div>
    </div>
  );
}
