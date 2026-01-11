// src/layout/AppLayout.jsx
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import AddGameModal from "../components/AddGameModal";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const inicial = (user?.name || user?.email || "?")[0].toUpperCase();

  const navLinks = [
    { to: "/app/dashboard", label: "Dashboard" },
    { to: "/app/colecao", label: "Minha Coleção" },
    { to: "/app/wishlist", label: "Wishlist" },
    { to: "/app/estatisticas", label: "Estatísticas" },
  ];

  function handleAvatarClick() {
    navigate("/app/settings");
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

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
  const [toast, setToast] = useState({ show: false, text: "" });


  function showToast(text) {
    setToast({ show: true, text });
    setTimeout(() => setToast({ show: false, text: "" }), 2500);
  }

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
    showToast(`Adicionado à coleção: ${item?.title || "jogo"}`);
    await refreshCollectionExternalIds();

    // opcional: se quiseres ir logo para a coleção, descomenta
    // navigate("/app/colecao");
    // ou até abrir o detalhe (depende do backend devolver o id da entry)
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      {/* Toast simples */}
      {toast.show && (
        <div className="fixed right-4 top-4 z-[60] rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 shadow-md">
          {toast.text}
        </div>
      )}

      {/* Modal global RAWG */}
      <AddGameModal
        open={openSearch}
        onClose={() => setOpenSearch(false)}
        collectionExternalIds={collectionExternalIds}
        onAddedToCollection={onAddedToCollection}
      />

      {/* TOP BAR */}
      <header className="border-b border-indigo-700/60 bg-indigo-700 shadow-md">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Logo + nav */}
          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={() => navigate("/app/dashboard")}
              className="flex items-center gap-2 focus:outline-none"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 text-xl text-white">
                🎮
              </div>
              <div className="leading-tight text-left text-white">
                <div className="text-sm font-semibold tracking-wide">GameVault</div>
                <div className="text-[11px] text-indigo-100/90">
                  A tua coleção de videojogos
                </div>
              </div>
            </button>

            <nav className="hidden items-center gap-2 text-sm md:flex">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    [
                      "rounded-md px-3 py-1.5 transition-colors",
                      isActive
                        ? "bg-white text-indigo-700 font-medium shadow-sm"
                        : "text-indigo-100/90 hover:bg-indigo-600 hover:text-white",
                    ].join(" ")
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Search + user */}
          <div className="flex items-center gap-4">
            {/* Pesquisa global (abre modal) */}
            <button
              type="button"
              onClick={handleOpenGlobalSearch}
              className="hidden items-center gap-2 rounded-full bg-indigo-600/80 px-3 py-2 text-xs text-indigo-100 shadow-sm hover:bg-indigo-600 focus:outline-none sm:flex"
              title="Pesquisar e importar jogos (Ctrl+K)"
            >
              <span className="opacity-90">🔍</span>
              <span className="text-indigo-50/95">Pesquisar jogos…</span>
              <span className="ml-2 rounded-md bg-white/15 px-2 py-0.5 text-[10px] text-indigo-100/90">
                Ctrl K
              </span>
            </button>

            <div className="flex items-center gap-3">
              <div className="text-right leading-tight hidden sm:block">
                <div className="text-xs font-semibold text-white">
                  {user?.name || "Utilizador"}
                </div>
                <div className="text-[11px] text-indigo-100/90">Coleção de jogos</div>
              </div>

              {/* Avatar */}
              <button
                type="button"
                onClick={handleAvatarClick}
                title="Ver / editar perfil"
                className="relative h-9 w-9 overflow-hidden rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 shadow-sm ring-2 ring-white/60 hover:ring-sky-300 transition-all"
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
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md bg-white text-xs font-medium text-indigo-700 px-3 py-1.5 shadow-sm hover:bg-slate-50 transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 px-6 py-6 bg-slate-100">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_30px_rgba(15,23,42,0.12)]">
          <Outlet />
        </div>
      </main>

      {/* FOOTER */}
      <footer className="mt-2">
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400" />
        <div className="bg-slate-100 border-t border-slate-200">
          <div className="flex flex-col gap-3 px-6 py-3 text-[11px] text-slate-500 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-slate-700 font-semibold">GameVault</span>
              <span className="text-slate-400">·</span>
              <span>Gestor da tua biblioteca de videojogos</span>
            </div>

            <div className="flex flex-wrap gap-4">
              <span>Projeto Final — Desenvolvimento de Software</span>
              <span className="hidden md:inline text-slate-300">|</span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>API online</span>
              </span>
              <span className="hidden sm:inline">
                {new Date().getFullYear()} © Todos os direitos reservados
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
