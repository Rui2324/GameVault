// src/layout/AppLayout.jsx
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      {/* Barra azul no topo */}
      <header className="h-14 bg-indigo-700 text-white flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="font-semibold text-lg tracking-tight">
            GameVault
          </div>

          <nav className="hidden md:flex items-center gap-4 text-sm">
            <TopNavItem to="/app/dashboard" label="Dashboard" />
            <TopNavItem to="/app/colecao" label="Minha Coleção" />
            <TopNavItem to="/app/wishlist" label="Wishlist" />
            <TopNavItem to="/app/estatisticas" label="Estatísticas" />
            <TopNavItem to="/app/definicoes" label="Definições" disabled />
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center bg-indigo-600/60 rounded-full px-3 py-1 text-xs">
            <span className="opacity-80">🔍</span>
            <input
              type="text"
              placeholder="Pesquisar..."
              className="bg-transparent outline-none border-none ml-2 placeholder:text-indigo-100/70 text-indigo-50 text-xs w-40"
            />
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex flex-col items-end leading-tight">
              <span className="font-medium">{user?.name || "Utilizador"}</span>
              <span className="opacity-80">
                Coleção de jogos
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-semibold">
              {user?.name ? user.name[0].toUpperCase() : "U"}
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="ml-2 text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-md hover:bg-white transition"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="flex-1 px-6 py-5">
        <Outlet />
      </main>

      {/* Rodapé simples */}
      <footer className="h-10 border-t border-slate-200 flex items-center justify-between px-6 text-xs text-slate-500">
        <span>© {new Date().getFullYear()} GameVault</span>
        <span>Projeto Final — Desenvolvimento de Software</span>
      </footer>
    </div>
  );
}

function TopNavItem({ to, label, disabled = false }) {
  if (disabled) {
    return (
      <span className="opacity-50 cursor-not-allowed">
        {label}
      </span>
    );
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "px-3 py-1 rounded-md transition",
          isActive
            ? "bg-indigo-900/40 font-semibold"
            : "hover:bg-indigo-900/30",
        ].join(" ")
      }
    >
      {label}
    </NavLink>
  );
}
