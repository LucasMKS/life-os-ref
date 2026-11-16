"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Clock } from "lucide-react";
import { EmptyState, SurfacePanel } from "@/components/ui/page-shell";
import {
  LMS_BASE_URL,
  MediaPoster,
  buildLmsMediaUrl,
  buildTmdbImageUrl,
} from "@/components/media/media-poster";
import { sanitizeUrl } from "@/lib/security";
import {
  moviesApi,
  seriesApi,
  watchlistMoviesApi,
  watchlistSeriesApi,
} from "@/lib/media-api";
import { TmdbMovie, TmdbSerie } from "@/lib/types";

type PreviewItem =
  | { kind: "movie"; data: TmdbMovie; addedAt: string }
  | { kind: "serie"; data: TmdbSerie; addedAt: string };

export function RecentWatchlistPreview() {
  const safeLmsUrl = sanitizeUrl(LMS_BASE_URL);

  const { data: recent = [], isLoading } = useQuery<PreviewItem[]>({
    queryKey: ["media-recent-watchlist-preview"],
    queryFn: async () => {
      const [movies, series] = await Promise.all([
        watchlistMoviesApi.getWatchlistMovies().catch(() => []),
        watchlistSeriesApi.getWatchlistSeries().catch(() => []),
      ]);

      const latestMovies = [...(Array.isArray(movies) ? movies : [])]
        .sort((a, b) => (b.addedAt ?? "").localeCompare(a.addedAt ?? ""))
        .slice(0, 2);

      const latestSeries = [...(Array.isArray(series) ? series : [])]
        .sort((a, b) => (b.addedAt ?? "").localeCompare(a.addedAt ?? ""))
        .slice(0, 2);

      const hydratedMovies = await Promise.all(
        latestMovies.map(async (m) => {
          try {
            const data = await moviesApi.getMovieDetails(m.movieId);
            return {
              kind: "movie" as const,
              data,
              addedAt: m.addedAt,
            };
          } catch {
            return null;
          }
        }),
      );

      const hydratedSeries = await Promise.all(
        latestSeries.map(async (s) => {
          try {
            const data = await seriesApi.getSerieDetails(s.serieId);
            return {
              kind: "serie" as const,
              data,
              addedAt: s.addedAt,
            };
          } catch {
            return null;
          }
        }),
      );

      return [...hydratedMovies, ...hydratedSeries].filter(
        (x): x is PreviewItem => x != null && x.data != null,
      );
    },
    staleTime: 1000 * 60 * 5,
  });

  return (
    <SurfacePanel
      title="Últimos adicionados"
      icon={<Clock className="w-4 h-4 text-zinc-400" />}
      action={
        safeLmsUrl ? (
          <a
            href={safeLmsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] px-2.5 py-1 rounded-xl border border-white/[0.06] transition-colors"
          >
            <span>Catálogo</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        ) : null
      }
      className="flex-1 flex flex-col"
    >
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="aspect-[2/3] bg-white/[0.04] animate-pulse rounded-xl"
            />
          ))}
        </div>
      ) : recent.length === 0 ? (
        <EmptyState
          icon={<Clock className="w-5 h-5" />}
          title="Watchlist vazia"
          description="Adicione títulos no LMS Filmes para vê-los aqui."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {recent.map((item) => {
            const id = item.data.id;
            const title =
              item.kind === "movie"
                ? (item.data as TmdbMovie).title || "Sem título"
                : (item.data as TmdbSerie).name || "Sem título";
            const url = buildLmsMediaUrl(
              item.kind === "movie" ? "MOVIE" : "SERIES",
              id,
            );
            const poster = buildTmdbImageUrl(item.data.poster_path, "w500");

            if (!url) return null;

            return (
              <a
                key={`${item.kind}-${id}`}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-[2/3] bg-[#161619] rounded-xl border border-white/[0.06] hover:border-white/[0.14] overflow-hidden transition-colors"
              >
                <MediaPoster
                  src={poster}
                  alt={title}
                  type={item.kind === "movie" ? "MOVIE" : "SERIES"}
                  className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity"
                />

                <div className="absolute top-2 left-2">
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider border ${
                      item.kind === "movie"
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/25"
                        : "bg-sky-500/15 text-sky-300 border-sky-500/25"
                    }`}
                  >
                    {item.kind === "movie" ? "Filme" : "Série"}
                  </span>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-[#09090b] via-[#09090b]/60 to-transparent">
                  <h3 className="text-xs font-semibold text-white line-clamp-2 leading-tight">
                    {title}
                  </h3>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </SurfacePanel>
  );
}
