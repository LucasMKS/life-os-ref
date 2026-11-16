"use client";

import { Suspense, lazy, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  CalendarDays,
  ExternalLink,
  Film,
  Info,
  Loader2,
  Tv,
} from "lucide-react";
import { EmptyState, SurfacePanel } from "@/components/ui/page-shell";
import {
  MediaPoster,
  buildLmsMediaUrl,
} from "@/components/media/media-poster";
import { radarApi } from "@/lib/api";
import {
  formatDateToDDMM,
  getDaysUntil,
  groupAndFilterRadarReleases,
} from "@/lib/date-utils";
import type {
  GroupedRadarRelease,
  ReleaseRadarDTO,
} from "@/components/media/release-schedule-modal";

const ReleaseScheduleModal = lazy(() =>
  import("@/components/media/release-schedule-modal").then((m) => ({
    default: m.ReleaseScheduleModal,
  })),
);

export function MediaHeroRadar() {
  const [selectedItem, setSelectedItem] =
    useState<GroupedRadarRelease | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: releases = [], isLoading } = useQuery<ReleaseRadarDTO[]>({
    queryKey: ["media-hero-radar"],
    queryFn: radarApi.getUpcomingReleases,
    refetchInterval: 1000 * 60 * 60,
    staleTime: 1000 * 60 * 10,
  });

  const groupedReleases = useMemo(() => {
    const safeReleases = Array.isArray(releases) ? releases : [];
    const list = groupAndFilterRadarReleases(safeReleases);
    return list.sort((a, b) => {
      const isTodayA = getDaysUntil(a.nextReleaseDate) === "ESTREIA HOJE!";
      const isTodayB = getDaysUntil(b.nextReleaseDate) === "ESTREIA HOJE!";
      if (isTodayA !== isTodayB) return isTodayA ? -1 : 1;
      return (a.nextReleaseDate ?? "").localeCompare(b.nextReleaseDate ?? "");
    });
  }, [releases]);

  const handleOpenSchedule = (item: GroupedRadarRelease) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  return (
    <>
      <SurfacePanel
        title="Radar de Lançamentos"
        icon={<Calendar className="w-4 h-4 text-zinc-400" />}
        action={
          <span className="text-[11px] text-zinc-500">
            O que está por vir na sua watchlist
          </span>
        }
      >
        {isLoading ? (
          <div className="w-full flex flex-col items-center justify-center gap-3 py-16">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
            <p className="text-zinc-500 text-xs font-medium">
              Sincronizando com TMDB...
            </p>
          </div>
        ) : groupedReleases.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {groupedReleases.map((item) => {
              const daysUntil = getDaysUntil(item.nextReleaseDate);
              const isToday = daysUntil === "ESTREIA HOJE!";
              const totalEps = Array.isArray(item.upcomingEpisodes)
                ? item.upcomingEpisodes.length
                : 0;
              const targetUrl = buildLmsMediaUrl(item.type, item.tmdbId);

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenSchedule(item)}
                  className={`cursor-pointer relative group shrink-0 w-[170px] sm:w-[195px] md:w-[220px] flex flex-col gap-3 snap-start rounded-xl p-1.5 transition-colors ${
                    isToday
                      ? "bg-emerald-500/[0.07] border border-emerald-500/25"
                      : "hover:bg-white/[0.03] border border-transparent hover:border-white/[0.08]"
                  }`}
                >
                  <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden border border-white/[0.06] bg-[#161619]">
                    <MediaPoster
                      src={item.posterUrl}
                      alt={item.title}
                      type={item.type}
                    />

                    {item.type === "SERIES" && totalEps > 1 && (
                      <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#09090b]/90 text-zinc-200 border border-white/[0.1]">
                        <CalendarDays className="w-3 h-3" />
                        <span>+{totalEps - 1} eps</span>
                      </div>
                    )}

                    {targetUrl && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(
                            targetUrl,
                            "_blank",
                            "noopener,noreferrer",
                          );
                        }}
                        className="absolute bottom-2 right-2 p-2 rounded-xl bg-[#09090b]/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/[0.1] opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        title="Abrir no LMS Filmes"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <div className="hidden lg:flex absolute inset-0 bg-gradient-to-t from-[#09090b]/95 via-[#09090b]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 items-end p-3 pointer-events-none">
                      <p className="text-[11px] text-zinc-300 line-clamp-5 leading-snug">
                        {item.description ||
                          "Clique para ver detalhes e cronograma."}
                      </p>
                    </div>

                    {isToday ? (
                      <div className="absolute top-2 left-2 right-2 flex justify-center">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-emerald-500/90 text-zinc-950 border border-emerald-400">
                          Estreia hoje
                        </span>
                      </div>
                    ) : (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase border bg-[#09090b]/90 text-zinc-200 border-white/[0.1]">
                        {daysUntil}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col px-0.5">
                    <h3
                      className="text-sm font-semibold text-white truncate group-hover:text-zinc-200 transition-colors"
                      title={item.title}
                    >
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                      {item.type === "MOVIE" ? (
                        <>
                          <Film className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>Filme · {formatDateToDDMM(item.nextReleaseDate)}</span>
                        </>
                      ) : (
                        <>
                          <Tv className="w-3 h-3 text-sky-400 shrink-0" />
                          <span>
                            S{item.nextSeasonNumber?.toString().padStart(2, "0")}{" "}
                            E{item.nextEpisodeNumber?.toString().padStart(2, "0")}{" "}
                            {totalEps > 1 ? `(+${totalEps - 1})` : ""} ·{" "}
                            {formatDateToDDMM(item.nextReleaseDate)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Info className="w-5 h-5" />}
            title="Nenhum lançamento previsto"
            description="Os títulos da sua watchlist já foram lançados ou ainda não têm data definida."
          />
        )}
      </SurfacePanel>

      {isModalOpen && (
        <Suspense fallback={null}>
          <ReleaseScheduleModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            item={selectedItem}
          />
        </Suspense>
      )}
    </>
  );
}
