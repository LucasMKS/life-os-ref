"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Film, Tv, Loader2, Check } from "lucide-react";
import { radarApi } from "@/lib/api";
import { toast } from "sonner";

interface ReleaseRadarDTO {
  tmdbId: string;
  title: string;
  type: "MOVIE" | "SERIES";
  releaseDate: string;
  posterUrl: string;
  description: string;
  episodeNumber?: number;
  seasonNumber?: number;
  watched?: boolean;
}

interface WeeklyDay {
  date: string;
  dayLabel: string;
  releases: ReleaseRadarDTO[];
}

const targetUrlFor = (r: ReleaseRadarDTO) =>
  r.type === "MOVIE"
    ? `https://filmes.lucasmks.com.br/filmes/${r.tmdbId}`
    : `https://filmes.lucasmks.com.br/series/${r.tmdbId}`;

function ReleaseTile({ r }: { r: ReleaseRadarDTO }) {
  const queryClient = useQueryClient();

  const watchMutation = useMutation({
    mutationFn: ({
      serieId,
      seasonNumber,
      episodeNumber,
    }: {
      serieId: string;
      seasonNumber: number;
      episodeNumber: number;
    }) => radarApi.watchEpisode(serieId, seasonNumber, episodeNumber),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["media-weekly-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["media-episodes-to-watch"] });
      toast.success(
        `S${String(variables.seasonNumber).padStart(2, "0")}E${String(
          variables.episodeNumber,
        ).padStart(2, "0")} marcado como assistido!`,
      );
    },
    onError: () => {
      toast.error("Erro ao marcar episódio como assistido.");
    },
  });

  const unwatchMutation = useMutation({
    mutationFn: ({
      serieId,
      seasonNumber,
      episodeNumber,
    }: {
      serieId: string;
      seasonNumber: number;
      episodeNumber: number;
    }) => radarApi.unwatchEpisode(serieId, seasonNumber, episodeNumber),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["media-weekly-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["media-episodes-to-watch"] });
      toast.info(
        `S${String(variables.seasonNumber).padStart(2, "0")}E${String(
          variables.episodeNumber,
        ).padStart(2, "0")} desmarcado.`,
      );
    },
    onError: () => {
      toast.error("Erro ao desmarcar episódio.");
    },
  });

  const releaseDate = new Date(r.releaseDate + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isReleased = releaseDate <= today;

  const isSeries = r.type === "SERIES" && r.seasonNumber != null && r.episodeNumber != null;
  const isPending = watchMutation.isPending || unwatchMutation.isPending;

  const handleWatchToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSeries || r.seasonNumber == null || r.episodeNumber == null) return;

    const payload = {
      serieId: r.tmdbId,
      seasonNumber: r.seasonNumber,
      episodeNumber: r.episodeNumber,
    };

    if (r.watched) {
      unwatchMutation.mutate(payload);
    } else {
      watchMutation.mutate(payload);
    }
  };

  return (
    <a
      href={targetUrlFor(r)}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-1.5 p-1.5 rounded-xl bg-black/40 border border-white/5 hover:border-sky-500/30 transition-all w-[88px] md:w-auto shrink-0 md:shrink relative"
    >
      <div className="aspect-[2/3] w-full rounded-md overflow-hidden border border-white/5 relative">
        {r.posterUrl ? (
          <img
            src={r.posterUrl}
            alt={r.title}
            loading="lazy"
            className="w-full h-full object-cover transition-opacity opacity-85 group-hover:opacity-100"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900">
            {r.type === "MOVIE" ? (
              <Film className="w-4 h-4 text-zinc-700" />
            ) : (
              <Tv className="w-4 h-4 text-zinc-700" />
            )}
          </div>
        )}

        {/* Overlay do botão de assistido */}
        {isSeries && isReleased && (
          <button
            onClick={handleWatchToggle}
            disabled={isPending}
            className={`absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
              r.watched
                ? "bg-emerald-600 text-white border border-emerald-500 shadow-md shadow-emerald-950/50"
                : "bg-black/60 text-zinc-400 hover:text-white border border-white/10 hover:bg-sky-600/80 hover:border-sky-500 shadow-sm"
            }`}
            title={r.watched ? "Marcar como não assistido" : "Marcar como assistido"}
          >
            {isPending ? (
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
            ) : r.watched ? (
              <Check className="w-3 h-3 stroke-[3]" />
            ) : (
              <Check className="w-3 h-3" />
            )}
          </button>
        )}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] md:text-[11px] font-bold text-white truncate">
          {r.title}
        </span>
        {r.type === "SERIES" &&
          r.seasonNumber != null &&
          r.episodeNumber != null && (
            <span className="text-[9px] md:text-[10px] text-sky-400 font-mono">
              S{String(r.seasonNumber).padStart(2, "0")}E
              {String(r.episodeNumber).padStart(2, "0")}
            </span>
          )}
      </div>
    </a>
  );
}

