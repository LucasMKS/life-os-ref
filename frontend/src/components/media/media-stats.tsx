"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Award,
  BarChart2,
  Calendar,
  Clock,
  Film,
  Loader2,
  Radio,
  Star,
  TrendingUp,
  Tv,
} from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState, StatCard, SurfacePanel } from "@/components/ui/page-shell";
import { buildLmsMediaUrl } from "@/components/media/media-poster";
import { radarApi } from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";
import { watchlistMoviesApi } from "@/lib/media-api";
import { EpisodeDTO, SerieWatchStatusDTO } from "@/lib/types";

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

export function MediaStats() {
  const userId = useAuthStore((state) => state.userId);
  const { data: rawShows = [], isLoading: isLoadingSeries } = useQuery<
    SerieWatchStatusDTO[]
  >({
    queryKey: ["media-episodes-to-watch", userId],
    queryFn: radarApi.getEpisodesToWatch,
    staleTime: 1000 * 60 * 5,
  });
  const shows = Array.isArray(rawShows) ? rawShows : [];

  const { data: rawMovies = [], isLoading: isLoadingMovies } = useQuery({
    queryKey: ["media-watchlist-movies-count"],
    queryFn: watchlistMoviesApi.getWatchlistMovies,
    staleTime: 1000 * 60 * 5,
  });
  const movies = Array.isArray(rawMovies) ? rawMovies : [];

  if (isLoadingSeries || isLoadingMovies) {
    return (
      <SurfacePanel>
        <div className="flex flex-col gap-3 py-12 items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          <span className="text-xs text-zinc-500 font-medium">
            Carregando estatísticas...
          </span>
        </div>
      </SurfacePanel>
    );
  }

  const totalEpisodes = shows.reduce(
    (acc, s) => acc + (s.totalAiredEpisodes ?? 0),
    0,
  );
  const watchedEpisodes = shows.reduce((acc, s) => {
    const eps = Array.isArray(s.episodes) ? s.episodes : [];
    return (
      acc +
      eps.filter((e) => e.watched).length +
      (s.rewatchCount || 0) * (s.totalAiredEpisodes ?? 0)
    );
  }, 0);

  const timeSpentSeriesMinutes = watchedEpisodes * 45;
  const totalMovies = movies.length;

  const formatTime = (totalMinutes: number) => {
    if (totalMinutes === 0) return "0 horas";
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);

    const parts: string[] = [];
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

  const genreCounts: Record<string, number> = {};
  shows.forEach((show) => {
    if (Array.isArray(show.genres)) {
      show.genres.forEach((genre) => {
        if (genre) genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    }
  });

  const topGenres = Object.entries(genreCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const maxGenreCount = topGenres.length > 0 ? topGenres[0].count : 1;

  const networkCounts: Record<string, number> = {};
  shows.forEach((show) => {
    if (Array.isArray(show.networks)) {
      show.networks.forEach((net) => {
        if (net) networkCounts[net] = (networkCounts[net] || 0) + 1;
      });
    }
  });

  const topNetworks = Object.entries(networkCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const maxNetworkCount = topNetworks.length > 0 ? topNetworks[0].count : 1;

  const allRatedEpisodes = shows.flatMap((show) => {
    const eps = Array.isArray(show.episodes) ? show.episodes : [];
    return eps
      .filter((ep) => ep.watched && ep.rating !== undefined && ep.rating !== null)
      .map((ep) => ({
        ...ep,
        showTitle: show.title,
        showPoster: show.posterUrl,
        showId: show.tmdbId,
      }));
  });

  const totalRatings = allRatedEpisodes.length;
  const averageRating =
    totalRatings > 0
      ? allRatedEpisodes.reduce((acc, ep) => acc + (ep.rating ?? 0), 0) /
        totalRatings
      : 0;

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

  const bestEpisodes = [...allRatedEpisodes]
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 5);

  const ratingDistribution = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(
    (ratingVal) => ({
      rating: `${ratingVal}★`,
      quantidade: ratingFrequencies[ratingVal] || 0,
    }),
  );

  const seasonCompletions: SeasonCompletion[] = [];
  const seriesCompletions: SeriesCompletion[] = [];

  shows.forEach((show) => {
    const eps = Array.isArray(show.episodes) ? show.episodes : [];
    if (eps.length === 0) return;

    const seriesWatchedEps = eps.filter((e) => e.watched);
    const seriesAllWatched = show.unwatchedCount === 0;

    if (seriesAllWatched && seriesWatchedEps.length > 0) {
      const watchedDates = seriesWatchedEps
        .filter((e) => e.watchedAt)
        .map((e) => new Date(e.watchedAt!))
        .filter((d) => !Number.isNaN(d.getTime()))
        .sort((a, b) => a.getTime() - b.getTime());

      if (watchedDates.length === seriesWatchedEps.length) {
        const startDate = watchedDates[0];
        const endDate = watchedDates[watchedDates.length - 1];
        const diffDays = Math.floor(
          Math.abs(endDate.getTime() - startDate.getTime()) /
            (1000 * 60 * 60 * 24),
        );
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

    const seasonsGrouped: Record<number, EpisodeDTO[]> = {};
    eps.forEach((ep) => {
      if (!seasonsGrouped[ep.seasonNumber]) {
        seasonsGrouped[ep.seasonNumber] = [];
      }
      seasonsGrouped[ep.seasonNumber].push(ep);
    });

    Object.entries(seasonsGrouped).forEach(([seasonNumStr, seasonEps]) => {
      const seasonNumber = parseInt(seasonNumStr, 10);
      const allWatched = seasonEps.every((e) => e.watched);
      if (allWatched && seasonEps.length > 0) {
        const watchedDates = seasonEps
          .filter((e) => e.watchedAt)
          .map((e) => new Date(e.watchedAt!))
          .filter((d) => !Number.isNaN(d.getTime()))
          .sort((a, b) => a.getTime() - b.getTime());

        if (watchedDates.length === seasonEps.length) {
          const startDate = watchedDates[0];
          const endDate = watchedDates[watchedDates.length - 1];
          const diffDays = Math.floor(
            Math.abs(endDate.getTime() - startDate.getTime()) /
              (1000 * 60 * 60 * 24),
          );
          seasonCompletions.push({
            showTitle: show.title,
            showTmdbId: show.tmdbId,
            seasonNumber,
            days: diffDays,
            startDate,
            endDate,
            episodesCount: seasonEps.length,
          });
        }
      }
    });
  });

  seasonCompletions.sort((a, b) => b.endDate.getTime() - a.endDate.getTime());
  seriesCompletions.sort((a, b) => b.endDate.getTime() - a.endDate.getTime());

  return (
    <div className="flex flex-col gap-5">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          label="Episódios Assistidos"
          value={watchedEpisodes}
          hint={`De um total de ${totalEpisodes} lançados`}
          icon={<Tv className="w-4 h-4 text-zinc-400" />}
        />
        <StatCard
          label="Tempo Assistindo"
          value={formatTime(timeSpentSeriesMinutes)}
          hint="Estimado (45 min/ep)"
          icon={<Clock className="w-4 h-4 text-zinc-400" />}
        />
        <StatCard
          label="Séries em Dia"
          value={seriesCompleted}
          hint="Sem episódios pendentes"
          icon={<Award className="w-4 h-4 text-emerald-400" />}
        />
        <StatCard
          label="Filmes na Watchlist"
          value={totalMovies}
          hint="Adicionados no LMS Filmes"
          icon={<Film className="w-4 h-4 text-zinc-400" />}
        />
      </div>

      {/* Genres & Networks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SurfacePanel
          title="Principais Gêneros de Séries"
          icon={<TrendingUp className="w-4 h-4 text-zinc-400" />}
        >
          {topGenres.length === 0 ? (
            <EmptyState title="Nenhum gênero disponível" />
          ) : (
            <div className="flex flex-col gap-4">
              {topGenres.map((genre) => {
                const percent = Math.round((genre.count / maxGenreCount) * 100);
                return (
                  <div key={genre.name} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-zinc-200">{genre.name}</span>
                      <span className="text-zinc-400 tabular-nums">
                        {genre.count} série{genre.count > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-zinc-200 rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SurfacePanel>

        <SurfacePanel
          title="Canais & Emissoras Principais"
          icon={<Radio className="w-4 h-4 text-zinc-400" />}
        >
          {topNetworks.length === 0 ? (
            <EmptyState title="Nenhuma emissora disponível" />
          ) : (
            <div className="flex flex-col gap-4">
              {topNetworks.map((net) => {
                const percent = Math.round((net.count / maxNetworkCount) * 100);
                return (
                  <div key={net.name} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-zinc-200">{net.name}</span>
                      <span className="text-sky-400 tabular-nums">
                        {net.count} série{net.count > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-400/80 rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SurfacePanel>
      </div>

      {/* Ratings Distribution & Best Episodes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <SurfacePanel
          title="Distribuição de Notas (Episódios)"
          icon={<BarChart2 className="w-4 h-4 text-zinc-400" />}
          action={
            totalRatings > 0 ? (
              <div className="flex gap-3 text-xs font-medium bg-[#161619] border border-white/[0.06] px-2.5 py-1 rounded-lg tabular-nums">
                <span className="text-zinc-400">
                  Média:{" "}
                  <span className="text-white">{averageRating.toFixed(1)}★</span>
                </span>
                <span className="text-zinc-400">
                  Mais comum:{" "}
                  <span className="text-amber-400">
                    {mostGivenRating.toFixed(0)}★
                  </span>
                </span>
              </div>
            ) : null
          }
          className="lg:col-span-7 flex flex-col"
        >
          {totalRatings === 0 ? (
            <EmptyState
              title="Nenhum episódio avaliado ainda"
              description="Avalie episódios no LMS Filmes para acompanhar sua distribuição de notas."
            />
          ) : (
            <div className="w-full min-h-[220px] h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ratingDistribution}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
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
                    fill="#38bdf8"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={36}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </SurfacePanel>

        <SurfacePanel
          title="Melhores Episódios Avaliados"
          icon={<Star className="w-4 h-4 text-amber-400" />}
          className="lg:col-span-5"
        >
          {bestEpisodes.length === 0 ? (
            <EmptyState
              title="Sem episódios avaliados"
              description="Avalie episódios para ver seu ranking aqui."
            />
          ) : (
            <div className="flex flex-col gap-2.5">
              {bestEpisodes.map((ep, idx) => (
                <div
                  key={`${ep.showId}-${ep.seasonNumber}-${ep.episodeNumber}`}
                  className="flex items-center justify-between gap-3 p-2.5 bg-[#161619] border border-white/[0.06] rounded-xl"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-zinc-300 leading-none">
                        {idx + 1}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-zinc-500 font-semibold block uppercase tracking-wider truncate">
                        {ep.showTitle}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                        <span className="text-[10px] font-mono text-sky-400 font-semibold shrink-0">
                          S{String(ep.seasonNumber).padStart(2, "0")}-E
                          {String(ep.episodeNumber).padStart(2, "0")}
                        </span>
                        <span className="text-xs text-zinc-200 font-medium truncate">
                          {ep.name}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/[0.05] text-zinc-200 border border-white/[0.08] shrink-0 tabular-nums">
                    <Star className="w-3 h-3 text-amber-400 fill-current" />
                    <span className="text-xs font-mono font-semibold">
                      {ep.rating?.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SurfacePanel>
      </div>

      {/* Watching Pace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SurfacePanel
          title="Tempo de Conclusão (Temporadas)"
          icon={<Clock className="w-4 h-4 text-zinc-400" />}
        >
          {seasonCompletions.length === 0 ? (
            <EmptyState
              title="Nenhuma temporada concluída"
              description="Marque todos os episódios de uma temporada para ver a estatística."
            />
          ) : (
            <div className="flex flex-col gap-2.5">
              {seasonCompletions.slice(0, 5).map((comp) => {
                const url = buildLmsMediaUrl("SERIES", comp.showTmdbId);
                return (
                  <a
                    key={`${comp.showTitle}-${comp.seasonNumber}`}
                    href={url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-[#161619] border border-white/[0.06] hover:border-white/[0.12] rounded-xl transition-colors group"
                  >
                    <span className="text-[10px] text-zinc-500 font-semibold block uppercase tracking-wider group-hover:text-zinc-300 transition-colors">
                      {comp.showTitle}
                    </span>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mt-1">
                      <span className="text-xs text-zinc-200 font-medium">
                        {comp.seasonNumber}ª Temporada ({comp.episodesCount}{" "}
                        episódios)
                      </span>
                      <span className="text-xs font-medium text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-lg self-start sm:self-auto">
                        {comp.days === 0
                          ? "Maratona (mesmo dia)"
                          : comp.days === 1
                            ? "1 dia"
                            : `${comp.days} dias`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mt-2">
                      <Calendar className="w-3 h-3" />
                      <span>
                        De{" "}
                        {comp.startDate.toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "long",
                        })}{" "}
                        até{" "}
                        {comp.endDate.toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "long",
                        })}
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </SurfacePanel>

        <SurfacePanel
          title="Tempo de Conclusão (Séries Completas)"
          icon={<Award className="w-4 h-4 text-emerald-400" />}
        >
          {seriesCompletions.length === 0 ? (
            <EmptyState
              title="Nenhuma série concluída"
              description="Marque todos os episódios de uma série para ver a estatística."
            />
          ) : (
            <div className="flex flex-col gap-2.5">
              {seriesCompletions.slice(0, 5).map((comp) => {
                const url = buildLmsMediaUrl("SERIES", comp.showTmdbId);
                return (
                  <a
                    key={comp.showTitle}
                    href={url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-[#161619] border border-white/[0.06] hover:border-white/[0.12] rounded-xl transition-colors group"
                  >
                    <span className="text-[10px] text-zinc-500 font-semibold block uppercase tracking-wider">
                      Série Concluída
                    </span>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mt-1">
                      <span className="text-xs text-zinc-200 font-semibold group-hover:text-emerald-400 transition-colors">
                        {comp.showTitle} ({comp.episodesCount} episódios)
                      </span>
                      <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg self-start sm:self-auto">
                        {comp.days === 0
                          ? "Maratona (mesmo dia)"
                          : comp.days === 1
                            ? "1 dia"
                            : `${comp.days} dias`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mt-2">
                      <Calendar className="w-3 h-3" />
                      <span>
                        De{" "}
                        {comp.startDate.toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "long",
                        })}{" "}
                        até{" "}
                        {comp.endDate.toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "long",
                        })}
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </SurfacePanel>
      </div>
    </div>
  );
}
