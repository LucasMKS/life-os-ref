"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SurfacePanel } from "@/components/ui/page-shell";
import {
  MediaPoster,
  buildLmsMediaUrl,
} from "@/components/media/media-poster";
import { radarApi } from "@/lib/api";

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

  const releaseDate = new Date((r.releaseDate || "") + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isReleased = !Number.isNaN(releaseDate.getTime()) && releaseDate <= today;

  const isSeries =
    r.type === "SERIES" && r.seasonNumber != null && r.episodeNumber != null;
  const isPending = watchMutation.isPending || unwatchMutation.isPending;
  const targetUrl = buildLmsMediaUrl(r.type, r.tmdbId);

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

  if (!targetUrl) return null;

  return (
    <a
      href={targetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-1.5 p-1.5 rounded-xl bg-[#161619] border border-white/[0.06] hover:border-white/[0.14] transition-colors w-[88px] md:w-auto shrink-0 md:shrink relative"
    >
      <div className="aspect-[2/3] w-full rounded-lg overflow-hidden border border-white/[0.06] relative">
        <MediaPoster
          src={r.posterUrl}
          alt={r.title}
          type={r.type}
          className="w-full h-full object-cover transition-opacity opacity-85 group-hover:opacity-100"
          iconClassName="w-4 h-4 text-zinc-700"
        />

        {isSeries && isReleased && (
          <button
            type="button"
            onClick={handleWatchToggle}
            disabled={isPending}
            className={`absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
              r.watched
                ? "bg-emerald-600 text-white border border-emerald-500"
                : "bg-[#09090b]/85 text-zinc-400 hover:text-white border border-white/[0.12] hover:bg-zinc-800"
            }`}
            title={
              r.watched ? "Marcar como não assistido" : "Marcar como assistido"
            }
          >
            {isPending ? (
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
            ) : (
              <Check className={`w-3 h-3 ${r.watched ? "stroke-[3]" : ""}`} />
            )}
          </button>
        )}
      </div>

      <div className="flex flex-col min-w-0">
        <span className="text-[11px] font-semibold text-white truncate">
          {r.title}
        </span>
        {r.type === "SERIES" &&
          r.seasonNumber != null &&
          r.episodeNumber != null && (
            <span className="text-[10px] text-sky-400 font-mono">
              S{String(r.seasonNumber).padStart(2, "0")}E
              {String(r.episodeNumber).padStart(2, "0")}
            </span>
          )}
      </div>
    </a>
  );
}

export function WeeklyEpisodeCalendar() {
  const { data: rawDays = [], isLoading } = useQuery<WeeklyDay[]>({
    queryKey: ["media-weekly-calendar"],
    queryFn: radarApi.getWeeklyCalendar,
    staleTime: 1000 * 60 * 15,
  });

  const days = Array.isArray(rawDays) ? rawDays : [];

  return (
    <SurfacePanel
      title="Semana a frente"
      icon={<CalendarDays className="w-4 h-4 text-zinc-400" />}
      action={
        <span className="text-[11px] text-zinc-500">
          Episódios e estreias nos próximos 7 dias
        </span>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
        </div>
      ) : (
        <>
          {/* Mobile */}
          <div className="md:hidden flex flex-col gap-3">
            {days.map((day, idx) => {
              const isToday = idx === 0;
              const releases = Array.isArray(day.releases) ? day.releases : [];
              return (
                <div
                  key={day.date}
                  className={`p-3 rounded-xl border ${
                    isToday
                      ? "bg-sky-500/[0.06] border-sky-500/25"
                      : "bg-[#161619] border-white/[0.06]"
                  }`}
                >
                  <div
                    className={`text-[11px] font-semibold uppercase tracking-wider mb-2 ${
                      isToday ? "text-sky-400" : "text-zinc-400"
                    }`}
                  >
                    {day.dayLabel}
                    {isToday && <span className="ml-2 text-sky-300">• Hoje</span>}
                  </div>

                  {releases.length === 0 ? (
                    <div className="py-2 text-zinc-500 text-xs">
                      Sem estreias.
                    </div>
                  ) : (
                    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                      {releases.map((r) => (
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

          {/* Desktop */}
          <div className="hidden md:grid grid-cols-7 gap-3">
            {days.map((day, idx) => {
              const isToday = idx === 0;
              const releases = Array.isArray(day.releases) ? day.releases : [];
              return (
                <div
                  key={day.date}
                  className={`flex flex-col gap-2 p-3 rounded-xl border ${
                    isToday
                      ? "bg-sky-500/[0.06] border-sky-500/25"
                      : "bg-[#161619] border-white/[0.06]"
                  }`}
                >
                  <div
                    className={`text-[11px] font-semibold uppercase tracking-wider text-center pb-2 border-b ${
                      isToday
                        ? "text-sky-400 border-sky-500/20"
                        : "text-zinc-400 border-white/[0.06]"
                    }`}
                  >
                    {day.dayLabel}
                  </div>

                  <div className="flex flex-col gap-2">
                    {releases.length === 0 ? (
                      <div className="py-6 flex items-center justify-center">
                        <span className="text-zinc-600 text-xs">—</span>
                      </div>
                    ) : (
                      releases.map((r) => (
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
    </SurfacePanel>
  );
}
