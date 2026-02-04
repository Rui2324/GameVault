// src/layout/AppLayout.jsx
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../components/Toast";
import api from "../services/api";
import AddGameModal from "../components/AddGameModal";
import { Gamepad2, Search, Sun, Moon, User, Trophy, Settings as SettingsIcon, LogOut, GraduationCap, Shield, Menu, X } from "lucide-react";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const inicial = (user?.name || user?.email || "?")[0].toUpperCase();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const userMenuRef = useRef(null);

  const navLinks = [
    { to: "/app/home", label: "Início", icon: "" },
    { to: "/app/colecao", label: "Coleção", icon: "" },
    { to: "/app/wishlist", label: "Wishlist", icon: "" },
    { to: "/app/estatisticas", label: "Estatísticas", icon: "" },
    { to: "/app/conquistas", label: "Conquistas", icon: "" },
    ...(user?.role === 'admin' ? [{ to: "/app/admin", label: "Admin", icon: "" }] : []),
  ];

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

  // Fechar menu mobile quando navegar
  useEffect(() => {
    setShowMobileMenu(false);
  }, [navigate]);

  // Bloquear scroll quando menu mobile está aberto
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showMobileMenu]);

  // Resolver URL do avatar
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

  // Pesquisa global (RAWG)
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
      console.error(err);
    }
  }

  async function handleOpenGlobalSearch() {
    setOpenSearch(true);
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

  async function onAddedToCollection(item) {
    toast.game(`Adicionado à coleção: ${item?.title || "jogo"}`, {
      title: "Jogo Adicionado! 🎉",
    });
    await refreshCollectionExternalIds();
  }

  return (
    // MUDANÇA: bg-slate-50 (mais claro) em vez de bg-slate-100 para o modo claro
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors font-sans">
      {/* Modal global RAWG */}
      <AddGameModal
        open={openSearch}
        onClose={() => setOpenSearch(false)}
        collectionExternalIds={collectionExternalIds}
        onAddedToCollection={onAddedToCollection}
      />

      {/* TOP BAR - RETRO STYLE */}
      {/* MUDANÇA: bg-white forçado no header */}
      <header className="relative border-b-4 border-fuchsia-500 bg-white dark:bg-slate-900 z-50">
        {/* Grid pattern - Aumentei opacidade no light mode para ver melhor o efeito retro */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(217,70,239,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(217,70,239,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(217,70,239,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(217,70,239,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
        
        <div className="relative flex items-center justify-between px-4 sm:px-6 py-3">
          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden flex h-10 w-10 items-center justify-center border-2 border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 shadow-[3px_3px_0px_0px_rgba(217,70,239,0.6)] hover:bg-fuchsia-500 hover:text-white transition-all"
          >
            {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Logo + nav */}
          <div className="flex items-center gap-4 lg:gap-8">
            <button
              type="button"
              onClick={() => navigate("/app/home")}
              className="group flex items-center gap-2 sm:gap-3 focus:outline-none"
            >
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center border-2 border-cyan-400 bg-cyan-400/10 text-xl text-cyan-600 dark:text-cyan-400 shadow-[3px_3px_0px_0px_rgba(34,211,238,0.6)] group-hover:bg-cyan-400 group-hover:text-slate-900 transition-all">
                <Gamepad2 size={20} />
              </div>
              <div className="leading-tight text-left hidden sm:block">
                <div className="text-base font-black tracking-wider text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">GAMEVAULT</div>
                <div className="text-[10px] text-fuchsia-600 dark:text-fuchsia-400 font-bold uppercase tracking-widest">
                  Retro Edition
                </div>
              </div>
            </button>

            <nav className="hidden items-center gap-1 lg:gap-2 text-sm md:flex">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    [
                      "group flex items-center gap-2 px-2 lg:px-4 py-2 border-2 font-bold text-xs lg:text-sm uppercase tracking-wide transition-all",
                      isActive
                        ? "border-cyan-400 bg-cyan-400 text-slate-900 shadow-[3px_3px_0px_0px_rgba(34,211,238,0.6)]"
                        : "border-transparent hover:border-fuchsia-500 text-slate-700 dark:text-slate-400 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-500/10",
                    ].join(" ")
                  }
                >
                  <span className="text-lg">{link.icon}</span>
                  <span>{link.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Search + theme toggle + user */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Pesquisa global - Mobile icon only */}
            <button
              type="button"
              onClick={handleOpenGlobalSearch}
              className="group flex sm:hidden h-10 w-10 items-center justify-center border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-400/10 text-yellow-700 dark:text-yellow-400 shadow-[3px_3px_0px_0px_rgba(250,204,21,0.6)] hover:bg-yellow-400 hover:text-slate-900 transition-all"
              title="Pesquisar (Ctrl+K)"
            >
              <Search size={18} />
            </button>

            {/* Pesquisa global - Desktop full button */}
            <button
              type="button"
              onClick={handleOpenGlobalSearch}
              className="group hidden items-center gap-2 border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-400/10 px-3 lg:px-4 py-2 text-sm text-yellow-700 dark:text-yellow-400 font-bold uppercase tracking-wide shadow-[3px_3px_0px_0px_rgba(250,204,21,0.6)] hover:bg-yellow-400 hover:text-slate-900 transition-all sm:flex"
              title="Pesquisar e importar jogos (Ctrl+K)"
            >
              <Search size={16} />
              <span className="hidden lg:inline">Pesquisar</span>
              <span className="hidden lg:inline ml-2 border border-yellow-600/30 dark:border-yellow-400/50 px-1.5 py-0.5 text-[10px] bg-white/50 dark:bg-transparent">
                Ctrl K
              </span>
            </button>

            {/* Toggle Tema */}
            <button
              type="button"
              onClick={toggleTheme}
              className="group flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center border-2 border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-500/10 text-lg text-fuchsia-600 dark:text-fuchsia-400 shadow-[3px_3px_0px_0px_rgba(217,70,239,0.6)] hover:bg-fuchsia-500 hover:text-white transition-all"
              title={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-right leading-tight hidden sm:block">
                <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                  {user?.name || "Utilizador"}
                </div>
                <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium">Online</div>
              </div>

              {/* Avatar com dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  title="Menu do utilizador"
                  className="group relative h-10 w-10 overflow-hidden border-2 border-green-400 bg-green-50 dark:bg-green-400/20 text-sm font-bold text-green-700 dark:text-green-400 shadow-[3px_3px_0px_0px_rgba(74,222,128,0.6)] hover:bg-green-400 hover:text-slate-900 transition-all"
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
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-400 border-2 border-white dark:border-slate-900"></span>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-3 w-64 border-2 border-slate-200 dark:border-fuchsia-500 bg-white dark:bg-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] dark:shadow-[4px_4px_0px_0px_rgba(217,70,239,0.8)] z-50 overflow-hidden rounded-lg">
                    <div className="bg-slate-50 dark:bg-fuchsia-500/20 border-b border-slate-200 dark:border-fuchsia-500 p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 border-2 border-cyan-400 bg-cyan-400/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-bold overflow-hidden rounded">
                          {avatarSrc ? (
                            <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
                          ) : inicial}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm uppercase">{user?.name || "Utilizador"}</p>
                          <p className="text-xs text-slate-500 dark:text-fuchsia-400">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-2 bg-white dark:bg-slate-900">
                      <button
                        onClick={() => { navigate(`/app/perfil/${user?.id}`); setShowUserMenu(false); }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-cyan-400/20 hover:text-cyan-700 dark:hover:text-cyan-400 transition-colors font-medium rounded-md"
                      >
                        <User size={16} /> O Meu Perfil
                      </button>
                      <button
                        onClick={() => { navigate("/app/conquistas"); setShowUserMenu(false); }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-yellow-400/20 hover:text-yellow-700 dark:hover:text-yellow-400 transition-colors font-medium rounded-md"
                      >
                        <Trophy size={16} /> Conquistas
                      </button>
                      <button
                        onClick={() => { navigate("/app/settings"); setShowUserMenu(false); }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-fuchsia-400/20 hover:text-fuchsia-700 dark:hover:text-fuchsia-400 transition-colors font-medium rounded-md"
                      >
                        <SettingsIcon size={16} /> Definições
                      </button>
                      <hr className="my-2 border-slate-200 dark:border-slate-700" />
                      <button
                        onClick={() => { handleLogout(); setShowUserMenu(false); }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/20 hover:text-rose-700 dark:hover:text-rose-300 transition-colors font-medium rounded-md"
                      >
                        <LogOut size={16} /> Sair
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {showMobileMenu && (
          <div className="md:hidden fixed inset-0 top-[65px] z-40 bg-white dark:bg-slate-900 border-t-2 border-fuchsia-500">
            <nav className="flex flex-col p-4 space-y-2">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setShowMobileMenu(false)}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-3 px-4 py-3 border-2 font-bold text-sm uppercase tracking-wide transition-all",
                      isActive
                        ? "border-cyan-400 bg-cyan-400 text-slate-900 shadow-[3px_3px_0px_0px_rgba(34,211,238,0.6)]"
                        : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-400 hover:border-fuchsia-500 hover:text-fuchsia-600 dark:hover:text-fuchsia-400",
                    ].join(" ")
                  }
                >
                  <span className="text-lg">{link.icon}</span>
                  <span>{link.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* CONTEÚDO PRINCIPAL - RETRO */}
      <main className="flex-1 px-3 sm:px-4 md:px-6 py-4 sm:py-6 bg-slate-100 dark:bg-slate-950">
        {/* Scanline effect (mais subtil no claro) */}
        <div className="fixed inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.01)_2px,rgba(0,0,0,0.01)_4px)] dark:bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.03)_2px,rgba(0,0,0,0.03)_4px)] pointer-events-none z-10" />
        
        {/* Container Principal: Branco Puro no Light Mode com borda definida */}
        <div className="relative z-0 w-full border-2 border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-slate-900 p-3 sm:p-5 shadow-sm dark:shadow-[0_0_30px_rgba(34,211,238,0.1)] rounded-xl">
          <Outlet />
        </div>
      </main>

      {/* FOOTER - RETRO */}
      <footer className="mt-0">
        <div className="h-1 bg-gradient-to-r from-fuchsia-500 via-cyan-400 to-yellow-400" />
        <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
          <div className="flex flex-col gap-3 px-4 sm:px-6 py-4 text-xs md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 sm:h-8 sm:w-8 border-2 border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-500/20 flex items-center justify-center text-fuchsia-600 dark:text-fuchsia-400 text-sm"><Gamepad2 size={14} /></span>
                <span className="text-slate-900 dark:text-white font-black uppercase tracking-wider text-xs sm:text-sm">GameVault</span>
              </div>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
              <span className="text-slate-500 dark:text-slate-500 hidden sm:inline">Retro Gaming Collection</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <span className="flex items-center gap-1 sm:gap-2 border border-slate-300 dark:border-slate-700 px-2 sm:px-3 py-1 sm:py-1.5 text-slate-600 dark:text-slate-400 rounded text-[10px] sm:text-xs">
                <GraduationCap size={14} /> ISTEC 2026
              </span>
              <span className="flex items-center gap-1 sm:gap-2 border border-green-500/50 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 px-2 sm:px-3 py-1 sm:py-1.5 rounded text-[10px] sm:text-xs">
                <span className="h-2 w-2 bg-green-500 dark:bg-green-400 animate-pulse rounded-full" />
                <span>ONLINE</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}