// src/pages/AdminDashboardPage.jsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { 
  Users, Database, Heart, TrendingUp, Crown, Shield, 
  AlertTriangle, Settings, Search, ChevronLeft, ChevronRight,
  X, Trash2, FileText, MessageSquare, BarChart3, Gamepad2, RefreshCw
} from "lucide-react";
import api from "../services/api";

const USERS_PER_PAGE = 10;

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

// Modal de Confirmação
function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirmar", type = "danger" }) {
  if (!isOpen) return null;

  const buttonColors = {
    danger: "bg-red-500 hover:bg-red-600",
    warning: "bg-amber-500 hover:bg-amber-600",
    info: "bg-blue-500 hover:bg-blue-600"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4 border border-slate-200 dark:border-slate-700">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <X size={20} />
        </button>
        
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${type === 'danger' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
            <AlertTriangle size={24} className={type === 'danger' ? 'text-red-500' : 'text-amber-500'} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">{message}</p>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${buttonColors[type]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function UserRow({ user, currentUserId, onRoleChange, onDeleteClick, onManage }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleRoleChange = async (newRole) => {
    if (user.id === currentUserId) return;
    setIsUpdating(true);
    await onRoleChange(user.id, newRole);
    setIsUpdating(false);
  };

  const renderAvatar = () => {
    if (user.avatar_url && !imageError) {
      // Construir URL completo se for um caminho relativo
      const avatarUrl = user.avatar_url.startsWith('http') 
        ? user.avatar_url 
        : `http://localhost:4000${user.avatar_url}`;
      
      return (
        <img 
          src={avatarUrl} 
          alt="" 
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          onError={() => setImageError(true)}
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
      <div className="col-span-5 flex items-center gap-3">
        {renderAvatar()}
        <div className="min-w-0">
          <p className="font-medium text-slate-900 dark:text-white truncate">{user.name}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
        </div>
      </div>
      
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
      
      <div className="col-span-2 text-sm text-slate-500 dark:text-slate-400">
        {new Date(user.created_at).toLocaleDateString('pt-PT')}
      </div>
      
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
              onClick={() => onDeleteClick(user)}
              className="px-3 py-1.5 bg-red-200 text-red-800 hover:bg-red-300 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
            >
              <Trash2 size={12} />
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
  
  // Filtros e paginação
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modal de confirmação
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, user: null });
  
  // Estado para enriquecer jogos Steam
  const [enrichingGames, setEnrichingGames] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Reset página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter]);

  // Filtrar users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = searchTerm === "" || 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  // Paginação
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(start, start + USERS_PER_PAGE);
  }, [filteredUsers, currentPage]);

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
      loadData();
    } catch (error) {
      console.error('Erro ao alterar role:', error);
      toast.error('Erro ao alterar role');
    }
  }

  function handleDeleteClick(userToDelete) {
    setDeleteModal({ isOpen: true, user: userToDelete });
  }

  async function handleConfirmDelete() {
    if (!deleteModal.user) return;
    
    try {
      await api.delete(`/admin/users/${deleteModal.user.id}`);
      toast.success('User eliminado com sucesso');
      setDeleteModal({ isOpen: false, user: null });
      loadData();
    } catch (error) {
      console.error('Erro ao eliminar user:', error);
      toast.error('Erro ao eliminar user');
    }
  }

  function handleManageUser(userId) {
    navigate(`/app/admin/user/${userId}`);
  }

  async function handleEnrichSteamGames() {
    if (enrichingGames) return;
    
    try {
      setEnrichingGames(true);
      toast.info('A atualizar jogos Steam com dados da RAWG... Isto pode demorar alguns minutos.');
      
      const response = await api.post('/admin/games/enrich-steam');
      const { updated, failed, total, errors } = response.data;
      
      if (updated > 0) {
        toast.success(`${updated} jogos atualizados com sucesso!`);
      }
      
      if (failed > 0) {
        toast.warning(`${failed} jogos não foram encontrados na RAWG`);
      }
      
      if (total === 0) {
        toast.info('Não há jogos para atualizar. Todos já têm dados completos.');
      }
      
    } catch (error) {
      console.error('Erro ao enriquecer jogos:', error);
      toast.error('Erro ao atualizar jogos Steam');
    } finally {
      setEnrichingGames(false);
    }
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

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => navigate('/app/admin/logs')}
          className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-lg transition-all flex items-center gap-4"
        >
          <div className="p-3 bg-cyan-500 text-white rounded-lg">
            <FileText size={24} />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-900 dark:text-white">Admin Logs</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Histórico de ações</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/app/admin/reviews')}
          className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-lg transition-all flex items-center gap-4"
        >
          <div className="p-3 bg-purple-500 text-white rounded-lg">
            <MessageSquare size={24} />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-900 dark:text-white">Moderar Reviews</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Gerir conteúdo</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/app/admin/analytics')}
          className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-lg transition-all flex items-center gap-4"
        >
          <div className="p-3 bg-orange-500 text-white rounded-lg">
            <BarChart3 size={24} />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-900 dark:text-white">Analytics</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Estatísticas e gráficos</p>
          </div>
        </button>

        <button
          onClick={handleEnrichSteamGames}
          disabled={enrichingGames}
          className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-lg transition-all flex items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className={`p-3 bg-emerald-500 text-white rounded-lg ${enrichingGames ? 'animate-pulse' : ''}`}>
            {enrichingGames ? <RefreshCw size={24} className="animate-spin" /> : <Gamepad2 size={24} />}
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {enrichingGames ? 'A atualizar...' : 'Enriquecer Jogos Steam'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Adicionar plataformas e géneros</p>
          </div>
        </button>
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
        {/* Header com filtros */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Gestão de Users ({filteredUsers.length})
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full sm:w-64 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              
              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="all">Todos os roles</option>
                <option value="admin">Admins</option>
                <option value="user">Users</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <div className="col-span-5">User</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-2">Registo</div>
          <div className="col-span-3 text-right">Ações</div>
        </div>
        
        {/* Users */}
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {paginatedUsers.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Users size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-500 dark:text-slate-400">
                {searchTerm || roleFilter !== "all" 
                  ? "Nenhum user encontrado com esses filtros" 
                  : "Nenhum user registado"}
              </p>
            </div>
          ) : (
            paginatedUsers.map(u => (
              <UserRow 
                key={u.id} 
                user={u}
                currentUserId={user.id}
                onRoleChange={handleRoleChange}
                onDeleteClick={handleDeleteClick}
                onManage={handleManageUser}
              />
            ))
          )}
        </div>
        
        {/* Paginação */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              A mostrar {((currentPage - 1) * USERS_PER_PAGE) + 1} - {Math.min(currentPage * USERS_PER_PAGE, filteredUsers.length)} de {filteredUsers.length}
            </p>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      page === currentPage
                        ? 'bg-cyan-500 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Eliminação */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, user: null })}
        onConfirm={handleConfirmDelete}
        title="Eliminar User"
        message={`Tem certeza que quer eliminar "${deleteModal.user?.name}"? Esta ação é irreversível e vai remover todos os dados do user, incluindo a sua coleção e wishlist.`}
        confirmText="Sim, eliminar"
        type="danger"
      />
    </div>
  );
}
