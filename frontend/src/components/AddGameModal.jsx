// src/components/AddGameModal.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* overlay */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
        aria-label="Fechar"
      />

      {/* modal */}
      <div className="relative z-10 w-[min(980px,92vw)] max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Adicionar jogo (RAWG)
            </h2>
            <p className="text-xs text-slate-500">
              Pesquisa pelo nome, vê detalhes e importa para a tua coleção.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Fechar
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ex.: red dead"
              className="w-full sm:w-[520px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="text-xs text-slate-500">{totalResultadosTexto}</div>
          </div>

          {erro && <div className="mt-3 text-sm text-rose-700">{erro}</div>}

          <div className="mt-4 max-h-[55vh] overflow-auto rounded-xl border border-slate-200">
            {(!podePesquisar && resultados.length === 0) ? (
              <div className="px-4 py-10 text-center text-sm text-slate-500">
                Escreve para começar a pesquisar.
              </div>
            ) : loading && resultados.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-slate-500">
                A pesquisar…
              </div>
            ) : resultados.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-slate-500">
                Sem resultados.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {resultados.map((item) => {
                  const externalId = getExternalId(item);
                  const title = getTitle(item);
                  const cover = getCover(item);
                  const platforms = getPlatforms(item);
                  const genres = getGenres(item);
                  const released = getRelease(item);

                  const jaNaColecao =
                    externalId != null && collectionExternalIds?.has(externalId);

                  const importing = aImportarId === externalId;

                  return (
                    <div key={String(externalId ?? title)} className="flex gap-3 px-4 py-3">
                      <div className="h-16 w-12 overflow-hidden rounded-md bg-slate-200 flex-shrink-0">
                        {cover ? (
                          <img
                            src={cover}
                            alt={title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-500">
                            Sem capa
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-900">
                              {title}
                            </div>
                            <div className="mt-0.5 text-[11px] text-slate-500">
                              {formatDate(released)}{" "}
                              {platforms ? ` · ${platforms}` : ""}{" "}
                              {genres ? ` · ${genres}` : ""}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => verDetalhes(item)}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Detalhes
                            </button>

                            <button
                              type="button"
                              disabled={jaNaColecao || importing}
                              onClick={() => importarParaColecao(item)}
                              className={
                                "rounded-lg px-3 py-2 text-xs font-medium text-white " +
                                (jaNaColecao
                                  ? "bg-slate-300 cursor-not-allowed"
                                  : "bg-emerald-600 hover:bg-emerald-500") +
                                (importing ? " opacity-70" : "")
                              }
                            >
                              {jaNaColecao
                                ? "Já na coleção"
                                : importing
                                ? "A importar…"
                                : "Importar p/ coleção"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Paginação simples */}
          {podePesquisar && resultados.length > 0 && (
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => pesquisar(page - 1)}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                ◀ Anterior
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => pesquisar(page + 1)}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Mais resultados ▶
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
