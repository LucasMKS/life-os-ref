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

export function ReleaseRadarWidget() {
  const [selectedItem, setSelectedItem] =
    useState<GroupedRadarRelease | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: releases = [], isLoading } = useQuery<ReleaseRadarDTO[]>({
    queryKey: ["release-radar"],
    queryFn: radarApi.getUpcomingReleases,
    refetchInterval: 1000 * 60 * 60,
  });

  const groupedReleases = useMemo(() => {
    const safeReleases = Array.isArray(releases) ? releases : [];
    return groupAndFilterRadarReleases(safeReleases);
  }, [releases]);

  const handleOpenSchedule = (item: GroupedRadarRelease) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  return (
    <>
      <SurfacePanel
        accent="purple"
        title="Radar de Lançamentos"
        icon={<Calendar className="w-4 h-4 text-purple-400" />}
        action={
          <span className="text-[10px] uppercase tracking-wider text-purple-300 font-semibold bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
            Sua Watchlist
          </span>
        }
        className="w-full flex flex-col min-h-[280px] border-t-2 border-t-purple-500/60"
      >
        {isLoading ? (
          <div className="w-full flex flex-col items-center justify-center gap-2.5 py-14">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
            <p className="text-zinc-500 text-xs font-medium">
              Sincronizando com TMDB...
            </p>
          </div>
        ) : groupedReleases.length > 0 ? (
          <div className="flex gap-3.5 md:gap-4 overflow-x-auto pb-2 snap-x scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent w-full">
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
                  className={`cursor-pointer relative group shrink-0 w-[135px] sm:w-[155px] md:w-[185px] flex flex-col gap-2.5 snap-start rounded-xl p-1.5 transition-colors ${
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
                      <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-[#09090b]/90 text-zinc-200 border border-white/[0.1]">
                        <CalendarDays className="w-2.5 h-2.5" />
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
                        className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-[#09090b]/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/[0.1] opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        title="Abrir no LMS Filmes"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}

                    <div className="hidden lg:flex absolute inset-0 bg-gradient-to-t from-[#09090b]/95 via-[#09090b]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 items-end p-2.5 pointer-events-none">
                      <p className="text-[11px] text-zinc-300 line-clamp-4 leading-snug">
                        {item.description || "Clique para ver detalhes e datas."}
                      </p>
                    </div>

                    <div
                      className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[9px] md:text-[10px] font-bold tracking-wider uppercase border ${
                        isToday
                          ? "bg-emerald-500/90 text-zinc-950 border-emerald-400"
                          : "bg-[#09090b]/90 text-zinc-200 border-white/[0.1]"
                      }`}
                    >
                      {daysUntil}
                    </div>
                  </div>

                  <div className="flex flex-col px-0.5">
                    <h3
                      className="text-xs md:text-sm font-semibold text-white truncate group-hover:text-zinc-200 transition-colors"
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
            description="Os filmes e séries da sua Watchlist já foram lançados ou ainda não têm data de estreia."
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
