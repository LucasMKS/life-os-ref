"use client";

import { Suspense, lazy, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Film,
  Info,
  Loader2,
  Tv,
} from "lucide-react";
import { EmptyState, FilterPill, SurfacePanel } from "@/components/ui/page-shell";
import {
  MediaPoster,
  buildLmsMediaUrl,
} from "@/components/media/media-poster";
import { radarApi } from "@/lib/api";
import { getDaysUntil, groupAndFilterRadarReleases } from "@/lib/date-utils";
import type {
  GroupedRadarRelease,
  ReleaseRadarDTO,
} from "@/components/media/release-schedule-modal";

const ReleaseScheduleModal = lazy(() =>
  import("@/components/media/release-schedule-modal").then((m) => ({
    default: m.ReleaseScheduleModal,
  })),
);

export function UpcomingReleasesRadar() {
  const [filter, setFilter] = useState<"ALL" | "SERIES" | "MOVIE">("ALL");
  const [selectedItem, setSelectedItem] =
    useState<GroupedRadarRelease | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const { data: releases = [], isLoading } = useQuery<ReleaseRadarDTO[]>({
    queryKey: ["media-upcoming-radar"],
    queryFn: radarApi.getUpcomingReleases,
    refetchInterval: 1000 * 60 * 60,
    staleTime: 1000 * 60 * 15,
  });

  const groupedReleases = useMemo(() => {
    const safeReleases = Array.isArray(releases) ? releases : [];
    return groupAndFilterRadarReleases(safeReleases);
  }, [releases]);

  const filteredReleases = useMemo(() => {
    return groupedReleases.filter((item) => {
      if (filter === "ALL") return true;
      return item.type === filter;
    });
  }, [groupedReleases, filter]);

  const formatShortDate = (dateString?: string) => {
    if (!dateString) return "—";
    try {
      const [year, month, day] = dateString.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      const formatted = date.toLocaleDateString("pt-BR", {
        weekday: "short",
        day: "2-digit",
        month: "short",
      });
      return (
        formatted.charAt(0).toUpperCase() + formatted.slice(1).replace(".", "")
      );
    } catch {
      return dateString;
    }
  };

  const scrollCarousel = (delta: number) => {
    carouselRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  const handleOpenSchedule = (item: GroupedRadarRelease) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  return (
    <>
      <SurfacePanel
        accent="purple"
        title="Radar de Próximos Lançamentos"
        icon={<Calendar className="w-4 h-4 text-purple-400" />}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <FilterPill
                accent="purple"
                active={filter === "ALL"}
                onClick={() => setFilter("ALL")}
              >
                Todos
              </FilterPill>
              <FilterPill
                accent="purple"
                active={filter === "SERIES"}
                onClick={() => setFilter("SERIES")}
              >
                Séries
              </FilterPill>
              <FilterPill
                accent="purple"
                active={filter === "MOVIE"}
                onClick={() => setFilter("MOVIE")}
              >
                Filmes
              </FilterPill>
            </div>

            {filteredReleases.length > 0 && (
              <div className="hidden md:flex items-center gap-1 ml-1">
                <button
                  type="button"
                  onClick={() => scrollCarousel(-300)}
                  className="p-1.5 rounded-lg bg-[#161619] border border-white/[0.06] hover:border-white/[0.12] text-zinc-400 hover:text-white transition-colors"
                  title="Rolar para esquerda"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCarousel(300)}
                  className="p-1.5 rounded-lg bg-[#161619] border border-white/[0.06] hover:border-white/[0.12] text-zinc-400 hover:text-white transition-colors"
                  title="Rolar para direita"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        }
        className="w-full flex flex-col h-full"
      >
        {isLoading ? (
          <div className="w-full flex flex-col items-center justify-center gap-3 py-16">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
            <p className="text-zinc-500 text-xs font-medium">
              Sincronizando com TMDB...
            </p>
          </div>
        ) : filteredReleases.length > 0 ? (
          <div
            ref={carouselRef}
            className="flex gap-3.5 md:gap-4 overflow-x-auto pb-2 snap-x scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent w-full"
          >
            {filteredReleases.map((item) => {
              const daysUntil = getDaysUntil(item.nextReleaseDate);
              const isToday = daysUntil === "ESTREIA HOJE!";
              const isTomorrow = daysUntil === "Amanhã";
              const totalEps = Array.isArray(item.upcomingEpisodes)
                ? item.upcomingEpisodes.length
                : 0;
              const targetUrl = buildLmsMediaUrl(item.type, item.tmdbId);

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenSchedule(item)}
                  className={`group cursor-pointer relative shrink-0 w-[135px] sm:w-[155px] md:w-[180px] flex flex-col gap-2.5 snap-start rounded-xl p-1.5 transition-colors ${
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
                        {item.description ||
                          "Clique para ver detalhes e datas."}
                      </p>
                    </div>

                    <div
                      className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[9px] md:text-[10px] font-bold tracking-wider uppercase border ${
                        isToday
                          ? "bg-emerald-500/90 text-zinc-950 border-emerald-400"
                          : isTomorrow
                            ? "bg-zinc-200 text-zinc-950 border-white/40"
                            : "bg-[#09090b]/90 text-zinc-200 border-white/[0.1]"
                      }`}
                    >
                      {daysUntil}
                    </div>
                  </div>

                  <div className="flex flex-col px-0.5 min-w-0">
                    <h3
                      className="text-xs md:text-sm font-semibold text-white truncate group-hover:text-zinc-200 transition-colors"
                      title={item.title}
                    >
                      {item.title}
                    </h3>

                    <div className="flex flex-col gap-0.5 mt-1 text-[10px] md:text-xs min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.type === "MOVIE" ? (
                          <div className="flex items-center gap-1 text-emerald-400 font-semibold uppercase tracking-wider text-[10px]">
                            <Film className="w-3 h-3 shrink-0" />
                            <span>Filme</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-sky-400 font-mono font-semibold text-[11px]">
                            <Tv className="w-3 h-3 shrink-0" />
                            <span>
                              S{item.nextSeasonNumber?.toString().padStart(2, "0")}
                              E{item.nextEpisodeNumber?.toString().padStart(2, "0")}
                            </span>
                          </div>
                        )}

                        {item.type === "SERIES" && totalEps > 1 && (
                          <span className="text-[10px] text-zinc-500">
                            ({totalEps} eps)
                          </span>
                        )}
                      </div>

                      <span className="text-zinc-400 text-[11px] whitespace-nowrap">
                        {formatShortDate(item.nextReleaseDate)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Info className="w-5 h-5" />}
            title="Nenhum lançamento futuro agendado"
            description="Todos os títulos de séries ou filmes em sua watchlist já estrearam ou não possuem datas confirmadas no TMDB."
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
