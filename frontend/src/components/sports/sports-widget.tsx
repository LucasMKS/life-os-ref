"use client";

import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Trophy,
  Calendar,
  Clock,
  ArrowUpRight,
  Star,
  Loader2,
} from "lucide-react";
import { sportsApi } from "@/lib/api";
import { SportMatch, SportsUserPreferences } from "@/lib/types";
import { translateLeagueName, translateTeamName } from "@/lib/sports-translations";
import { formatMatchTime, getLocalDateString } from "@/lib/date-utils";
import { TeamLogo } from "./match-row";

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
    <div className="relative bg-[#111113] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl flex flex-col h-full overflow-hidden transition-colors">
      <div className="p-5 md:p-6 flex flex-col flex-grow relative z-10">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Esportes • Favoritos
            </span>
          </div>

          <Link
            to="/sports"
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white font-medium transition-colors group/link"
          >
            <span>Ver central</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-zinc-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs">Carregando placares...</span>
          </div>
        ) : !hasPreferences ? (
          /* Empty: No preferences yet */
          <div className="flex flex-col items-center justify-center text-center py-8 px-4 bg-white/[0.02] rounded-xl border border-dashed border-white/[0.08] my-auto">
            <Star className="w-6 h-6 text-zinc-500 mb-2" />
            <h4 className="text-sm font-semibold text-white mb-1">
              Personalize seus esportes
            </h4>
            <p className="text-xs text-zinc-400 max-w-xs mb-4">
              Escolha seus times e ligas favoritos para acompanhar no radar diário.
            </p>
            <Link
              to="/sports/favoritos"
              className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-950 font-semibold text-xs hover:bg-white transition-colors"
            >
              Escolher Favoritos
            </Link>
          </div>
        ) : !featuredMatch ? (
          /* Empty: No matches today */
          <div className="flex flex-col items-center justify-center text-center py-8 px-4 bg-white/[0.02] rounded-xl border border-dashed border-white/[0.08] my-auto">
            <Calendar className="w-6 h-6 text-zinc-500 mb-2" />
            <h4 className="text-sm font-semibold text-white mb-1">
              Sem partidas hoje
            </h4>
            <p className="text-xs text-zinc-400 max-w-xs mb-3">
              Nenhum dos seus times favoritos tem jogo agendado para o dia de hoje.
            </p>
            <Link
              to="/sports"
              className="text-xs text-zinc-300 hover:text-white font-medium underline underline-offset-4"
            >
              Explorar calendário completo →
            </Link>
          </div>
        ) : (
          /* Featured Match Display */
          <div className="space-y-3.5 flex-grow flex flex-col justify-between">
            {/* Main Featured Match Card */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] relative overflow-hidden">
              {featuredMatch.status === "IN_PROGRESS" || featuredMatch.status === "HALFTIME" ? (
                <div className="flex items-center justify-between mb-2.5">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {featuredMatch.displayClock || "AO VIVO"}
                  </span>
                  <span className="text-[10px] font-medium text-zinc-400 truncate max-w-[130px]">
                    {translateLeagueName(featuredMatch.leagueName, featuredMatch.league)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between mb-2.5 text-[10px] text-zinc-400">
                  <span className="font-medium uppercase tracking-wider truncate max-w-[130px]">
                    {translateLeagueName(featuredMatch.leagueName, featuredMatch.league)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-zinc-300 font-medium">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    {featuredMatch.status === "FINISHED"
                      ? "Finalizado"
                      : `Hoje ${formatMatchTime(featuredMatch.matchDate || featuredMatch.date)}`}
                  </span>
                </div>
              )}

              {/* Teams & Score */}
              <div className="space-y-2">
                {/* Home Team */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <TeamLogo
                      src={featuredMatch.homeTeam?.logoUrl}
                      name={featuredMatch.homeTeam?.displayName || featuredMatch.homeTeam?.name || "M"}
                      size={20}
                    />
                    <span className="text-xs font-medium text-zinc-100 truncate">
                      {translateTeamName(featuredMatch.homeTeam?.displayName || featuredMatch.homeTeam?.name)}
                    </span>
                  </div>
                  {featuredMatch.homeTeam?.score !== null &&
                    featuredMatch.homeTeam?.score !== undefined && (
                      <span className="text-sm font-semibold font-mono text-zinc-100 tabular-nums">
                        {featuredMatch.homeTeam.score}
                      </span>
                    )}
                </div>

                {/* Away Team */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <TeamLogo
                      src={featuredMatch.awayTeam?.logoUrl}
                      name={featuredMatch.awayTeam?.displayName || featuredMatch.awayTeam?.name || "V"}
                      size={20}
                    />
                    <span className="text-xs font-medium text-zinc-100 truncate">
                      {translateTeamName(featuredMatch.awayTeam?.displayName || featuredMatch.awayTeam?.name)}
                    </span>
                  </div>
                  {featuredMatch.awayTeam?.score !== null &&
                    featuredMatch.awayTeam?.score !== undefined && (
                      <span className="text-sm font-semibold font-mono text-zinc-100 tabular-nums">
                        {featuredMatch.awayTeam.score}
                      </span>
                    )}
                </div>
              </div>
            </div>

            {/* Other matches list if any */}
            {otherMatches.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
                  Outros jogos de hoje
                </span>
                {otherMatches.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs text-zinc-300"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="font-medium truncate max-w-[90px]">
                        {translateTeamName(m.homeTeam?.displayName || m.homeTeam?.name || m.homeTeam?.abbreviation)}
                      </span>
                      <span className="text-zinc-600 text-[10px]">vs</span>
                      <span className="font-medium truncate max-w-[90px]">
                        {translateTeamName(m.awayTeam?.displayName || m.awayTeam?.name || m.awayTeam?.abbreviation)}
                      </span>
                    </div>

                    <div className="text-[10px] text-zinc-400 font-mono tabular-nums shrink-0">
                      {m.status === "IN_PROGRESS" || m.status === "HALFTIME" ? (
                        <span className="text-emerald-400 font-semibold">
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
