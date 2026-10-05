"use client";

import { useQuery } from "@tanstack/react-query";
import { Film, Tv, Sparkles } from "lucide-react";
import { radarApi } from "@/lib/api";
import { watchlistMoviesApi, watchlistSeriesApi } from "@/lib/media-api";

type MediaOverview = {
  releasesThisWeek: number;
  totalUpcoming: number;
};

export function MediaStatsStrip() {
  const { data: movies, isLoading: loadingMovies } = useQuery({
    queryKey: ["media-watchlist-movies-count"],
    queryFn: watchlistMoviesApi.getWatchlistMovies,
    staleTime: 1000 * 60 * 5,
  });

  const { data: series, isLoading: loadingSeries } = useQuery({
    queryKey: ["media-watchlist-series-count"],
    queryFn: watchlistSeriesApi.getWatchlistSeries,
    staleTime: 1000 * 60 * 5,
  });

  const { data: overview, isLoading: loadingOverview } = useQuery<MediaOverview>({
    queryKey: ["media-overview"],
    queryFn: radarApi.getMediaOverview,
    staleTime: 1000 * 60 * 10,
  });

  const cards = [
    {
      label: "Filmes na watchlist",
      value: movies?.length ?? 0,
      icon: <Film className="w-4 h-4 md:w-5 md:h-5" />,
      accent: "blue",
      loading: loadingMovies,
    },
    {
      label: "Séries acompanhando",
      value: series?.length ?? 0,
      icon: <Tv className="w-4 h-4 md:w-5 md:h-5" />,
      accent: "purple",
      loading: loadingSeries,
    },
    {
      label: "Lançamentos na semana",
      value: overview?.releasesThisWeek ?? 0,
      icon: <Sparkles className="w-4 h-4 md:w-5 md:h-5" />,
      accent: "emerald",
      loading: loadingOverview,
    },
  ] as const;

  const accentClasses: Record<string, string> = {
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  };

  return (
    <div className="grid grid-cols-3 gap-2 md:gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-[#121214]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-3 md:p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4"
        >
          <div
            className={`w-9 h-9 md:w-12 md:h-12 rounded-xl border flex items-center justify-center shrink-0 ${accentClasses[card.accent]}`}
          >
            {card.icon}
          </div>
          <div className="flex flex-col min-w-0 w-full">
            <span className="text-[9px] md:text-[11px] font-bold uppercase tracking-widest text-zinc-500 line-clamp-2 sm:truncate leading-tight">
              {card.label}
            </span>
            {card.loading ? (
              <div className="h-6 md:h-7 w-12 bg-white/5 animate-pulse rounded mt-1" />
            ) : (
              <span className="text-xl md:text-3xl font-bold text-white tabular-nums">
                {card.value}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
