import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { Plus, Pencil, FileText, Heart } from "lucide-react";

// Requisitos mínimos para escrever uma review
const MIN_HOURS_FOR_REVIEW = 1; // pelo menos 1 hora jogada

export default function ReviewSection({ gameId, gameTitle, userRating, userHoursPlayed }) {
  const { user } = useAuth();
  
  // Verificar se o utilizador pode escrever review
  const hasRating = userRating !== null && userRating !== undefined && userRating > 0;
  const hasMinHours = (userHoursPlayed || 0) >= MIN_HOURS_FOR_REVIEW;
  const canWriteReview = hasRating && hasMinHours;
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ averageRating: 0, totalRatings: 0 });
  const [showForm, setShowForm] = useState(false);
  const [myReview, setMyReview] = useState(null);
  const [formData, setFormData] = useState({
    rating: 8,
    title: "",
    content: "",
    spoiler: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [expandedSpoilers, setExpandedSpoilers] = useState({});

  useEffect(() => {
    fetchReviews();
  }, [gameId]);

  async function fetchReviews() {
    try {
      setLoading(true);
      const res = await api.get(`/reviews/games/${gameId}/reviews`);
      setReviews(res.data.reviews || []);
      setStats({
        averageRating: res.data.averageRating,
        totalRatings: res.data.totalRatings
      });
      
      // Verificar se o utilizador já tem review
      if (user) {
        const userReview = res.data.reviews?.find(r => r.user_id === user.id);
        if (userReview) {
          setMyReview(userReview);
          setFormData({
            rating: userReview.rating,
            title: userReview.title || "",
            content: userReview.content || "",
            spoiler: userReview.spoiler
          });
        }
      }
    } catch (err) {
      console.error("Erro ao carregar reviews:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user) return;
    
    try {
      setSubmitting(true);
      
      if (myReview) {
        // Atualizar review existente
        await api.put(`/reviews/${myReview.id}`, formData);
      } else {
        // Criar nova review
        await api.post(`/reviews/games/${gameId}/reviews`, formData);
      }
      
      setShowForm(false);
      fetchReviews();
    } catch (err) {
      console.error("Erro ao submeter review:", err);
      alert(err.response?.data?.mensagem || "Erro ao submeter review");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!myReview || !confirm("Tens a certeza que queres eliminar a tua review?")) return;
    
    try {
      await api.delete(`/reviews/${myReview.id}`);
      setMyReview(null);
      setFormData({ rating: 8, title: "", content: "", spoiler: false });
      fetchReviews();
    } catch (err) {
      console.error("Erro ao eliminar review:", err);
    }
  }

  async function handleLike(reviewId) {
    if (!user) return;
    
    try {
      const review = reviews.find(r => r.id === reviewId);
      if (review.userLiked) {
        await api.delete(`/reviews/${reviewId}/like`);
      } else {
        await api.post(`/reviews/${reviewId}/like`);
      }
      fetchReviews();
    } catch (err) {
      console.error("Erro ao dar like:", err);
    }
  }

  function toggleSpoiler(reviewId) {
    setExpandedSpoilers(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("pt-PT", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  function getRatingColor(rating) {
    if (rating >= 8) return "text-emerald-600";
    if (rating >= 6) return "text-amber-600";
    if (rating >= 4) return "text-orange-600";
    return "text-rose-600";
  }

  function getRatingBg(rating) {
    if (rating >= 8) return "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700";
    if (rating >= 6) return "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700";
    if (rating >= 4) return "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-700";
    return "bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-700";
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 mt-6 shadow-sm">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 mt-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Pencil size={16} /> Reviews da Comunidade
          </h2>
          {stats.totalRatings > 0 && (
            <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-sm">
              <span className={`font-bold ${getRatingColor(stats.averageRating)}`}>
                {parseFloat(stats.averageRating).toFixed(1)}
              </span>
              <span className="text-xs"> / 10 • {stats.totalRatings} review{stats.totalRatings !== 1 ? "s" : ""}</span>
            </p>
          )}
        </div>
        
        {user && !showForm && (
          <div className="flex flex-col items-end gap-1">
            {/* Se já tem review, pode sempre editar */}
            {myReview ? (
              <button
                onClick={() => setShowForm(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition flex items-center gap-1"
              >
                <Pencil size={14} /> Editar
              </button>
            ) : canWriteReview ? (
              <button
                onClick={() => setShowForm(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition flex items-center gap-1"
              >
                <Plus size={14} /> Escrever
              </button>
            ) : (
              <div className="text-right">
                <button
                  disabled
                  className="px-3 py-1.5 bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 text-xs font-medium rounded-lg cursor-not-allowed flex items-center gap-1"
                >
                  <Plus size={14} /> Escrever
                </button>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 max-w-[180px]">
                  {!hasRating && !hasMinHours && `Dá um rating e joga pelo menos ${MIN_HOURS_FOR_REVIEW}h`}
                  {!hasRating && hasMinHours && "Dá primeiro um rating ao jogo"}
                  {hasRating && !hasMinHours && `Joga pelo menos ${MIN_HOURS_FOR_REVIEW}h para escrever`}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Formulário de Review */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg p-4 mb-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Rating</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                  className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <span className={`font-bold text-sm ${getRatingColor(formData.rating)} min-w-[2.5rem] text-center`}>
                  {formData.rating}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Título (opcional)</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Uma experiência incrível!"
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                maxLength={100}
              />
            </div>
          </div>
          
          <div className="mb-3">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">A tua opinião</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder={`O que achaste de ${gameTitle}?`}
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 resize-none text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={3}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.spoiler}
                onChange={(e) => setFormData({ ...formData, spoiler: e.target.checked })}
                className="w-3.5 h-3.5 text-indigo-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-indigo-500"
              />
              <span className="text-xs">⚠️ Contém spoilers</span>
            </label>
            
            <div className="flex gap-2">
              {myReview && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1.5 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-medium rounded-lg transition border border-rose-200 dark:border-rose-800"
                >
                  Eliminar
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-lg transition border border-slate-200 dark:border-slate-600"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition disabled:opacity-50"
              >
                {submitting ? "A guardar..." : myReview ? "Atualizar" : "Publicar"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Lista de Reviews */}
      {reviews.length === 0 ? (
        <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-sm">
          <FileText size={48} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
          <p>Ainda não há reviews para este jogo.</p>
          {user && <p className="text-xs mt-1">Sê o primeiro a partilhar a tua opinião!</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className={`bg-slate-50 dark:bg-slate-700/50 border rounded-lg p-3 ${
                myReview?.id === review.id ? "border-indigo-300 dark:border-indigo-600 bg-indigo-50/30 dark:bg-indigo-900/20" : "border-slate-200 dark:border-slate-600"
              }`}
            >
              {/* Header da Review */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                    {review.user_avatar ? (
                      <img
                        src={
                          review.user_avatar.startsWith("data:") || review.user_avatar.startsWith("http")
                            ? review.user_avatar
                            : `http://localhost:4000${review.user_avatar}`
                        }
                        alt={review.user_name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      review.user_name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-slate-800 dark:text-slate-200">{review.user_name}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">{formatDate(review.created_at)}</p>
                  </div>
                </div>
                <div className={`px-2 py-0.5 rounded-full border text-xs font-bold ${getRatingBg(review.rating)} ${getRatingColor(review.rating)}`}>
                  {review.rating}/10
                </div>
              </div>
              
              {/* Título */}
              {review.title && (
                <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200 mb-1">{review.title}</h4>
              )}
              
              {/* Conteúdo */}
              {review.content && (
                review.spoiler && !expandedSpoilers[review.id] ? (
                  <button
                    onClick={() => toggleSpoiler(review.id)}
                    className="w-full py-2 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-700 rounded-lg text-amber-700 dark:text-amber-400 text-xs transition"
                  >
                    ⚠️ Clica para revelar spoilers
                  </button>
                ) : (
                  <p className="text-slate-600 dark:text-slate-300 text-sm whitespace-pre-wrap">
                    {review.content}
                    {review.spoiler && (
                      <button
                        onClick={() => toggleSpoiler(review.id)}
                        className="ml-2 text-[10px] text-amber-600 dark:text-amber-400 hover:underline"
                      >
                        (esconder spoilers)
                      </button>
                    )}
                  </p>
                )
              )}
              
              {/* Footer */}
              <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-200 dark:border-slate-600">
                <button
                  onClick={() => handleLike(review.id)}
                  disabled={!user}
                  className={`flex items-center gap-1 text-xs transition ${
                    review.userLiked
                      ? "text-rose-500"
                      : "text-slate-400 dark:text-slate-500 hover:text-rose-500"
                  } ${!user ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <Heart size={14} fill={review.userLiked ? "currentColor" : "none"} /> {review.likes_count || 0}
                </button>
                {myReview?.id === review.id && (
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 ml-auto font-medium">A tua review</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
