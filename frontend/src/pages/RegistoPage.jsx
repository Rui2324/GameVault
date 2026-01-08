// src/pages/RegistoPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegistoPage() {
  const { registar, setErro, erro } = useAuth();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [aCarregar, setACarregar] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (password !== confirmacao) {
      setErro("As palavras-passe não coincidem.");
      return;
    }

    setACarregar(true);
    try {
      await registar(nome, email, password);
      navigate("/app");
    } catch (err) {
      console.error(err);
      setErro(
        err?.response?.data?.message ||
          err?.response?.data?.mensagem ||
          "Erro ao criar conta."
      );
    } finally {
      setACarregar(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100">
      <div className="w-full max-w-md bg-slate-800/80 border border-slate-700 rounded-xl p-8 shadow-lg">
        <h1 className="text-2xl font-semibold mb-1 text-center">GameVault</h1>
        <p className="text-sm text-slate-300 mb-6 text-center">
          Cria a tua conta para começares a gerir a tua coleção
        </p>

        {erro && (
          <div className="mb-4 text-sm text-red-400 bg-red-950/40 border border-red-800 px-3 py-2 rounded">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Nome</label>
            <input
              type="text"
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="O teu nome"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@dominio.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Palavra-passe</label>
            <input
              type="password"
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Confirmar palavra-passe</label>
            <input
              type="password"
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={aCarregar}
            className="w-full mt-2 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition px-3 py-2 text-sm font-medium"
          >
            {aCarregar ? "A criar conta..." : "Criar conta"}
          </button>
        </form>

        <p className="mt-4 text-xs text-slate-400 text-center">
          Já tens conta?{" "}
          <Link
            to="/login"
            className="text-indigo-400 hover:text-indigo-300 underline"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
