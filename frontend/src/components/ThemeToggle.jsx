import { useTheme } from "../context/ThemeContext";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
      className={`
        group flex items-center justify-center w-10 h-10 
        border-2 transition-all duration-200 cursor-pointer
        hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none
        ${theme === "dark" 
          ? "bg-slate-800 border-yellow-400 text-yellow-400 shadow-[3px_3px_0px_0px_rgba(250,204,21,0.6)] hover:bg-yellow-400 hover:text-slate-900" 
          : "bg-white border-slate-900 text-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,0.6)] hover:bg-slate-900 hover:text-white"
        }
        ${className}
      `}
    >
      {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}