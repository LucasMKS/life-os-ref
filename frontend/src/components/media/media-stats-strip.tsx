"use client";

import { useQuery } from "@tanstack/react-query";
import { Film, Sparkles, Tv } from "lucide-react";
import { StatCard } from "@/components/ui/page-shell";
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

  const movieCount = Array.isArray(movies) ? movies.length : 0;
  const seriesCount = Array.isArray(series) ? series.length : 0;
  const releasesCount = overview?.releasesThisWeek ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
      <StatCard
        label="Filmes na watchlist"
        value={loadingMovies ? "—" : movieCount}
        icon={<Film className="w-4 h-4 text-zinc-400" />}
      />
      <StatCard
        label="Séries acompanhando"
        value={loadingSeries ? "—" : seriesCount}
        icon={<Tv className="w-4 h-4 text-zinc-400" />}
      />
      <StatCard
        label="Lançamentos na semana"
        value={loadingOverview ? "—" : releasesCount}
        icon={<Sparkles className="w-4 h-4 text-emerald-400" />}
      />
    </div>
  );
}
