// src/pages/ExternalGameDetailsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { rawgImage, rawgOriginal } from "../utils/rawgImages";

function formatDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString("pt-PT");
}

function Chip({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700">
      {children}
    </span>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
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

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [jogo, setJogo] = useState(null);

  const [aImportar, setAImportar] = useState(false);
  const [aWishlist, setAWishlist] = useState(false);
  const [msg, setMsg] = useState("");

  const [descricaoExpandida, setDescricaoExpandida] = useState(false);

  const [jaNaColecao, setJaNaColecao] = useState(false);
  const [jaNaWishlist, setJaNaWishlist] = useState(false);

  function showMsg(texto) {
    setMsg(texto);
    setTimeout(() => setMsg(""), 2500);
  }

  async function carregar() {
    try {
      setLoading(true);
      setErro("");

      const res = await api.get(`/external-games/${externalId}`);
      const j = res.data.jogo;
      setJogo(j);

      const extId = j?.external_id ?? j?.id ?? Number(externalId);

      Promise.allSettled([api.get("/collection"), api.get("/wishlist")]).then(
        (results) => {
          const col =
            results?.[0]?.status === "fulfilled"
              ? results[0].value?.data?.colecao || []
              : [];

          const colIds = new Set(
            col.map((x) => x.external_id).filter((x) => x != null)
          );

          const w =
            results?.[1]?.status === "fulfilled"
              ? results[1].value?.data?.wishlist ||
                results[1].value?.data?.items ||
                []
              : [];

          const wIds = new Set(
            w
              .map((x) => x.external_id ?? x?.game?.external_id ?? null)
              .filter((x) => x != null)
          );

          setJaNaColecao(colIds.has(extId));
          setJaNaWishlist(wIds.has(extId));
        }
      );
    } catch (e) {
      console.error(e);
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

  // imagens “leves”
  const cover = rawgImage(coverOriginal, {
    mode: "resize",
    width: 700,
    height: "-",
  });
  const bg = rawgImage(bgOriginal, { mode: "resize", width: 1800, height: "-" });

  // extras
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

  // screenshots com resized + original (fallback)
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

  const descricaoCurta = useMemo(() => {
    const text = safeStr(description).trim();
    if (!text) return "";
    if (descricaoExpandida) return text;
    return text.length > 450 ? text.slice(0, 450) + "…" : text;
  }, [description, descricaoExpandida]);

  const extIdFinal = jogo?.external_id ?? jogo?.id ?? Number(externalId);

  async function importarParaColecao() {
    if (!jogo) return;
    if (jaNaColecao) return;

    try {
      setAImportar(true);

      const res = await api.post("/external-games/import/collection", {
        external_id: extIdFinal,
        rating: null,
        hours_played: 0,
        status: "por_jogar",
        notes: null,
      });

      setJaNaColecao(true);
      showMsg("Adicionado à coleção ✅");

      const entryId = res.data?.collection_entry_id;
      if (entryId) navigate(`/app/jogo/${entryId}`);
    } catch (e) {
      console.error(e);
      if (e?.response?.status === 409) {
        setJaNaColecao(true);
        showMsg("Já está na tua coleção.");
      } else {
        showMsg("Falhou ao adicionar à coleção.");
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
      showMsg("Adicionado à wishlist ✅");
    } catch (e) {
      console.error(e);
      if (e?.response?.status === 409) {
        setJaNaWishlist(true);
        showMsg("Já está na tua wishlist.");
      } else {
        showMsg("Falhou ao adicionar à wishlist.");
      }
    } finally {
      setAWishlist(false);
    }
  }

  if (loading) return <div className="text-sm text-slate-500">A carregar…</div>;
  if (erro) return <div className="text-sm text-red-600">{erro}</div>;
  if (!jogo) return <div className="text-sm text-slate-500">Sem dados.</div>;

  return (
    <div className="space-y-5">
      {/* HERO: blur a partir da CAPA (sem imagem da frente) */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm h-[180px] md:h-[220px]">
        {(cover || bg) && (
          <img
            src={cover || bg}
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => {
              // fallback 1: original da capa
              const fb1 = rawgOriginal(coverOriginal);
              if (!e.currentTarget.dataset.fallback && fb1) {
                e.currentTarget.dataset.fallback = "1";
                e.currentTarget.src = fb1;
                return;
              }
              // fallback 2: bg original (se a capa não existir)
              const fb2 = rawgOriginal(bgOriginal);
              if (!e.currentTarget.dataset.fallback2 && fb2) {
                e.currentTarget.dataset.fallback2 = "1";
                e.currentTarget.src = fb2;
              }
            }}
          />
        )}

        {/* Blur + escurecer */}
        <div className="absolute inset-0 backdrop-blur-xl bg-slate-950/45" />

        <div className="relative z-10 p-5 h-full">
          <div className="flex h-full flex-col justify-between gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200 hover:bg-white"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white">
                  ←
                </span>
                Voltar
              </button>

              <h1 className="mt-3 text-2xl font-semibold text-white drop-shadow-sm truncate">
                {title}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={adicionarWishlist}
                disabled={aWishlist || jaNaWishlist}
                className={
                  "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium " +
                  (jaNaWishlist
                    ? "bg-white/60 text-slate-700 cursor-not-allowed"
                    : "bg-white text-slate-800 hover:bg-white/90") +
                  (aWishlist ? " opacity-60" : "")
                }
              >
                {jaNaWishlist ? "Já na wishlist" : aWishlist ? "A adicionar…" : "Wishlist"}
              </button>

              <button
                type="button"
                onClick={importarParaColecao}
                disabled={aImportar || jaNaColecao}
                className={
                  "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white " +
                  (jaNaColecao
                    ? "bg-white/40 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-500") +
                  (aImportar ? " opacity-60" : "")
                }
              >
                {jaNaColecao ? "Já na coleção" : aImportar ? "A adicionar…" : "Adicionar à coleção"}
              </button>
            </div>
          </div>

          {msg && (
            <div className="mt-3 rounded-lg bg-white/90 px-3 py-2 text-sm text-slate-800 shadow-sm ring-1 ring-slate-200">
              {msg}
            </div>
          )}
        </div>
      </div>
      {/* CONTEÚDO */}
      <div className="grid gap-6 md:grid-cols-[360px,1fr]">
        {/* Sidebar */}
        <div className="space-y-4">
          {/* Capa */}
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="w-full overflow-hidden rounded-lg bg-slate-200">
              {cover ? (
                <img
                  src={cover}
                  alt={title}
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-contain"
                  onError={(e) => {
                    const fallback = rawgOriginal(coverOriginal);
                    if (!e.currentTarget.dataset.fallback && fallback) {
                      e.currentTarget.dataset.fallback = "1";
                      e.currentTarget.src = fallback;
                    }
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                  Sem capa
                </div>
              )}
            </div>
          </div>

          {/* Resumo */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <SectionTitle>Resumo</SectionTitle>

            <div className="flex flex-wrap gap-2">
              {released && <Chip>Lançamento: {formatDate(released)}</Chip>}
              {playtime != null && <Chip>Tempo médio: {playtime}h</Chip>}
              {metacritic != null && <Chip>Metacritic: {metacritic}</Chip>}
              {esrb && <Chip>ESRB: {esrb}</Chip>}
            </div>

            <div className="mt-3">
              <SectionTitle>Géneros</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {generos.length ? (
                  generos.slice(0, 10).map((g) => <Chip key={g}>{g}</Chip>)
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </div>
            </div>

            <div className="mt-3">
              <SectionTitle>Plataformas</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {plataformas.length ? (
                  plataformas.slice(0, 12).map((p) => <Chip key={p}>{p}</Chip>)
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </div>
            </div>

            {developers.length > 0 && (
              <div className="mt-3">
                <SectionTitle>Developers</SectionTitle>
                <div className="flex flex-wrap gap-2">
                  {developers.slice(0, 10).map((d) => (
                    <Chip key={d}>{d}</Chip>
                  ))}
                </div>
              </div>
            )}

            {publishers.length > 0 && (
              <div className="mt-3">
                <SectionTitle>Editoras</SectionTitle>
                <div className="flex flex-wrap gap-2">
                  {publishers.slice(0, 10).map((p) => (
                    <Chip key={p}>{p}</Chip>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Links */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <SectionTitle>Links</SectionTitle>
            <div className="space-y-2 text-sm">
              {website ? (
                <a
                  href={website}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-indigo-700 hover:bg-slate-50"
                >
                  🌐 Website oficial
                </a>
              ) : (
                <div className="text-xs text-slate-400">Sem website.</div>
              )}

              {reddit ? (
                <a
                  href={reddit}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-indigo-700 hover:bg-slate-50"
                >
                  💬 Reddit
                </a>
              ) : (
                <div className="text-xs text-slate-400">Sem link do Reddit.</div>
              )}
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="space-y-4">
          {/* Descrição */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <SectionTitle>Descrição</SectionTitle>

            <p className="text-sm text-slate-700 whitespace-pre-line">
              {descricaoCurta
                ? descricaoCurta
                : "Sem descrição disponível na RAWG para este jogo."}
            </p>

            {safeStr(description).trim().length > 450 && (
              <button
                type="button"
                onClick={() => setDescricaoExpandida((v) => !v)}
                className="mt-3 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                {descricaoExpandida ? "Mostrar menos" : "Ler mais"}
              </button>
            )}
          </div>

          {/* Tags */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <SectionTitle>Tags</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {tags.length ? (
                tags.slice(0, 18).map((t) => <Chip key={t}>{t}</Chip>)
              ) : (
                <span className="text-xs text-slate-400">Sem tags.</span>
              )}
            </div>
          </div>

          {/* Galeria */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <SectionTitle>Galeria</SectionTitle>

            {screenshots.length ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {screenshots.slice(0, 9).map((shot) => (
                  <a
                    key={shot.resized || shot.original}
                    href={shot.original}
                    target="_blank"
                    rel="noreferrer"
                    className="group block overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                    title="Abrir imagem"
                  >
                    <img
                      src={shot.resized || shot.original}
                      alt="Screenshot"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        if (!e.currentTarget.dataset.fallback && shot.original) {
                          e.currentTarget.dataset.fallback = "1";
                          e.currentTarget.src = shot.original;
                        }
                      }}
                      className="h-32 w-full object-cover transition-transform group-hover:scale-[1.03]"
                    />
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400">
                Sem screenshots disponíveis.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
