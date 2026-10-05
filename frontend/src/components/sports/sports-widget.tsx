"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Trophy,
  Calendar,
  Radio,
  Clock,
  ArrowUpRight,
  Star,
  ChevronRight,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { sportsApi } from "@/lib/api";
import { SportMatch, SportsUserPreferences } from "@/lib/types";
import { translateLeagueName, translateTeamName } from "@/lib/sports-translations";
import { formatMatchTime, getLocalDateString } from "@/lib/date-utils";

export function SportsWidget() {
  const todayStr = useMemo(() => getLocalDateString(), []);

  // Fetch preferences to know if user has tracked items
  const { data: preferences } = useQuery<SportsUserPreferences>({
    queryKey: ["sports-preferences"],
    queryFn: sportsApi.getPreferences,
    staleTime: 1000 * 60 * 5,
  });

  const hasPreferences =
    (preferences?.trackedTeams && preferences.trackedTeams.length > 0) ||
    (preferences?.trackedLeagues && preferences.trackedLeagues.length > 0);

  // Fetch followed matches
  const {
    data: followedMatches = [],
    isLoading,
  } = useQuery<SportMatch[]>({
    queryKey: ["sports-followed-matches", todayStr],
    queryFn: () => sportsApi.getFollowedMatches(todayStr),
    staleTime: 1000 * 60 * 2,
    refetchInterval: (query) => {
      const data = query.state.data;
      const hasLiveMatch = data?.some(
        (m) => m.status === "IN_PROGRESS" || m.status === "HALFTIME"
      );
      return hasLiveMatch ? 30000 : 120000;
    },
  });

  // Separate live vs scheduled vs finished
  const liveMatches = useMemo(() => {
    return followedMatches.filter(
      (m) => m.status === "IN_PROGRESS" || m.status === "HALFTIME"
    );
  }, [followedMatches]);

  const upcomingMatches = useMemo(() => {
    return followedMatches.filter((m) => m.status === "SCHEDULED");
  }, [followedMatches]);

  const finishedMatches = useMemo(() => {
    return followedMatches.filter((m) => m.status === "FINISHED");
  }, [followedMatches]);

  // Featured match to highlight (Live > Next upcoming > Finished)
  const featuredMatch = liveMatches[0] || upcomingMatches[0] || finishedMatches[0];
  const otherMatches = followedMatches
    .filter((m) => m.id !== featuredMatch?.id)
    .slice(0, 3);

  return (
    <div className="relative bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-emerald-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-full group hover:-translate-y-1 transition-transform duration-300">
      {/* Glow */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none -ml-20 -mt-20 transition-opacity group-hover:opacity-100 opacity-60" />

      <div className="p-5 md:p-6 lg:p-7 flex flex-col flex-grow relative z-10">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] md:text-xs font-bold text-emerald-400 uppercase tracking-widest">
              Esportes • Meus Favoritos
            </span>
          </div>

          <Link
            href="/sports"
            className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white font-semibold transition-colors group/link"
          >
            Ver todos
            <ArrowUpRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-zinc-500">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500/50" />
            <span className="text-xs">Carregando placares...</span>
          </div>
        ) : !hasPreferences ? (
          /* Empty: No preferences yet */
          <div className="flex flex-col items-center justify-center text-center py-6 px-3 bg-black/20 rounded-2xl border border-dashed border-white/10 my-auto">
            <Star className="w-8 h-8 text-emerald-400/40 mb-2 stroke-[1.5]" />
            <h4 className="text-sm font-bold text-white mb-1">
              Personalize seus esportes
            </h4>
            <p className="text-xs text-zinc-500 max-w-xs mb-4">
              Escolha seus times e ligas para acompanhar resultados em tempo real.
            </p>
            <Link
              href="/sports/favoritos"
              className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-extrabold text-xs hover:bg-emerald-400 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              Escolher Favoritos
            </Link>
          </div>
        ) : !featuredMatch ? (
          /* Empty: No matches today */
          <div className="flex flex-col items-center justify-center text-center py-8 px-3 bg-black/20 rounded-2xl border border-dashed border-white/10 my-auto">
            <Calendar className="w-8 h-8 text-zinc-600 mb-2" />
            <h4 className="text-sm font-bold text-white mb-1">
              Sem partidas hoje
            </h4>
            <p className="text-xs text-zinc-500 max-w-xs mb-3">
              Nenhum dos seus times favoritos tem jogo agendado para o dia de hoje.
            </p>
            <Link
              href="/sports"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              Explorar outras datas →
            </Link>
          </div>
        ) : (
          /* Featured Match Display */
          <div className="space-y-4 flex-grow flex flex-col justify-between">
            {/* Main Featured Match Card */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 relative overflow-hidden">
              {featuredMatch.status === "IN_PROGRESS" || featuredMatch.status === "HALFTIME" ? (
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {featuredMatch.displayClock || "AO VIVO"}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-400 truncate max-w-[120px]">
                    {translateLeagueName(featuredMatch.leagueName, featuredMatch.league)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between mb-3 text-[10px] text-zinc-400">
                  <span className="font-semibold uppercase tracking-wider">
                    {translateLeagueName(featuredMatch.leagueName, featuredMatch.league)}
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-300">
                    <Clock className="w-3 h-3 text-emerald-400" />
                    {featuredMatch.status === "FINISHED"
                      ? "Finalizado"
                      : `Hoje ${formatMatchTime(featuredMatch.matchDate || featuredMatch.date)}`}
                  </span>
                </div>
              )}

              {/* Teams & Score */}
              <div className="space-y-2.5">
                {/* Home Team */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    {featuredMatch.homeTeam?.logoUrl ? (
                      <img
                        src={featuredMatch.homeTeam.logoUrl}
                        alt=""
                        className="w-5 h-5 object-contain shrink-0"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-md bg-zinc-800 text-[9px] font-bold flex items-center justify-center text-white shrink-0">
                        {featuredMatch.homeTeam?.abbreviation || "M"}
                      </div>
                    )}
                    <span className="text-xs md:text-sm font-bold text-zinc-100 truncate">
                      {translateTeamName(featuredMatch.homeTeam?.displayName || featuredMatch.homeTeam?.name)}
                    </span>
                  </div>
                  {featuredMatch.homeTeam?.score !== null &&
                    featuredMatch.homeTeam?.score !== undefined && (
                      <span className="text-sm md:text-base font-black font-mono text-white">
                        {featuredMatch.homeTeam.score}
                      </span>
                    )}
                </div>

                {/* Away Team */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    {featuredMatch.awayTeam?.logoUrl ? (
                      <img
                        src={featuredMatch.awayTeam.logoUrl}
                        alt=""
                        className="w-5 h-5 object-contain shrink-0"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-md bg-zinc-800 text-[9px] font-bold flex items-center justify-center text-white shrink-0">
                        {featuredMatch.awayTeam?.abbreviation || "V"}
                      </div>
                    )}
                    <span className="text-xs md:text-sm font-bold text-zinc-100 truncate">
                      {translateTeamName(featuredMatch.awayTeam?.displayName || featuredMatch.awayTeam?.name)}
                    </span>
                  </div>
                  {featuredMatch.awayTeam?.score !== null &&
                    featuredMatch.awayTeam?.score !== undefined && (
                      <span className="text-sm md:text-base font-black font-mono text-white">
                        {featuredMatch.awayTeam.score}
                      </span>
                    )}
                </div>
              </div>
            </div>

            {/* Other matches list if any */}
            {otherMatches.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  Outros jogos de hoje
                </span>
                {otherMatches.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-black/20 border border-white/5 text-xs text-zinc-300"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="font-semibold truncate max-w-[90px]">
                        {translateTeamName(m.homeTeam?.displayName || m.homeTeam?.name || m.homeTeam?.abbreviation)}
                      </span>
                      <span className="text-zinc-500 text-[10px]">vs</span>
                      <span className="font-semibold truncate max-w-[90px]">
                        {translateTeamName(m.awayTeam?.displayName || m.awayTeam?.name || m.awayTeam?.abbreviation)}
                      </span>
                    </div>

                    <div className="text-[10px] text-zinc-400 font-mono shrink-0">
                      {m.status === "IN_PROGRESS" || m.status === "HALFTIME" ? (
                        <span className="text-emerald-400 font-bold animate-pulse">
                          {m.homeTeam?.score} - {m.awayTeam?.score}
                        </span>
                      ) : m.status === "FINISHED" ? (
                        <span>
                          {m.homeTeam?.score} - {m.awayTeam?.score}
                        </span>
                      ) : (
                        <span>{formatMatchTime(m.matchDate || m.date)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
