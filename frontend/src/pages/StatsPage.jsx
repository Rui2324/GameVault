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

const CORES_ESTADO = ["#4F46E5", "#0EA5E9", "#22C55E", "#F97316"];
const CORES_GENERO = ["#6366F1", "#EC4899", "#10B981", "#F59E0B", "#8B5CF6", "#14B8A6"];
const CORES_PLATAFORMA = ["#2563EB", "#7C3AED", "#F97316", "#0D9488", "#DC2626"];

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
        if (!cancelado) {
          setStats(res.data);
        }
      } catch (err) {
        console.error(err);
        if (!cancelado) {
          setErro(
            err?.response?.data?.mensagem ||
              "Não foi possível carregar as estatísticas."
          );
        }
      } finally {
        if (!cancelado) {
          setLoading(false);
        }
      }
    }

    carregarStats();

    return () => {
      cancelado = true;
    };
  }, []);

  const totalJogos = stats?.total_jogos ?? 0;
  const totalHoras = stats?.total_horas_jogadas ?? 0;
  const taxaConclusao = stats?.taxa_conclusao_percent ?? 0;
  const jogosPorEstado = stats?.jogos_por_estado || {};
  const jogosPorGenero = stats?.jogos_por_genero || {};
  const jogosPorPlataforma = stats?.jogos_por_plataforma || {};

  // dados para os gráficos
  const dataEstado = useMemo(
    () =>
      Object.entries(jogosPorEstado).map(([estado, valor]) => ({
        estado: mapEstadoLabel(estado),
        quantidade: valor,
      })),
    [jogosPorEstado]
  );

  const dataGenero = useMemo(
    () =>
      Object.entries(jogosPorGenero).map(([genero, valor]) => ({
        nome: genero,
        quantidade: valor,
      })),
    [jogosPorGenero]
  );

  const dataPlataforma = useMemo(
    () =>
      Object.entries(jogosPorPlataforma).map(([plat, valor]) => ({
        nome: plat,
        quantidade: valor,
      })),
    [jogosPorPlataforma]
  );

  return (
    <div className="space-y-6">
      {/* Header com gradiente */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-6 shadow-xl">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        
        <div className="relative">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">📊</span>
            Estatísticas da coleção
          </h2>
          <p className="text-purple-100 text-sm mt-1">
            Visão geral da tua biblioteca de jogos: distribuição por estado, género e plataforma.
          </p>
        </div>
      </section>

      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800 h-24" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800 h-80" />
            ))}
          </div>
        </div>
      )}

      {erro && !loading && (
        <div className="flex items-center justify-center py-8 text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800">
          <span className="mr-2">⚠️</span> {erro}
        </div>
      )}

      {!loading && !erro && (
        <>
          {/* KPIs principais */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              titulo="Total de jogos" 
              valor={totalJogos} 
              icone="🎮"
              cor="from-blue-500 to-cyan-500"
            />
            <StatCard 
              titulo="Horas jogadas" 
              valor={totalHoras}
              sufixo="h"
              icone="⏱️"
              cor="from-emerald-500 to-teal-500"
            />
            <StatCard 
              titulo="Taxa de conclusão" 
              valor={taxaConclusao}
              sufixo="%"
              icone="🏆"
              cor="from-amber-500 to-orange-500"
            />
            <StatCard 
              titulo="Em progresso" 
              valor={jogosPorEstado?.a_jogar ?? 0}
              icone="🎯"
              cor="from-pink-500 to-rose-500"
            />
          </section>

          {/* Gráfico de barras: jogos por estado */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
            <div className="rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">📈</span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Jogos por estado
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Distribuição dos jogos que estão por jogar, em progresso, concluídos ou abandonados.
              </p>
              {dataEstado.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500 dark:text-slate-400">
                  <span className="text-4xl mb-2">📭</span>
                  <p className="text-sm">Ainda não há dados suficientes</p>
                </div>
              ) : (
                <div className="w-full h-64">
                  <ResponsiveContainer>
                    <BarChart data={dataEstado}>
                      <XAxis
                        dataKey="estado"
                        tick={{ fontSize: 11, fill: 'currentColor' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: 'currentColor' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          fontSize: 12,
                          borderRadius: 12,
                          border: 'none',
                          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                        }}
                      />
                      <Bar dataKey="quantidade" radius={[8, 8, 0, 0]}>
                        {dataEstado.map((_, index) => (
                          <Cell
                            key={`cell-estado-${index}`}
                            fill={CORES_ESTADO[index % CORES_ESTADO.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Pizza: jogos por género */}
            <div className="rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🥧</span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Jogos por género
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Que tipos de jogos jogas mais? RPG, ação, estratégia... vê a distribuição aqui.
              </p>
              {dataGenero.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500 dark:text-slate-400">
                  <span className="text-4xl mb-2">📭</span>
                  <p className="text-sm">Ainda não há dados suficientes</p>
                </div>
              ) : (
                <div className="w-full h-64">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={dataGenero}
                        dataKey="quantidade"
                        nameKey="nome"
                        outerRadius={80}
                        innerRadius={45}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {dataGenero.map((_, index) => (
                          <Cell
                            key={`cell-genero-${index}`}
                            fill={CORES_GENERO[index % CORES_GENERO.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          fontSize: 12,
                          borderRadius: 12,
                          border: 'none',
                          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                        }}
                      />
                      <Legend
                        layout="vertical"
                        align="right"
                        verticalAlign="middle"
                        wrapperStyle={{ fontSize: 11 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </section>

          {/* Gráfico barras horizontais: jogos por plataforma */}
          <section className="rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🖥️</span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Jogos por plataforma
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Em que plataformas tens mais jogos registados (PC, PS5, Switch, etc.).
            </p>
            {dataPlataforma.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-500 dark:text-slate-400">
                <span className="text-4xl mb-2">📭</span>
                <p className="text-sm">Ainda não há dados suficientes</p>
              </div>
            ) : (
              <div className="w-full h-72">
                <ResponsiveContainer>
                  <BarChart
                    data={dataPlataforma}
                    layout="vertical"
                    margin={{ left: 50, right: 20 }}
                  >
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: 'currentColor' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="nome"
                      tick={{ fontSize: 11, fill: 'currentColor' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 12,
                        border: 'none',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                      }}
                    />
                    <Bar dataKey="quantidade" radius={[0, 8, 8, 0]}>
                      {dataPlataforma.map((_, index) => (
                        <Cell
                          key={`cell-plat-${index}`}
                          fill={
                            CORES_PLATAFORMA[index % CORES_PLATAFORMA.length]
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({ titulo, valor, sufixo = "", icone, cor }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl p-5 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
      {/* Background gradient accent */}
      <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${cor} opacity-20 rounded-full blur-2xl`} />
      
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">{titulo}</p>
          <span className={`text-3xl font-bold bg-gradient-to-r ${cor} bg-clip-text text-transparent`}>
            {valor}{sufixo}
          </span>
        </div>
        <div className="text-3xl">{icone}</div>
      </div>
    </div>
  );
}

function mapEstadoLabel(estado) {
  switch (estado) {
    case "por_jogar":
      return "Por jogar";
    case "a_jogar":
      return "A jogar";
    case "concluido":
      return "Concluído";
    case "abandonado":
      return "Abandonado";
    default:
      return estado || "—";
  }
}
