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
      {/* Cabeçalho */}
      <section>
        <h2 className="text-xl font-semibold text-slate-900">
          Estatísticas da coleção
        </h2>
        <p className="text-sm text-slate-600">
          Visão geral da tua biblioteca de jogos: distribuição por estado, género e plataforma.
        </p>
      </section>

      {loading && (
        <p className="text-sm text-slate-600">A carregar estatísticas...</p>
      )}

      {erro && !loading && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">
          {erro}
        </p>
      )}

      {!loading && !erro && (
        <>
          {/* KPIs principais */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card titulo="Total de jogos">
              <span className="text-2xl font-semibold text-slate-900">
                {totalJogos}
              </span>
            </Card>
            <Card titulo="Horas jogadas (total)">
              <span className="text-2xl font-semibold text-slate-900">
                {totalHoras}
              </span>
            </Card>
            <Card titulo="Taxa de conclusão">
              <span className="text-2xl font-semibold text-slate-900">
                {taxaConclusao}%
              </span>
            </Card>
            <Card titulo="Jogos em progresso">
              <span className="text-2xl font-semibold text-slate-900">
                {jogosPorEstado?.a_jogar ?? 0}
              </span>
            </Card>
          </section>

          {/* Gráfico de barras: jogos por estado */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
            <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">
                Jogos por estado
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Distribuição dos jogos que estão por jogar, em progresso, concluídos ou abandonados.
              </p>
              {dataEstado.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Ainda não há dados suficientes para este gráfico.
                </p>
              ) : (
                <div className="w-full h-64">
                  <ResponsiveContainer>
                    <BarChart data={dataEstado}>
                      <XAxis
                        dataKey="estado"
                        tick={{ fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          fontSize: 12,
                          borderRadius: 8,
                        }}
                      />
                      <Bar dataKey="quantidade" radius={[6, 6, 0, 0]}>
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
            <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">
                Jogos por género
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Que tipos de jogos jogas mais? RPG, ação, estratégia... vê a distribuição aqui.
              </p>
              {dataGenero.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Ainda não há dados suficientes para este gráfico.
                </p>
              ) : (
                <div className="w-full h-64">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={dataGenero}
                        dataKey="quantidade"
                        nameKey="nome"
                        outerRadius={80}
                        innerRadius={40}
                        paddingAngle={2}
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
                          borderRadius: 8,
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
          <section className="rounded-xl bg-white border border-slate-200 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">
              Jogos por plataforma
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Em que plataformas tens mais jogos registados (PC, PS5, Switch, etc.).
            </p>
            {dataPlataforma.length === 0 ? (
              <p className="text-xs text-slate-500">
                Ainda não há dados suficientes para este gráfico.
              </p>
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
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="nome"
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                      }}
                    />
                    <Bar dataKey="quantidade" radius={[0, 6, 6, 0]}>
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

function Card({ titulo, children }) {
  return (
    <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-4">
      <p className="text-xs text-slate-500 mb-1">{titulo}</p>
      {children}
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
