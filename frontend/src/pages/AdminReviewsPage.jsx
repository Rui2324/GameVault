// src/pages/AdminReviewsPage.jsx
import { useEffect, useState } from "react";
import { Trash2, User, Gamepad2, Star, MessageSquare, AlertCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useToast } from "../components/Toast";

export default function AdminReviewsPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleteReason, setDeleteReason] = useState("");

  useEffect(() => {
    fetchReviews();
  }, [page]);

  async function fetchReviews() {
    try {
      setLoading(true);
      const res = await api.get(`/admin/reviews?page=${page}&limit=20`);
      setReviews(res.data.reviews);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      toast.error("Erro ao carregar reviews");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteModal) return;
    
    try {
      await api.delete(`/admin/reviews/${deleteModal.id}`, {
        data: { reason: deleteReason }
      });
      toast.success("Review eliminada");
      setReviews(reviews.filter(r => r.id !== deleteModal.id));
      setDeleteModal(null);
      setDeleteReason("");
    } catch (error) {
      toast.error("Erro ao eliminar review");
    }
  }

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
            <MessageSquare size={32} className="text-cyan-500" />
            Moderação de Reviews
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Gerir e moderar todas as reviews da plataforma
          </p>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <User size={18} className="text-slate-500" />
                    <div>
                      <span className="font-medium text-slate-900 dark:text-white">{review.user_name}</span>
                      <span className="text-slate-500 text-sm ml-2">({review.user_email})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <Gamepad2 size={18} className="text-slate-500" />
                    <span className="text-slate-700 dark:text-slate-300">{review.game_title}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Star size={16} className="text-yellow-500 fill-yellow-500" />
                    <span className="font-medium text-slate-900 dark:text-white">{review.rating}/10</span>
                    <span className="text-xs text-slate-500 ml-auto">
                      {new Date(review.created_at).toLocaleString('pt-PT')}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {review.review_text}
                  </p>
                </div>
                <button
                  onClick={() => setDeleteModal(review)}
                  className="ml-4 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Eliminar review"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}

          {reviews.length === 0 && !loading && (
            <div className="text-center py-12">
              <MessageSquare size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-500 dark:text-slate-400">Nenhuma review encontrada</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="px-4 py-2 text-slate-900 dark:text-white">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteModal(null)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle size={24} className="text-red-500" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Eliminar Review
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Tens a certeza que queres eliminar esta review de <strong>{deleteModal.user_name}</strong>?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Razão (opcional)
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Motivo da eliminação..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
