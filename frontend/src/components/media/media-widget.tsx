"use client";

import { useQuery } from "@tanstack/react-query";
import { Film, ChevronRight, Star, Loader2 } from "lucide-react";
import Link from "next/link";
import { moviesApi } from "@/lib/media-api";

export function MediaWidget() {
  const { data: popular = [], isLoading } = useQuery({
    queryKey: ["media-popular-widget"],
    queryFn: async () => {
      const res = await moviesApi.getPopularMovies(1);
      return res.results || [];
    },
  });

  const heroMovie = popular[0];
  const sideMovies = popular.slice(1, 4);

  return (
    <div className="relative bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-purple-500/50 rounded-3xl p-5 md:p-6 lg:p-8 shadow-2xl flex flex-col h-full overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
      <div className="absolute top-0 right-0 w-[200px] h-[200px] md:w-[300px] md:h-[300px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none -mr-20 -mt-20 transition-opacity group-hover:opacity-100 opacity-60"></div>

      <Film
        className="absolute -bottom-10 -right-10 w-48 h-48 md:w-64 md:h-64 text-white opacity-[0.015] pointer-events-none -rotate-12"
        strokeWidth={1}
      />

      <div className="flex items-center justify-between mb-5 md:mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <Film className="text-purple-400 w-4 h-4 md:w-5 md:h-5" />
          <h2 className="text-base md:text-lg font-bold text-white tracking-tight">
            Em Alta no Cinema
          </h2>
        </div>
        <Link
          href="/media"
          className="text-[10px] md:text-xs font-bold text-zinc-500 hover:text-purple-400 flex items-center transition-colors uppercase tracking-wider bg-white/5 hover:bg-purple-500/10 px-2.5 py-1.5 md:px-3 md:py-1.5 rounded-full border border-white/5 hover:border-purple-500/30"
        >
          Ver Mais <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin text-purple-500/50" />
        </div>
      ) : heroMovie ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6 h-full relative z-10">
          <a
            href={`https://filmes.lucasmks.com.br/filmes/${heroMovie.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="md:col-span-3 relative rounded-2xl overflow-hidden group/hero shadow-lg border border-white/5 hover:border-purple-500/50 transition-all block hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] min-h-[220px] md:min-h-[300px]"
          >
            <img
              src={`https://image.tmdb.org/t/p/original${heroMovie.backdrop_path || heroMovie.poster_path}`}
              alt={heroMovie.title}
              className="w-full h-full object-cover opacity-80 group-hover/hero:opacity-100 transition-all duration-700 group-hover/hero:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/50 to-transparent"></div>

            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5 lg:p-6 flex flex-col justify-end">
              <div className="flex items-center gap-2 mb-2 md:mb-3">
                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 md:py-1 rounded-md backdrop-blur-md">
                  Destaque
                </span>
                <div className="flex items-center gap-1 text-[10px] md:text-[11px] text-yellow-400 font-bold bg-black/40 px-2 py-0.5 md:py-1 rounded-md backdrop-blur-md border border-white/10">
                  <Star size={10} fill="currentColor" />{" "}
                  {heroMovie.vote_average?.toFixed(1)}
                </div>
              </div>
              <h3 className="font-bold text-white text-xl md:text-2xl lg:text-3xl leading-tight mb-1.5 md:mb-2 drop-shadow-lg group-hover/hero:text-purple-300 transition-colors line-clamp-2">
                {heroMovie.title}
              </h3>
              <p className="text-zinc-400 text-[11px] md:text-xs lg:text-sm line-clamp-2 drop-shadow-md">
                {heroMovie.overview}
              </p>
            </div>
          </a>

          <div className="md:col-span-2 flex flex-col gap-3 justify-between">
            {sideMovies.map((movie) => (
              <a
                key={movie.id}
                href={`https://filmes.lucasmks.com.br/filmes/${movie.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 md:gap-4 bg-black/20 hover:bg-purple-500/10 border border-white/5 hover:border-purple-500/30 rounded-xl p-2.5 transition-all group/side shadow-sm"
              >
                <div className="w-10 h-14 md:w-12 md:h-16 shrink-0 rounded-lg overflow-hidden shadow-md border border-white/10">
                  <img
                    src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover/side:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="flex flex-col min-w-0 pr-2">
                  <h4 className="font-bold text-[11px] md:text-xs text-zinc-300 truncate group-hover/side:text-purple-400 transition-colors mb-1">
                    {movie.title}
                  </h4>
                  <div className="flex items-center gap-1 text-[9px] md:text-[10px] font-bold text-zinc-500">
                    <Star
                      size={10}
                      className="text-yellow-500"
                      fill="currentColor"
                    />{" "}
                    {movie.vote_average?.toFixed(1)}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-grow flex items-center justify-center text-zinc-500 text-sm bg-black/20 rounded-2xl border border-dashed border-white/5">
          Sem recomendações no momento.
        </div>
      )}
    </div>
  );
}
