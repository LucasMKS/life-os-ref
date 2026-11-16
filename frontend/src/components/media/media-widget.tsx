"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Film, Loader2, Star } from "lucide-react";
import Link from "next/link";
import { EmptyState, SurfacePanel } from "@/components/ui/page-shell";
import {
  MediaPoster,
  buildLmsMediaUrl,
  buildTmdbImageUrl,
} from "@/components/media/media-poster";
import { moviesApi } from "@/lib/media-api";

export function MediaWidget() {
  const { data: popular = [], isLoading } = useQuery({
    queryKey: ["media-popular-widget"],
    queryFn: async () => {
      const res = await moviesApi.getPopularMovies(1);
      return Array.isArray(res?.results) ? res.results : [];
    },
  });

  const safePopular = Array.isArray(popular) ? popular : [];
  const heroMovie = safePopular[0];
  const sideMovies = safePopular.slice(1, 4);

  const heroUrl = heroMovie ? buildLmsMediaUrl("MOVIE", heroMovie.id) : null;
  const heroImage = heroMovie
    ? buildTmdbImageUrl(heroMovie.backdrop_path || heroMovie.poster_path, "w780")
    : null;

  return (
    <SurfacePanel
      accent="purple"
      title="Em Alta no Cinema"
      icon={<Film className="w-4 h-4 text-purple-400" />}
      action={
        <Link
          href="/media"
          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-purple-300 bg-white/[0.04] hover:bg-purple-500/10 px-2.5 py-1 rounded-xl border border-white/[0.06] hover:border-purple-500/30 transition-colors"
        >
          <span>Ver Mais</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      }
      className="h-full flex flex-col border-t-2 border-t-purple-500/60"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
        </div>
      ) : heroMovie && heroUrl ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-5 h-full">
          <a
            href={heroUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="md:col-span-3 relative rounded-xl overflow-hidden group/hero border border-white/[0.06] hover:border-white/[0.14] transition-colors block min-h-[220px] md:min-h-[280px] bg-[#161619]"
          >
            <MediaPoster
              src={heroImage}
              alt={heroMovie.title || "Filme em destaque"}
              type="MOVIE"
              className="w-full h-full object-cover opacity-85 group-hover/hero:opacity-100 transition-opacity duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/55 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5 flex flex-col justify-end">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md">
                  Destaque
                </span>
                {typeof heroMovie.vote_average === "number" && (
                  <div className="flex items-center gap-1 text-[11px] text-zinc-200 font-semibold bg-[#09090b]/85 px-2 py-0.5 rounded-md border border-white/[0.08] tabular-nums">
                    <Star size={10} className="text-amber-400" fill="currentColor" />
                    {heroMovie.vote_average.toFixed(1)}
                  </div>
                )}
              </div>
              <h3 className="font-bold text-white text-lg md:text-2xl leading-tight mb-1 group-hover/hero:text-zinc-200 transition-colors line-clamp-2">
                {heroMovie.title || "Sem título"}
              </h3>
              {heroMovie.overview && (
                <p className="text-zinc-400 text-xs line-clamp-2">
                  {heroMovie.overview}
                </p>
              )}
            </div>
          </a>

          <div className="md:col-span-2 flex flex-col gap-2.5 justify-between">
            {sideMovies.map((movie) => {
              const movieUrl = buildLmsMediaUrl("MOVIE", movie.id);
              const posterUrl = buildTmdbImageUrl(movie.poster_path, "w200");
              if (!movieUrl) return null;

              return (
                <a
                  key={movie.id}
                  href={movieUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-[#161619] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] rounded-xl p-2.5 transition-colors group/side"
                >
                  <div className="w-10 h-14 md:w-12 md:h-16 shrink-0 rounded-lg overflow-hidden border border-white/[0.06]">
                    <MediaPoster
                      src={posterUrl}
                      alt={movie.title || "Poster"}
                      type="MOVIE"
                      iconClassName="w-4 h-4 text-zinc-700"
                    />
                  </div>
                  <div className="flex flex-col min-w-0 pr-1">
                    <h4 className="font-semibold text-xs text-zinc-200 truncate group-hover/side:text-white transition-colors mb-1">
                      {movie.title || "Sem título"}
                    </h4>
                    {typeof movie.vote_average === "number" && (
                      <div className="flex items-center gap-1 text-[10px] font-medium text-zinc-400 tabular-nums">
                        <Star
                          size={10}
                          className="text-amber-400"
                          fill="currentColor"
                        />
                        {movie.vote_average.toFixed(1)}
                      </div>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<Film className="w-5 h-5" />}
          title="Sem recomendações no momento"
          description="Não foi possível carregar os filmes populares agora."
        />
      )}
    </SurfacePanel>
  );
}
