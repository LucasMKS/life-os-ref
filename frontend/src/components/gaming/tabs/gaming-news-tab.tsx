"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Gamepad2, ExternalLink, Rss } from "lucide-react";
import { gamingApi } from "@/lib/api";
import { sanitizeUrl } from "@/lib/security";
import { EmptyState, FilterPill, SurfacePanel } from "@/components/ui/page-shell";

interface GamingNews {
  id: string;
  title: string;
  summary?: string;
  game?: string;
  date?: string;
  publishedAt?: string;
  url?: string;
  type?: string;
}

const NewsSkeleton = () => (
  <div className="p-4 bg-[#09090b] rounded-xl border border-white/[0.06] animate-pulse flex flex-col gap-2">
    <div className="flex justify-between items-start mb-1">
      <div className="h-4 w-16 bg-white/[0.06] rounded" />
      <div className="h-3.5 w-12 bg-white/[0.05] rounded" />
    </div>
    <div className="h-4 w-3/4 bg-white/[0.08] rounded mb-1" />
    <div className="h-3 w-full bg-white/[0.05] rounded" />
    <div className="h-3 w-2/3 bg-white/[0.05] rounded" />
  </div>
);

const formatDate = (dateString?: string) => {
  if (!dateString) return "Recente";
  const safeDate = dateString.endsWith("Z") ? dateString : `${dateString}Z`;
  const parsed = new Date(safeDate);
  if (Number.isNaN(parsed.getTime())) return "Recente";
  return parsed.toLocaleDateString("pt-BR", {
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
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  }
  return "bg-white/[0.05] text-zinc-300 border-white/[0.08]";
};

export function GamingNewsTab() {
  const [gameFilter, setGameFilter] = useState<string>("all");

  const { data: news = [], isLoading } = useQuery<GamingNews[]>({
    queryKey: ["gaming-news"],
    queryFn: gamingApi.getNews,
  });

  const feedGames = useMemo(() => {
    const items = Array.isArray(news) ? news : [];
    const fromNews = items
      .map((item) => item.game)
      .filter((g): g is string => Boolean(g));
    return [
      "all",
      ...Array.from(new Set(fromNews)).sort((a, b) => a.localeCompare(b)),
    ];
  }, [news]);

  const filteredNews = useMemo(() => {
    const items = Array.isArray(news) ? news : [];
    if (gameFilter === "all") return items;
    return items.filter((item) => item.game === gameFilter);
  }, [news, gameFilter]);

  return (
    <SurfacePanel
      title="Novidades & Atualizações"
      icon={<Rss className="w-3.5 h-3.5 text-blue-400" />}
      accent="blue"
    >
      {feedGames.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 border-b border-white/[0.06]">
          {feedGames.map((game) => (
            <FilterPill
              key={game}
              active={gameFilter === game}
              onClick={() => setGameFilter(game)}
              accent="blue"
            >
              {game === "all" ? "Todos os Jogos" : game}
            </FilterPill>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <NewsSkeleton key={i} />
          ))}
        </div>
      ) : filteredNews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredNews.map((item) => {
            const safeUrl = sanitizeUrl(item.url);
            const cardContent = (
              <>
                <div className="flex justify-between items-center mb-2.5 gap-2">
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getBadgeStyle(
                      item.type,
                      item.game
                    )}`}
                  >
                    {item.game || "Game"}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-medium">
                    {formatDate(item.publishedAt || item.date)}
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors mb-1.5 flex items-start justify-between gap-2 leading-snug">
                  <span className="line-clamp-2">
                    {item.title || "Atualização"}
                  </span>
                  {safeUrl && (
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                  )}
                </h4>
                {item.summary && (
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mt-auto">
                    {item.summary}
                  </p>
                )}
              </>
            );

            return safeUrl ? (
              <a
                key={item.id}
                href={safeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col p-4 bg-[#09090b] rounded-xl border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.02] transition-colors"
              >
                {cardContent}
              </a>
            ) : (
              <div
                key={item.id}
                className="group flex flex-col p-4 bg-[#09090b] rounded-xl border border-white/[0.06]"
              >
                {cardContent}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Gamepad2 className="w-5 h-5" />}
          title="Nenhuma novidade no radar"
          description="Abra a biblioteca Steam acima e ative o radar dos seus jogos prediletos."
        />
      )}
    </SurfacePanel>
  );
}
