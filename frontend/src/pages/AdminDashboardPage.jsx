// src/pages/AdminDashboardPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { 
  Users, Database, Heart, TrendingUp, UserX, Crown, Shield, 
  AlertTriangle, CheckCircle, XCircle, Settings 
} from "lucide-react";
import api from "../services/api";

function StatCard({ title, value, icon, color = "blue" }) {
  const colors = {
    blue: "bg-blue-500",
    green: "bg-emerald-500",
    purple: "bg-fuchsia-500",
    orange: "bg-orange-500"
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colors[color]} text-white`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function UserRow({ user, currentUserId, onRoleChange, onDeleteUser, onManage }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleRoleChange = async (newRole) => {
    if (user.id === currentUserId) return;
    
    setIsUpdating(true);
    await onRoleChange(user.id, newRole);
    setIsUpdating(false);
  };

  const handleDelete = async () => {
    if (user.id === currentUserId) return;
    
    if (window.confirm(`Tem certeza que quer eliminar o user ${user.name}?`)) {
      await onDeleteUser(user.id);
    }
  };

  // Avatar com fallback robusto
  const renderAvatar = () => {
    if (user.avatar_url && !imageError) {
      return (
        <img 
          src={user.avatar_url} 
          alt="" 
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          onError={() => setImageError(true)}
          onLoad={() => setImageError(false)}
        />
      );
    }
    
    return (
      <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-fuchsia-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
        {user.name.charAt(0).toUpperCase()}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50">
      {/* User */}
      <div className="col-span-5 flex items-center gap-3">
        {renderAvatar()}
        <div className="min-w-0">
          <p className="font-medium text-slate-900 dark:text-white truncate">{user.name}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
        </div>
      </div>
      
      {/* Role */}
      <div className="col-span-2">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
          user.role === 'admin' 
            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
        }`}>
          {user.role === 'admin' ? <Crown size={12} /> : <Users size={12} />}
          {user.role}
        </span>
      </div>
      
      {/* Registo */}
      <div className="col-span-2 text-sm text-slate-500 dark:text-slate-400">
        {new Date(user.created_at).toLocaleDateString('pt-PT')}
      </div>
      
      {/* Ações */}
      <div className="col-span-3 flex items-center justify-end gap-2">
        <button
          onClick={() => onManage(user.id)}
          className="px-3 py-1.5 bg-cyan-200 text-cyan-800 hover:bg-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-400 dark:hover:bg-cyan-900/50 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
        >
          <Settings size={12} />
          Gerir
        </button>
        {user.id !== currentUserId ? (
          <>
            <button
              onClick={() => handleRoleChange(user.role === 'admin' ? 'user' : 'admin')}
              disabled={isUpdating}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                user.role === 'admin'
                  ? 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                  : 'bg-purple-200 text-purple-800 hover:bg-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:hover:bg-purple-900/50'
              }`}
            >
              {isUpdating ? '...' : user.role === 'admin' ? 'Remover' : 'Admin'}
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 bg-red-200 text-red-800 hover:bg-red-300 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-lg text-xs font-medium transition-colors"
            >
              Eliminar
            </button>
          </>
        ) : (
          <span className="text-xs text-slate-500 dark:text-slate-400 italic">Tu</span>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [statsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users')
      ]);
      
      setStats(statsRes.data);
      setUsers(usersRes.data.users);
    } catch (error) {
      console.error('Erro ao carregar dados admin:', error);
      if (error.response?.status === 403) {
        toast.error('Acesso negado. Apenas administradores.');
      } else {
        toast.error('Erro ao carregar dados');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId, newRole) {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      toast.success(`Role alterado para ${newRole}`);
      loadData(); // Reload
    } catch (error) {
      console.error('Erro ao alterar role:', error);
      toast.error('Erro ao alterar role');
    }
  }

  async function handleDeleteUser(userId) {
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User eliminado');
      loadData(); // Reload
    } catch (error) {
      console.error('Erro ao eliminar user:', error);
      toast.error('Erro ao eliminar user');
    }
  }

  function handleManageUser(userId) {
    navigate(`/app/admin/user/${userId}`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-slate-400 animate-pulse mb-4" />
          <p className="text-slate-500 dark:text-slate-400">A carregar painel admin...</p>
        </div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Acesso Negado</h2>
          <p className="text-slate-500 dark:text-slate-400">Apenas administradores podem aceder a esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Shield className="text-purple-500" />
            Admin Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400">Gestão e estatísticas do sistema</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Users"
            value={stats.totalUsers}
            icon={<Users size={24} />}
            color="blue"
          />
          <StatCard 
            title="Jogos na Coleção"
            value={stats.totalGames}
            icon={<Database size={24} />}
            color="green"
          />
          <StatCard 
            title="Items na Wishlist"
            value={stats.totalWishlist}
            icon={<Heart size={24} />}
            color="purple"
          />
          <StatCard 
            title="Novos Users (30d)"
            value={stats.newUsersThisMonth}
            icon={<TrendingUp size={24} />}
            color="orange"
          />
        </div>
      )}

      {/* Users List */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Gestão de Users ({users.length})
          </h2>
        </div>
        
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <div className="col-span-5">User</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-2">Registo</div>
          <div className="col-span-3 text-right">Ações</div>
        </div>
        
        {/* Users */}
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {users.map(u => (
            <UserRow 
              key={u.id} 
              user={u}
              currentUserId={user.id}
              onRoleChange={handleRoleChange}
              onDeleteUser={handleDeleteUser}
              onManage={handleManageUser}
            />
          ))}
        </div>
      </div>
    </div>
  );
}