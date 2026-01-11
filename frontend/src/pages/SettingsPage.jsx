// src/pages/SettingsPage.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

export default function SettingsPage() {
  const { user, atualizarPerfil } = useAuth();
  const toast = useToast();

  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState(user?.avatar_url || "");
  const [saving, setSaving] = useState(false);

  function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    } else {
      setAvatarFile(null);
      setPreview(avatarUrl || "");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("bio", bio);

      if (avatarFile) {
        formData.append("avatar", avatarFile);
      } else if (avatarUrl) {
        formData.append("avatar_url", avatarUrl);
      }

      await atualizarPerfil(formData);
      toast.success("Perfil atualizado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar perfil.");
    } finally {
      setSaving(false);
    }
  }

  const inicial = (name || user?.email || "?")[0].toUpperCase();
  const imagemPreview = preview || avatarUrl;

  const resolvedPreview = imagemPreview
    ? imagemPreview.startsWith("data:") || imagemPreview.startsWith("http")
      ? imagemPreview
      : `http://localhost:4000${imagemPreview}`
    : "";

  return (
    <div className="space-y-6">
      {/* Header com gradiente */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-6 shadow-xl">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        
        <div className="relative flex items-center gap-4">
          {/* Avatar grande */}
          <div className="relative group">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-2xl overflow-hidden shadow-xl border-4 border-white/30">
              {resolvedPreview ? (
                <img
                  src={resolvedPreview}
                  alt={name}
                  className="h-20 w-20 object-cover"
                />
              ) : (
                inicial
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-700 rounded-full p-1.5 shadow-lg">
              <span className="text-sm">✏️</span>
            </div>
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              ⚙️ Definições do Perfil
            </h1>
            <p className="text-indigo-100 text-sm mt-1">
              Personaliza o teu perfil e torna-o único
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6 space-y-5"
      >
        {/* Avatar upload */}
        <div className="flex items-center gap-5 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-700/50 dark:to-slate-800/50 border border-slate-200/50 dark:border-slate-600/50">
          <div className="relative group">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl overflow-hidden shadow-lg">
              {resolvedPreview ? (
                <img
                  src={resolvedPreview}
                  alt={name}
                  className="h-20 w-20 object-cover"
                />
              ) : (
                inicial
              )}
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Foto de perfil</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">JPG, PNG ou GIF. Máx 2MB.</p>
            <label className="inline-flex items-center gap-2 cursor-pointer rounded-xl bg-white dark:bg-slate-700 border border-slate-200/50 dark:border-slate-600/50 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all">
              <span>📷</span> Escolher ficheiro
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Nome */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            👤 Nome
          </label>
          <input
            type="text"
            className="w-full rounded-xl border border-slate-200/50 dark:border-slate-600/50 px-4 py-3 text-sm bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
            placeholder="O teu nome de utilizador"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            📝 Bio
          </label>
          <textarea
            className="w-full rounded-xl border border-slate-200/50 dark:border-slate-600/50 px-4 py-3 text-sm bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none"
            rows={4}
            placeholder="Conta-nos um pouco sobre ti..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
          <p className="text-xs text-slate-400 mt-1 text-right">{bio.length}/200 caracteres</p>
        </div>

        {/* URL opcional */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            🔗 URL da imagem (opcional)
          </label>
          <input
            type="text"
            placeholder="https://exemplo.com/avatar.jpg"
            className="w-full rounded-xl border border-slate-200/50 dark:border-slate-600/50 px-4 py-3 text-sm bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
          />
          <p className="text-xs text-slate-400 mt-1">Usa se quiseres uma imagem da internet</p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 px-6 py-3 text-sm font-semibold text-white hover:shadow-xl hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100 transition-all duration-300"
          >
            {saving ? (
              <>
                <span className="animate-spin">⏳</span>
                A guardar...
              </>
            ) : (
              <>
                <span>💾</span>
                Guardar alterações
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
