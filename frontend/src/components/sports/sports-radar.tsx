"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Tv,
  Star,
  Loader2,
  Trophy,
} from "lucide-react";
import { sportsApi } from "@/lib/api";
import { SportMatch } from "@/lib/types";
import { translateLeagueName, translateTeamName } from "@/lib/sports-translations";
import { formatRadarDate } from "@/lib/date-utils";

interface SportsRadarProps {
  onOpenFavorites?: () => void;
  onSelectMatch?: (match: SportMatch) => void;
}

export function SportsRadar({ onOpenFavorites, onSelectMatch }: SportsRadarProps) {
  const { data: radarMatches = [], isLoading } = useQuery<SportMatch[]>({
    queryKey: ["sports-radar-matches"],
    queryFn: () => sportsApi.getRadarMatches(14),
    staleTime: 1000 * 60 * 5, // 5 min
    refetchInterval: 1000 * 60 * 5,
  });

  const activeRadarMatches = useMemo(() => {
    return radarMatches.filter(
      (m) => m.status !== "FINISHED" && m.status !== "CANCELED"
    );
  }, [radarMatches]);

  const scrollLeft = () => {
    const el = document.getElementById("sports-radar-carousel");
    if (el) el.scrollBy({ left: -320, behavior: "smooth" });
  };

  const scrollRight = () => {
    const el = document.getElementById("sports-radar-carousel");
    if (el) el.scrollBy({ left: 320, behavior: "smooth" });
  };

  return (
    <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-emerald-500/50 rounded-3xl p-5 md:p-6 shadow-2xl relative overflow-hidden flex flex-col w-full mb-8">
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-emerald-500/5 to-transparent pointer-events-none opacity-60" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <Calendar className="text-emerald-400 w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-base md:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Radar de Próximos Jogos
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                14 dias
              </span>
            </h2>
            <span className="text-[11px] text-zinc-500 font-medium">
              Calendário unificado dos seus times e ligas favoritos
            </span>
          </div>
        </div>

        {/* Carousel controls */}
        {activeRadarMatches.length > 0 && (
          <div className="hidden md:flex items-center gap-1.5 self-end sm:self-auto">
            <button
              onClick={scrollLeft}
              className="p-2 rounded-xl bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="Rolar para esquerda"
              aria-label="Rolar para esquerda"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={scrollRight}
              className="p-2 rounded-xl bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="Rolar para direita"
              aria-label="Rolar para direita"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Carousel content */}
      <div className="relative z-10">
        {isLoading ? (
          <div className="w-full flex flex-col items-center justify-center gap-2 py-10">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500/60" />
            <p className="text-zinc-500 text-xs font-medium">
              Sincronizando calendário de favoritos...
            </p>
          </div>
        ) : activeRadarMatches.length === 0 ? (
          <div className="py-8 px-4 text-center flex flex-col items-center justify-center gap-3 bg-black/20 rounded-2xl border border-dashed border-white/10">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <p className="text-zinc-200 text-sm font-semibold">
                Nenhum jogo previsto nos próximos 14 dias para seus favoritos
              </p>
              <p className="text-zinc-500 text-xs mt-1">
                Adicione times ou ligas para preencher seu radar.
              </p>
            </div>
            <Link
              href="/sports/favoritos"
              className="mt-1 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all shadow-sm"
            >
              Gerenciar Favoritos
            </Link>
          </div>
        ) : (
          <div
            id="sports-radar-carousel"
            className="flex gap-4 overflow-x-auto pb-3 pt-1 snap-x scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent w-full"
          >
            {activeRadarMatches.map((m) => {
              const { dayLabel, timeLabel, daysDiffText } = formatRadarDate(m.matchDate || m.date);
              const isLive = m.status === "IN_PROGRESS" || m.status === "HALFTIME";
              const isToday = daysDiffText === "HOJE!";
              const isTomorrow = daysDiffText === "AMANHÃ";

              return (
                <div
                  key={`radar-${m.id}`}
                  role={onSelectMatch ? "button" : undefined}
                  tabIndex={onSelectMatch ? 0 : undefined}
                  onClick={() => onSelectMatch?.(m)}
                  onKeyDown={(e) => {
                    if (onSelectMatch && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      onSelectMatch(m);
                    }
                  }}
                  className={`group shrink-0 w-[240px] sm:w-[270px] md:w-[290px] flex flex-col justify-between snap-start rounded-2xl p-4 transition-all duration-300 border ${
                    onSelectMatch ? "cursor-pointer hover:border-emerald-500/50 hover:shadow-[0_0_25px_rgba(16,185,129,0.15)]" : ""
                  } ${
                    isLive
                      ? "bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.12)]"
                      : isToday
                      ? "bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.12)]"
                      : "bg-[#18181b]/80 hover:bg-[#202024] border-white/10 hover:border-white/20"
                  }`}
                >
                  {/* Top Bar: League & Days countdown / Live badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 truncate max-w-[140px]">
                      {translateLeagueName(m.leagueName, m.league)}
                    </span>

                    {isLive ? (
                      <span className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        AO VIVO
                      </span>
                    ) : daysDiffText ? (
                      <span
                        className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          isToday
                            ? "bg-emerald-500 text-black font-extrabold shadow-sm"
                            : isTomorrow
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-white/5 text-zinc-400 border border-white/10"
                        }`}
                      >
                        {daysDiffText}
                      </span>
                    ) : null}
                  </div>

                  {/* Match Teams: Clean & Focused */}
                  <div className="space-y-2.5 my-2">
                    {/* Home Team */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {m.homeTeam?.logoUrl ? (
                          <img
                            src={m.homeTeam.logoUrl}
                            alt=""
                            className="w-6 h-6 object-contain shrink-0"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300 shrink-0">
                            {m.homeTeam?.name?.slice(0, 2).toUpperCase() || "?"}
                          </div>
                        )}
                        <span className="text-xs font-semibold text-zinc-100 truncate">
                          {translateTeamName(m.homeTeam?.displayName || m.homeTeam?.name || "Mandante")}
                        </span>
                      </div>
                      {isLive && m.homeTeam?.score !== undefined && m.homeTeam?.score !== null && (
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {m.homeTeam.score}
                        </span>
                      )}
                    </div>

                    {/* Away Team */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {m.awayTeam?.logoUrl ? (
                          <img
                            src={m.awayTeam.logoUrl}
                            alt=""
                            className="w-6 h-6 object-contain shrink-0"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300 shrink-0">
                            {m.awayTeam?.name?.slice(0, 2).toUpperCase() || "?"}
                          </div>
                        )}
                        <span className="text-xs font-semibold text-zinc-100 truncate">
                          {translateTeamName(m.awayTeam?.displayName || m.awayTeam?.name || "Visitante")}
                        </span>
                      </div>
                      {isLive && m.awayTeam?.score !== undefined && m.awayTeam?.score !== null && (
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {m.awayTeam.score}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom details: Time, venue, broadcast */}
                  <div className="pt-3 mt-1 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{dayLabel} · {timeLabel}</span>
                    </div>

                    {m.broadcast && (
                      <span className="text-[10px] text-zinc-400 font-semibold px-1.5 py-0.5 rounded bg-white/5 truncate max-w-[85px]">
                        {m.broadcast}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
