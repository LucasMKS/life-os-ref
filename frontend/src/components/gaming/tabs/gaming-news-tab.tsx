"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Gamepad2, ExternalLink, Rss } from "lucide-react";
import { gamingApi } from "@/lib/api";

interface GamingNews {
  id: string;
  title: string;
  summary: string;
  game: string;
  date?: string;
  publishedAt?: string;
  url: string;
  type?: string;
}

const NewsSkeleton = () => (
  <div className="p-5 md:p-6 bg-[#121214]/50 rounded-2xl border border-white/5 animate-pulse">
    <div className="flex justify-between items-start mb-4">
      <div className="h-5 md:h-6 w-20 md:w-24 bg-white/5 rounded-md"></div>
      <div className="h-3.5 md:h-4 w-14 md:w-16 bg-white/5 rounded"></div>
    </div>
    <div className="h-4 md:h-5 w-3/4 bg-white/10 rounded mb-3"></div>
    <div className="h-3.5 md:h-4 w-full bg-white/5 rounded mb-1.5"></div>
    <div className="h-3.5 md:h-4 w-2/3 bg-white/5 rounded"></div>
  </div>
);

const formatDate = (dateString?: string) => {
  if (!dateString) return "Recente";
  const safeDate = dateString.endsWith("Z") ? dateString : `${dateString}Z`;
  return new Date(safeDate).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
};

const getBadgeStyle = (type?: string, game?: string) => {
  if (
    type === "PATCH_NOTE" ||
    game === "LoL" ||
    game === "TFT" ||
    game === "Valorant"
  ) {
    return "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]";
  }
  return "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]";
};

export function GamingNewsTab() {
  const [gameFilter, setGameFilter] = useState<string>("all");

  const { data: news, isLoading } = useQuery<GamingNews[]>({
    queryKey: ["gaming-news"],
    queryFn: gamingApi.getNews,
  });

  const feedGames = useMemo(() => {
    const fromNews = (news || []).map((item) => item.game).filter(Boolean);
    return [
      "all",
      ...Array.from(new Set(fromNews)).sort((a, b) => a.localeCompare(b)),
    ];
  }, [news]);

  const filteredNews = useMemo(() => {
    const items = news || [];
    if (gameFilter === "all") return items;
    return items.filter((item) => item.game === gameFilter);
  }, [news, gameFilter]);

  return (
    <div className="bg-[#121214]/60 border border-white/5 rounded-3xl p-5 md:p-6 lg:p-8 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2 md:gap-3">
          <Rss className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
          Últimas Atualizações
        </h3>

        <select
          value={gameFilter}
          onChange={(e) => setGameFilter(e.target.value)}
          className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 md:px-4 md:py-2.5 text-xs md:text-sm font-medium text-zinc-300 focus:outline-none focus:border-blue-500/50 cursor-pointer shadow-inner w-full sm:w-auto"
        >
          {feedGames.map((game) => (
            <option key={game} value={game}>
              {game === "all" ? "Todos os Jogos" : game}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <NewsSkeleton key={i} />
          ))}
        </div>
      ) : filteredNews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {filteredNews.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col p-5 md:p-6 bg-black/40 rounded-2xl border border-white/5 hover:border-blue-500/30 hover:bg-white/[0.02] hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-[0_10px_30px_-15px_rgba(59,130,246,0.3)]"
            >
              <div className="flex justify-between items-start mb-3 md:mb-4">
                <span
                  className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest px-2 py-1 md:px-2.5 md:py-1 rounded-md border backdrop-blur-sm ${getBadgeStyle(item.type, item.game)}`}
                >
                  {item.game}
                </span>
                <span className="text-[9px] md:text-[10px] font-semibold text-zinc-500 bg-white/5 px-2 py-1 rounded-md">
                  {formatDate(item.publishedAt || item.date)}
                </span>
              </div>
              <h4 className="text-sm md:text-base font-bold text-zinc-100 lg:group-hover:text-blue-400 transition-colors mb-2 md:mb-3 flex items-start justify-between gap-3 leading-snug">
                <span className="line-clamp-2">{item.title}</span>
                <ExternalLink className="w-4 h-4 shrink-0 mt-0.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 translate-x-0 lg:-translate-x-2 lg:group-hover:translate-x-0 transition-all text-blue-400" />
              </h4>
              <p className="text-[11px] md:text-xs text-zinc-400 line-clamp-3 leading-relaxed mt-auto">
                {item.summary}
              </p>
            </a>
          ))}
        </div>
      ) : (
        <div className="bg-black/20 rounded-2xl border border-dashed border-white/10 p-10 md:p-16 text-center">
          <Gamepad2 className="w-10 h-10 md:w-12 md:h-12 text-zinc-800 mx-auto mb-3 md:mb-4" />
          <p className="text-zinc-400 text-sm font-medium">
            O radar está limpo.
          </p>
          <p className="text-zinc-600 text-xs md:text-sm mt-1">
            Adicione jogos ao radar na biblioteca Steam para ver as atualizações aqui.
          </p>
        </div>
      )}
    </div>
  );
}
