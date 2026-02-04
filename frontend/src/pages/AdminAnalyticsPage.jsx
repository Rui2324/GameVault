// src/pages/AdminAnalyticsPage.jsx
import { useEffect, useState } from "react";
import { TrendingUp, Users, Gamepad2, MessageSquare, Award, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from "../services/api";
import { useToast } from "../components/Toast";

const COLORS = ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

export default function AdminAnalyticsPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      setLoading(true);
      const res = await api.get("/admin/analytics");
      setAnalytics(res.data);
    } catch (error) {
      toast.error("Erro ao carregar analytics");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-20 flex items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">A carregar analytics...</div>
      </div>
    );
  }

  if (!analytics) return null;

  const { generalStats, popularGames, newUsersByMonth, reviewsByDay, statusDistribution } = analytics;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-20 px-4 pb-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/app/admin')}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Voltar ao Admin Dashboard</span>
          </button>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <TrendingUp size={32} className="text-cyan-500" />
            Analytics & Estatísticas
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Visão geral da plataforma com métricas e gráficos
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Users size={24} />
              <span className="text-2xl font-bold">{generalStats.total_users}</span>
            </div>
            <p className="text-sm opacity-90">Total Users</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Gamepad2 size={24} />
              <span className="text-2xl font-bold">{generalStats.total_games}</span>
            </div>
            <p className="text-sm opacity-90">Total Jogos</p>
          </div>
          
          <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <MessageSquare size={24} />
              <span className="text-2xl font-bold">{generalStats.total_reviews}</span>
            </div>
            <p className="text-sm opacity-90">Total Reviews</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp size={24} />
              <span className="text-2xl font-bold">{generalStats.total_collection_entries}</span>
            </div>
            <p className="text-sm opacity-90">Entradas Coleção</p>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Award size={24} />
              <span className="text-2xl font-bold">{generalStats.total_achievements_unlocked}</span>
            </div>
            <p className="text-sm opacity-90">Achievements</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Novos Users por Mês */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Novos Users (Últimos 6 Meses)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={newUsersByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Line type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={2} name="Novos Users" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Reviews por Dia */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Reviews por Dia (Últimos 30 Dias)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reviewsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Bar dataKey="count" fill="#8b5cf6" name="Reviews" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution & Popular Games */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Distribuição de Status
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => entry.status}
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top 10 Jogos Populares */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Top 10 Jogos Populares
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {popularGames.map((game, index) => (
                <div key={game.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="w-8 h-8 flex items-center justify-center bg-cyan-500 text-white rounded-full font-bold text-sm">
                    {index + 1}
                  </div>
                  {game.cover_url && (
                    <img src={game.cover_url} alt="" className="w-12 h-16 object-cover rounded" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white truncate">{game.title}</p>
                    <p className="text-xs text-slate-500">
                      {game.user_count} users • {game.avg_rating ? `${parseFloat(game.avg_rating).toFixed(1)}/10` : 'Sem rating'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
