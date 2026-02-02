// src/pages/AdminUserPage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";
import api from "../services/api";
import { 
  ArrowLeft, User, Gamepad2, Heart, Save, Trash2, 
  Edit2, X, Check, Clock, Star, MoveRight, Crown, Shield
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: 'a_jogar', label: 'A Jogar', color: 'bg-green-500' },
  { value: 'completo', label: 'Completo', color: 'bg-blue-500' },
  { value: 'por_jogar', label: 'Por Jogar', color: 'bg-yellow-500' },
  { value: 'abandonado', label: 'Abandonado', color: 'bg-red-500' },
  { value: 'em_pausa', label: 'Em Pausa', color: 'bg-gray-500' },
];

function TabButton({ active, onClick, icon, label, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
        active 
          ? 'bg-cyan-500 text-white' 
          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
      }`}
    >
      {icon}
      {label}
      {count !== undefined && (
        <span className={`px-2 py-0.5 rounded-full text-xs ${active ? 'bg-white/20' : 'bg-slate-300 dark:bg-slate-600'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function GameCard({ game, onUpdate, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState(game.status || 'por_jogar');
  const [rating, setRating] = useState(game.rating || 0);
  const [hours, setHours] = useState(game.hours_played || 0);

  const handleSave = async () => {
    await onUpdate(game.id, { status, rating, hours_played: hours });
    setEditing(false);
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
      <div className="flex gap-4">
        {/* Cover */}
        <div className="w-16 h-20 flex-shrink-0 bg-slate-200 dark:bg-slate-700 rounded overflow-hidden">
          {game.cover_url ? (
            <img src={game.cover_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Gamepad2 size={24} className="text-slate-400" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-slate-900 dark:text-white truncate">
            {game.title || `Jogo #${game.external_id || game.game_id}`}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{game.platform || 'N/A'}</p>
          
          {!editing ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <span className={`px-2 py-0.5 rounded text-xs text-white ${STATUS_OPTIONS.find(s => s.value === status)?.color || 'bg-gray-500'}`}>
                {STATUS_OPTIONS.find(s => s.value === status)?.label || status}
              </span>
              {rating > 0 && (
                <span className="px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 flex items-center gap-1">
                  <Star size={10} /> {rating}/10
                </span>
              )}
              {hours > 0 && (
                <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Clock size={10} /> {hours}h
                </span>
              )}
            </div>
          ) : (
            <div className="mt-2 space-y-2">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-2 py-1 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  placeholder="Rating"
                  min="0"
                  max="10"
                  className="w-20 px-2 py-1 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                />
                <input
                  type="number"
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  placeholder="Horas"
                  min="0"
                  className="w-20 px-2 py-1 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1">
          {!editing ? (
            <>
              <button
                onClick={() => setEditing(true)}
                className="p-2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => onRemove(game.id)}
                className="p-2 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
              >
                <Trash2 size={14} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="p-2 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200"
              >
                <Check size={14} />
              </button>
              <button
                onClick={() => setEditing(false)}
                className="p-2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              >
                <X size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function WishlistCard({ item, onUpdate, onRemove, onMoveToCollection }) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
      <div className="flex gap-4">
        {/* Cover */}
        <div className="w-16 h-20 flex-shrink-0 bg-slate-200 dark:bg-slate-700 rounded overflow-hidden">
          {item.cover_url ? (
            <img src={item.cover_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Heart size={24} className="text-slate-400" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-slate-900 dark:text-white truncate">
            {item.title || `Jogo #${item.external_id || item.game_id}`}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{item.platform || 'N/A'}</p>
          <p className="text-xs text-slate-400 mt-1">
            Adicionado: {new Date(item.created_at).toLocaleDateString('pt-PT')}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1">
          <button
            onClick={() => onMoveToCollection(item.id)}
            className="p-2 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
            title="Mover para coleção"
          >
            <MoveRight size={14} />
          </button>
          <button
            onClick={() => onRemove(item.id)}
            className="p-2 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
            title="Remover"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUserPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [collection, setCollection] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [activeTab, setActiveTab] = useState('info');

  // Edit user form
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editPublic, setEditPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [userId]);

  async function loadUserData() {
    try {
      setLoading(true);
      const res = await api.get(`/admin/users/${userId}`);
      setUserData(res.data);
      
      // Preencher form
      setEditName(res.data.user.name || '');
      setEditEmail(res.data.user.email || '');
      setEditBio(res.data.user.bio || '');
      setEditPublic(res.data.user.is_public || false);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar user");
    } finally {
      setLoading(false);
    }
  }

  async function loadCollection() {
    try {
      const res = await api.get(`/admin/users/${userId}/collection`);
      setCollection(res.data.games);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar coleção");
    }
  }

  async function loadWishlist() {
    try {
      const res = await api.get(`/admin/users/${userId}/wishlist`);
      setWishlist(res.data.items);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar wishlist");
    }
  }

  useEffect(() => {
    if (activeTab === 'collection' && collection.length === 0) {
      loadCollection();
    } else if (activeTab === 'wishlist' && wishlist.length === 0) {
      loadWishlist();
    }
  }, [activeTab]);

  async function handleSaveUser() {
    try {
      setSaving(true);
      await api.put(`/admin/users/${userId}`, {
        name: editName,
        email: editEmail,
        bio: editBio,
        is_public: editPublic
      });
      toast.success("User atualizado!");
      loadUserData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateGame(entryId, data) {
    try {
      await api.put(`/admin/collection/${entryId}`, data);
      toast.success("Jogo atualizado");
      loadCollection();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar");
    }
  }

  async function handleRemoveGame(entryId) {
    if (!confirm("Remover este jogo da coleção?")) return;
    try {
      await api.delete(`/admin/collection/${entryId}`);
      toast.success("Jogo removido");
      setCollection(prev => prev.filter(g => g.id !== entryId));
    } catch (error) {
      console.error(error);
      toast.error("Erro ao remover");
    }
  }

  async function handleRemoveWishlist(entryId) {
    if (!confirm("Remover da wishlist?")) return;
    try {
      await api.delete(`/admin/wishlist/${entryId}`);
      toast.success("Item removido");
      setWishlist(prev => prev.filter(w => w.id !== entryId));
    } catch (error) {
      console.error(error);
      toast.error("Erro ao remover");
    }
  }

  async function handleMoveToCollection(entryId) {
    try {
      await api.post(`/admin/wishlist/${entryId}/move-to-collection`);
      toast.success("Movido para a coleção");
      setWishlist(prev => prev.filter(w => w.id !== entryId));
      // Reload collection se já tiver carregada
      if (collection.length > 0) {
        loadCollection();
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao mover");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-slate-400 animate-pulse mb-4" />
          <p className="text-slate-500 dark:text-slate-400">A carregar...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">User não encontrado</p>
      </div>
    );
  }

  const { user, stats } = userData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app/admin')}
            className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-fuchsia-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {user.name}
                {user.role === 'admin' && <Crown size={16} className="text-purple-500" />}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="text-center">
            <p className="font-bold text-slate-900 dark:text-white">{stats.totalGames}</p>
            <p className="text-slate-500 dark:text-slate-400">Jogos</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-slate-900 dark:text-white">{stats.totalWishlist}</p>
            <p className="text-slate-500 dark:text-slate-400">Wishlist</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <TabButton
          active={activeTab === 'info'}
          onClick={() => setActiveTab('info')}
          icon={<User size={16} />}
          label="Info"
        />
        <TabButton
          active={activeTab === 'collection'}
          onClick={() => setActiveTab('collection')}
          icon={<Gamepad2 size={16} />}
          label="Coleção"
          count={stats.totalGames}
        />
        <TabButton
          active={activeTab === 'wishlist'}
          onClick={() => setActiveTab('wishlist')}
          icon={<Heart size={16} />}
          label="Wishlist"
          count={stats.totalWishlist}
        />
      </div>

      {/* Content */}
      {activeTab === 'info' && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Editar Informações</h2>
          
          <div className="grid gap-4 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bio</label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={editPublic}
                onChange={(e) => setEditPublic(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="isPublic" className="text-sm text-slate-700 dark:text-slate-300">
                Perfil público
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSaveUser}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors"
              >
                <Save size={16} />
                {saving ? 'A guardar...' : 'Guardar'}
              </button>
            </div>
          </div>

          {/* Info adicional */}
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Informações do Sistema</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-400">ID:</span>
                <span className="ml-2 text-slate-900 dark:text-white">{user.id}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Role:</span>
                <span className={`ml-2 ${user.role === 'admin' ? 'text-purple-500' : 'text-slate-900 dark:text-white'}`}>
                  {user.role}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">XP:</span>
                <span className="ml-2 text-slate-900 dark:text-white">{user.total_xp || 0}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Registo:</span>
                <span className="ml-2 text-slate-900 dark:text-white">
                  {new Date(user.created_at).toLocaleDateString('pt-PT')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'collection' && (
        <div className="space-y-3">
          {collection.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <Gamepad2 size={48} className="mx-auto text-slate-400 mb-4" />
              <p className="text-slate-500 dark:text-slate-400">Coleção vazia</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {collection.map(game => (
                <GameCard
                  key={game.id}
                  game={game}
                  onUpdate={handleUpdateGame}
                  onRemove={handleRemoveGame}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'wishlist' && (
        <div className="space-y-3">
          {wishlist.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <Heart size={48} className="mx-auto text-slate-400 mb-4" />
              <p className="text-slate-500 dark:text-slate-400">Wishlist vazia</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {wishlist.map(item => (
                <WishlistCard
                  key={item.id}
                  item={item}
                  onUpdate={() => {}}
                  onRemove={handleRemoveWishlist}
                  onMoveToCollection={handleMoveToCollection}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
