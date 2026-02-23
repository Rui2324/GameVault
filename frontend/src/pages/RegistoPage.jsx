import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import ThemeToggle from "../components/ThemeToggle";
import { Gamepad2, Eye, EyeOff, AlertTriangle, ChevronLeft, UserPlus } from "lucide-react";

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

export default function RegistoPage() {
  const { registar, setErro, erro } = useAuth();
  const toast = useToast();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [aCarregar, setACarregar] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const getPasswordStrength = () => {
    if (!password) return { strength: 0, label: "", color: "bg-slate-300 dark:bg-slate-700" };
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength, label: "FRACA", color: "bg-rose-500" };
    if (strength <= 3) return { strength, label: "MÉDIA", color: "bg-yellow-400" };
    return { strength, label: "FORTE", color: "bg-green-400" };
  };

  const passwordStrength = getPasswordStrength();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (password !== confirmacao) {
      setErro("As palavras-passe não coincidem.");
      return;
    }

    if (password.length < 6) {
      setErro("A palavra-passe deve ter pelo menos 6 caracteres.");
      return;
    }

    setACarregar(true);
    try {
      await registar(nome, email, password);
      toast.success("Conta criada com sucesso!", { title: "Bem-vindo ao GameVault! 🎉" });
      navigate("/app");
    } catch (err) {
      console.error(err);
      setErro(err?.response?.data?.message || err?.response?.data?.mensagem || "Erro ao criar conta.");
    } finally {
      setACarregar(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-200 dark:bg-slate-950 relative overflow-hidden font-sans py-6 sm:py-10 transition-colors duration-300 px-4">
      
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Grelha mais escura no modo claro */}
      <div className="absolute inset-0 
        bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] 
        dark:bg-[linear-gradient(rgba(34,211,238,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.05)_1px,transparent_1px)] 
        bg-[size:40px_40px]" 
      />
      
      {/* Scanline */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.03)_2px,rgba(0,0,0,0.03)_4px)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md p-2 sm:p-4">
        {/* Link voltar */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-1 text-xs sm:text-sm text-slate-500 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 mb-4 sm:mb-6 font-bold transition-colors"
        >
          <ChevronLeft size={16} /> Voltar ao início
        </Link>

        {/* Logo/Brand */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 border-4 border-fuchsia-500 bg-white dark:bg-slate-900 shadow-[4px_4px_0px_0px_rgba(217,70,239,0.8)] mb-3 sm:mb-4">
            <Gamepad2 size={24} className="text-fuchsia-500 sm:w-8 sm:h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-wider">GameVault</h1>
          <p className="text-cyan-600 dark:text-cyan-400 font-bold text-xs sm:text-sm tracking-widest mt-1">PLAYER ONE START</p>
        </div>

        <RetroCard color="cyan" className="p-4 sm:p-8">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 uppercase tracking-wide border-b-2 border-cyan-500/30 pb-2">
            Criar Conta
          </h2>

          {erro && (
            <div className="mb-4 sm:mb-6 p-2 sm:p-3 border-2 border-rose-500 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] sm:text-xs font-bold flex items-center gap-2">
              <AlertTriangle size={14} /> {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase mb-1 sm:mb-2">Nome</label>
              <input
                type="text"
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white px-3 sm:px-4 py-2 sm:py-3 text-sm focus:outline-none focus:border-fuchsia-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="O teu nome"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase mb-2">Email</label>
              <input
                type="email"
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white px-4 py-3 text-sm focus:outline-none focus:border-fuchsia-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@dominio.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase mb-2">Palavra-passe</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-fuchsia-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 transition-colors"
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
              {/* Strength Meter Retro */}
              {password && (
                <div className="mt-2 flex gap-1 h-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`flex-1 border border-slate-300 dark:border-slate-900 ${
                        level <= passwordStrength.strength ? passwordStrength.color : "bg-slate-300 dark:bg-slate-700"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase mb-2">Confirmar</label>
              <input
                type={showPassword ? "text" : "password"}
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white px-4 py-3 text-sm focus:outline-none focus:border-fuchsia-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600"
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <RetroButton 
              type="submit" 
              disabled={aCarregar} 
              color="fuchsia" 
              className="w-full flex justify-center items-center gap-2 mt-6"
            >
              {aCarregar ? "A criar..." : "REGISTAR ➤"}
            </RetroButton>
          </form>

          <div className="mt-6 pt-6 border-t-2 border-slate-200 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Já tens conta?{" "}
              <Link to="/login" className="text-fuchsia-600 dark:text-fuchsia-400 hover:text-slate-900 dark:hover:text-white font-bold hover:underline">
                ENTRAR
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