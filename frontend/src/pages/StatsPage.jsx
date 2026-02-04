// src/pages/StatsPage.jsx
import { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { 
  Gamepad2, 
  Clock, 
  Trophy, 
  Target, 
  BarChart3,
  PieChart as PieChartIcon
} from "lucide-react";

const CORES_ESTADO = ["#D946EF", "#22D3EE", "#4ADE80", "#FACC15"];
const CORES_GENERO = ["#D946EF", "#22D3EE", "#4ADE80", "#FACC15", "#F472B6", "#2DD4BF"];
const CORES_PLATAFORMA = ["#22D3EE", "#D946EF", "#FACC15", "#4ADE80", "#F87171"];

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

function StatCard({ titulo, valor, sufixo = "", IconComponent, cor }) {
  const colors = {
    fuchsia: { border: "border-fuchsia-500", shadow: "shadow-[4px_4px_0px_0px_rgba(217,70,239,0.5)]", text: "text-fuchsia-600 dark:text-fuchsia-400" },
    cyan: { border: "border-cyan-400", shadow: "shadow-[4px_4px_0px_0px_rgba(34,211,238,0.5)]", text: "text-cyan-600 dark:text-cyan-400" },
    yellow: { border: "border-yellow-400", shadow: "shadow-[4px_4px_0px_0px_rgba(250,204,21,0.5)]", text: "text-yellow-600 dark:text-yellow-400" },
    green: { border: "border-green-400", shadow: "shadow-[4px_4px_0px_0px_rgba(74,222,128,0.5)]", text: "text-green-600 dark:text-green-400" },
  };
  
  const style = colors[cor] || colors.fuchsia;

  return (
    <div className={`relative overflow-hidden bg-white dark:bg-slate-900 border-2 ${style.border} ${style.shadow} p-3 sm:p-5 transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none`}>
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide mb-1">{titulo}</p>
          <span className={`text-xl sm:text-3xl font-black ${style.text}`}>
            {valor}{sufixo}
          </span>
        </div>
        <IconComponent size={24} className={`${style.text} sm:w-8 sm:h-8`} />
      </div>
    </div>
  );
}

function mapEstadoLabel(estado) {
  switch (estado) {
    case "por_jogar": return "Por jogar";
    case "a_jogar": return "A jogar";
    case "em_pausa": return "Em Pausa";
    case "concluido": return "Concluído";
    case "abandonado": return "Abandonado";
    default: return estado || "—";
  }
}

export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelado = false;
    async function carregarStats() {
      try {
        if (cancelado) return;
        setErro("");
        setLoading(true);
        const res = await api.get("/stats");
        if (!cancelado) setStats(res.data);
      } catch (err) {
        console.error(err);
        if (!cancelado) setErro(err?.response?.data?.mensagem || "Não foi possível carregar as estatísticas.");
      } finally {
        if (!cancelado) setLoading(false);
      }
    }
    carregarStats();
    return () => { cancelado = true; };
  }, []);

  const totalJogos = stats?.total_jogos ?? 0;
  const totalHoras = stats?.total_horas_jogadas ?? 0;
  const taxaConclusao = stats?.taxa_conclusao_percent ?? 0;
  const jogosPorEstado = stats?.jogos_por_estado || {};
  const jogosPorGenero = stats?.jogos_por_genero || {};
  const jogosPorPlataforma = stats?.jogos_por_plataforma || {};

  const dataEstado = useMemo(() => Object.entries(jogosPorEstado).map(([estado, valor]) => ({ estado: mapEstadoLabel(estado), quantidade: valor })), [jogosPorEstado]);
  const dataGenero = useMemo(() => Object.entries(jogosPorGenero).map(([genero, valor]) => ({ nome: genero, quantidade: valor })), [jogosPorGenero]);
  const dataPlataforma = useMemo(() => Object.entries(jogosPorPlataforma).map(([plat, valor]) => ({ nome: plat, quantidade: valor })), [jogosPorPlataforma]);

  return (
    <div className="space-y-6">
      {/* Header Retro */}
      <RetroCard color="fuchsia" className="p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(217,70,239,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(217,70,239,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
        <div className="relative">
          <div className="flex items-center gap-2 text-fuchsia-600 dark:text-fuchsia-400 text-xs sm:text-sm font-bold uppercase tracking-widest mb-2">
            <span className="inline-block w-2 h-2 sm:w-3 sm:h-3 bg-fuchsia-500 animate-pulse" />
            Análise
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 sm:gap-3">
            <BarChart3 size={24} className="sm:w-7 sm:h-7" /> Estatísticas da coleção
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Visão geral da tua biblioteca de jogos.
          </p>
        </div>
      </RetroCard>

      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="animate-pulse border-2 border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 h-24" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2].map((i) => <div key={i} className="animate-pulse border-2 border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 h-80" />)}
          </div>
        </div>
      )}

      {erro && !loading && (
        <div className="flex items-center justify-center py-8 text-rose-500 border-2 border-rose-500/50 bg-rose-50 dark:bg-rose-500/10">
          <span className="mr-2">⚠️</span> {erro}
        </div>
      )}

      {!loading && !erro && (
        <>
          {/* KPIs principais */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <StatCard titulo="Total de jogos" valor={totalJogos} IconComponent={Gamepad2} cor="cyan" />
            <StatCard titulo="Horas jogadas" valor={totalHoras} sufixo="h" IconComponent={Clock} cor="green" />
            <StatCard titulo="Taxa de conclusão" valor={taxaConclusao} sufixo="%" IconComponent={Trophy} cor="yellow" />
            <StatCard titulo="Em progresso" valor={jogosPorEstado?.a_jogar ?? 0} IconComponent={Target} cor="fuchsia" />
          </section>

          {/* Gráfico de barras: jogos por estado */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 items-stretch">
            <RetroCard color="cyan" className="p-3 sm:p-5">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 size={18} className="text-cyan-500" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Jogos por estado</h3>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 mb-3 sm:mb-4">Distribuição dos jogos por estado.</p>
              {dataEstado.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-36 sm:h-48 text-slate-400"><span className="text-3xl sm:text-4xl mb-2">📭</span><p className="text-xs sm:text-sm">Ainda não há dados suficientes</p></div>
              ) : (
                <div className="w-full h-48 sm:h-64">
                  <ResponsiveContainer>
                    <BarChart data={dataEstado}>
                      <XAxis dataKey="estado" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 0, border: '2px solid #22d3ee', backgroundColor: '#0f172a', color: '#fff' }} />
                      <Bar dataKey="quantidade" radius={0}>
                        {dataEstado.map((_, index) => <Cell key={`cell-estado-${index}`} fill={CORES_ESTADO[index % CORES_ESTADO.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </RetroCard>

            {/* Pizza: jogos por género */}
            <RetroCard color="fuchsia" className="p-3 sm:p-5">
              <div className="flex items-center gap-2 mb-2">
                <PieChartIcon size={18} className="text-fuchsia-500" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Jogos por género</h3>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 mb-3 sm:mb-4">Distribuição por tipo de jogo.</p>
              {dataGenero.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-36 sm:h-48 text-slate-400"><span className="text-3xl sm:text-4xl mb-2">📭</span><p className="text-xs sm:text-sm">Ainda não há dados suficientes</p></div>
              ) : (
                <div className="w-full h-48 sm:h-64">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={dataGenero} dataKey="quantidade" nameKey="nome" outerRadius={60} innerRadius={35} paddingAngle={3} stroke="none">
                        {dataGenero.map((_, index) => <Cell key={`cell-genero-${index}`} fill={CORES_GENERO[index % CORES_GENERO.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 0, border: '2px solid #d946ef', backgroundColor: '#0f172a', color: '#fff' }} />
                      <Legend layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </RetroCard>
          </section>

          {/* Gráfico barras horizontais: jogos por plataforma */}
          <RetroCard color="yellow" className="p-3 sm:p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg sm:text-xl">🖥️</span>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Jogos por plataforma</h3>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 mb-3 sm:mb-4">Em que plataformas tens mais jogos.</p>
            {dataPlataforma.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-36 sm:h-48 text-slate-400"><span className="text-3xl sm:text-4xl mb-2">📭</span><p className="text-xs sm:text-sm">Ainda não há dados suficientes</p></div>
            ) : (
              <div className="w-full h-56 sm:h-72">
                <ResponsiveContainer>
                  <BarChart data={dataPlataforma} layout="vertical" margin={{ left: 40, right: 10 }}>
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="nome" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={35} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 0, border: '2px solid #facc15', backgroundColor: '#0f172a', color: '#fff' }} />
                    <Bar dataKey="quantidade" radius={0}>
                      {dataPlataforma.map((_, index) => <Cell key={`cell-plat-${index}`} fill={CORES_PLATAFORMA[index % CORES_PLATAFORMA.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </RetroCard>
        </>
      )}
    </div>
  );
}