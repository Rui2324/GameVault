// src/pages/SettingsPage.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function SettingsPage() {
  const { user, atualizarPerfil } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState(user?.avatar_url || "");
  const [saving, setSaving] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

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
    setErro("");
    setMensagem("");
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
      setMensagem("Perfil atualizado com sucesso.");
    } catch (err) {
      console.error(err);
      setErro("Erro ao atualizar perfil.");
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
    <div>
      <h1 className="text-2xl font-semibold mb-2">Perfil</h1>
      <p className="text-sm text-slate-500 mb-6">
        Atualiza o teu nome, bio e imagem de perfil.
      </p>

      <form
        onSubmit={handleSubmit}
        className="max-w-xl bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4"
      >
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold text-lg overflow-hidden">
            {resolvedPreview ? (
              <img
                src={resolvedPreview}
                alt={name}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              inicial
            )}
          </div>
          <div className="space-y-1 text-xs text-slate-500">
            <p>Podes escolher uma imagem do teu computador (jpg, png, etc.).</p>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="block text-xs"
            />
          </div>
        </div>

        {/* Nome */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Nome
          </label>
          <input
            type="text"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Bio
          </label>
          <textarea
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        {/* URL opcional (por ex. imagem da internet) */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            URL da imagem (opcional)
          </label>
          <input
            type="text"
            placeholder="https://exemplo.com/avatar.jpg (só se quiseres usar uma imagem da internet)"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
          />
        </div>

        {erro && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {erro}
          </div>
        )}

        {mensagem && (
          <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-3 py-2">
            {mensagem}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {saving ? "A guardar..." : "Guardar alterações"}
        </button>
      </form>
    </div>
  );
}
