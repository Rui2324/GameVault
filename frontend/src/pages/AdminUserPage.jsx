// src/pages/AdminUserPage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";
import api from "../services/api";
import { 
  ArrowLeft, User, Gamepad2, Heart, Save, Trash2, 
  Edit2, X, Check, Clock, Star, MoveRight, Crown, Shield,
  Plus, Search, Loader2, Award, Lock, Unlock
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: 'a_jogar', label: 'A Jogar', color: 'bg-green-500' },
  { value: 'completo', label: 'Completo', color: 'bg-blue-500' },
  { value: 'por_jogar', label: 'Por Jogar', color: 'bg-yellow-500' },
  { value: 'abandonado', label: 'Abandonado', color: 'bg-red-500' },
  { value: 'em_pausa', label: 'Em Pausa', color: 'bg-gray-500' },
];

// Modal para adicionar jogos
function AddGameModal({ isOpen, onClose, userId, onGameAdded }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("por_jogar");
  const toast = useToast();

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setSearchResults([]);
    }
  }, [isOpen]);

  async function handleSearch() {
    if (!searchTerm.trim()) return;
    
    try {
      setSearching(true);
      setSearchResults([]);
      const res = await api.get(`/external-games/search?query=${encodeURIComponent(searchTerm)}`);
      // A API retorna { jogos: [...] }
      const jogos = res.data.jogos || [];
      setSearchResults(jogos.slice(0, 10));
      if (jogos.length === 0) {
        toast.info("Nenhum jogo encontrado");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro na pesquisa - verifique a API key");
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function handleAddGame(game) {
    try {
      setAdding(game.external_id);
      await api.post(`/admin/users/${userId}/collection`, {
        external_id: game.external_id,
        title: game.title,
        cover_url: game.cover_url,
        platform: game.platforms || "N/A",
        status: selectedStatus
      });
      toast.success(`${game.title} adicionado!`);
      onGameAdded();
      onClose();
    } catch (error) {
      console.error(error);
      if (error.response?.status === 409) {
        toast.error("Jogo já está na coleção");
      } else {
        toast.error("Erro ao adicionar jogo");
      }
    } finally {
      setAdding(null);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Plus size={20} className="text-cyan-500" />
            Adicionar Jogo à Coleção
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X size={20} />
          </button>
        </div>
        
        {/* Search */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar jogos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button
              onClick={handleSearch}
              disabled={searching || !searchTerm.trim()}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Pesquisar
            </button>
          </div>
        </div>
        
        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {searchResults.length === 0 ? (
            <div className="text-center py-12">
              <Gamepad2 size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-500 dark:text-slate-400">
                {searching ? "A pesquisar..." : "Pesquisa por jogos para adicionar"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map(game => (
                <div
                  key={game.external_id}
                  className="flex items-center gap-4 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="w-14 h-18 flex-shrink-0 bg-slate-200 dark:bg-slate-700 rounded overflow-hidden">
                    {game.cover_url ? (
                      <img src={game.cover_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Gamepad2 size={20} className="text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900 dark:text-white truncate">{game.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {game.platforms || "N/A"}
                    </p>
                    {game.release_date && (
                      <p className="text-xs text-slate-400">{new Date(game.release_date).getFullYear()}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddGame(game)}
                    disabled={adding === game.external_id}
                    className="flex-shrink-0 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {adding === game.external_id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Plus size={16} />
                    )}
                    Adicionar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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

// Achievements Tab Component
function AchievementsTab({ userId }) {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const toast = useToast();

  useEffect(() => {
    fetchAchievements();
  }, [userId]);

  async function fetchAchievements() {
    try {
      setLoading(true);
      const res = await api.get(`/admin/users/${userId}/achievements`);
      setAchievements(res.data.achievements);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar achievements");
    } finally {
      setLoading(false);
    }
  }

  async function handleUnlock(achievementId) {
    try {
      setProcessing(achievementId);
      await api.post(`/admin/users/${userId}/achievements/${achievementId}/unlock`);
      toast.success("Achievement desbloqueado");
      fetchAchievements();
    } catch (error) {
      console.error(error);
      if (error.response?.status === 409) {
        toast.error("Achievement já desbloqueado");
      } else {
        toast.error("Erro ao desbloquear achievement");
      }
    } finally {
      setProcessing(null);
    }
  }

  async function handleLock(achievementId) {
    try {
      setProcessing(achievementId);
      await api.post(`/admin/users/${userId}/achievements/${achievementId}/lock`);
      toast.success("Achievement bloqueado");
      fetchAchievements();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao bloquear achievement");
    } finally {
      setProcessing(null);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 size={48} className="mx-auto text-slate-400 animate-spin mb-4" />
        <p className="text-slate-500">A carregar achievements...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Award size={20} className="text-yellow-500" />
          Gestão de Achievements
        </h2>
        <p className="text-sm text-slate-500">
          {achievements.filter(a => a.unlocked_at).length} / {achievements.length} desbloqueados
        </p>
      </div>

      <div className="grid gap-3">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`flex items-center gap-4 p-4 rounded-lg border ${
              achievement.unlocked_at
                ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
            }`}
          >
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              achievement.unlocked_at ? 'bg-yellow-500' : 'bg-slate-300 dark:bg-slate-600'
            }`}>
              {achievement.icon_url ? (
                <img src={achievement.icon_url} alt="" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <Award size={24} className={achievement.unlocked_at ? 'text-white' : 'text-slate-500'} />
              )}
            </div>
            
            <div className="flex-1">
              <h3 className="font-medium text-slate-900 dark:text-white">{achievement.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{achievement.description}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-purple-600 dark:text-purple-400">+{achievement.xp_reward} XP</span>
                {achievement.unlocked_at && (
                  <span className="text-xs text-green-600 dark:text-green-400">
                    Desbloqueado: {new Date(achievement.unlocked_at).toLocaleDateString('pt-PT')}
                  </span>
                )}
              </div>
            </div>

            {achievement.unlocked_at ? (
              <button
                onClick={() => handleLock(achievement.id)}
                disabled={processing === achievement.id}
                className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                {processing === achievement.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Lock size={16} />
                )}
                Bloquear
              </button>
            ) : (
              <button
                onClick={() => handleUnlock(achievement.id)}
                disabled={processing === achievement.id}
                className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                {processing === achievement.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Unlock size={16} />
                )}
                Desbloquear
              </button>
            )}
          </div>
        ))}

        {achievements.length === 0 && (
          <div className="text-center py-12">
            <Award size={48} className="mx-auto text-slate-400 mb-4" />
            <p className="text-slate-500 dark:text-slate-400">Nenhum achievement disponível</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Reviews Tab Component
function ReviewsTab({ userId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const toast = useToast();

  useEffect(() => {
    fetchReviews();
  }, [userId]);

  async function fetchReviews() {
    try {
      setLoading(true);
      const res = await api.get(`/admin/reviews?userId=${userId}`);
      setReviews(res.data.reviews);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar reviews");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(reviewId, gameName) {
    if (!confirm(`Eliminar review de "${gameName}"?`)) return;
    
    try {
      setDeleting(reviewId);
      await api.delete(`/admin/reviews/${reviewId}`, {
        data: { reason: 'Removido pelo admin' }
      });
      toast.success("Review eliminada");
      setReviews(reviews.filter(r => r.id !== reviewId));
    } catch (error) {
      console.error(error);
      toast.error("Erro ao eliminar review");
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 size={48} className="mx-auto text-slate-400 animate-spin mb-4" />
        <p className="text-slate-500">A carregar reviews...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Star size={20} className="text-yellow-500" />
          Reviews do User
        </h2>
        <span className="text-sm text-slate-500">{reviews.length} reviews</span>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <Star size={48} className="mx-auto text-slate-400 mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Nenhuma review ainda</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Gamepad2 size={16} className="text-slate-500" />
                    <h3 className="font-medium text-slate-900 dark:text-white">{review.game_title}</h3>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-yellow-500 fill-yellow-500" />
                      <span className="font-medium text-slate-900 dark:text-white">{review.rating}/10</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(review.created_at).toLocaleString('pt-PT')}
                    </span>
                  </div>
                  {review.review_text && (
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                      {review.review_text}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(review.id, review.game_title)}
                  disabled={deleting === review.id}
                  className="ml-4 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                  title="Eliminar review"
                >
                  {deleting === review.id ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Trash2 size={18} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
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
  
  // Modal adicionar jogo
  const [showAddGameModal, setShowAddGameModal] = useState(false);

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
              <img 
                src={user.avatar_url.startsWith('http') ? user.avatar_url : `http://localhost:4000${user.avatar_url}`} 
                alt="" 
                className="w-12 h-12 rounded-full object-cover" 
              />
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
        <TabButton
          active={activeTab === 'achievements'}
          onClick={() => setActiveTab('achievements')}
          icon={<Crown size={16} />}
          label="Achievements"
        />
        <TabButton
          active={activeTab === 'reviews'}
          onClick={() => setActiveTab('reviews')}
          icon={<Star size={16} />}
          label="Reviews"
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
          {/* Botão adicionar */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddGameModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
            >
              <Plus size={16} />
              Adicionar Jogo
            </button>
          </div>
          
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

      {/* Achievements Tab */}
      {activeTab === 'achievements' && <AchievementsTab userId={userId} />}

      {/* Reviews Tab */}
      {activeTab === 'reviews' && <ReviewsTab userId={userId} />}

      {/* Modal Adicionar Jogo */}
      <AddGameModal
        isOpen={showAddGameModal}
        onClose={() => setShowAddGameModal(false)}
        userId={userId}
        onGameAdded={loadCollection}
      />
    </div>
  );
}
