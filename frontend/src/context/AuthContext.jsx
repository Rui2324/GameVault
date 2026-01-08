// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // vê logo se há token no arranque
  const tokenInicial =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!tokenInicial); // só fica "a carregar" se houver token
  const [erro, setErro] = useState("");

  useEffect(() => {
    // se não houver token, não fazemos pedidos nenhuns
    if (!tokenInicial) {
      return;
    }

    api
      .get("/auth/me")
      .then((res) => {
        setUser(res.data.user);
      })
      .catch(() => {
        localStorage.removeItem("token");
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [tokenInicial]);

  async function login(email, password) {
    setErro("");
    const res = await api.post("/auth/login", { email, password });
    const { user, token } = res.data;
    localStorage.setItem("token", token);
    setUser(user);
  }

  async function registar(nome, email, password) {
    setErro("");
    const res = await api.post("/auth/register", {
      name: nome,
      email,
      password,
    });
    const { user, token } = res.data;
    localStorage.setItem("token", token);
    setUser(user);
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  const value = {
    user,
    loading,
    erro,
    setErro,
    login,
    registar,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
