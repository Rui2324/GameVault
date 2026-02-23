import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const tokenInicial =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!tokenInicial);
  const [erro, setErro] = useState("");

  useEffect(() => {
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

  // atualizar dados do perfil
  async function atualizarPerfil(dados) {
    const res = await api.put("/auth/profile", dados);
    setUser(res.data.user); // mantém header/nav sempre em sync
  }

  const value = {
    user,
    loading,
    erro,
    setErro,
    login,
    registar,
    logout,
    atualizarPerfil,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
