import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import ReviewSection from "../components/ReviewSection";
import { useToast } from "../components/Toast";
import { Clock, Gamepad2, Check, X, FileText, Star, Trash2, Lightbulb, Target, Tag, Calendar, BarChart3, Save, RotateCcw, BookOpen } from "lucide-react";

function EstadoBadge({ estado }) {
  if (!estado) return null;

  const map = {
    por_jogar: {
      label: "Por jogar",
      icon: Clock,
      classes: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600",
    },
    a_jogar: {
      label: "A jogar",
      icon: Gamepad2,
      classes: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-700",
    },
    em_pausa: {
      label: "Em Pausa",
      icon: Clock,
      classes: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
    },
    concluido: {
      label: "Concluído",
      icon: Check,
      classes: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
    },
    abandonado: {
      label: "Abandonado",
      icon: X,
      classes: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700",
    },
  };

  const cfg = map[estado] || {
    label: estado,
    icon: FileText,
    classes: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600",
  };

  const IconComponent = cfg.icon;
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm " +
        cfg.classes
      }
    >
      <IconComponent size={12} /> {cfg.label}
    </span>
  );
}

function RatingChip({ rating }) {
  if (rating == null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-1 text-xs text-slate-500 dark:text-slate-400 shadow-sm">
        <Star size={12} /> Sem rating
      </span>
    );
  }

  const valor = Number(rating);
  let cor = "bg-gradient-to-r from-emerald-400 to-teal-400 text-white shadow-emerald-500/25";
  if (valor <= 4) cor = "bg-gradient-to-r from-rose-400 to-pink-400 text-white shadow-rose-500/25";
  else if (valor <= 7) cor = "bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-amber-500/25";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold shadow-lg ${cor}`}
    >
      <Star size={12} fill="currentColor" /> {valor.toFixed(1)}/10
    </span>
  );
}

function toDateTimePT(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString("pt-PT");
}

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export default function GameDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [entrada, setEntrada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [form, setForm] = useState({
    rating: "",
    horas_jogadas: "",
    estado: "por_jogar",
    notas: "",
  });

  const [aGravar, setAGravar] = useState(false);

  const fetchDetalhes = useCallback(async () => {
    try {
      setErro("");
      setLoading(true);

      const res = await api.get(`/collection/${id}`);
      const ent = res.data.entrada;

      setEntrada(ent);

      setForm({
        rating:
          ent.rating === null || ent.rating === undefined ? "" : String(ent.rating),
        horas_jogadas:
          ent.horas_jogadas === null || ent.horas_jogadas === undefined
            ? ""
            : String(ent.horas_jogadas),
        estado: ent.estado || "por_jogar",
        notas: ent.notas || "",
      });
    } catch (err) {
      console.error(err);
      setErro("Erro ao carregar os detalhes do jogo.");
      setEntrada(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetalhes();
  }, [fetchDetalhes]);

  useEffect(() => {
    const onKey = (e) => {
      const isSave =
        (e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S");
      if (!isSave) return;
      e.preventDefault();
      // só tenta guardar se houver alterações e não estiver a gravar
      if (temAlteracoes && !aGravar) handleGuardar();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aGravar, form, entrada]);

  const capa = entrada?.url_capa || entrada?.cover_url || entrada?.capa_url || null;

  const temAlteracoes = useMemo(() => {
    if (!entrada) return false;

    const r0 =
      entrada.rating === null || entrada.rating === undefined
        ? ""
        : String(entrada.rating);
    const h0 =
      entrada.horas_jogadas === null || entrada.horas_jogadas === undefined
        ? ""
        : String(entrada.horas_jogadas);
    const e0 = entrada.estado || "por_jogar";
    const n0 = entrada.notas || "";

    return (
      String(form.rating) !== r0 ||
      String(form.horas_jogadas) !== h0 ||
      String(form.estado) !== e0 ||
      String(form.notas) !== n0
    );
  }, [entrada, form]);

  function setHorasDelta(delta) {
    setForm((f) => {
      const atual = safeNum(f.horas_jogadas, 0);
      const novo = Math.max(0, Math.round((atual + delta) * 10) / 10); // 1 casa
      return { ...f, horas_jogadas: String(novo) };
    });
  }

  function resetHoras() {
    setForm((f) => ({ ...f, horas_jogadas: "0" }));
  }

  async function handleGuardar(e) {
    if (e?.preventDefault) e.preventDefault();

    if (!entrada) return;

    setAGravar(true);

    try {
      const payload = {
        rating: form.rating === "" || form.rating === null ? null : Number(form.rating),
        horas_jogadas:
          form.horas_jogadas === "" || form.horas_jogadas === null
            ? 0
            : Number(form.horas_jogadas),
        estado: form.estado,
        notas: form.notas,
      };

      await api.put(`/collection/${id}`, payload);

      // refresca para trazer updated_at real + garantir campos completos
      await fetchDetalhes();

      toast.success("Progresso guardado com sucesso!", {
        title: "Guardado! 💾",
      });
    } catch (err) {
      console.error(err);
      toast.error("Falhou ao guardar. Tenta novamente.", {
        title: "Erro ao guardar",
      });
    } finally {
      setAGravar(false);
    }
  }

  async function handleRemover() {
    const ok = window.confirm("Queres mesmo remover este jogo da tua coleção?");
    if (!ok) return;

    try {
      await api.delete(`/collection/${id}`);
      toast.success("Jogo removido da coleção.", {
        title: "Removido! 🗑️",
      });
      navigate("/app/colecao");
    } catch (err) {
      console.error(err);
      toast.error("Falhou ao remover o jogo.", {
        title: "Erro",
      });
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton Header */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 skeleton rounded-lg"></div>
          <div className="flex-1 space-y-2">
            <div className="h-8 skeleton rounded-lg w-1/3"></div>
            <div className="h-4 skeleton rounded-lg w-1/4"></div>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-[260px,1fr]">
          {/* Skeleton Cover */}
          <div className="rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-4">
            <div className="aspect-[3/4] skeleton rounded-xl"></div>
            <div className="mt-4 space-y-2">
              <div className="h-3 skeleton rounded w-2/3"></div>
              <div className="h-3 skeleton rounded w-1/2"></div>
              <div className="h-3 skeleton rounded w-3/4"></div>
            </div>
          </div>
          
          {/* Skeleton Content */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6">
              <div className="h-6 skeleton rounded-lg w-1/4 mb-4"></div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="h-10 skeleton rounded-lg"></div>
                <div className="h-10 skeleton rounded-lg"></div>
                <div className="h-10 skeleton rounded-lg"></div>
              </div>
              <div className="h-32 skeleton rounded-lg mt-4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="rounded-2xl border border-rose-200/50 dark:border-rose-700/50 bg-rose-50/80 dark:bg-rose-900/20 backdrop-blur-sm p-6 text-center">
        <span className="text-4xl mb-3 block">😕</span>
        <p className="text-rose-700 dark:text-rose-400 font-medium">{erro}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-medium transition"
        >
          Voltar
        </button>
      </div>
    );
  }

  if (!entrada) {
    return (
      <div className="text-sm text-slate-500 dark:text-slate-400">
        Jogo não encontrado na tua coleção.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header com Banner */}
      <div className="relative rounded-2xl overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 animate-gradient opacity-90"></div>
        {/* Overlay com imagem */}
        {capa && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-overlay"
            style={{ backgroundImage: `url(${capa})` }}
          ></div>
        )}
        
        <div className="relative z-10 p-6 md:p-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center gap-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 px-3 py-1.5 text-sm text-white hover:bg-white/30 transition-all duration-300"
          >
            <span>←</span> Voltar
          </button>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 drop-shadow-lg">{entrada.titulo}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <EstadoBadge estado={entrada.estado} />
                <RatingChip rating={entrada.rating} />
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white border border-white/30">
                  <Clock size={12} /> {safeNum(entrada.horas_jogadas, 0)}h jogadas
                </span>

                {temAlteracoes && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/90 px-3 py-1 text-xs font-semibold text-white shadow-lg animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                    Alterações por guardar
                  </span>
                )}
              </div>

              <p className="mt-3 text-sm text-white/80">
                <Lightbulb size={14} className="inline mb-0.5" /> Dica: <span className="font-medium">Ctrl+S</span> para guardar rapidamente.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRemover}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-500/90 hover:bg-rose-600 backdrop-blur-sm px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:scale-105"
            >
              <Trash2 size={16} /> Remover da coleção
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[280px,1fr]">
        {/* Capa */}
        <div className="card-3d rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-4 shadow-lg">
          <div className="aspect-[3/4] w-full overflow-hidden rounded-xl bg-slate-200 dark:bg-slate-700 shadow-lg group">
            {capa ? (
              <img 
                src={capa} 
                alt={entrada.titulo} 
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center text-slate-500 dark:text-slate-400 bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                <Gamepad2 size={48} className="mb-2" />
                <span className="text-xs">Sem capa</span>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50">
              <Target size={16} className="text-indigo-600 dark:text-indigo-400" />
              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide">Plataforma</p>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{entrada.plataforma || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50">
              <Tag size={16} className="text-purple-600 dark:text-purple-400" />
              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide">Género</p>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{entrada.genero || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50">
              <Calendar size={16} className="text-teal-600 dark:text-teal-400" />
              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide">Adicionado em</p>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{toDateTimePT(entrada.criado_em)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50">
              <span className="text-base">🔄</span>
              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide">Última atualização</p>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{toDateTimePT(entrada.atualizado_em)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {/* Form */}
          <form
            onSubmit={handleGuardar}
            className="rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 shadow-lg space-y-5"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-sm shadow-md"><BarChart3 size={16} className="text-white" /></span>
                Atualizar progresso
              </h2>

              <button
                type="submit"
                disabled={aGravar || !temAlteracoes}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {aGravar ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    A guardar...
                  </>
                ) : (
                  <>
                    <Save size={16} /> Guardar
                  </>
                )}
              </button>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Star size={14} /> Rating (0 a 10)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={form.rating}
                  onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200/50 dark:border-slate-600/50 bg-white/50 dark:bg-slate-700/50 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Ex.: 8.5"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock size={14} /> Horas jogadas
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.horas_jogadas}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, horas_jogadas: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200/50 dark:border-slate-600/50 bg-white/50 dark:bg-slate-700/50 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Ex.: 42"
                />

                {/* Botões rápidos */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[0.5, 1, 2, 5].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHorasDelta(h)}
                      className="rounded-lg bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200/50 dark:border-indigo-700/50 px-2.5 py-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all"
                    >
                      +{h}h
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={resetHoras}
                    className="rounded-lg bg-rose-50 dark:bg-rose-900/30 border border-rose-200/50 dark:border-rose-700/50 px-2.5 py-1 text-[11px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all flex items-center gap-1"
                  >
                    <RotateCcw size={10} /> Repor
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileText size={14} /> Estado
                </label>
                <select
                  value={form.estado}
                  onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200/50 dark:border-slate-600/50 bg-white/50 dark:bg-slate-700/50 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
                >
                  <option value="por_jogar">Por jogar</option>
                  <option value="a_jogar">A jogar</option>
                  <option value="em_pausa">Em Pausa</option>
                  <option value="concluido">Concluído</option>
                  <option value="abandonado">Abandonado</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText size={14} /> Notas pessoais / análise do jogo
              </label>
              <textarea
                rows={5}
                value={form.notas}
                onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
                className="w-full rounded-xl border border-slate-200/50 dark:border-slate-600/50 bg-white/50 dark:bg-slate-700/50 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                placeholder="O que achaste do jogo? O que gostaste mais, pontos fracos, etc."
              />
            </div>
          </form>

          {/* Descrição */}
          <div className="rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 shadow-lg">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-sm shadow-md"><BookOpen size={16} className="text-white" /></span>
              Descrição do jogo
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">
              {entrada.descricao && String(entrada.descricao).trim().length > 0
                ? entrada.descricao
                : "Sem descrição disponível. Este campo poderá ser preenchido a partir da API de jogos no futuro."}
            </p>
          </div>

          {/* Reviews da Comunidade */}
          {entrada.game_id && (
            <ReviewSection 
              gameId={entrada.game_id} 
              gameTitle={entrada.titulo}
              userRating={entrada.rating}
              userHoursPlayed={entrada.horas_jogadas}
            />
          )}
        </div>
      </div>
    </div>
  );
}