export function WeeklyEpisodeCalendar() {
  const { data: days = [], isLoading } = useQuery<WeeklyDay[]>({
    queryKey: ["media-weekly-calendar"],
    queryFn: radarApi.getWeeklyCalendar,
    staleTime: 1000 * 60 * 15,
  });

  return (
    <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-sky-500/50 rounded-3xl p-4 md:p-6 lg:p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-72 h-72 bg-sky-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex items-center gap-2.5 md:gap-3 mb-4 md:mb-6 relative z-10">
        <div className="p-1.5 md:p-2 bg-sky-500/10 rounded-xl border border-sky-500/20">
          <CalendarDays className="text-sky-400 w-4 h-4 md:w-5 md:h-5" />
        </div>
        <div className="flex flex-col">
          <h2 className="text-base md:text-xl font-bold text-white tracking-tight">
            Semana a frente
          </h2>
          <span className="text-[10px] md:text-[11px] text-zinc-500 font-medium">
            Episódios e estreias nos próximos 7 dias
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 relative z-10">
          <Loader2 className="w-6 h-6 animate-spin text-sky-500/50" />
        </div>
      ) : (
        <>
          {/* MOBILE: dias empilhados verticalmente, releases scrolláveis horizontalmente */}
          <div className="md:hidden flex flex-col gap-3 relative z-10">
            {days.map((day, idx) => {
              const isToday = idx === 0;
              return (
                <div
                  key={day.date}
                  className={`p-3 rounded-2xl border ${
                    isToday
                      ? "bg-sky-500/5 border-sky-500/30"
                      : "bg-black/30 border-white/5"
                  }`}
                >
                  <div
                    className={`text-[11px] font-bold uppercase tracking-widest mb-2 ${
                      isToday ? "text-sky-400" : "text-zinc-400"
                    }`}
                  >
                    {day.dayLabel}
                    {isToday && <span className="ml-2 text-sky-300">• Hoje</span>}
                  </div>

                  {day.releases.length === 0 ? (
                    <div className="py-3 text-zinc-600 text-xs">
                      Sem estreias.
                    </div>
                  ) : (
                    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                      {day.releases.map((r) => (
                        <ReleaseTile
                          key={`${r.type}-${r.tmdbId}-${day.date}`}
                          r={r}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* DESKTOP: grid 7 colunas */}
          <div className="hidden md:grid grid-cols-7 gap-3 relative z-10">
            {days.map((day, idx) => {
              const isToday = idx === 0;
              return (
                <div
                  key={day.date}
                  className={`flex flex-col gap-2 p-3 rounded-2xl border ${
                    isToday
                      ? "bg-sky-500/5 border-sky-500/30"
                      : "bg-black/30 border-white/5"
                  }`}
                >
                  <div
                    className={`text-[11px] font-bold uppercase tracking-widest text-center pb-2 border-b ${
                      isToday
                        ? "text-sky-400 border-sky-500/20"
                        : "text-zinc-500 border-white/5"
                    }`}
                  >
                    {day.dayLabel}
                  </div>

                  <div className="flex flex-col gap-2">
                    {day.releases.length === 0 ? (
                      <div className="py-6 flex items-center justify-center">
                        <span className="text-zinc-700 text-[10px]">—</span>
                      </div>
                    ) : (
                      day.releases.map((r) => (
                        <ReleaseTile
                          key={`${r.type}-${r.tmdbId}-${day.date}`}
                          r={r}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
