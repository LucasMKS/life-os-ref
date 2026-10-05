"use client";

import { useEffect } from "react";
import {
  X,
  Calendar,
  Tv,
  Film,
  ArrowUpRight,
  Sparkles,
  CalendarDays,
  Clock,
} from "lucide-react";
import { getDaysUntil } from "@/lib/date-utils";

export interface ReleaseRadarDTO {
  tmdbId: string;
  title: string;
  type: "MOVIE" | "SERIES";
  releaseDate: string;
  posterUrl: string;
  description: string;
  episodeNumber?: number;
  seasonNumber?: number;
  watched?: boolean;
  episodeTitle?: string;
}

export interface GroupedRadarRelease {
  id: string;
  tmdbId: string;
  title: string;
  type: "MOVIE" | "SERIES";
  posterUrl: string;
  description: string;
  nextReleaseDate: string;
  nextEpisodeNumber?: number;
  nextSeasonNumber?: number;
  nextEpisodeTitle?: string;
  upcomingEpisodes: ReleaseRadarDTO[];
}

interface ReleaseScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: GroupedRadarRelease | null;
}

const formatFullDatePtBR = (dateString: string) => {
  try {
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    const formatted = date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  } catch {
    return dateString;
  }
};

const formatShortDatePtBR = (dateString: string) => {
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

export function ReleaseScheduleModal({
  isOpen,
  onClose,
  item,
}: ReleaseScheduleModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const targetUrl =
    item.type === "MOVIE"
      ? `https://filmes.lucasmks.com.br/filmes/${item.tmdbId}`
      : `https://filmes.lucasmks.com.br/series/${item.tmdbId}`;

  const nextDaysUntil = getDaysUntil(item.nextReleaseDate);
  const isNextToday = nextDaysUntil === "ESTREIA HOJE!";
  const isNextTomorrow = nextDaysUntil === "Amanhã";

  const totalEpisodes = item.upcomingEpisodes.length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 md:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-[#0e0e11] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 z-10">
        {/* Glow Superior */}
        <div className="absolute top-0 right-1/4 w-80 h-40 bg-purple-600/15 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-80 h-40 bg-sky-600/10 rounded-full blur-[90px] pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-6 border-b border-white/5 relative z-10 bg-black/30 backdrop-blur-sm">
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 pr-2">
            {/* Poster Thumbnail */}
            <div className="w-12 h-16 sm:w-14 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-lg bg-zinc-950">
              {item.posterUrl ? (
                <img
                  src={item.posterUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-700">
                  {item.type === "MOVIE" ? (
                    <Film className="w-6 h-6" />
                  ) : (
                    <Tv className="w-6 h-6" />
                  )}
                </div>
              )}
            </div>

            {/* Informações Principais */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {item.type === "MOVIE" ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold uppercase tracking-wider text-[10px] sm:text-[11px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                    <Film className="w-3 h-3" />
                    Filme
                  </span>
                ) : (
                  <>
                    <span className="flex items-center gap-1 text-sky-400 font-bold uppercase tracking-wider text-[10px] sm:text-[11px] bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-md">
                      <Tv className="w-3 h-3" />
                      Série
                    </span>
                    {totalEpisodes > 1 && (
                      <span className="text-[10px] sm:text-[11px] font-semibold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-md">
                        {totalEpisodes} episódios confirmados
                      </span>
                    )}
                  </>
                )}
              </div>

              <h2 className="text-base sm:text-xl font-black text-white truncate drop-shadow-sm">
                {item.title}
              </h2>

              <span className="text-xs text-zinc-400 font-medium">
                Cronograma de lançamentos na sua watchlist
              </span>
            </div>
          </div>

          {/* Botão de Fechar */}
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors shrink-0"
            title="Fechar (Esc)"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className="p-4 sm:p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 flex flex-col gap-5 relative z-10">
          {/* Spotlight: Próxima Estreia / Próximo Episódio */}
          <div
            className={`rounded-2xl p-4 sm:p-5 border transition-all ${
              isNextToday
                ? "bg-purple-500/10 border-purple-500/40 shadow-[0_0_25px_rgba(168,85,247,0.15)]"
                : isNextTomorrow
                ? "bg-amber-500/10 border-amber-500/30"
                : "bg-white/[0.03] border-white/10"
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-400">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>
                  {item.type === "MOVIE"
                    ? "Estreia Prevista"
                    : "Próximo Episódio a Lançar"}
                </span>
              </div>

              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider border shadow-sm ${
                  isNextToday
                    ? "bg-purple-600 text-white border-purple-400 shadow-purple-600/30"
                    : isNextTomorrow
                    ? "bg-amber-600 text-white border-amber-400"
                    : "bg-black/70 text-zinc-200 border-white/10"
                }`}
              >
                {nextDaysUntil}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              {item.type === "SERIES" && item.nextSeasonNumber != null && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm sm:text-base font-black text-sky-400 bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 rounded-lg">
                    S{String(item.nextSeasonNumber).padStart(2, "0")}E
                    {String(item.nextEpisodeNumber).padStart(2, "0")}
                  </span>
                  {item.nextEpisodeTitle && (
                    <span className="text-sm sm:text-base font-bold text-white">
                      {item.nextEpisodeTitle}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-300 font-semibold mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>{formatFullDatePtBR(item.nextReleaseDate)}</span>
              </div>

              {item.description && (
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed line-clamp-3 bg-black/30 p-2.5 rounded-xl border border-white/5">
                  {item.description}
                </p>
              )}
            </div>
          </div>

          {/* Cronograma de Episódios Seguintes (quando há múltiplos episódios) */}
          {item.type === "SERIES" && totalEpisodes > 1 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-zinc-200">
                  <CalendarDays className="w-4 h-4 text-sky-400" />
                  <span>Calendário dos Próximos Episódios</span>
                </div>
                <span className="text-[11px] text-zinc-500 font-medium">
                  {totalEpisodes} datas confirmadas
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {item.upcomingEpisodes.map((ep, idx) => {
                  const daysUntil = getDaysUntil(ep.releaseDate);
                  const isToday = daysUntil === "ESTREIA HOJE!";
                  const isFirst = idx === 0;

                  return (
                    <div
                      key={`ep-${ep.seasonNumber}-${ep.episodeNumber}-${ep.releaseDate}`}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border transition-all ${
                        isFirst
                          ? "bg-purple-500/10 border-purple-500/30"
                          : "bg-black/40 border-white/5 hover:border-white/15"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono text-xs font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-md shrink-0">
                          S{String(ep.seasonNumber).padStart(2, "0")}E
                          {String(ep.episodeNumber).padStart(2, "0")}
                        </span>

                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-zinc-200 truncate">
                            {ep.episodeTitle || `Episódio ${ep.episodeNumber}`}
                          </span>
                          <span className="text-[11px] text-zinc-400 font-medium">
                            {formatShortDatePtBR(ep.releaseDate)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        {isFirst && (
                          <span className="text-[10px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
                            Próximo
                          </span>
                        )}
                        <span
                          className={`text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-md ${
                            isToday
                              ? "bg-purple-600 text-white font-bold"
                              : "bg-white/5 text-zinc-300"
                          }`}
                        >
                          {daysUntil}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer com Ações */}
        <div className="p-4 sm:p-5 border-t border-white/5 bg-black/40 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
          <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 self-start sm:self-auto">
            <Clock className="w-3.5 h-3.5" />
            <span>Atualizado automaticamente com o catálogo TMDB</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
            >
              Fechar
            </button>
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20"
            >
              Abrir no LMS Filmes
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
