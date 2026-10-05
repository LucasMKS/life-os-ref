"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Film,
  Tv,
  Loader2,
  Info,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  ExternalLink,
} from "lucide-react";
import { radarApi } from "@/lib/api";
import { getDaysUntil, groupAndFilterRadarReleases } from "@/lib/date-utils";
import {
  ReleaseScheduleModal,
  GroupedRadarRelease,
  ReleaseRadarDTO,
} from "@/components/media/release-schedule-modal";

export function UpcomingReleasesRadar() {
  const [filter, setFilter] = useState<"ALL" | "SERIES" | "MOVIE">("ALL");
  const [selectedItem, setSelectedItem] = useState<GroupedRadarRelease | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: releases = [], isLoading } = useQuery<ReleaseRadarDTO[]>({
    queryKey: ["media-upcoming-radar"],
    queryFn: radarApi.getUpcomingReleases,
    refetchInterval: 1000 * 60 * 60, // 1h
    staleTime: 1000 * 60 * 15, // 15 min cache
  });

  // Agrupar episódios da mesma série e aplicar regras (sem séries no 'Já lançou' e máximo 2 filmes passados)
  const groupedReleases = useMemo(() => {
    return groupAndFilterRadarReleases(releases);
  }, [releases]);

  // Filtrar de acordo com a seleção de abas
  const filteredReleases = useMemo(() => {
    return groupedReleases.filter((item) => {
      if (filter === "ALL") return true;
      return item.type === filter;
    });
  }, [groupedReleases, filter]);

  // Formatar data por extenso curta: "Seg, 13 Jul"
  const formatShortDate = (dateString: string) => {
    try {
      const [year, month, day] = dateString.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      const formatted = date.toLocaleDateString("pt-BR", {
        weekday: "short",
        day: "2-digit",
        month: "short",
      });
      return formatted.charAt(0).toUpperCase() + formatted.slice(1).replace(".", "");
    } catch {
      return dateString;
    }
  };

  const scrollLeft = () => {
    const el = document.getElementById("radar-carousel-container");
    if (el) el.scrollBy({ left: -300, behavior: "smooth" });
  };

  const scrollRight = () => {
    const el = document.getElementById("radar-carousel-container");
    if (el) el.scrollBy({ left: 300, behavior: "smooth" });
  };

  const handleOpenSchedule = (item: GroupedRadarRelease) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-purple-500/50 rounded-3xl p-5 md:p-6 lg:p-8 shadow-2xl relative overflow-hidden flex flex-col w-full">
        {/* Glow de Fundo */}
        <div className="absolute top-0 right-0 w-72 h-72 md:w-96 md:h-96 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/10 via-purple-600/5 to-transparent pointer-events-none opacity-60"></div>

        {/* Header e Filtros */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
          <div className="flex items-center gap-2.5 md:gap-3">
            <div className="p-1.5 md:p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <Calendar className="text-purple-400 w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-base md:text-xl font-bold text-white tracking-tight">
                Radar de Próximos Lançamentos
              </h2>
              <span className="text-[10px] md:text-[11px] text-zinc-500 font-medium">
                1 card por título · Clique para ver o cronograma completo
              </span>
            </div>
          </div>

          {/* Filtros e Controles */}
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="flex bg-black/40 border border-white/5 p-0.5 rounded-xl gap-0.5">
              <button
                onClick={() => setFilter("ALL")}
                className={`px-3 py-1 text-[11px] md:text-xs font-semibold rounded-lg transition-all ${
                  filter === "ALL"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilter("SERIES")}
                className={`px-3 py-1 text-[11px] md:text-xs font-semibold rounded-lg transition-all ${
                  filter === "SERIES"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Séries
              </button>
              <button
                onClick={() => setFilter("MOVIE")}
                className={`px-3 py-1 text-[11px] md:text-xs font-semibold rounded-lg transition-all ${
                  filter === "MOVIE"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Filmes
              </button>
            </div>

            {/* Botões de Navegação do Carrossel */}
            {filteredReleases.length > 0 && (
              <div className="hidden md:flex items-center gap-1">
                <button
                  onClick={scrollLeft}
                  className="p-1.5 rounded-lg bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                  title="Rolar para esquerda"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={scrollRight}
                  className="p-1.5 rounded-lg bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                  title="Rolar para direita"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="relative z-10 flex-grow flex items-center">
          {isLoading ? (
            <div className="w-full flex flex-col items-center justify-center gap-3 py-16">
              <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin text-purple-500/50" />
              <p className="text-zinc-500 text-xs md:text-sm font-medium animate-pulse">
                Sincronizando com TMDB...
              </p>
            </div>
          ) : filteredReleases.length > 0 ? (
            <div
              id="radar-carousel-container"
              className="flex gap-4 md:gap-5 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent w-full"
            >
              {filteredReleases.map((item) => {
                const daysUntil = getDaysUntil(item.nextReleaseDate);
                const isToday = daysUntil === "ESTREIA HOJE!";
                const isTomorrow = daysUntil === "Amanhã";
                const totalEps = item.upcomingEpisodes.length;

                const targetUrl =
                  item.type === "MOVIE"
                    ? `https://filmes.lucasmks.com.br/filmes/${item.tmdbId}`
                    : `https://filmes.lucasmks.com.br/series/${item.tmdbId}`;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleOpenSchedule(item)}
                    className={`group cursor-pointer relative shrink-0 w-[135px] sm:w-[155px] md:w-[185px] flex flex-col gap-2.5 md:gap-3 snap-start rounded-2xl p-1.5 md:p-2 transition-all duration-300 ${
                      isToday
                        ? "bg-purple-500/10 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                        : "hover:bg-white/[0.04] border border-transparent hover:border-white/10 hover:shadow-lg"
                    }`}
                  >
                    {/* Poster */}
                    <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden shadow-lg border border-white/5 bg-zinc-950">
                      {item.posterUrl ? (
                        <img
                          src={item.posterUrl}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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

                      {/* Tag de múltiplos episódios (badge superior esquerda) */}
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

                      {/* Overlay de Sinopse (apenas no hover em desktop) */}
                      <div className="hidden lg:flex absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-end p-2.5 pointer-events-none">
                        <p className="text-[10px] text-zinc-300 line-clamp-4 leading-snug drop-shadow-md">
                          {item.description || "Clique para ver detalhes e datas."}
                        </p>
                      </div>

                      {/* Tag de dias restantes (badge flutuante superior direita) */}
                      <div
                        className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-lg text-[9px] md:text-[10px] font-black tracking-wider uppercase shadow-md backdrop-blur-md border ${
                          isToday
                            ? "bg-purple-600/90 text-white border-purple-400/50 shadow-purple-500/20"
                            : isTomorrow
                            ? "bg-amber-600/90 text-white border-amber-400/50"
                            : "bg-black/85 text-zinc-300 border-white/10"
                        }`}
                      >
                        {daysUntil}
                      </div>
                    </div>

                    {/* Informações do Lançamento */}
                    <div className="flex flex-col px-1 min-w-0">
                      <h3
                        className="text-xs md:text-sm font-bold text-white truncate group-hover:text-purple-400 transition-colors"
                        title={item.title}
                      >
                        {item.title}
                      </h3>

                      {/* Metadados: Linha 1 (Tipo/Próximo Episódio) e Linha 2 (Data do Próximo) */}
                      <div className="flex flex-col gap-0.5 mt-1.5 text-[10px] md:text-xs min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.type === "MOVIE" ? (
                            <div className="flex items-center gap-1 text-emerald-400 font-bold uppercase tracking-wider text-[9px] md:text-[10px]">
                              <Film className="w-3 h-3 shrink-0" />
                              <span>Filme</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-sky-400 font-mono font-bold">
                              <Tv className="w-3 h-3 shrink-0" />
                              <span>
                                S{item.nextSeasonNumber?.toString().padStart(2, "0")}E
                                {item.nextEpisodeNumber?.toString().padStart(2, "0")}
                              </span>
                            </div>
                          )}

                          {item.type === "SERIES" && totalEps > 1 && (
                            <span className="text-[9px] text-zinc-500 font-medium">
                              ({totalEps} eps)
                            </span>
                          )}
                        </div>

                        <span className="text-zinc-400 font-medium whitespace-nowrap">
                          {formatShortDate(item.nextReleaseDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="w-full flex flex-col items-center justify-center text-center p-6 md:p-8 bg-black/25 rounded-2xl border border-dashed border-white/5">
              <Info className="w-8 h-8 text-zinc-700 mb-2" />
              <p className="text-zinc-400 text-xs md:text-sm font-medium">
                Nenhum lançamento futuro agendado.
              </p>
              <p className="text-zinc-600 text-[10px] md:text-xs mt-1 max-w-sm leading-relaxed">
                Todos os títulos de séries ou filmes em sua watchlist já estrearam ou não possuem datas confirmadas no TMDB.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Cronograma e Detalhes */}
      <ReleaseScheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={selectedItem}
      />
    </>
  );
}
