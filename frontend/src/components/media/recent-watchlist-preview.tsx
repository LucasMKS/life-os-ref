"use client";

import { useQuery } from "@tanstack/react-query";
import { Film, Tv, ArrowUpRight, Clock } from "lucide-react";
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

const LMS_URL = "https://filmes.lucasmks.com.br";

export function RecentWatchlistPreview() {
  const { data: recent = [], isLoading } = useQuery<PreviewItem[]>({
    queryKey: ["media-recent-watchlist-preview"],
    queryFn: async () => {
      const [movies, series] = await Promise.all([
        watchlistMoviesApi.getWatchlistMovies().catch(() => []),
        watchlistSeriesApi.getWatchlistSeries().catch(() => []),
      ]);

      const latestMovies = [...(movies || [])]
        .sort((a, b) => (b.addedAt ?? "").localeCompare(a.addedAt ?? ""))
        .slice(0, 2);

      const latestSeries = [...(series || [])]
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
        (x): x is PreviewItem => x != null,
      );
    },
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-4 md:p-5 shadow-xl relative flex-1 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4 md:mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-zinc-500/10 rounded-xl border border-white/10">
            <Clock className="text-zinc-300 w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm md:text-base font-bold text-white tracking-tight">
              Últimos adicionados
            </h2>
            <span className="text-[10px] md:text-[11px] text-zinc-500 font-medium">
              Atalho para continuar
            </span>
          </div>
        </div>
        <a
          href={LMS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] md:text-xs font-bold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors border border-white/10"
        >
          Catálogo
          <ArrowUpRight className="w-3 h-3 md:w-3.5 md:h-3.5" />
        </a>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="aspect-[2/3] bg-white/5 animate-pulse rounded-2xl"
            />
          ))}
        </div>
      ) : recent.length === 0 ? (
        <div className="p-6 bg-black/20 rounded-2xl border border-white/5 border-dashed text-center text-zinc-500 text-xs md:text-sm font-medium">
          Watchlist vazia — adicione títulos no LMS Filmes.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {recent.map((item) => {
            const id = item.data.id;
            const title =
              item.kind === "movie"
                ? (item.data as TmdbMovie).title
                : (item.data as TmdbSerie).name;
            const url =
              item.kind === "movie"
                ? `${LMS_URL}/filmes/${id}`
                : `${LMS_URL}/series/${id}`;
            const poster = item.data.poster_path
              ? `https://image.tmdb.org/t/p/w500${item.data.poster_path}`
              : null;

            return (
              <a
                key={`${item.kind}-${id}`}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-[2/3] bg-black/40 rounded-2xl border border-white/5 overflow-hidden shadow-lg hover:-translate-y-1 hover:border-white/20 transition-all duration-300"
              >
                {poster ? (
                  <img
                    src={poster}
                    alt={title}
                    loading="lazy"
                    className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                    {item.kind === "movie" ? (
                      <Film className="w-8 h-8 text-zinc-800" />
                    ) : (
                      <Tv className="w-8 h-8 text-zinc-800" />
                    )}
                  </div>
                )}

                <div className="absolute top-2 left-2">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border backdrop-blur-md ${
                      item.kind === "movie"
                        ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                        : "bg-purple-500/20 text-purple-300 border-purple-500/30"
                    }`}
                  >
                    {item.kind === "movie" ? "Filme" : "Série"}
                  </span>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                  <h3 className="text-xs md:text-sm font-bold text-white line-clamp-2 leading-tight">
                    {title}
                  </h3>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
