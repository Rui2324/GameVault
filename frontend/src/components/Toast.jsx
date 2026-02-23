import { createContext, useContext, useState, useCallback } from "react";
import { Check, X, AlertTriangle, Info, Gamepad2, Trophy } from "lucide-react";

export const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast deve ser usado dentro de ToastProvider");
  }
  return context;
};

// Configurações por tipo
const toastConfig = {
  success: {
    icon: Check,
    gradient: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-50/95 dark:bg-emerald-900/90",
    border: "border-emerald-200/50 dark:border-emerald-700/50",
    text: "text-emerald-700 dark:text-emerald-200",
    progress: "bg-emerald-500",
  },
  error: {
    icon: X,
    gradient: "from-rose-500 to-pink-500",
    bg: "bg-rose-50/95 dark:bg-rose-900/90",
    border: "border-rose-200/50 dark:border-rose-700/50",
    text: "text-rose-700 dark:text-rose-200",
    progress: "bg-rose-500",
  },
  warning: {
    icon: AlertTriangle,
    gradient: "from-amber-500 to-orange-500",
    bg: "bg-amber-50/95 dark:bg-amber-900/90",
    border: "border-amber-200/50 dark:border-amber-700/50",
    text: "text-amber-700 dark:text-amber-200",
    progress: "bg-amber-500",
  },
  info: {
    icon: Info,
    gradient: "from-blue-500 to-cyan-500",
    bg: "bg-blue-50/95 dark:bg-blue-900/90",
    border: "border-blue-200/50 dark:border-blue-700/50",
    text: "text-blue-700 dark:text-blue-200",
    progress: "bg-blue-500",
  },
  game: {
    icon: Gamepad2,
    gradient: "from-indigo-500 to-purple-500",
    bg: "bg-indigo-50/95 dark:bg-indigo-900/90",
    border: "border-indigo-200/50 dark:border-indigo-700/50",
    text: "text-indigo-700 dark:text-indigo-200",
    progress: "bg-indigo-500",
  },
  achievement: {
    icon: Trophy,
    gradient: "from-yellow-500 to-amber-500",
    bg: "bg-yellow-50/95 dark:bg-yellow-900/90",
    border: "border-yellow-200/50 dark:border-yellow-700/50",
    text: "text-yellow-700 dark:text-yellow-200",
    progress: "bg-yellow-500",
  },
};

// Componente individual do Toast
function ToastItem({ toast, onRemove }) {
  const config = toastConfig[toast.type] || toastConfig.info;
  const duration = toast.duration || 4000;

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border backdrop-blur-xl shadow-xl
        ${config.bg} ${config.border}
        animate-slideIn
        transform transition-all duration-300 ease-out
        hover:scale-[1.02] hover:shadow-2xl
      `}
      style={{
        animation: `slideIn 0.4s ease-out, ${toast.removing ? 'slideOut 0.3s ease-in forwards' : ''}`,
      }}
    >
      {/* Conteúdo */}
      <div className="flex items-start gap-3 p-4">
        {/* Ícone com gradiente */}
        <div className={`
          flex h-10 w-10 shrink-0 items-center justify-center rounded-xl 
          bg-gradient-to-br ${config.gradient} text-white text-lg shadow-lg
        `}>
          {toast.icon ? (
            typeof toast.icon === 'string' ? toast.icon : <toast.icon size={20} />
          ) : (
            <config.icon size={20} />
          )}
        </div>

        {/* Texto */}
        <div className="flex-1 min-w-0 pt-0.5">
          {toast.title && (
            <p className={`font-semibold text-sm ${config.text}`}>
              {toast.title}
            </p>
          )}
          <p className={`text-sm ${config.text} ${toast.title ? 'opacity-80' : 'font-medium'}`}>
            {toast.message}
          </p>
        </div>

        {/* Botão fechar */}
        <button
          onClick={() => onRemove(toast.id)}
          className={`
            shrink-0 p-1 rounded-lg opacity-60 hover:opacity-100 
            hover:bg-black/5 dark:hover:bg-white/10 transition-all
            ${config.text}
          `}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Barra de progresso */}
      {toast.showProgress !== false && (
        <div className="h-1 w-full bg-black/5 dark:bg-white/10">
          <div
            className={`h-full ${config.progress} origin-left`}
            style={{
              animation: `shrink ${duration}ms linear forwards`,
            }}
          />
        </div>
      )}
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, removing: true } : t))
    );

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const addToast = useCallback((options) => {
    const id = Date.now() + Math.random();
    const duration = options.duration || 4000;

    const newToast = {
      id,
      type: options.type || "info",
      message: options.message || "",
      title: options.title,
      icon: options.icon,
      duration,
      showProgress: options.showProgress,
      removing: false,
    };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, duration);

    return id;
  }, [removeToast]);

  // Helpers para cada tipo
  const success = useCallback((message, options = {}) => {
    return addToast({ ...options, type: "success", message });
  }, [addToast]);

  const error = useCallback((message, options = {}) => {
    return addToast({ ...options, type: "error", message });
  }, [addToast]);

  const warning = useCallback((message, options = {}) => {
    return addToast({ ...options, type: "warning", message });
  }, [addToast]);

  const info = useCallback((message, options = {}) => {
    return addToast({ ...options, type: "info", message });
  }, [addToast]);

  const game = useCallback((message, options = {}) => {
    return addToast({ ...options, type: "game", message });
  }, [addToast]);

  const achievement = useCallback((message, options = {}) => {
    return addToast({ ...options, type: "achievement", message, duration: 6000 });
  }, [addToast]);

  const value = {
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    game,
    achievement,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Container dos toasts */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
