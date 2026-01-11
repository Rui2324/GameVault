// src/pages/GameDetailsPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  const [msg, setMsg] = useState({ type: "", text: "" });

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

  // Ctrl+S para guardar
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

  function limparMsgDepois() {
    // limpa passado 3s
    setTimeout(() => {
      setMsg((m) => (m.text ? { type: "", text: "" } : m));
    }, 3000);
  }

  async function handleGuardar(e) {
    if (e?.preventDefault) e.preventDefault();
    setMsg({ type: "", text: "" });

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

      setMsg({ type: "success", text: "Guardado ✅" });
      limparMsgDepois();
    } catch (err) {
      console.error(err);
      setMsg({ type: "error", text: "Falhou ao guardar. Vê a consola/network." });
      limparMsgDepois();
    } finally {
      setAGravar(false);
    }
  }

  async function handleRemover() {
    const ok = window.confirm("Queres mesmo remover este jogo da tua coleção?");
    if (!ok) return;

    try {
      await api.delete(`/collection/${id}`);
      navigate("/app/colecao");
    } catch (err) {
      console.error(err);
      setMsg({ type: "error", text: "Falhou ao remover o jogo." });
      limparMsgDepois();
    }
  }

  if (loading) {
    return <div className="text-sm text-slate-500">A carregar detalhes...</div>;
  }

  if (erro) {
    return <div className="text-sm text-red-600">{erro}</div>;
  }

  if (!entrada) {
    return (
      <div className="text-sm text-slate-500">
        Jogo não encontrado na tua coleção.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Topo */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-2 inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
          >
            ◀ Voltar
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-slate-900">{entrada.titulo}</h1>
            <EstadoBadge estado={entrada.estado} />
            <RatingChip rating={entrada.rating} />
            <span className="text-[11px] text-slate-500">
              {safeNum(entrada.horas_jogadas, 0)}h jogadas
            </span>

            {temAlteracoes && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 border border-amber-200">
                ● alterações por guardar
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Dica: <span className="font-medium">Ctrl+S</span> para guardar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRemover}
            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100"
          >
            Remover da coleção
          </button>
        </div>
      </div>

      {/* Msg */}
      {msg.text && (
        <div
          className={
            "rounded-lg border px-3 py-2 text-sm " +
            (msg.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-700")
          }
        >
          {msg.text}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[260px,1fr]">
        {/* Capa */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-slate-200">
            {capa ? (
              <img src={capa} alt={entrada.titulo} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                Sem capa
              </div>
            )}
          </div>

          <div className="mt-3 text-xs text-slate-600 space-y-1">
            <div>
              <span className="text-slate-400">Plataforma:</span>{" "}
              {entrada.plataforma || "—"}
            </div>
            <div>
              <span className="text-slate-400">Género:</span> {entrada.genero || "—"}
            </div>
            <div>
              <span className="text-slate-400">Criado em:</span>{" "}
              {toDateTimePT(entrada.criado_em)}
            </div>
            <div>
              <span className="text-slate-400">Atualizado em:</span>{" "}
              {toDateTimePT(entrada.atualizado_em)}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Form */}
          <form
            onSubmit={handleGuardar}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900">
                Atualizar progresso e notas
              </h2>

              <button
                type="submit"
                disabled={aGravar || !temAlteracoes}
                className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {aGravar ? "A guardar..." : "Guardar"}
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Rating (0 a 10)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={form.rating}
                  onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex.: 8.5"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Horas jogadas
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.horas_jogadas}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, horas_jogadas: e.target.value }))
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex.: 42"
                />

                {/* Botões rápidos */}
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setHorasDelta(0.5)}
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-50"
                  >
                    +0.5h
                  </button>
                  <button
                    type="button"
                    onClick={() => setHorasDelta(1)}
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-50"
                  >
                    +1h
                  </button>
                  <button
                    type="button"
                    onClick={() => setHorasDelta(2)}
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-50"
                  >
                    +2h
                  </button>
                  <button
                    type="button"
                    onClick={() => setHorasDelta(5)}
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-50"
                  >
                    +5h
                  </button>
                  <button
                    type="button"
                    onClick={resetHoras}
                    className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] text-rose-700 hover:bg-rose-100"
                  >
                    Repor
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Estado</label>
                <select
                  value={form.estado}
                  onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="por_jogar">Por jogar</option>
                  <option value="a_jogar">A jogar</option>
                  <option value="concluido">Concluído</option>
                  <option value="abandonado">Abandonado</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Notas pessoais / análise do jogo
              </label>
              <textarea
                rows={5}
                value={form.notas}
                onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="O que achaste do jogo? O que gostaste mais, pontos fracos, etc."
              />
            </div>
          </form>

          {/* Descrição */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-1.5">
              Descrição do jogo
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-line">
              {entrada.descricao && String(entrada.descricao).trim().length > 0
                ? entrada.descricao
                : "Sem descrição disponível. Este campo poderá ser preenchido a partir da API de jogos no futuro."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
