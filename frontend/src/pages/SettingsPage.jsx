// src/pages/SettingsPage.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../components/Toast";
import ImageCropper from "../components/ImageCropper"; // <--- IMPORTANTE: Importar o Cropper

// Componente RetroCard
function RetroCard({ children, className = "", color = "fuchsia" }) {
  const colors = {
    fuchsia: "border-fuchsia-500 shadow-[4px_4px_0px_0px_rgba(217,70,239,0.5)]",
    cyan: "border-cyan-400 shadow-[4px_4px_0px_0px_rgba(34,211,238,0.5)]",
    yellow: "border-yellow-400 shadow-[4px_4px_0px_0px_rgba(250,204,21,0.5)]",
    green: "border-green-400 shadow-[4px_4px_0px_0px_rgba(74,222,128,0.5)]",
    rose: "border-rose-500 shadow-[4px_4px_0px_0px_rgba(244,63,94,0.5)]",
    purple: "border-purple-500 shadow-[4px_4px_0px_0px_rgba(168,85,247,0.5)]"
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border-2 ${colors[color]} ${className}`}>
      {children}
    </div>
  );
}

// Componente RetroButton
function RetroButton({ children, onClick, className = "", color = "fuchsia", type = "button", disabled = false }) {
  const colors = {
    fuchsia: "border-fuchsia-500 bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/20 dark:text-fuchsia-400 hover:bg-fuchsia-500 hover:text-white shadow-[3px_3px_0px_0px_rgba(217,70,239,0.6)]",
    cyan: "border-cyan-400 bg-cyan-50 text-cyan-600 dark:bg-cyan-400/20 dark:text-cyan-400 hover:bg-cyan-400 hover:text-slate-900 shadow-[3px_3px_0px_0px_rgba(34,211,238,0.6)]",
    yellow: "border-yellow-400 bg-yellow-50 text-yellow-600 dark:bg-yellow-400/20 dark:text-yellow-400 hover:bg-yellow-400 hover:text-slate-900 shadow-[3px_3px_0px_0px_rgba(250,204,21,0.6)]",
    green: "border-green-400 bg-green-50 text-green-600 dark:bg-green-400/20 dark:text-green-400 hover:bg-green-400 hover:text-slate-900 shadow-[3px_3px_0px_0px_rgba(74,222,128,0.6)]",
    rose: "border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 hover:bg-rose-500 hover:text-white shadow-[3px_3px_0px_0px_rgba(244,63,94,0.6)]"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`border-2 font-bold px-4 py-2.5 transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none disabled:opacity-50 disabled:cursor-not-allowed ${colors[color]} ${className}`}
    >
      {children}
    </button>
  );
}

export default function SettingsPage() {
  const { user, atualizarPerfil, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();

  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState(user?.avatar_url || "");
  const [saving, setSaving] = useState(false);
  const [isPublic, setIsPublic] = useState(user?.is_public !== false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [showInRanking, setShowInRanking] = useState(true);

  // --- NOVO: Estados para o ImageCropper ---
  const [imageSrc, setImageSrc] = useState(null);
  const [showCropper, setShowCropper] = useState(false);

  // --- NOVO: Função que lê o ficheiro e abre o Cropper ---
  function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result);
        setShowCropper(true); // Abre o modal
      });
      reader.readAsDataURL(file);
    }
    // Limpar o input para permitir selecionar a mesma foto se cancelar
    e.target.value = null;
  }

  // --- NOVO: Função chamada quando o corte termina ---
  function handleCropComplete(croppedBlob) {
    setAvatarFile(croppedBlob); // Guarda o blob pronto a enviar
    setPreview(URL.createObjectURL(croppedBlob)); // Atualiza a preview visual
    setShowCropper(false); // Fecha o modal
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("bio", bio);
      
      if (avatarFile) {
        // Enviar o blob com um nome de ficheiro
        formData.append("avatar", avatarFile, "avatar.jpg");
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
  const resolvedPreview = (preview || avatarUrl) ? ((preview || avatarUrl).startsWith("data:") || (preview || avatarUrl).startsWith("blob:") || (preview || avatarUrl).startsWith("http") ? (preview || avatarUrl) : `http://localhost:4000${(preview || avatarUrl)}`) : "";

  return (
    <div className="space-y-6 relative">
      
      {/* --- NOVO: Renderizar o Cropper se showCropper for true --- */}
      {showCropper && (
        <ImageCropper 
          imageSrc={imageSrc}
          onCancel={() => setShowCropper(false)}
          onCropComplete={handleCropComplete}
        />
      )}

      {/* Header Retro */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-900 border-2 border-fuchsia-500/30 shadow-sm">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(217,70,239,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(217,70,239,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
        <div className="relative flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚙️</span>
            <div>
              <h1 className="text-2xl font-bold text-fuchsia-600 dark:text-fuchsia-400 tracking-wider uppercase">Definições</h1>
              <p className="text-cyan-600 dark:text-cyan-400 text-sm font-mono">&gt; Personaliza o teu perfil_</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-1">
            <div className="w-3 h-3 bg-fuchsia-500" /><div className="w-3 h-3 bg-cyan-400" /><div className="w-3 h-3 bg-yellow-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna Esquerda - Perfil */}
        <div className="space-y-6">
          <form onSubmit={handleSubmit}>
            <RetroCard color="fuchsia" className="p-6 space-y-5">
              <h2 className="text-lg font-bold text-fuchsia-600 dark:text-fuchsia-400 flex items-center gap-2 uppercase tracking-wide">
                <span className="text-xl">👤</span> Perfil
              </h2>
              
              {/* Avatar */}
              <div className="flex items-center gap-5 p-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-fuchsia-500/30">
                <div className="relative group">
                  <div className="h-16 w-16 border-2 border-cyan-400 bg-white dark:bg-slate-800 flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-bold text-xl overflow-hidden shadow-sm">
                    {resolvedPreview ? <img src={resolvedPreview} alt={name} className="h-16 w-16 object-cover" /> : inicial}
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Foto de perfil</p>
                  <label className="inline-flex items-center gap-2 cursor-pointer border-2 border-cyan-400/50 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:bg-cyan-400 hover:text-slate-900 transition-all">
                    <span>📷</span> Escolher ficheiro
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Campos */}
              <div>
                <label className="block text-sm font-medium text-fuchsia-600 dark:text-fuchsia-400 mb-2 uppercase tracking-wide">Nome</label>
                <input type="text" className="w-full border-2 border-fuchsia-500/50 px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-fuchsia-500 transition-all" placeholder="O teu nome" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-fuchsia-600 dark:text-fuchsia-400 mb-2 uppercase tracking-wide">Bio</label>
                <textarea className="w-full border-2 border-fuchsia-500/50 px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-fuchsia-500 transition-all resize-none" rows={3} placeholder="Conta-nos sobre ti..." value={bio} onChange={(e) => setBio(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-fuchsia-600 dark:text-fuchsia-400 mb-2 uppercase tracking-wide">URL da imagem (opcional)</label>
                <input type="text" placeholder="https://exemplo.com/avatar.jpg" className="w-full border-2 border-fuchsia-500/50 px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-fuchsia-500 transition-all" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
              </div>

              <RetroButton type="submit" disabled={saving} color="fuchsia" className="w-full flex items-center justify-center gap-2">
                {saving ? "⏳ A guardar..." : "💾 Guardar alterações"}
              </RetroButton>
            </RetroCard>
          </form>

          {/* Conta */}
          <RetroCard color="cyan" className="p-6 space-y-4">
            <h2 className="text-lg font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-2 uppercase tracking-wide">
              <span className="text-xl">📧</span> Conta
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-cyan-400/30">
                <span className="text-slate-500 dark:text-slate-400">Email</span>
                <span className="font-medium text-slate-700 dark:text-slate-300 font-mono">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-cyan-400/30">
                <span className="text-slate-500 dark:text-slate-400">Membro desde</span>
                <span className="font-medium text-slate-700 dark:text-slate-300 font-mono">{user?.created_at ? new Date(user.created_at).toLocaleDateString("pt-PT", { year: "numeric", month: "short" }) : "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500 dark:text-slate-400">Nível</span>
                <span className="font-bold text-yellow-600 dark:text-yellow-400">Nível {user?.level || 1}</span>
              </div>
            </div>
          </RetroCard>
        </div>

        {/* Coluna Direita - Preferências */}
        <div className="space-y-6">
          <RetroCard color="yellow" className="p-6 space-y-4">
            <h2 className="text-lg font-bold text-yellow-600 dark:text-yellow-400 flex items-center gap-2 uppercase tracking-wide"><span className="text-xl">🎨</span> Aparência</h2>
            <ToggleOption icon={theme === "dark" ? "🌙" : "☀️"} iconColor="yellow" title="Tema" description={theme === "dark" ? "Modo escuro" : "Modo claro"} checked={theme === "dark"} onChange={toggleTheme} color="yellow" />
          </RetroCard>

          <RetroCard color="green" className="p-6 space-y-4">
            <h2 className="text-lg font-bold text-green-600 dark:text-green-400 flex items-center gap-2 uppercase tracking-wide"><span className="text-xl">🔒</span> Privacidade</h2>
            <ToggleOption icon="👁️" iconColor="green" title="Perfil Público" description="Visível para outros" checked={isPublic} onChange={() => { setIsPublic(!isPublic); toast.info(isPublic ? "Perfil privado" : "Perfil público"); }} color="green" />
            <ToggleOption icon="🏆" iconColor="yellow" title="Ranking" description="Mostrar no leaderboard" checked={showInRanking} onChange={() => { setShowInRanking(!showInRanking); toast.info(showInRanking ? "Removido do ranking" : "Adicionado ao ranking"); }} color="yellow" />
          </RetroCard>

          <RetroCard color="cyan" className="p-6 space-y-4">
            <h2 className="text-lg font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-2 uppercase tracking-wide"><span className="text-xl">🔔</span> Notificações</h2>
            <ToggleOption icon="✉️" iconColor="cyan" title="Email" description="Receber atualizações" checked={emailNotifications} onChange={() => { setEmailNotifications(!emailNotifications); toast.info(emailNotifications ? "Desativadas" : "Ativadas"); }} color="cyan" />
          </RetroCard>

          <RetroCard color="rose" className="p-6 space-y-4">
            <h2 className="text-lg font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2 uppercase tracking-wide"><span className="text-xl">⚠️</span> Zona de Perigo</h2>
            <RetroButton onClick={() => { if (confirm("Terminar sessão?")) logout(); }} color="cyan" className="w-full flex items-center justify-center gap-2">🚪 Terminar sessão</RetroButton>
            <RetroButton onClick={() => { if (confirm("Eliminar conta?")) toast.error("Funcionalidade não implementada"); }} color="rose" className="w-full flex items-center justify-center gap-2">🗑️ Eliminar conta</RetroButton>
          </RetroCard>
        </div>
      </div>
    </div>
  );
}

// Componente Toggle reutilizável
function ToggleOption({ icon, iconColor, title, description, checked, onChange, color }) {
  const borderColors = {
    yellow: "border-yellow-400/30", green: "border-green-400/30", cyan: "border-cyan-400/30", fuchsia: "border-fuchsia-500/30"
  };
  const iconBgColors = {
    yellow: "bg-yellow-50 text-yellow-600 border-yellow-400 dark:bg-yellow-400/20 dark:text-yellow-400",
    green: "bg-green-50 text-green-600 border-green-400 dark:bg-green-400/20 dark:text-green-400",
    cyan: "bg-cyan-50 text-cyan-600 border-cyan-400 dark:bg-cyan-400/20 dark:text-cyan-400",
    fuchsia: "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-500 dark:bg-fuchsia-500/20 dark:text-fuchsia-400"
  };
  const toggleColors = {
    yellow: checked ? "bg-yellow-400 border-yellow-400" : "bg-slate-300 dark:bg-slate-700 border-slate-400 dark:border-slate-600",
    green: checked ? "bg-green-400 border-green-400" : "bg-slate-300 dark:bg-slate-700 border-slate-400 dark:border-slate-600",
    cyan: checked ? "bg-cyan-400 border-cyan-400" : "bg-slate-300 dark:bg-slate-700 border-slate-400 dark:border-slate-600",
    fuchsia: checked ? "bg-fuchsia-500 border-fuchsia-500" : "bg-slate-300 dark:bg-slate-700 border-slate-400 dark:border-slate-600"
  };

  return (
    <div className={`flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 border-2 ${borderColors[color]}`}>
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 border-2 flex items-center justify-center text-sm ${iconBgColors[iconColor]}`}>{icon}</div>
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-300">{title}</p>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <button onClick={onChange} className={`relative w-11 h-6 border-2 transition-colors duration-300 ${toggleColors[color]}`}>
        <span className={`absolute left-0.5 top-0.5 w-4 h-4 bg-white dark:bg-slate-900 transition-transform duration-300 ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}