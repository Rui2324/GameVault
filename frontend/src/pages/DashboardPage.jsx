// src/pages/DashboardPage.jsx
import { useEffect, useState } from "react";
import api from "../services/api";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      try {
        if (cancelado) return;
        setErro("");
        setLoading(true);

        const res = await api.get("/stats");
        if (!cancelado) {
          setStats(res.data);
        }
      } catch (err) {
        console.error(err);
        if (!cancelado) {
          setErro(
            err?.response?.data?.mensagem ||
              "Não foi possível carregar as estatísticas."
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

  const totalJogos = stats?.total_jogos ?? 0;
  const totalHoras = stats?.total_horas_jogadas ?? 0;
  //const taxaConclusao = stats?.taxa_conclusao_percent ?? 0;
  const jogosPorEstado = stats?.jogos_por_estado || {};
  const concluidos = jogosPorEstado.concluido ?? 0;

  // por enquanto "Na wishlist" fica a 0; mais tarde ligamos ao /api/wishlist
  const totalWishlist = 0;

  return (
    <div className="space-y-6">
      {/* Banner de boas-vindas */}
      <section className="rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 text-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-1">
          Bem-vindo de volta!
        </h2>
        <p className="text-sm text-indigo-100">
          Continua a jogar onde paraste ou descobre novos jogos para a tua coleção.
        </p>
        {loading && (
          <p className="text-xs text-indigo-100 mt-2">
            A carregar estatísticas...
          </p>
        )}
        {erro && (
          <p className="text-xs mt-2 bg-red-950/40 border border-red-500/70 px-3 py-1 rounded">
            {erro}
          </p>
        )}
      </section>

      {/* Cartões de estatísticas rápidas */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          titulo="Total de jogos"
          valor={loading ? "…" : totalJogos}
          bg="bg-slate-50"
        />
        <StatCard
          titulo="Concluídos"
          valor={loading ? "…" : concluidos}
          bg="bg-emerald-50"
        />
        <StatCard
          titulo="Horas jogadas"
          valor={loading ? "…" : totalHoras}
          bg="bg-amber-50"
        />
        <StatCard
          titulo="Na wishlist"
          valor={loading ? "…" : totalWishlist}
          bg="bg-violet-50"
        />
      </section>

      {/* Corpo principal: jogos em destaque + colunas (por agora mock) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Coluna esquerda: jogos em destaque + jogados recentemente */}
        <div className="lg:col-span-2 space-y-4">
          {/* Jogos em destaque (mock por enquanto) */}
          <div className="rounded-xl bg-white shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between text-sm">
              <span className="font-semibold">
                🔥 Jogos em Destaque
              </span>
              <button className="text-xs text-indigo-600 hover:underline">
                Ver todos
              </button>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 p-4">
              <FeaturedGameCard
                titulo="Baldur's Gate 3"
                genero="RPG"
                estado="A jogar"
                rating="9.5"
                imagem="https://images.pexels.com/photos/194511/pexels-photo-194511.jpeg?auto=compress&cs=tinysrgb&w=640"
              />
              <FeaturedGameCard
                titulo="The Legend of Zelda: TOTK"
                genero="Aventura"
                estado="Concluído"
                rating="9.8"
                imagem="https://images.pexels.com/photos/1720745/pexels-photo-1720745.jpeg?auto=compress&cs=tinysrgb&w=640"
              />
              <FeaturedGameCard
                titulo="Cyberpunk 2077"
                genero="RPG"
                estado="A jogar"
                rating="8.5"
                imagem="https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=640"
              />
            </div>
          </div>

          {/* Jogados recentemente (mock também por agora) */}
          <div className="rounded-xl bg-white shadow-sm border border-slate-200">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between text-sm">
              <span className="font-semibold">
                ⏱ Jogados Recentemente
              </span>
              <button className="text-xs text-indigo-600 hover:underline">
                Ver todos
              </button>
            </div>

            <div className="p-4 space-y-3 text-sm">
              <RecentGame
                titulo="Baldur's Gate 3"
                plataforma="PC"
                quando="Hoje"
                progresso="70%"
              />
              <RecentGame
                titulo="Cyberpunk 2077"
                plataforma="PS5"
                quando="Ontem"
                progresso="40%"
              />
              <RecentGame
                titulo="Stardew Valley"
                plataforma="PC"
                quando="Há 2 dias"
                progresso="90%"
              />
            </div>
          </div>
        </div>

        {/* Coluna direita: top jogos + próximos lançamentos + ações rápidas (mock) */}
        <div className="space-y-4">
          {/* Top jogos */}
          <div className="rounded-xl bg-white shadow-sm border border-slate-200">
            <div className="px-4 py-3 border-b border-slate-200 text-sm font-semibold flex items-center gap-2">
              📊 <span>Top Jogos</span>
            </div>
            <ol className="p-4 space-y-2 text-xs">
              <TopGame
                pos={1}
                titulo="Baldur's Gate 3"
                rating="9.5"
                jogadores="127K"
                tendencia="+12"
              />
              <TopGame
                pos={2}
                titulo="Elden Ring"
                rating="9.2"
                jogadores="98K"
                tendencia="+8"
              />
              <TopGame
                pos={3}
                titulo="Hades"
                rating="9.0"
                jogadores="89K"
                tendencia="+5"
              />
              <TopGame
                pos={4}
                titulo="Hollow Knight"
                rating="8.9"
                jogadores="76K"
                tendencia="+3"
              />
              <TopGame
                pos={5}
                titulo="Red Dead Redemption 2"
                rating="9.3"
                jogadores="112K"
                tendencia="+15"
              />
            </ol>
          </div>

          {/* Próximos lançamentos */}
          <div className="rounded-xl bg-white shadow-sm border border-slate-200">
            <div className="px-4 py-3 border-b border-slate-200 text-sm font-semibold flex items-center justify-between">
              <span>📅 Próximos Lançamentos</span>
              <span className="text-xs text-indigo-600 cursor-default">
                Wishlist
              </span>
            </div>
            <div className="p-4 space-y-3 text-xs">
              <UpcomingGame
                titulo="Final Fantasy VII Rebirth"
                data="Fev 2024"
                plataforma="PS5"
              />
              <UpcomingGame
                titulo="Hollow Knight: Silksong"
                data="TBA"
                plataforma="Multi"
              />
              <UpcomingGame
                titulo="Dragon's Dogma 2"
                data="Mar 2024"
                plataforma="Multi"
              />
            </div>
          </div>

          {/* Ações rápidas */}
          <div className="rounded-xl bg-indigo-700 text-white shadow-sm">
            <div className="px-4 py-3 border-b border-indigo-500 text-sm font-semibold">
              Ações Rápidas
            </div>
            <div className="p-4 space-y-2 text-sm">
              <button className="w-full bg-indigo-500 hover:bg-indigo-400 rounded-md py-2 font-medium">
                + Adicionar Jogo
              </button>
              <button className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-md py-2">
                Ver Estatísticas
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ titulo, valor, bg }) {
  return (
    <div className={`rounded-xl ${bg} border border-slate-200 p-4 text-center`}>
      <p className="text-xs text-slate-500 mb-1">{titulo}</p>
      <p className="text-2xl font-semibold text-slate-800">{valor}</p>
    </div>
  );
}

function FeaturedGameCard({ titulo, genero, estado, rating, imagem }) {
  return (
    <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex flex-col">
      <div className="relative">
        <img
          src={imagem}
          alt={titulo}
          className="h-32 w-full object-cover"
        />
        <div className="absolute top-2 right-2 bg-amber-400 text-xs font-semibold px-2 py-1 rounded-full shadow">
          ⭐ {rating}
        </div>
      </div>
      <div className="p-3 text-xs space-y-1">
        <p className="font-semibold text-slate-800 text-sm truncate">
          {titulo}
        </p>
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span className="px-2 py-0.5 rounded-full bg-slate-200">
            {genero}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
            {estado}
          </span>
        </div>
      </div>
    </div>
  );
}

function RecentGame({ titulo, plataforma, quando, progresso }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div>
          <p className="font-semibold text-slate-800">{titulo}</p>
          <p className="text-slate-500">
            {plataforma} • {quando}
          </p>
        </div>
        <span className="text-slate-500">{progresso}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
        <div
          className="h-full bg-indigo-500"
          style={{ width: progresso }}
        />
      </div>
    </div>
  );
}

function TopGame({ pos, titulo, rating, jogadores, tendencia }) {
  return (
    <li className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-semibold">
          {pos}
        </span>
        <div>
          <p className="font-semibold text-slate-800 text-xs">
            {titulo}
          </p>
          <p className="text-[11px] text-slate-500">
            ⭐ {rating} • {jogadores}
          </p>
        </div>
      </div>
      <span className="text-[11px] text-emerald-600 font-medium">
        {tendencia}
      </span>
    </li>
  );
}

function UpcomingGame({ titulo, data, plataforma }) {
  return (
    <div>
      <p className="font-semibold text-slate-800 text-xs">
        {titulo}
      </p>
      <p className="text-[11px] text-slate-500">
        {data} • {plataforma}
      </p>
    </div>
  );
}
