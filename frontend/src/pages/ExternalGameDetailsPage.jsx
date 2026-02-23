import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { rawgImage, rawgOriginal } from "../utils/rawgImages";
import { useToast } from "../components/Toast";
import ReviewSection from "../components/ReviewSection";
import { Calendar, Target, Heart, Clock, Plus, Pencil, Gamepad2, FileText, Globe, MessageCircle, Play, Image, Youtube, ExternalLink } from "lucide-react";

function formatDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString("pt-PT");
}

function Chip({ children, color = "slate" }) {
  const colors = {
    slate: "border-slate-200/50 dark:border-slate-600/50 bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300",
    indigo: "border-indigo-200/50 dark:border-indigo-800/50 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300",
    emerald: "border-emerald-200/50 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
  };
  return (
    <span className={`inline-flex items-center rounded-xl border ${colors[color]} px-2.5 py-1 text-[11px] font-medium`}>
      {children}
    </span>
  );
}

function SectionTitle({ children, icon }) {
  return (
    <div className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-2">
      {icon && <span>{icon}</span>}
      {children}
    </div>
  );
}

function safeStr(v) {
  return v == null ? "" : String(v);
}

function splitList(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean).map((x) => String(x).trim());
  return String(v)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function ExternalGameDetailsPage() {
  const { externalId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [jogo, setJogo] = useState(null);

  const [aImportar, setAImportar] = useState(false);
  const [aWishlist, setAWishlist] = useState(false);

  const [descricaoExpandida, setDescricaoExpandida] = useState(false);

  const [collectionId, setCollectionId] = useState(null); // Guarda o ID interno (ex: 30) se existir
  const [jaNaWishlist, setJaNaWishlist] = useState(false);
  const [userCollectionData, setUserCollectionData] = useState(null); // Dados do jogo na coleção do user
  const [internalGameId, setInternalGameId] = useState(null); // game_id na tabela games (sempre existe)

  async function carregar() {
    try {
      setLoading(true);
      setErro("");

      // 1. Carregar detalhes da API Externa (RAWG)
      const res = await api.get(`/external-games/${externalId}`);
      const j = res.data.jogo;
      setJogo(j);

      const extId = Number(j?.external_id ?? j?.id ?? externalId);
      
      console.log("🔍 A procurar ID Externo:", extId);

      // 2. Buscar Coleção e Wishlist
      const [resCol, resWish] = await Promise.allSettled([
        api.get("/collection?limit=1000"), 
        api.get("/wishlist")
      ]);

      // --- LÓGICA DE COLEÇÃO ---
      if (resCol.status === "fulfilled") {
        const dados = resCol.value?.data;
        const listaColecao = dados?.colecao || dados?.items || dados?.data || (Array.isArray(dados) ? dados : []);

        // DEBUG: Mostra a estrutura do primeiro item para percebermos onde está o ID
        if (listaColecao.length > 0) {
            console.log("📦 Exemplo de item da coleção:", listaColecao[0]);
        }

        const itemEncontrado = listaColecao.find((item) => {
          // Tenta encontrar o ID externo em TODOS os sítios possíveis
          const idNoItem = item.external_id;
          const idNoGame = item.game?.external_id; // Caso venha aninhado
          const idComoGameId = item.game_id; 

          // Converte tudo para número para comparar
          return Number(idNoItem) === extId || 
                 Number(idNoGame) === extId ||
                 (Number(idComoGameId) === extId && !item.is_internal); // Só usa game_id se não for confuso
        });
        
        if (itemEncontrado) {
          console.log("✅ ENCONTRADO! ID Interno:", itemEncontrado.id);
          setCollectionId(itemEncontrado.id);
          // Guardar dados completos para usar no ReviewSection
          setUserCollectionData({
            game_id: itemEncontrado.game_id,
            rating: itemEncontrado.rating,
            horas_jogadas: itemEncontrado.horas_jogadas
          });
        } else {
          console.warn("❌ Não encontrado. IDs disponíveis na lista:", 
            listaColecao.map(i => i.external_id || i.game?.external_id).slice(0, 5) // Mostra só os primeiros 5 para não poluir
          );
          setCollectionId(null);
        }
      }

      // --- LÓGICA DE WISHLIST ---
      if (resWish.status === "fulfilled") {
        const dadosW = resWish.value?.data;
        const listaWish = dadosW?.wishlist || dadosW?.items || dadosW?.data || (Array.isArray(dadosW) ? dadosW : []);
        
        const foundInWishlist = listaWish.some((item) => {
            const wId = item.external_id ?? item.game?.external_id;
            return Number(wId) === extId;
        });
        setJaNaWishlist(foundInWishlist);
      }

      // 3. SEMPRE buscar o game_id da tabela games (para mostrar reviews)
      try {
        const resGameId = await api.get(`/external-games/game-id/${extId}`);
        if (resGameId.data?.game_id) {
          setInternalGameId(resGameId.data.game_id);
          console.log("🎮 Game ID interno:", resGameId.data.game_id);
        }
      } catch (err) {
        console.warn("Não foi possível obter game_id:", err);
      }

    } catch (e) {
      console.error("Erro critico no carregar:", e);
      setErro("Não foi possível carregar os detalhes do jogo.");
      setJogo(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalId]);

  // campos principais
  const title = jogo?.title || jogo?.name || "Sem título";
  const released = jogo?.release_date || jogo?.released || null;
  const platformsRaw = jogo?.platforms || jogo?.platform || "";
  const genresRaw = jogo?.genres || jogo?.genre || "";
  const description = jogo?.description || jogo?.description_raw || "";

  const coverOriginal =
    jogo?.cover_url || jogo?.background_image || jogo?.cover || null;

  const bgOriginal =
    jogo?.background_image_additional ||
    jogo?.background_image ||
    coverOriginal ||
    null;

  const cover = rawgImage(coverOriginal, {
    mode: "resize",
    width: 700,
    height: "-",
  });
  const bg = rawgImage(bgOriginal, { mode: "resize", width: 1800, height: "-" });

  const metacritic = jogo?.metacritic ?? null;
  const website = jogo?.website || null;
  const reddit = jogo?.reddit_url || null;
  const playtime = jogo?.playtime ?? null;
  const esrb = jogo?.esrb_rating?.name || jogo?.esrb || null;

  const tags = useMemo(() => {
    const raw = jogo?.tags;
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw
        .map((t) => (typeof t === "string" ? t : t?.name))
        .filter(Boolean)
        .map((t) => String(t).trim());
    }
    return splitList(raw);
  }, [jogo]);

  const developers = useMemo(() => {
    const raw = jogo?.developers;
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw
        .map((d) => (typeof d === "string" ? d : d?.name))
        .filter(Boolean)
        .map((d) => String(d).trim());
    }
    return splitList(raw);
  }, [jogo]);

  const publishers = useMemo(() => {
    const raw = jogo?.publishers;
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw
        .map((p) => (typeof p === "string" ? p : p?.name))
        .filter(Boolean)
        .map((p) => String(p).trim());
    }
    return splitList(raw);
  }, [jogo]);

  const plataformas = useMemo(() => splitList(platformsRaw), [platformsRaw]);
  const generos = useMemo(() => splitList(genresRaw), [genresRaw]);

  const screenshots = useMemo(() => {
    const raw = jogo?.screenshots || jogo?.short_screenshots || null;
    if (!raw) return [];

    const urls = Array.isArray(raw)
      ? raw
          .map((s) => (typeof s === "string" ? s : s?.image || s?.url || null))
          .filter(Boolean)
      : [];

    return urls.map((u) => ({
      original: rawgOriginal(u),
      resized: rawgImage(u, { mode: "resize", width: 900, height: "-" }),
    }));
  }, [jogo]);

  const movies = useMemo(() => {
    return jogo?.movies || [];
  }, [jogo]);

  const descricaoCurta = useMemo(() => {
    const text = safeStr(description).trim();
    if (!text) return "";
    if (descricaoExpandida) return text;
    return text.length > 450 ? text.slice(0, 450) + "…" : text;
  }, [description, descricaoExpandida]);

  const extIdFinal = jogo?.external_id ?? jogo?.id ?? Number(externalId);

  async function importarParaColecao() {
    if (!jogo) return;
    if (collectionId) return; 

    try {
      setAImportar(true);

      const res = await api.post("/external-games/import/collection", {
        external_id: extIdFinal,
        rating: null,
        hours_played: 0,
        status: "por_jogar",
        notes: null,
      });

      // Atualiza o estado imediatamente
      const novoId = res.data?.collection_entry_id;
      if (novoId) {
        setCollectionId(novoId);
        toast.success(`${title} adicionado à coleção!`);
      }
      
    } catch (e) {
      console.error(e);
      if (e?.response?.status === 409) {
        toast.info("Este jogo já está na tua coleção.");
      } else {
        toast.error("Falhou ao adicionar à coleção.");
      }
    } finally {
      setAImportar(false);
    }
  }

  async function adicionarWishlist() {
    if (!jogo) return;
    if (jaNaWishlist) return;

    try {
      setAWishlist(true);
      await api.post("/external-games/import/wishlist", {
        external_id: extIdFinal,
      });
      setJaNaWishlist(true);
      toast.success(`${title} adicionado à wishlist!`);
    } catch (e) {
      console.error(e);
      if (e?.response?.status === 409) {
        setJaNaWishlist(true);
        toast.info("Este jogo já está na tua wishlist.");
      } else {
        toast.error("Falhou ao adicionar à wishlist.");
      }
    } finally {
      setAWishlist(false);
    }
  }

  if (loading) return (
    <div className="space-y-5">
      <div className="animate-pulse h-[220px] rounded-2xl bg-slate-200 dark:bg-slate-700" />
      <div className="grid gap-6 md:grid-cols-[360px,1fr]">
        <div className="space-y-4">
          <div className="animate-pulse h-80 rounded-2xl bg-slate-200 dark:bg-slate-700" />
          <div className="animate-pulse h-40 rounded-2xl bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="space-y-4">
          <div className="animate-pulse h-60 rounded-2xl bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    </div>
  );
  if (erro) return (
    <div className="flex items-center justify-center py-16 text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800">
      <span className="mr-2">⚠️</span> {erro}
    </div>
  );
  if (!jogo) return (
    <div className="flex items-center justify-center py-16 text-slate-500 dark:text-slate-400">
      <span className="mr-2">📭</span> Sem dados.
    </div>
  );

  return (
    <div className="space-y-5">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-800 shadow-xl h-[200px] md:h-[240px]">
        {(cover || bg) && (
          <img
            src={cover || bg}
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full object-cover scale-110"
            onError={(e) => {
              const fb1 = rawgOriginal(coverOriginal);
              if (!e.currentTarget.dataset.fallback && fb1) {
                e.currentTarget.dataset.fallback = "1";
                e.currentTarget.src = fb1;
                return;
              }
              const fb2 = rawgOriginal(bgOriginal);
              if (!e.currentTarget.dataset.fallback2 && fb2) {
                e.currentTarget.dataset.fallback2 = "1";
                e.currentTarget.src = fb2;
              }
            }}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-slate-900/30 backdrop-blur-xl" />

        <div className="relative z-10 p-6 h-full">
          <div className="flex h-full flex-col justify-between gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 px-4 py-2 text-xs font-semibold text-white hover:bg-white/30 transition-all"
              >
                <span>←</span>
                Voltar
              </button>

              <h1 className="mt-4 text-3xl font-bold text-white drop-shadow-lg">
                {title}
              </h1>
              
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {released && (
                  <span className="text-xs text-white/80 bg-white/10 rounded-lg px-2 py-1 flex items-center gap-1">
                    <Calendar size={12} /> {formatDate(released)}
                  </span>
                )}
                {metacritic && (
                  <span className={`text-xs font-bold rounded-lg px-2 py-1 flex items-center gap-1 ${
                    metacritic >= 75 ? 'bg-emerald-500/80 text-white' :
                    metacritic >= 50 ? 'bg-amber-500/80 text-white' :
                    'bg-red-500/80 text-white'
                  }`}>
                    <Target size={12} /> {metacritic}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              
              {/* O BOTÃO DE WISHLIST */}
              {!collectionId && (
                <button
                  type="button"
                  onClick={adicionarWishlist}
                  disabled={aWishlist || jaNaWishlist}
                  className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                    jaNaWishlist
                      ? "bg-white/30 text-white/70 cursor-not-allowed"
                      : "bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 hover:scale-105"
                  } ${aWishlist ? " opacity-60" : ""}`}
                >
                  {jaNaWishlist ? <><Heart size={16} fill="currentColor" /> Na wishlist</> : aWishlist ? <><Clock size={16} /> A adicionar...</> : <><Heart size={16} /> Wishlist</>}
                </button>
              )}

              {/* --- BOTÃO DINÂMICO --- */}
              {collectionId ? (
                <button
                  type="button"
                  onClick={() => navigate(`/app/jogo/${collectionId}`)} 
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 shadow-lg hover:scale-105 transition-all"
                >
                  <Pencil size={16} /> Editar na Coleção
                </button>
              ) : (
                <button
                  type="button"
                  onClick={importarParaColecao}
                  disabled={aImportar}
                  className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all ${
                    aImportar 
                      ? "bg-indigo-600/50 opacity-60 cursor-wait"
                      : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-xl hover:scale-105"
                  }`}
                >
                  {aImportar ? <><Clock size={16} /> A adicionar...</> : <><Plus size={16} /> Adicionar à coleção</>}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[360px,1fr]">
        {/* Sidebar (Capa, Resumo, Links) */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-4 shadow-xl">
            <div className="w-full overflow-hidden rounded-xl bg-slate-200 dark:bg-slate-700">
              {cover ? (
                <img
                  src={cover}
                  alt={title}
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-contain hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    const fallback = rawgOriginal(coverOriginal);
                    if (!e.currentTarget.dataset.fallback && fallback) {
                      e.currentTarget.dataset.fallback = "1";
                      e.currentTarget.src = fallback;
                    }
                  }}
                />
              ) : (
                <div className="flex h-60 w-full items-center justify-center text-4xl"><Gamepad2 size={64} className="text-slate-400 dark:text-slate-600" /></div>
              )}
            </div>
          </div>

          {/* Resumo */}
          <div className="rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-5 shadow-xl">
            <SectionTitle icon={<FileText size={14} />}>Resumo</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {released && <Chip>Lançamento: {formatDate(released)}</Chip>}
              {playtime != null && <Chip>Tempo médio: {playtime}h</Chip>}
              {metacritic != null && <Chip>Metacritic: {metacritic}</Chip>}
              {esrb && <Chip>ESRB: {esrb}</Chip>}
            </div>
            
            <div className="mt-3">
              <SectionTitle>Géneros</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {generos.length ? generos.slice(0, 10).map((g) => <Chip key={g}>{g}</Chip>) : <span className="text-xs text-slate-400">—</span>}
              </div>
            </div>

            <div className="mt-3">
              <SectionTitle>Plataformas</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {plataformas.length ? plataformas.slice(0, 12).map((p) => <Chip key={p}>{p}</Chip>) : <span className="text-xs text-slate-400">—</span>}
              </div>
            </div>

            {developers.length > 0 && (
              <div className="mt-3">
                <SectionTitle>Developers</SectionTitle>
                <div className="flex flex-wrap gap-2">
                  {developers.slice(0, 10).map((d) => <Chip key={d}>{d}</Chip>)}
                </div>
              </div>
            )}
            
            {publishers.length > 0 && (
              <div className="mt-3">
                <SectionTitle>Editoras</SectionTitle>
                <div className="flex flex-wrap gap-2">
                  {publishers.slice(0, 10).map((p) => <Chip key={p}>{p}</Chip>)}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
            <SectionTitle>Links</SectionTitle>
            <div className="space-y-2 text-sm">
              {website ? <a href={website} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-xs text-indigo-700 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-600"><Globe size={14} /> Website oficial</a> : <div className="text-xs text-slate-400">Sem website.</div>}
              {reddit ? <a href={reddit} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-xs text-indigo-700 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-600"><MessageCircle size={14} /> Reddit</a> : <div className="text-xs text-slate-400">Sem link do Reddit.</div>}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-4">
          {/* Trailer - YouTube */}
          <div className="rounded-xl border-2 border-red-500/50 bg-white dark:bg-slate-800 p-4 shadow-sm">
            <div className="mb-3 text-xs font-bold uppercase tracking-wide text-red-500 dark:text-red-400 flex items-center gap-2">
              <Youtube size={16} /> Trailer
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Vê o trailer oficial deste jogo no YouTube.
            </p>
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(title + " official trailer")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 text-sm transition-all hover:scale-105"
            >
              <Play size={16} fill="currentColor" /> Ver no YouTube <ExternalLink size={14} />
            </a>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
            <SectionTitle>Descrição</SectionTitle>
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
              {descricaoCurta ? descricaoCurta : "Sem descrição disponível na RAWG para este jogo."}
            </p>
            {safeStr(description).trim().length > 450 && (
              <button type="button" onClick={() => setDescricaoExpandida((v) => !v)} className="mt-3 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600">
                {descricaoExpandida ? "Mostrar menos" : "Ler mais"}
              </button>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
            <SectionTitle>Tags</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {tags.length ? tags.slice(0, 18).map((t) => <Chip key={t}>{t}</Chip>) : <span className="text-xs text-slate-400">Sem tags.</span>}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
            <SectionTitle>Galeria</SectionTitle>
            {screenshots.length ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {screenshots.slice(0, 9).map((shot) => (
                  <a key={shot.resized || shot.original} href={shot.original} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700" title="Abrir imagem">
                    <img src={shot.resized || shot.original} alt="Screenshot" loading="lazy" referrerPolicy="no-referrer" onError={(e) => { if (!e.currentTarget.dataset.fallback && shot.original) { e.currentTarget.dataset.fallback = "1"; e.currentTarget.src = shot.original; } }} className="h-32 w-full object-cover transition-transform group-hover:scale-[1.03]" />
                  </a>
                ))}
              </div>
            ) : <div className="text-xs text-slate-400">Sem screenshots disponíveis.</div>}
          </div>

          {/* Reviews da Comunidade - SEMPRE MOSTRA se tiver game_id */}
          {internalGameId && (
            <ReviewSection 
              gameId={internalGameId} 
              gameTitle={title}
              userRating={userCollectionData?.rating || null}
              userHoursPlayed={userCollectionData?.horas_jogadas || 0}
            />
          )}
        </div>
      </div>
    </div>
  );
}