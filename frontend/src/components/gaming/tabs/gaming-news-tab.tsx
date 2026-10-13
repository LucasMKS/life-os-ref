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
  <div className="p-4 md:p-5 bg-black/40 rounded-2xl border border-white/5 animate-pulse flex flex-col gap-2">
    <div className="flex justify-between items-start mb-2">
      <div className="h-5 w-20 bg-white/5 rounded-md" />
      <div className="h-4 w-14 bg-white/5 rounded" />
    </div>
    <div className="h-4 w-3/4 bg-white/10 rounded mb-2" />
    <div className="h-3 w-full bg-white/5 rounded" />
    <div className="h-3 w-2/3 bg-white/5 rounded" />
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
    return "bg-red-500/10 text-red-400 border-red-500/20";
  }
  return "bg-blue-500/10 text-blue-400 border-blue-500/20";
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
    <div className="bg-[#121214]/70 border border-white/5 rounded-3xl p-5 md:p-6 lg:p-7 backdrop-blur-xl shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Rss className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-bold text-white tracking-tight">
              Novidades & Atualizações
            </h3>
            <p className="text-xs text-zinc-400">
              Patch notes e novidades dos jogos acompanhados no radar.
            </p>
          </div>
        </div>

        <select
          value={gameFilter}
          onChange={(e) => setGameFilter(e.target.value)}
          className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-medium text-zinc-300 focus:outline-none focus:border-blue-500/50 cursor-pointer w-full sm:w-auto"
        >
          {feedGames.map((game) => (
            <option key={game} value={game}>
              {game === "all" ? "Todos os Jogos" : game}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <NewsSkeleton key={i} />
          ))}
        </div>
      ) : filteredNews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {filteredNews.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col p-4 md:p-5 bg-black/40 rounded-2xl border border-white/5 hover:border-white/15 hover:bg-white/[0.02] transition-all"
            >
              <div className="flex justify-between items-start mb-2.5">
                <span
                  className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border ${getBadgeStyle(item.type, item.game)}`}
                >
                  {item.game}
                </span>
                <span className="text-[9px] font-semibold text-zinc-500 bg-white/5 px-2 py-0.5 rounded-md">
                  {formatDate(item.publishedAt || item.date)}
                </span>
              </div>
              <h4 className="text-xs md:text-sm font-bold text-zinc-100 group-hover:text-blue-400 transition-colors mb-2 flex items-start justify-between gap-2 leading-snug">
                <span className="line-clamp-2">{item.title}</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5 text-zinc-500 group-hover:text-blue-400 transition-colors" />
              </h4>
              <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed mt-auto">
                {item.summary}
              </p>
            </a>
          ))}
        </div>
      ) : (
        <div className="bg-black/20 rounded-2xl border border-dashed border-white/10 p-8 md:p-12 text-center">
          <Gamepad2 className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
          <p className="text-zinc-400 text-xs font-medium">
            Nenhuma novidade no radar no momento.
          </p>
          <p className="text-zinc-600 text-[11px] mt-1">
            Abra a biblioteca Steam acima e ative o radar dos seus jogos prediletos.
          </p>
        </div>
      )}
    </div>
  );
}
