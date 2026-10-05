"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Film, Tv, Loader2, Info, CalendarDays, ExternalLink } from "lucide-react";
import { radarApi } from "@/lib/api";
import { getDaysUntil, formatDateToDDMM, groupAndFilterRadarReleases } from "@/lib/date-utils";
import {
  ReleaseScheduleModal,
  GroupedRadarRelease,
  ReleaseRadarDTO,
} from "@/components/media/release-schedule-modal";

export function MediaHeroRadar() {
  const [selectedItem, setSelectedItem] = useState<GroupedRadarRelease | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: releases = [], isLoading } = useQuery<ReleaseRadarDTO[]>({
    queryKey: ["media-hero-radar"],
    queryFn: radarApi.getUpcomingReleases,
    refetchInterval: 1000 * 60 * 60,
    staleTime: 1000 * 60 * 10,
  });

  const groupedReleases = useMemo(() => {
    const list = groupAndFilterRadarReleases(releases);
    return list.sort((a, b) => {
      const isTodayA = getDaysUntil(a.nextReleaseDate) === "ESTREIA HOJE!";
      const isTodayB = getDaysUntil(b.nextReleaseDate) === "ESTREIA HOJE!";
      if (isTodayA !== isTodayB) return isTodayA ? -1 : 1;
      return a.nextReleaseDate.localeCompare(b.nextReleaseDate);
    });
  }, [releases]);

  const handleOpenSchedule = (item: GroupedRadarRelease) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-purple-500/50 rounded-3xl p-5 md:p-6 lg:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 md:w-96 md:h-96 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/15 via-purple-600/5 to-transparent pointer-events-none opacity-70"></div>

        <div className="flex items-center justify-between mb-5 md:mb-6 relative z-10">
          <div className="flex items-center gap-2.5 md:gap-3">
            <div className="p-1.5 md:p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <Calendar className="text-purple-400 w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
                Radar de Lançamentos
              </h2>
              <span className="text-[10px] md:text-[11px] text-zinc-500 font-medium">
                O que está por vir na sua watchlist
              </span>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          {isLoading ? (
            <div className="w-full flex flex-col items-center justify-center gap-3 py-16">
              <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin text-purple-500/50" />
              <p className="text-zinc-500 text-xs md:text-sm font-medium">
                Sincronizando com TMDB...
              </p>
            </div>
          ) : groupedReleases.length > 0 ? (
            <div className="flex gap-4 md:gap-5 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              {groupedReleases.map((item) => {
                const daysUntil = getDaysUntil(item.nextReleaseDate);
                const isToday = daysUntil === "ESTREIA HOJE!";
                const totalEps = item.upcomingEpisodes.length;

                const targetUrl =
                  item.type === "MOVIE"
                    ? `https://filmes.lucasmks.com.br/filmes/${item.tmdbId}`
                    : `https://filmes.lucasmks.com.br/series/${item.tmdbId}`;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleOpenSchedule(item)}
                    className={`block cursor-pointer relative group shrink-0 w-[180px] sm:w-[200px] md:w-[240px] flex flex-col gap-3 md:gap-3.5 snap-start rounded-2xl p-2 transition-all duration-300 ${
                      isToday
                        ? "bg-purple-500/15 border border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.2)]"
                        : "hover:bg-white/[0.04] border border-transparent hover:border-white/10"
                    }`}
                  >
                    <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden shadow-lg border border-white/10 bg-zinc-950">
                      <img
                        src={item.posterUrl}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 lg:group-hover:scale-105"
                      />

                      {item.type === "SERIES" && totalEps > 1 && (
                        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-purple-950/85 text-purple-300 border border-purple-500/30 shadow-md backdrop-blur-md">
                          <CalendarDays className="w-3 h-3" />
                          <span>+{totalEps - 1} eps</span>
                        </div>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(targetUrl, "_blank", "noopener,noreferrer");
                        }}
                        className="absolute bottom-2 right-2 p-2 rounded-xl bg-black/80 hover:bg-purple-600 text-zinc-300 hover:text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-all z-10 shadow-md"
                        title="Abrir no LMS Filmes"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>

                      <div className="hidden lg:flex absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-end p-3 pointer-events-none">
                        <p className="text-[11px] text-zinc-300 line-clamp-5 leading-snug drop-shadow-md">
                          {item.description || "Clique para ver detalhes e cronograma."}
                        </p>
                      </div>

                      {isToday ? (
                        <div className="absolute top-2 left-2 right-2 flex justify-center">
                          <span className="px-2.5 py-1 rounded-lg text-[10px] md:text-[11px] font-black tracking-widest uppercase bg-purple-600 text-white shadow-lg border border-purple-300/40 animate-pulse">
                            Estreia hoje
                          </span>
                        </div>
                      ) : (
                        <div className="absolute top-2 right-2 px-2 py-0.5 md:px-2 md:py-1 rounded-lg text-[10px] md:text-[11px] font-black tracking-wider uppercase shadow-md backdrop-blur-md border bg-black/80 text-zinc-200 border-white/10">
                          {daysUntil}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col px-1">
                      <h3
                        className="text-sm md:text-base font-bold text-white truncate lg:group-hover:text-purple-400 transition-colors"
                        title={item.title}
                      >
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] md:text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                        {item.type === "MOVIE" ? (
                          <>
                            <Film className="w-3 h-3 text-emerald-400" />
                            Filme · {formatDateToDDMM(item.nextReleaseDate)}
                          </>
                        ) : (
                          <>
                            <Tv className="w-3 h-3 text-sky-400" />
                            S{item.nextSeasonNumber?.toString().padStart(2, "0")} E
                            {item.nextEpisodeNumber?.toString().padStart(2, "0")}{" "}
                            {totalEps > 1 ? `(+${totalEps - 1})` : ""} ·{" "}
                            {formatDateToDDMM(item.nextReleaseDate)}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="w-full flex flex-col items-center justify-center text-center p-8 md:p-10 bg-black/20 rounded-2xl border border-dashed border-white/10">
              <Info className="w-8 h-8 md:w-10 md:h-10 text-zinc-700 mb-2 md:mb-3" />
              <p className="text-zinc-400 text-xs md:text-sm font-medium">
                Nenhum lançamento previsto.
              </p>
              <p className="text-zinc-600 text-[10px] md:text-xs mt-1 max-w-sm">
                Os títulos da sua watchlist já foram lançados ou ainda não têm
                data definida.
              </p>
            </div>
          )}
        </div>
      </div>

      <ReleaseScheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={selectedItem}
      />
    </>
  );
}
