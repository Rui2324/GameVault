// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegistoPage from "./pages/RegistoPage";
import DashboardPage from "./pages/DashboardPage";
import CollectionPage from "./pages/CollectionPage";
import WishlistPage from "./pages/WishlistPage";
import StatsPage from "./pages/StatsPage";
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
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="colecao" element={<CollectionPage />} />
        <Route path="wishlist" element={<WishlistPage />} />
        <Route path="estatisticas" element={<StatsPage />} />
        {/* default: /app → /app/dashboard */}
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* fallback: qualquer outra rota vai para /login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
