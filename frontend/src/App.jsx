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
import SteamImportPage from "./pages/SteamImportPage";
import SteamWishlistImportPage from "./pages/SteamWishlistImportPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminUserPage from "./pages/AdminUserPage";
import AdminLogsPage from "./pages/AdminLogsPage";
import AdminReviewsPage from "./pages/AdminReviewsPage";
import AdminAnalyticsPage from "./pages/AdminAnalyticsPage";
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
  const { user } = useAuth();
  
  return (
    <Routes>
      {/* ============ ROTAS PÚBLICAS ============ */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registo" element={<RegistoPage />} />

      {/* ============ ROTAS PROTEGIDAS ============ */}
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
        
        {/* Admin Dashboard */}
        <Route path="admin" element={<AdminDashboardPage />} />
        <Route path="admin/user/:userId" element={<AdminUserPage />} />
        <Route path="admin/logs" element={<AdminLogsPage />} />
        <Route path="admin/reviews" element={<AdminReviewsPage />} />
        <Route path="admin/analytics" element={<AdminAnalyticsPage />} />
        
        {/* Steam Import */}
        <Route path="steam-import" element={<SteamImportPage />} />
        <Route path="steam-wishlist-import" element={<SteamWishlistImportPage />} />

        {/* Perfil público (acessível por users logados) */}
        <Route path="perfil/:identifier" element={<PublicProfilePage />} />

        {/* Detalhe da entrada na coleção */}
        <Route path="jogo/:id" element={<GameDetailsPage />} />

        {/* Detalhe RAWG (explorar) - Versão autenticada com opções de adicionar */}
        <Route path="explorar/:externalId" element={<ExternalGameDetailsPage />} />

        <Route index element={<Navigate to="home" replace />} />
      </Route>

      {/* Redireciona tudo para login se não estiver logado, para app se estiver */}
      <Route path="/" element={user ? <Navigate to="/app" replace /> : <Navigate to="/login" replace />} />
      <Route path="*" element={user ? <Navigate to="/app" replace /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}