// src/layout/AppLayout.jsx
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../components/Toast";
import api from "../services/api";
import AddGameModal from "../components/AddGameModal";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const inicial = (user?.name || user?.email || "?")[0].toUpperCase();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  const navLinks = [
    { to: "/app/dashboard", label: "Dashboard", icon: "🏠" },
    { to: "/app/colecao", label: "Coleção", icon: "🎮" },
    { to: "/app/wishlist", label: "Wishlist", icon: "❤️" },
    { to: "/app/estatisticas", label: "Estatísticas", icon: "📊" },
    { to: "/app/conquistas", label: "Conquistas", icon: "🏆" },
  ];

  function handleAvatarClick() {
    navigate("/app/settings");
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  // Fechar menu do utilizador ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Resolver URL do avatar: se vier como "/uploads/..." juntar o backend
  let avatarSrc = null;
  if (user?.avatar_url) {
    if (
      user.avatar_url.startsWith("http") ||
      user.avatar_url.startsWith("data:") ||
      user.avatar_url.startsWith("blob:")
    ) {
      avatarSrc = user.avatar_url;
    } else {
      avatarSrc = `http://localhost:4000${user.avatar_url}`;
    }
  }

  // -------------------------
  // Pesquisa global (RAWG)
  // -------------------------
  const [openSearch, setOpenSearch] = useState(false);
  const [collectionExternalIds, setCollectionExternalIds] = useState(new Set());
  const toast = useToast();

  async function refreshCollectionExternalIds() {
    try {
      const res = await api.get("/collection");
      const ids = new Set(
        (res.data.colecao || [])
          .map((j) => j.external_id)
          .filter((x) => x !== null && x !== undefined)
      );
      setCollectionExternalIds(ids);
    } catch (err) {
      // se falhar não estraga nada; só não bloqueia duplicados
      console.error(err);
    }
  }

  async function handleOpenGlobalSearch() {
    setOpenSearch(true);
    // carregar ids para bloquear duplicados (não bloqueia a abertura)
    refreshCollectionExternalIds();
  }

  // Ctrl+K / Cmd+K para abrir
  useEffect(() => {
    const onKeyDown = (e) => {
      const isCmdK = (e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K");
      if (!isCmdK) return;

      e.preventDefault();
      handleOpenGlobalSearch();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Quando algo é importado, avisar e atualizar ids
  async function onAddedToCollection(item) {
    toast.game(`Adicionado à coleção: ${item?.title || "jogo"}`, {
      title: "Jogo Adicionado! 🎉",
    });
    await refreshCollectionExternalIds();

    // opcional: se quiseres ir logo para a coleção, descomenta
    // navigate("/app/colecao");
    // ou até abrir o detalhe (depende do backend devolver o id da entry)
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Modal global RAWG */}
      <AddGameModal
        open={openSearch}
        onClose={() => setOpenSearch(false)}
        collectionExternalIds={collectionExternalIds}
        onAddedToCollection={onAddedToCollection}
      />

      {/* TOP BAR */}
      <header className="relative border-b border-indigo-600/50 dark:border-indigo-900/50 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 dark:from-indigo-950 dark:via-purple-950 dark:to-indigo-950 shadow-lg shadow-indigo-500/20">
        {/* Efeito de brilho animado */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
        </div>
        <div className="flex items-center justify-between px-6 py-3">
          {/* Logo + nav */}
          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={() => navigate("/app/dashboard")}
              className="group flex items-center gap-3 focus:outline-none transition-transform duration-300 hover:scale-105"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm text-xl text-white shadow-lg border border-white/20 group-hover:bg-white/30 group-hover:shadow-white/20 transition-all duration-300">
                🎮
              </div>
              <div className="leading-tight text-left text-white">
                <div className="text-base font-bold tracking-wide group-hover:tracking-wider transition-all duration-300">GameVault</div>
                <div className="text-[11px] text-white/70">
                  A tua coleção de videojogos
                </div>
              </div>
            </button>

            <nav className="hidden items-center gap-1.5 text-sm md:flex">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    [
                      "group flex items-center gap-2 rounded-xl px-3 py-2 transition-all duration-300",
                      isActive
                        ? "bg-white/95 text-indigo-700 font-semibold shadow-lg shadow-white/20 scale-105"
                        : "text-white/80 hover:bg-white/15 hover:text-white hover:scale-105",
                    ].join(" ")
                  }
                >
                  <span className="text-sm transition-transform duration-300 group-hover:scale-110">{link.icon}</span>
                  <span>{link.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Search + theme toggle + user */}
          <div className="flex items-center gap-4">
            {/* Pesquisa global (abre modal) */}
            <button
              type="button"
              onClick={handleOpenGlobalSearch}
              className="group hidden items-center gap-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2.5 text-sm text-white shadow-lg hover:bg-white/20 hover:border-white/30 hover:shadow-white/10 focus:outline-none sm:flex transition-all duration-300"
              title="Pesquisar e importar jogos (Ctrl+K)"
            >
              <span className="text-base transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">🔍</span>
              <span className="text-white/90">Pesquisar jogos…</span>
              <span className="ml-2 rounded-lg bg-white/20 px-2 py-1 text-[10px] font-medium text-white/80">
                Ctrl K
              </span>
            </button>

            {/* Toggle Tema */}
            <button
              type="button"
              onClick={toggleTheme}
              className="group flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-lg text-white shadow-lg hover:bg-white/20 hover:scale-110 hover:rotate-12 transition-all duration-300"
              title={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
            >
              <span className="transition-transform duration-300 group-hover:scale-110">
                {theme === "dark" ? "☀️" : "🌙"}
              </span>
            </button>

            <div className="flex items-center gap-3">
              <div className="text-right leading-tight hidden sm:block">
                <div className="text-xs font-semibold text-white">
                  {user?.name || "Utilizador"}
                </div>
                <div className="text-[11px] text-indigo-100/90">Coleção de jogos</div>
              </div>

              {/* Avatar com dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  title="Menu do utilizador"
                  className="group relative h-10 w-10 overflow-hidden rounded-xl bg-gradient-to-br from-indigo-400 to-purple-400 text-sm font-bold text-white shadow-lg ring-2 ring-white/40 hover:ring-white/60 hover:scale-110 transition-all duration-300"
                >
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={user?.name || user?.email || "Avatar"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="inline-flex h-full w-full items-center justify-center">
                      {inicial}
                    </span>
                  )}
                  {/* Indicador online */}
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white shadow-lg"></span>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-3 w-56 rounded-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl shadow-xl shadow-black/10 ring-1 ring-black/5 dark:ring-white/10 z-50 overflow-hidden animate-fadeIn">
                    {/* Header do dropdown */}
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold overflow-hidden">
                          {avatarSrc ? (
                            <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
                          ) : inicial}
                        </div>
                        <div>
                          <p className="font-semibold text-white text-sm">{user?.name || "Utilizador"}</p>
                          <p className="text-xs text-white/70">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-2">
                      <button
                        onClick={() => {
                          navigate(`/app/perfil/${user?.id}`);
                          setShowUserMenu(false);
                        }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
                      >
                        <span className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">👤</span>
                        O Meu Perfil
                      </button>
                      <button
                        onClick={() => {
                          navigate("/app/conquistas");
                          setShowUserMenu(false);
                        }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
                      >
                        <span className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">🏆</span>
                        Conquistas
                      </button>
                      <button
                        onClick={() => {
                          navigate("/app/settings");
                          setShowUserMenu(false);
                        }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
                      >
                        <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">⚙️</span>
                        Definições
                      </button>
                      <hr className="my-2 border-slate-200 dark:border-slate-700" />
                      <button
                        onClick={() => {
                          handleLogout();
                          setShowUserMenu(false);
                        }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
                      >
                        <span className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">🚪</span>
                        Sair
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 px-4 sm:px-6 py-6 bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20">
        <div className="w-full rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-5 shadow-xl shadow-slate-200/50 dark:shadow-black/20">
          <Outlet />
        </div>
      </main>

      {/* FOOTER */}
      <footer className="mt-2">
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-gradient" />
        <div className="bg-slate-50 dark:bg-slate-900/95 border-t border-slate-200/50 dark:border-slate-800">
          <div className="flex flex-col gap-3 px-6 py-4 text-xs text-slate-500 dark:text-slate-400 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm shadow-lg">🎮</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">GameVault</span>
              </div>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span>Gestor da tua biblioteca de videojogos</span>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                <span>🎓</span> Projeto Final — ISTEC
              </span>
              <span className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-full">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>API online</span>
              </span>
              <span className="hidden sm:inline text-slate-400">
                {new Date().getFullYear()} © Todos os direitos reservados
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
