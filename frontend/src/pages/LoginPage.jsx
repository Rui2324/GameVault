// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import ThemeToggle from "../components/ThemeToggle";

// Componentes Retro Locais
function RetroCard({ children, className = "", color = "fuchsia" }) {
  const colors = {
    fuchsia: "border-fuchsia-500 shadow-[4px_4px_0px_0px_rgba(217,70,239,0.8)]",
    cyan: "border-cyan-400 shadow-[4px_4px_0px_0px_rgba(34,211,238,0.8)]",
  };
  return (
    <div className={`bg-white dark:bg-slate-900 border-2 ${colors[color]} ${className}`}>
      {children}
    </div>
  );
}

function RetroButton({ children, onClick, className = "", color = "fuchsia", type = "button", disabled = false }) {
  const colors = {
    fuchsia: "border-fuchsia-500 bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/20 dark:text-fuchsia-400 hover:bg-fuchsia-500 hover:text-white shadow-[3px_3px_0px_0px_rgba(217,70,239,0.6)]",
    cyan: "border-cyan-400 bg-cyan-50 text-cyan-600 dark:bg-cyan-400/20 dark:text-cyan-400 hover:bg-cyan-400 hover:text-slate-900 shadow-[3px_3px_0px_0px_rgba(34,211,238,0.6)]",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`border-2 font-bold px-4 py-3 text-sm uppercase tracking-wide transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-50 disabled:cursor-not-allowed ${colors[color]} ${className}`}
    >
      {children}
    </button>
  );
}

export default function LoginPage() {
  const { login, setErro, erro } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [aCarregar, setACarregar] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setACarregar(true);
    try {
      await login(email, password);
      toast.success("Sessão iniciada com sucesso!", { title: "Bem-vindo! 👋" });
      navigate("/app");
    } catch (err) {
      console.error(err);
      setErro(err?.response?.data?.message || err?.response?.data?.mensagem || "Credenciais inválidas.");
    } finally {
      setACarregar(false);
    }
  }

  return (
    // Fundo alterado para bg-slate-200 no modo claro para reduzir o brilho
    <div className="min-h-screen flex items-center justify-center bg-slate-200 dark:bg-slate-950 relative overflow-hidden font-sans transition-colors duration-300">
      
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Grelha mais escura no modo claro (preto com 10% opacidade) para contraste */}
      <div className="absolute inset-0 
        bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] 
        dark:bg-[linear-gradient(rgba(217,70,239,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(217,70,239,0.05)_1px,transparent_1px)] 
        bg-[size:40px_40px]" 
      />
      
      {/* Scanline */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.03)_2px,rgba(0,0,0,0.03)_4px)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md p-4">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 border-4 border-cyan-400 bg-white dark:bg-slate-900 shadow-[4px_4px_0px_0px_rgba(34,211,238,0.8)] mb-4">
            <span className="text-4xl">🎮</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-wider">GameVault</h1>
          <p className="text-fuchsia-600 dark:text-fuchsia-400 font-bold text-sm tracking-widest mt-1">RETRO EDITION</p>
        </div>

        <RetroCard color="fuchsia" className="p-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wide border-b-2 border-fuchsia-500/30 pb-2">
            Iniciar Sessão
          </h2>

          {erro && (
            <div className="mb-6 p-3 border-2 border-rose-500 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
              <span>⚠️</span> {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-fuchsia-600 dark:text-fuchsia-400 uppercase mb-2">Email</label>
              <input
                type="email"
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white px-4 py-3 text-sm focus:outline-none focus:border-cyan-400 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@dominio.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-fuchsia-600 dark:text-fuchsia-400 uppercase mb-2">Palavra-passe</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-cyan-400 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                >
                  {showPassword ? "👁️" : "🔒"}
                </button>
              </div>
            </div>

            <RetroButton 
              type="submit" 
              disabled={aCarregar} 
              color="cyan" 
              className="w-full flex justify-center items-center gap-2 mt-4"
            >
              {aCarregar ? "A carregar..." : "Entrar ➤"}
            </RetroButton>
          </form>

          <div className="mt-6 pt-6 border-t-2 border-slate-200 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ainda não tens conta?{" "}
              <Link to="/registo" className="text-cyan-600 dark:text-cyan-400 hover:text-slate-900 dark:hover:text-white font-bold hover:underline">
                CRIAR CONTA
              </Link>
            </p>
          </div>
        </RetroCard>

        <p className="text-center text-[10px] text-slate-500 dark:text-slate-600 mt-8 font-mono uppercase">
          © 2026 GameVault. Insert Coin to Start.
        </p>
      </div>
    </div>
  );
}