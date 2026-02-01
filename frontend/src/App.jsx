// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import LoginPage from "./pages/LoginPage";
import RegistoPage from "./pages/RegistoPage";
import HomePage from "./pages/HomePage";
import CollectionPage from "./pages/CollectionPage";
import WishlistPage from "./pages/WishlistPage";
import StatsPage from "./pages/StatsPage";
import SettingsPage from "./pages/SettingsPage";
import GameDetailsPage from "./pages/GameDetailsPage";
import ExternalGameDetailsPage from "./pages/ExternalGameDetailsPage";
import AchievementsPage from "./pages/AchievementsPage";
import PublicProfilePage from "./pages/PublicProfilePage";
import SteamImportPage from "./pages/SteamImportPage"; // <--- 1. IMPORTAR A PÁGINA
import SteamWishlistImportPage from "./pages/SteamWishlistImportPage";
import AppLayout from "./layout/AppLayout";

function RotaProtegida({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100">
        <p>A carregar...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registo" element={<RegistoPage />} />

      <Route
        path="/app"
        element={
          <RotaProtegida>
            <AppLayout />
          </RotaProtegida>
        }
      >
        <Route path="home" element={<HomePage />} />
        <Route path="colecao" element={<CollectionPage />} />
        <Route path="wishlist" element={<WishlistPage />} />
        <Route path="estatisticas" element={<StatsPage />} />
        <Route path="conquistas" element={<AchievementsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        
        {/* ROTA NOVA DA STEAM */}
        <Route path="steam-import" element={<SteamImportPage />} />

        <Route path="steam-wishlist-import" element={<SteamWishlistImportPage />} />

        <Route path="perfil/:identifier" element={<PublicProfilePage />} />

        {/* Detalhe da tua entrada na coleção */}
        <Route path="jogo/:id" element={<GameDetailsPage />} />

        {/* Detalhe RAWG (explorar) */}
        <Route path="explorar/:externalId" element={<ExternalGameDetailsPage />} />

        <Route index element={<Navigate to="home" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}