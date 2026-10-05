"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { radarApi } from "@/lib/api";
import { Calendar, Film, Tv, Loader2, Info, CalendarDays, ExternalLink } from "lucide-react";
import { getDaysUntil, formatDateToDDMM, groupAndFilterRadarReleases } from "@/lib/date-utils";
import {
  ReleaseScheduleModal,
  GroupedRadarRelease,
  ReleaseRadarDTO,
} from "@/components/media/release-schedule-modal";

export function ReleaseRadarWidget() {
  const [selectedItem, setSelectedItem] = useState<GroupedRadarRelease | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: releases = [], isLoading } = useQuery<ReleaseRadarDTO[]>({
    queryKey: ["release-radar"],
    queryFn: radarApi.getUpcomingReleases,
    refetchInterval: 1000 * 60 * 60,
  });

  // Agrupar episódios da mesma série e aplicar regras (sem séries no 'Já lançou' e máximo 2 filmes passados)
  const groupedReleases = useMemo(() => {
    return groupAndFilterRadarReleases(releases);
  }, [releases]);

  const handleOpenSchedule = (item: GroupedRadarRelease) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-purple-500/50 rounded-3xl p-5 md:p-6 lg:p-8 shadow-2xl relative overflow-hidden flex flex-col w-full h-auto min-h-[300px]">
        {/* Glow de Fundo */}
        <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/10 via-purple-600/5 to-transparent pointer-events-none opacity-60"></div>

        <div className="flex items-center justify-between mb-5 md:mb-6 relative z-10">
          <div className="flex items-center gap-2">
            <Calendar className="text-purple-400 w-4 h-4 md:w-5 md:h-5" />
            <h2 className="text-base md:text-xl font-bold text-white tracking-tight">
              Radar de Lançamentos
            </h2>
            <span className="ml-1 md:ml-2 text-[9px] md:text-[10px] uppercase tracking-widest text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 md:px-2.5 md:py-1 rounded-md border border-purple-500/20">
              Sua Watchlist
            </span>
          </div>
        </div>

        <div className="relative z-10 flex-grow flex items-center">
          {isLoading ? (
            <div className="w-full flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin text-purple-500/50" />
              <p className="text-zinc-500 text-xs md:text-sm font-medium">
                Sincronizando com TMDB...
              </p>
            </div>
          ) : groupedReleases.length > 0 ? (
            <div className="flex gap-4 md:gap-5 overflow-x-auto pb-4 pt-2 snap-x scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent w-full">
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
                    className={`block cursor-pointer relative group shrink-0 w-[140px] sm:w-[160px] md:w-[200px] flex flex-col gap-2.5 md:gap-3 snap-start rounded-2xl p-1.5 md:p-2 transition-all duration-300 ${
                      isToday
                        ? "bg-purple-500/10 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                        : "hover:bg-white/[0.04] border border-transparent hover:border-white/10"
                    }`}
                  >
                    {/* Poster */}
                    <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden shadow-lg border border-white/10 bg-zinc-950">
                      {item.posterUrl ? (
                        <img
                          src={item.posterUrl}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-500 lg:group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {item.type === "MOVIE" ? (
                            <Film className="w-8 h-8 text-zinc-800" />
                          ) : (
                            <Tv className="w-8 h-8 text-zinc-800" />
                          )}
                        </div>
                      )}

                      {/* Tag de múltiplos episódios */}
                      {item.type === "SERIES" && totalEps > 1 && (
                        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-purple-950/85 text-purple-300 border border-purple-500/30 shadow-md backdrop-blur-md">
                          <CalendarDays className="w-2.5 h-2.5" />
                          <span>+{totalEps - 1} eps</span>
                        </div>
                      )}

                      {/* Botão de abrir no LMS direto (visível no hover) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(targetUrl, "_blank", "noopener,noreferrer");
                        }}
                        className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/80 hover:bg-purple-600 text-zinc-300 hover:text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-all z-10 shadow-md"
                        title="Abrir no LMS Filmes"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </button>

                      <div className="hidden lg:flex absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-end p-3 pointer-events-none">
                        <p className="text-xs text-zinc-300 line-clamp-4 leading-snug drop-shadow-md">
                          {item.description || "Clique para ver detalhes e datas."}
                        </p>
                      </div>

                      {/* Tag de Data */}
                      <div
                        className={`absolute top-2 right-2 px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg text-[9px] md:text-[10px] font-black tracking-wider uppercase shadow-md backdrop-blur-md border ${
                          isToday
                            ? "bg-purple-600/90 text-white border-purple-400 shadow-purple-500/30"
                            : "bg-black/80 text-zinc-200 border-white/10"
                        }`}
                      >
                        {daysUntil}
                      </div>
                    </div>

                    {/* Informações */}
                    <div className="flex flex-col px-1">
                      <h3
                        className="text-xs md:text-sm font-bold text-white truncate lg:group-hover:text-purple-400 transition-colors"
                        title={item.title}
                      >
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-1 md:gap-1.5 mt-0.5 md:mt-1 text-[9px] md:text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                        {item.type === "MOVIE" ? (
                          <>
                            <Film className="w-2.5 h-2.5 md:w-3 md:h-3 text-emerald-400" />{" "}
                            Filme - {formatDateToDDMM(item.nextReleaseDate)}
                          </>
                        ) : (
                          <>
                            <Tv className="w-2.5 h-2.5 md:w-3 md:h-3 text-sky-400" />{" "}
                            S{item.nextSeasonNumber?.toString().padStart(2, "0")} E
                            {item.nextEpisodeNumber?.toString().padStart(2, "0")}{" "}
                            {totalEps > 1 ? `(+${totalEps - 1})` : ""} -{" "}
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
            <div className="w-full flex flex-col items-center justify-center text-center p-6 md:p-8 bg-black/20 rounded-2xl border border-dashed border-white/10">
              <Info className="w-8 h-8 md:w-10 md:h-10 text-zinc-700 mb-2 md:mb-3" />
              <p className="text-zinc-400 text-xs md:text-sm font-medium">
                Nenhum lançamento previsto.
              </p>
              <p className="text-zinc-600 text-[10px] md:text-xs mt-1 max-w-sm">
                Os filmes e séries da sua Watchlist já foram lançados ou ainda não
                têm data de estreia.
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
