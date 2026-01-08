// src/pages/WishlistPage.jsx
import { useEffect, useState } from "react";
import api from "../services/api";

export default function WishlistPage() {
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [acaoId, setAcaoId] = useState(null); // para desativar botões enquanto faz requests

  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      try {
        if (cancelado) return;
        setErro("");
        setLoading(true);

        const res = await api.get("/wishlist");
        if (!cancelado) {
          setItens(res.data.wishlist || []);
        }
      } catch (err) {
        console.error(err);
        if (!cancelado) {
          setErro(
            err?.response?.data?.mensagem ||
              "Não foi possível carregar a tua wishlist."
          );
        }
      } finally {
        if (!cancelado) {
          setLoading(false);
        }
      }
    }

    carregar();

    return () => {
      cancelado = true;
    };
  }, []);

  async function handleRemover(itemId) {
    try {
      setAcaoId(itemId);
      setErro("");
      await api.delete(`/wishlist/${itemId}`);
      setItens((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err) {
      console.error(err);
      setErro(
        err?.response?.data?.mensagem ||
          "Não foi possível remover o jogo da wishlist."
      );
    } finally {
      setAcaoId(null);
    }
  }

  async function handleAdicionarAColecao(item) {
    try {
      setAcaoId(item.id);
      setErro("");

      // aqui usamos o formato que já tens no endpoint /collection:
      await api.post("/collection", {
        jogo_id: item.game_id,
        rating: null,
        horas_jogadas: 0,
        estado: "por_jogar",
        notas: null,
      });

      // depois de adicionar à coleção, removemos da wishlist
      await api.delete(`/wishlist/${item.id}`);

      setItens((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      console.error(err);
      setErro(
        err?.response?.data?.mensagem ||
          "Não foi possível adicionar o jogo à coleção."
      );
    } finally {
      setAcaoId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Wishlist</h2>
          <p className="text-sm text-slate-600">
            Jogos que queres jogar ou comprar mais tarde. Podes movê-los para a
            coleção quando começares a jogar.
          </p>
        </div>
      </div>

      {/* Estado de carregamento / erro */}
      {loading && (
        <p className="text-sm text-slate-600">A carregar wishlist...</p>
      )}

      {erro && !loading && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">
          {erro}
        </p>
      )}

      {/* Lista */}
      {!loading && !erro && (
        <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          {itens.length === 0 ? (
            <div className="p-4 text-sm text-slate-600">
              Ainda não tens jogos na wishlist. Podes começar por adicionar
              alguns via API (Insomnia) ou, mais tarde, a partir de outros
              ecrãs.
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <Th>Jogo</Th>
                  <Th>Plataforma</Th>
                  <Th>Género</Th>
                  <Th>Adicionado em</Th>
                  <Th className="text-right pr-4">Ações</Th>
                </tr>
              </thead>
              <tbody>
                {itens.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 hover:bg-slate-50/80"
                  >
                    <Td>
                      <div className="flex items-center gap-3">
                        {item.capa_url && (
                          <img
                            src={item.capa_url}
                            alt={item.titulo}
                            className="w-10 h-14 object-cover rounded"
                          />
                        )}
                        <span className="font-medium text-slate-900">
                          {item.titulo}
                        </span>
                      </div>
                    </Td>
                    <Td>{item.plataforma || "—"}</Td>
                    <Td>{item.genero || "—"}</Td>
                    <Td>
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString("pt-PT")
                        : "—"}
                    </Td>
                    <Td className="text-right pr-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleAdicionarAColecao(item)}
                          disabled={acaoId === item.id}
                          className="text-xs px-3 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-60"
                        >
                          Adicionar à coleção
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemover(item.id)}
                          disabled={acaoId === item.id}
                          className="text-xs px-3 py-1 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                        >
                          Remover
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function Th({ children, className = "" }) {
  return (
    <th
      className={
        "text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide " +
        className
      }
    >
      {children}
    </th>
  );
}

function Td({ children, className = "" }) {
  return (
    <td className={"px-3 py-2 align-middle text-slate-800 " + className}>
      {children}
    </td>
  );
}
