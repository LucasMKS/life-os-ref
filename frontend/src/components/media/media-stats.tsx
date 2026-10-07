"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Clock,
  Tv,
  Film,
  Award,
  TrendingUp,
  Star,
  Radio,
  BarChart2,
  Calendar,
} from "lucide-react";
import { radarApi } from "@/lib/api";
import { watchlistMoviesApi } from "@/lib/media-api";
import { useAuthStore } from "@/lib/authStore";
import { SerieWatchStatusDTO, EpisodeDTO } from "@/lib/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function MediaStats() {
  const userId = useAuthStore((state) => state.userId);
  const { data: shows = [], isLoading: isLoadingSeries } = useQuery<SerieWatchStatusDTO[]>({
    queryKey: ["media-episodes-to-watch", userId],
    queryFn: radarApi.getEpisodesToWatch,
    staleTime: 1000 * 60 * 5,
  });

  const { data: movies = [], isLoading: isLoadingMovies } = useQuery({
    queryKey: ["media-watchlist-movies-count"],
    queryFn: watchlistMoviesApi.getWatchlistMovies,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoadingSeries || isLoadingMovies) {
    return (
      <div className="flex flex-col gap-6 py-12 items-center justify-center bg-[#121214]/80 border border-white/5 border-t-purple-500/50 rounded-3xl p-6 md:p-8">
        <div className="w-8 h-8 animate-spin rounded-full border-2 border-purple-500/20 border-t-purple-500" />
        <span className="text-xs text-zinc-500 font-medium">Carregando estatísticas...</span>
      </div>
    );
  }

  // --- Calculations ---

  // 1. General Stats
  const totalSeries = shows.length;
  const totalEpisodes = shows.reduce((acc, s) => acc + s.totalAiredEpisodes, 0);
  const watchedEpisodes = shows.reduce(
    (acc, s) => acc + s.episodes.filter((e) => e.watched).length + ((s.rewatchCount || 0) * s.totalAiredEpisodes),
    0
  );
  
  // Estimate time: series episodes * 45 minutes
  const timeSpentSeriesMinutes = watchedEpisodes * 45;
  
  // Movies in watchlist (estimate 120 mins per movie in watchlist as planned time)
  const totalMovies = movies.length;
  const timeSpentMoviesMinutes = totalMovies * 120;

  const formatTime = (totalMinutes: number) => {
    if (totalMinutes === 0) return "0 horas";
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days} dia${days > 1 ? "s" : ""}`);
    if (hours > 0) parts.push(`${hours} hora${hours > 1 ? "s" : ""}`);
    
    return parts.join(" e ");
  };

  const seriesCompleted = shows.reduce((acc, s) => {
    if (s.rewatching) {
      return acc + (s.rewatchCount || 0);
    } else if (s.unwatchedCount === 0 && !s.watchLater) {
      return acc + 1 + (s.rewatchCount || 0);
    }
    return acc;
  }, 0);

  // 2. Genres Distribution
  const genreCounts: Record<string, number> = {};
  shows.forEach((show) => {
    if (show.genres && Array.isArray(show.genres)) {
      show.genres.forEach((genre) => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    }
  });

  const topGenres = Object.entries(genreCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const maxGenreCount = topGenres.length > 0 ? topGenres[0].count : 1;

  // 3. Networks Distribution
  const networkCounts: Record<string, number> = {};
  shows.forEach((show) => {
    if (show.networks && Array.isArray(show.networks)) {
      show.networks.forEach((net) => {
        networkCounts[net] = (networkCounts[net] || 0) + 1;
      });
    }
  });

  const topNetworks = Object.entries(networkCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const maxNetworkCount = topNetworks.length > 0 ? topNetworks[0].count : 1;

  // 4. Ratings
  const allRatedEpisodes = shows.flatMap((show) =>
    show.episodes
      .filter((ep) => ep.watched && ep.rating !== undefined && ep.rating !== null)
      .map((ep) => ({
        ...ep,
        showTitle: show.title,
        showPoster: show.posterUrl,
        showId: show.tmdbId,
      }))
  );

  const totalRatings = allRatedEpisodes.length;
  
  const averageRating =
    totalRatings > 0
      ? allRatedEpisodes.reduce((acc, ep) => acc + (ep.rating ?? 0), 0) / totalRatings
      : 0;

  // Find most given rating (mode)
  const ratingFrequencies: Record<number, number> = {};
  allRatedEpisodes.forEach((ep) => {
    const val = Math.round(ep.rating ?? 0);
    ratingFrequencies[val] = (ratingFrequencies[val] || 0) + 1;
  });

  let mostGivenRating = 0;
  let maxFreq = 0;
  Object.entries(ratingFrequencies).forEach(([rating, freq]) => {
    if (freq > maxFreq) {
      maxFreq = freq;
      mostGivenRating = parseFloat(rating);
    }
  });

  // Top 5 Rated Episodes
  const bestEpisodes = [...allRatedEpisodes]
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 5);

  // Ratings chart data (1 to 10 scale)
  const ratingDistribution = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((ratingVal) => ({
    rating: `${ratingVal}★`,
    quantidade: ratingFrequencies[ratingVal] || 0,
  }));

  // --- Watching Pace (Completions) Calculations ---
  interface SeasonCompletion {
    showTitle: string;
    showTmdbId: string;
    seasonNumber: number;
    days: number;
    startDate: Date;
    endDate: Date;
    episodesCount: number;
  }

  interface SeriesCompletion {
    showTitle: string;
    showTmdbId: string;
    days: number;
    startDate: Date;
    endDate: Date;
    episodesCount: number;
  }

  const seasonCompletions: SeasonCompletion[] = [];
  const seriesCompletions: SeriesCompletion[] = [];

  shows.forEach((show) => {
    if (!show.episodes || show.episodes.length === 0) return;

    // Series completion
    const seriesWatchedEps = show.episodes.filter((e) => e.watched);
    const seriesAllWatched = show.unwatchedCount === 0;

    if (seriesAllWatched && seriesWatchedEps.length > 0) {
      const watchedDates = seriesWatchedEps
        .filter((e) => e.watchedAt)
        .map((e) => new Date(e.watchedAt!))
        .sort((a, b) => a.getTime() - b.getTime());

      // Only calculate if we have dates for all watched episodes
      if (watchedDates.length === seriesWatchedEps.length) {
        const startDate = watchedDates[0];
        const endDate = watchedDates[watchedDates.length - 1];
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        seriesCompletions.push({
          showTitle: show.title,
          showTmdbId: show.tmdbId,
          days: diffDays,
          startDate,
          endDate,
          episodesCount: seriesWatchedEps.length,
        });
      }
    }

    // Seasons completion
    const seasonsGrouped: Record<number, EpisodeDTO[]> = {};
    show.episodes.forEach((ep) => {
      if (!seasonsGrouped[ep.seasonNumber]) {
        seasonsGrouped[ep.seasonNumber] = [];
      }
      seasonsGrouped[ep.seasonNumber].push(ep);
    });

    Object.entries(seasonsGrouped).forEach(([seasonNumStr, eps]) => {
      const seasonNumber = parseInt(seasonNumStr, 10);
      const allWatched = eps.every((e) => e.watched);
      if (allWatched && eps.length > 0) {
        const watchedDates = eps
          .filter((e) => e.watchedAt)
          .map((e) => new Date(e.watchedAt!))
          .sort((a, b) => a.getTime() - b.getTime());

        if (watchedDates.length === eps.length) {
          const startDate = watchedDates[0];
          const endDate = watchedDates[watchedDates.length - 1];
          const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          seasonCompletions.push({
            showTitle: show.title,
            showTmdbId: show.tmdbId,
            seasonNumber,
            days: diffDays,
            startDate,
            endDate,
            episodesCount: eps.length,
          });
        }
      }
    });
  });

  // Sort completions by the most recently completed (endDate descending)
  seasonCompletions.sort((a, b) => b.endDate.getTime() - a.endDate.getTime());
  seriesCompletions.sort((a, b) => b.endDate.getTime() - a.endDate.getTime());

  return (
    <div className="flex flex-col gap-6 relative z-10 animate-in fade-in duration-300">
      {/* Overview Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Episodes Watched */}
        <div className="bg-[#18181b]/55 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-zinc-500">
              Episódios Assistidos
            </span>
            <div className="p-1.5 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20">
              <Tv className="w-4 h-4" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              {watchedEpisodes}
            </span>
            <span className="text-[10px] text-zinc-500 mt-1">
              De um total de {totalEpisodes} episódios lançados
            </span>
          </div>
        </div>

        {/* Card 2: Time spent series */}
        <div className="bg-[#18181b]/55 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-zinc-500">
              Tempo Assistindo
            </span>
            <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-lg md:text-xl font-bold text-white leading-tight min-h-[36px] flex items-center">
              {formatTime(timeSpentSeriesMinutes)}
            </span>
            <span className="text-[10px] text-zinc-500 mt-1">
              Estimado (45 min/ep nas séries assistidas)
            </span>
          </div>
        </div>

        {/* Card 3: Series completed */}
        <div className="bg-[#18181b]/55 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-zinc-500">
              Séries em Dia
            </span>
            <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              {seriesCompleted}
            </span>
            <span className="text-[10px] text-zinc-500 mt-1">
              Séries acompanhadas sem episódios pendentes
            </span>
          </div>
        </div>

        {/* Card 4: Movies in watchlist */}
        <div className="bg-[#18181b]/55 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-zinc-500">
              Filmes na Watchlist
            </span>
            <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
              <Film className="w-4 h-4" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              {totalMovies}
            </span>
            <span className="text-[10px] text-zinc-500 mt-1">
              Adicionados no LMS Filmes para ver depois
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts & Rankings Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Top Genres */}
        <div className="bg-[#18181b]/55 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Principais Gêneros de Séries
            </h3>
          </div>
          
          {topGenres.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">Nenhum gênero disponível.</div>
          ) : (
            <div className="flex flex-col gap-4">
              {topGenres.map((genre) => {
                const percent = Math.round((genre.count / maxGenreCount) * 100);
                return (
                  <div key={genre.name} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-300">{genre.name}</span>
                      <span className="text-purple-400">{genre.count} série{genre.count > 1 ? "s" : ""}</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-800/60 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Top Networks */}
        <div className="bg-[#18181b]/55 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <Radio className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Canais & Emissoras Principais
            </h3>
          </div>
          
          {topNetworks.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">Nenhuma emissora disponível.</div>
          ) : (
            <div className="flex flex-col gap-4">
              {topNetworks.map((net) => {
                const percent = Math.round((net.count / maxNetworkCount) * 100);
                return (
                  <div key={net.name} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-300">{net.name}</span>
                      <span className="text-blue-400">{net.count} série{net.count > 1 ? "s" : ""}</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-800/60 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Ratings distribution & best episodes Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Part: Ratings Distribution Chart */}
        <div className="lg:col-span-7 bg-[#18181b]/55 border border-white/5 rounded-2xl p-5 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Distribuição de Notas (Episódios)
              </h3>
            </div>
            {totalRatings > 0 && (
              <div className="flex gap-4 text-xs font-bold shrink-0 bg-black/40 border border-white/5 px-3 py-1 rounded-xl">
                <span className="text-zinc-400 flex items-center gap-1">
                  Média: <span className="text-purple-400">{averageRating.toFixed(1)}★</span>
                </span>
                <span className="text-zinc-400 flex items-center gap-1">
                  Mais Comum: <span className="text-amber-400">{mostGivenRating.toFixed(0)}★</span>
                </span>
              </div>
            )}
          </div>

          {totalRatings === 0 ? (
            <div className="flex-1 min-h-[220px] flex items-center justify-center text-xs text-zinc-500">
              Nenhum episódio avaliado ainda. Avalie no histórico de episódios de alguma série!
            </div>
          ) : (
            <div className="flex-1 w-full min-h-[220px] h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratingDistribution} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis
                    dataKey="rating"
                    stroke="#71717a"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#71717a"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255, 255, 255, 0.03)" }}
                    contentStyle={{
                      backgroundColor: "#161619",
                      borderColor: "rgba(255, 255, 255, 0.08)",
                      borderRadius: "12px",
                      fontSize: "11px",
                      color: "#fff",
                    }}
                  />
                  <Bar
                    dataKey="quantidade"
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right Part: Best Episodes list */}
        <div className="lg:col-span-5 bg-[#18181b]/55 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <Star className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Melhores Episódios Avaliados
            </h3>
          </div>

          {bestEpisodes.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              Avalie episódios para ver o seu ranking de episódios favoritos aqui.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {bestEpisodes.map((ep, idx) => (
                <div
                  key={`${ep.showId}-${ep.seasonNumber}-${ep.episodeNumber}`}
                  className="flex items-center justify-between gap-3 p-2.5 bg-black/25 border border-white/5 rounded-xl transition-all hover:border-amber-500/10"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-extrabold text-amber-400 leading-none">
                        {idx + 1}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider truncate">
                        {ep.showTitle}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                        <span className="text-[9px] font-mono text-purple-400 font-bold shrink-0">
                          S{String(ep.seasonNumber).padStart(2, "0")}-E{String(ep.episodeNumber).padStart(2, "0")}
                        </span>
                        <span className="text-xs text-zinc-200 font-medium truncate">
                          {ep.name}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="text-xs font-mono font-bold">
                      {ep.rating?.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Watching Pace (Completions) Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Season Completion Pace */}
        <div className="bg-[#18181b]/55 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <Clock className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Tempo de Conclusão (Temporadas)
            </h3>
          </div>

          {seasonCompletions.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              Nenhuma temporada concluída com datas de visualização registradas ainda.
              <br />
              <span className="text-[10px] text-zinc-600 mt-1 block">
                Marque todos os episódios de uma temporada para ver a estatística.
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {seasonCompletions.slice(0, 5).map((comp) => (
                <a
                  key={`${comp.showTitle}-${comp.seasonNumber}`}
                  href={`https://filmes.lucasmks.com.br/series/${comp.showTmdbId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 bg-black/25 border border-white/5 rounded-xl transition-all hover:border-purple-500/30 group"
                >
                  <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider group-hover:text-purple-400 transition-colors">
                    {comp.showTitle}
                  </span>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mt-1">
                    <span className="text-xs text-zinc-200 font-medium">
                      {comp.seasonNumber}ª Temporada ({comp.episodesCount} episódios)
                    </span>
                    <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-lg">
                      {comp.days === 0
                        ? "Maratona (mesmo dia)"
                        : comp.days === 1
                        ? "1 dia"
                        : `${comp.days} dias`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-500 mt-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      De {comp.startDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })} até{" "}
                      {comp.endDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Series Completion Pace */}
        <div className="bg-[#18181b]/55 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <Award className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Tempo de Conclusão (Séries Completas)
            </h3>
          </div>

          {seriesCompletions.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              Nenhuma série concluída com datas de visualização registradas ainda.
              <br />
              <span className="text-[10px] text-zinc-600 mt-1 block">
                Marque todos os episódios de uma série para ver a estatística.
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {seriesCompletions.slice(0, 5).map((comp) => (
                <a
                  key={comp.showTitle}
                  href={`https://filmes.lucasmks.com.br/series/${comp.showTmdbId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 bg-black/25 border border-white/5 rounded-xl transition-all hover:border-emerald-500/30 group"
                >
                  <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">
                    Série Concluída
                  </span>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mt-1">
                    <span className="text-xs text-zinc-200 font-bold group-hover:text-emerald-400 transition-colors">
                      {comp.showTitle} ({comp.episodesCount} episódios)
                    </span>
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                      {comp.days === 0
                        ? "Maratona (mesmo dia)"
                        : comp.days === 1
                        ? "1 dia"
                        : `${comp.days} dias`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-500 mt-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      De {comp.startDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })} até{" "}
                      {comp.endDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
