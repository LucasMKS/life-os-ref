"use client";

import { useEffect } from "react";
import {
  ArrowUpRight,
  Calendar,
  CalendarDays,
  Clock,
  Film,
  Sparkles,
  Tv,
  X,
} from "lucide-react";
import { getDaysUntil } from "@/lib/date-utils";
import { MediaPoster, buildLmsMediaUrl } from "@/components/media/media-poster";

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

const formatFullDatePtBR = (dateString?: string) => {
  if (!dateString) return "Data indefinida";
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

const formatShortDatePtBR = (dateString?: string) => {
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

  const targetUrl = buildLmsMediaUrl(item.type, item.tmdbId);
  const nextDaysUntil = getDaysUntil(item.nextReleaseDate);
  const isNextToday = nextDaysUntil === "ESTREIA HOJE!";
  const isNextTomorrow = nextDaysUntil === "Amanhã";
  const upcomingEpisodes = Array.isArray(item.upcomingEpisodes)
    ? item.upcomingEpisodes
    : [];
  const totalEpisodes = upcomingEpisodes.length;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-[#111113] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10">
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-5 border-b border-white/[0.06] bg-[#111113]">
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 pr-2">
            <div className="w-12 h-16 sm:w-14 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-white/[0.08] bg-[#161619]">
              <MediaPoster
                src={item.posterUrl}
                alt={item.title}
                type={item.type}
                iconClassName="w-5 h-5 text-zinc-600"
              />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {item.type === "MOVIE" ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold uppercase tracking-wider text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                    <Film className="w-3 h-3" />
                    Filme
                  </span>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1 text-sky-400 font-semibold uppercase tracking-wider text-[10px] bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-md">
                      <Tv className="w-3 h-3" />
                      Série
                    </span>
                    {totalEpisodes > 1 && (
                      <span className="text-[10px] font-medium text-zinc-300 bg-white/[0.06] border border-white/[0.08] px-2 py-0.5 rounded-md">
                        {totalEpisodes} episódios confirmados
                      </span>
                    )}
                  </>
                )}
              </div>

              <h2 className="text-base sm:text-xl font-bold text-white truncate">
                {item.title}
              </h2>

              <span className="text-xs text-zinc-400">
                Cronograma de lançamentos na sua watchlist
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] rounded-xl transition-colors shrink-0"
            title="Fechar (Esc)"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-5">
          {/* Spotlight */}
          <div
            className={`rounded-xl p-4 border ${
              isNextToday
                ? "bg-emerald-500/[0.07] border-emerald-500/25"
                : isNextTomorrow
                  ? "bg-white/[0.04] border-white/[0.12]"
                  : "bg-[#161619] border-white/[0.06]"
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-300">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {item.type === "MOVIE"
                    ? "Estreia Prevista"
                    : "Próximo Episódio a Lançar"}
                </span>
              </div>

              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-wider border ${
                  isNextToday
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                    : "bg-white/[0.06] text-zinc-200 border-white/[0.1]"
                }`}
              >
                {nextDaysUntil}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              {item.type === "SERIES" && item.nextSeasonNumber != null && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs sm:text-sm font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-lg">
                    S{String(item.nextSeasonNumber).padStart(2, "0")}E
                    {String(item.nextEpisodeNumber ?? 0).padStart(2, "0")}
                  </span>
                  {item.nextEpisodeTitle && (
                    <span className="text-sm sm:text-base font-semibold text-white">
                      {item.nextEpisodeTitle}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-300 font-medium mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>{formatFullDatePtBR(item.nextReleaseDate)}</span>
              </div>

              {item.description && (
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed line-clamp-3 bg-[#09090b]/60 p-3 rounded-xl border border-white/[0.05]">
                  {item.description}
                </p>
              )}
            </div>
          </div>

          {/* Cronograma de Episódios Seguintes */}
          {item.type === "SERIES" && totalEpisodes > 1 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-zinc-200">
                  <CalendarDays className="w-4 h-4 text-sky-400" />
                  <span>Calendário dos Próximos Episódios</span>
                </div>
                <span className="text-[11px] text-zinc-500 font-medium">
                  {totalEpisodes} datas confirmadas
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {upcomingEpisodes.map((ep, idx) => {
                  const daysUntil = getDaysUntil(ep.releaseDate);
                  const isToday = daysUntil === "ESTREIA HOJE!";
                  const isFirst = idx === 0;

                  return (
                    <div
                      key={`ep-${ep.seasonNumber}-${ep.episodeNumber}-${ep.releaseDate}-${idx}`}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border ${
                        isFirst
                          ? "bg-white/[0.04] border-white/[0.12]"
                          : "bg-[#161619] border-white/[0.06]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono text-xs font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-md shrink-0">
                          S{String(ep.seasonNumber ?? 0).padStart(2, "0")}E
                          {String(ep.episodeNumber ?? 0).padStart(2, "0")}
                        </span>

                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-zinc-200 truncate">
                            {ep.episodeTitle || `Episódio ${ep.episodeNumber ?? ""}`}
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            {formatShortDatePtBR(ep.releaseDate)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        {isFirst && (
                          <span className="text-[10px] font-semibold text-zinc-200 bg-white/[0.08] px-2 py-0.5 rounded-md uppercase tracking-wider">
                            Próximo
                          </span>
                        )}
                        <span
                          className={`text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-md ${
                            isToday
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
                              : "bg-white/[0.05] text-zinc-300"
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

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-white/[0.06] bg-[#09090b]/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 self-start sm:self-auto">
            <Clock className="w-3.5 h-3.5" />
            <span>Atualizado automaticamente com o catálogo TMDB</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-medium bg-white/[0.05] text-zinc-200 border border-white/[0.08] hover:bg-white/[0.1] transition-colors"
            >
              Fechar
            </button>
            {targetUrl && (
              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-950 hover:bg-white transition-colors"
              >
                <span>Abrir no LMS Filmes</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
