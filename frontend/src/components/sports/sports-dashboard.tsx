"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Trophy,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Star,
  RefreshCw,
  History,
  Layers,
  ArrowRight,
  Shield,
} from "lucide-react";
import { sportsApi } from "@/lib/api";
import {
  SportLeague,
  SportMatch,
  SportsUserPreferences,
} from "@/lib/types";
import { translateLeagueName } from "@/lib/sports-translations";
import { getLocalDateString, parseMatchDate } from "@/lib/date-utils";
import { MatchCard } from "./match-card";
import { SportsRadar } from "./sports-radar";
import { MatchDetailModal } from "./match-detail-modal";

const SUPPORTED_LEAGUES: SportLeague[] = [
  {
    id: "bra.1",
    slug: "bra.1",
    name: "Brasileirão Série A",
    displayName: "Brasileirão Série A",
    abbreviation: "Série A",
    sport: "soccer",
    logoUrl: "https://a.espncdn.com/i/leaguelogos/soccer/500/85.png",
  },
  {
    id: "fifa.friendly",
    slug: "fifa.friendly",
    name: "Amistosos & Seleção Brasileira",
    displayName: "Amistosos Internacionais",
    abbreviation: "Amistosos",
    sport: "soccer",
    logoUrl: "https://a.espncdn.com/i/teamlogos/countries/500/bra.png",
  },
  {
    id: "bra.copa_do_brazil",
    slug: "bra.copa_do_brazil",
    name: "Copa do Brasil",
    displayName: "Copa do Brasil",
    abbreviation: "Copa BR",
    sport: "soccer",
    logoUrl: "https://a.espncdn.com/i/leaguelogos/soccer/500/528.png",
  },
  {
    id: "conmebol.libertadores",
    slug: "conmebol.libertadores",
    name: "Copa Libertadores",
    displayName: "Copa Libertadores da América",
    abbreviation: "Libertadores",
    sport: "soccer",
    logoUrl: "https://a.espncdn.com/i/leaguelogos/soccer/500/58.png",
  },
  {
    id: "uefa.champions",
    slug: "uefa.champions",
    name: "UEFA Champions League",
    displayName: "UEFA Champions League",
    abbreviation: "UCL",
    sport: "soccer",
    logoUrl: "https://a.espncdn.com/i/leaguelogos/soccer/500/2.png",
  },
  {
    id: "fifa.wwc",
    slug: "fifa.wwc",
    name: "Copa do Mundo Feminina",
    displayName: "Copa do Mundo Feminina",
    abbreviation: "WWC",
    sport: "soccer",
    logoUrl: "https://a.espncdn.com/i/leaguelogos/soccer/500/60.png",
  },
  {
    id: "nba",
    slug: "nba",
    name: "NBA",
    displayName: "National Basketball Association",
    abbreviation: "NBA",
    sport: "basketball",
    logoUrl: "https://a.espncdn.com/i/teamlogos/leagues/500/nba.png",
  },
  {
    id: "nfl",
    slug: "nfl",
    name: "NFL",
    displayName: "National Football League",
    abbreviation: "NFL",
    sport: "football",
    logoUrl: "https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png",
  },
];

export function SportsDashboard() {
  const [selectedLeagueFilter, setSelectedLeagueFilter] = useState<string>("ALL");
  const [selectedMatchForModal, setSelectedMatchForModal] = useState<SportMatch | null>(null);

  // Date management: default to today in local timezone (formatted as YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateString());

  const todayStr = useMemo(() => getLocalDateString(), []);

  // Fetch preferences (tracked teams & leagues)
  const { data: preferences, refetch: refetchPrefs } = useQuery<SportsUserPreferences>({
    queryKey: ["sports-preferences"],
    queryFn: sportsApi.getPreferences,
    staleTime: 1000 * 60 * 5,
  });

  const trackedSportTeamKeys = useMemo(() => {
    return new Set(
      preferences?.trackedTeams?.map(
        (t) => `${(t.sport || "").toLowerCase()}::${t.teamId}`
      ) || []
    );
  }, [preferences?.trackedTeams]);

  const trackedLeagueSlugs = useMemo(() => {
    return new Set(preferences?.trackedLeagues?.map((l) => l.league) || []);
  }, [preferences?.trackedLeagues]);

  const totalFavoritesCount =
    (preferences?.trackedTeams?.length || 0) + (preferences?.trackedLeagues?.length || 0);

  // Query: Aggregated day matches across leagues
  const {
    data: dayMatches = [],
    isLoading: isLoadingDay,
    isFetching: isFetchingDay,
    refetch: refetchDay,
  } = useQuery<SportMatch[]>({
    queryKey: ["sports-day-matches", selectedDate, selectedLeagueFilter],
    queryFn: () => sportsApi.getDayMatches(selectedDate, selectedLeagueFilter),
    refetchInterval: (query) => {
      const data = query.state.data;
      const hasLiveMatch = data?.some(
        (m) =>
          m.status?.toUpperCase().includes("IN_PROGRESS") ||
          m.status?.toUpperCase().includes("FIRST_HALF") ||
          m.status?.toUpperCase().includes("HALFTIME")
      );
      return hasLiveMatch ? 30000 : 120000;
    },
  });

  // Query: Dedicated Live matches query for today (always monitored)
  const {
    data: todayAllMatches = [],
    refetch: refetchToday,
  } = useQuery<SportMatch[]>({
    queryKey: ["sports-day-matches-today-live", todayStr],
    queryFn: () => sportsApi.getDayMatches(todayStr, "ALL"),
    refetchInterval: 30000,
  });

  // Live matches across all leagues
  const liveMatches = useMemo(() => {
    const list = selectedDate === todayStr ? dayMatches : todayAllMatches;
    return list.filter((m) => {
      const s = (m.status || "").toUpperCase();
      return (
        s.includes("IN_PROGRESS") ||
        s.includes("FIRST_HALF") ||
        s.includes("SECOND_HALF") ||
        s.includes("HALFTIME") ||
        s.includes("LIVE")
      );
    });
  }, [selectedDate, todayStr, dayMatches, todayAllMatches]);

  const liveMatchesCount = liveMatches.length;

  // Query: Recent finished matches for tracked teams (Histórico dos Favoritos)
  const {
    data: historyMatches = [],
    isLoading: isLoadingHistory,
    refetch: refetchHistory,
  } = useQuery<SportMatch[]>({
    queryKey: ["sports-history-matches", preferences?.trackedTeams?.map((t) => t.teamId).join(",")],
    queryFn: async () => {
      if (!preferences?.trackedTeams || preferences.trackedTeams.length === 0) {
        return [];
      }
      const teamsToFetch = preferences.trackedTeams.slice(0, 10);
      const promises = teamsToFetch.map((t) =>
        sportsApi.getTeamSchedule(t.sport, t.league, t.teamId).catch(() => [])
      );
      const results = await Promise.all(promises);

      const finishedMap = new Map<string, SportMatch>();
      for (const schedule of results) {
        if (!Array.isArray(schedule)) continue;
        for (const match of schedule) {
          const s = (match.status || "").toUpperCase();
          const isFinished =
            s.includes("FINISHED") ||
            s.includes("FINAL") ||
            s.includes("FT") ||
            s.includes("POST") ||
            s.includes("COMPLETED");
          if (isFinished) {
            finishedMap.set(match.id, match);
          }
        }
      }

      const sorted = Array.from(finishedMap.values()).sort((a, b) => {
        const da = parseMatchDate(a.matchDate || a.date)?.getTime() || 0;
        const db = parseMatchDate(b.matchDate || b.date)?.getTime() || 0;
        return db - da; // newest first
      });

      return sorted.slice(0, 24);
    },
    enabled: Boolean(preferences?.trackedTeams && preferences.trackedTeams.length > 0),
    staleTime: 1000 * 60 * 10,
  });

  // Group day matches by translated league when "ALL" is selected
  const groupedByLeague = useMemo(() => {
    if (selectedLeagueFilter !== "ALL") return null;

    const map = new Map<
      string,
      { leagueName: string; leagueLogo?: string; matches: SportMatch[] }
    >();

    for (const match of dayMatches) {
      const translatedLeague = translateLeagueName(match.leagueName, match.league);
      const key = translatedLeague || match.league || "outros";

      const leagueDef = SUPPORTED_LEAGUES.find(
        (l) =>
          l.slug === match.league ||
          l.id === match.league ||
          translateLeagueName(l.name) === translatedLeague ||
          translateLeagueName(l.displayName) === translatedLeague
      );
      const leagueLogo = leagueDef?.logoUrl;

      if (!map.has(key)) {
        map.set(key, { leagueName: translatedLeague, leagueLogo, matches: [] });
      }
      map.get(key)!.matches.push(match);
    }

    return Array.from(map.values());
  }, [selectedLeagueFilter, dayMatches]);

  const handleRefresh = () => {
    refetchDay();
    refetchToday();
    refetchPrefs();
    refetchHistory();
  };

  const handleShiftDate = (days: number) => {
    const [year, month, day] = selectedDate.split("-").map(Number);
    const current = new Date(year, month - 1, day);
    current.setDate(current.getDate() + days);
    setSelectedDate(getLocalDateString(current));
  };

  const handleSelectQuickDate = (type: "yesterday" | "today" | "tomorrow") => {
    const d = new Date();
    if (type === "yesterday") d.setDate(d.getDate() - 1);
    if (type === "tomorrow") d.setDate(d.getDate() + 1);
    setSelectedDate(getLocalDateString(d));
  };

  const formattedDateTitle = useMemo(() => {
    try {
      const [year, month, day] = selectedDate.split("-").map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString("pt-BR", {
        weekday: "short",
        day: "2-digit",
        month: "short",
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. TOP HEADER: TÍTULO + AÇÕES RÁPIDAS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 md:p-5 bg-[#121214]/60 backdrop-blur-xl border border-white/5 rounded-2xl shadow-lg">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] md:text-xs font-bold tracking-widest uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-1.5">
            <Trophy className="w-3 h-3 text-emerald-400" />
            Central de Esportes
          </span>
          <h1 className="text-xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            Placares &{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              Partidas
            </span>
          </h1>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={handleRefresh}
            disabled={isFetchingDay}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5 transition-all disabled:opacity-50"
            title="Atualizar placares"
            aria-label="Atualizar placares"
          >
            <RefreshCw
              className={`w-4 h-4 ${isFetchingDay ? "animate-spin text-emerald-400" : ""}`}
            />
          </button>

          <Link
            href="/sports/favoritos"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all shadow-sm"
          >
            <Star className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
            <span>Gerenciar Favoritos</span>
            {totalFavoritesCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-500/25 text-emerald-200 text-[10px] font-black">
                {totalFavoritesCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* 2. TOP HERO: RADAR DE PRÓXIMOS JOGOS (TIMELINE DOS PRÓXIMOS 14 DIAS) */}
      <SportsRadar
        onOpenFavorites={() => {}}
        onSelectMatch={setSelectedMatchForModal}
      />

      {/* 3. AO VIVO: TEMA VERDE/EMERALD HARMONIOSO E ALTURA DINÂMICA COMPACTA */}
      {liveMatchesCount > 0 && (
        <div className="p-4 md:p-5 bg-[#121214]/90 backdrop-blur-xl border border-emerald-500/30 rounded-3xl shadow-[0_0_30px_rgba(16,185,129,0.08)] space-y-3 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Ao Vivo Agora ({liveMatchesCount})
              </span>
              <span className="text-xs text-zinc-400 hidden sm:inline">
                Acompanhamento em tempo real sincronizado com a ESPN
              </span>
            </div>

            <button
              onClick={handleRefresh}
              className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Sincronizar</span>
            </button>
          </div>

          {/* DYNAMIC HEIGHT CONTAINER:
              - 1 game: 1 compact column
              - 2 games: 2-column grid
              - > 2 games: max-height with smooth scrollbar, never dominating the full vertical page */}
          <div
            className={`grid gap-3.5 ${
              liveMatchesCount === 1
                ? "grid-cols-1 max-w-xl"
                : "grid-cols-1 md:grid-cols-2"
            } ${
              liveMatchesCount > 2
                ? "max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700/60 scrollbar-track-transparent pr-1.5"
                : ""
            }`}
          >
            {liveMatches.map((match) => (
              <MatchCard
                key={`live-${match.id}`}
                match={match}
                onClick={setSelectedMatchForModal}
                isFavorite={Boolean(
                  (match.homeTeam?.id &&
                    trackedSportTeamKeys.has(
                      `${(match.sport || "").toLowerCase()}::${match.homeTeam.id}`
                    )) ||
                    (match.awayTeam?.id &&
                      trackedSportTeamKeys.has(
                        `${(match.sport || "").toLowerCase()}::${match.awayTeam.id}`
                      )) ||
                    trackedLeagueSlugs.has(match.league || "")
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* 4. BLOCO UNIFICADO: CENTRAL DE JOGOS & RESULTADOS */}
      <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-emerald-500/40 rounded-3xl p-5 md:p-6 lg:p-7 shadow-2xl relative overflow-hidden">
        {/* Ambient radial glow */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/5 via-teal-500/5 to-transparent pointer-events-none opacity-60" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start relative z-10">
          {/* ============================================================== */}
          {/* COLUNA ESQUERDA: JOGOS DO DIA (col-span-12 lg:col-span-7)      */}
          {/* ============================================================== */}
          <div className="lg:col-span-7 space-y-4">
            {/* Top Bar da Esquerda: Título + Seletor de Data */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-black text-white tracking-tight">
                    Jogos do Dia
                  </h2>
                  <span className="text-[11px] text-zinc-400">
                    Partidas organizadas por data e campeonato
                  </span>
                </div>
              </div>

              {/* Quick Date Selector + Arrows */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
                <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-xl border border-white/5">
                  <button
                    onClick={() => handleSelectQuickDate("yesterday")}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Ontem
                  </button>
                  <button
                    onClick={() => handleSelectQuickDate("today")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedDate === todayStr
                        ? "bg-emerald-500 text-black shadow-sm font-black"
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Hoje
                  </button>
                  <button
                    onClick={() => handleSelectQuickDate("tomorrow")}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Amanhã
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleShiftDate(-1)}
                    className="p-1.5 rounded-lg bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                    title="Dia anterior"
                    aria-label="Dia anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/10 text-xs font-semibold text-zinc-300">
                    <CalendarIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="capitalize text-[11px] md:text-xs">{formattedDateTitle}</span>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        if (e.target.value) setSelectedDate(e.target.value);
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full"
                      aria-label="Selecionar data"
                    />
                  </div>

                  <button
                    onClick={() => handleShiftDate(1)}
                    className="p-1.5 rounded-lg bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                    title="Próximo dia"
                    aria-label="Próximo dia"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* League Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
              <button
                onClick={() => setSelectedLeagueFilter("ALL")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  selectedLeagueFilter === "ALL"
                    ? "bg-emerald-500 text-black shadow-sm font-black"
                    : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-white/5"
                }`}
              >
                Todas as Ligas
              </button>

              {SUPPORTED_LEAGUES.map((league) => {
                const active = selectedLeagueFilter === league.slug;
                return (
                  <button
                    key={league.slug}
                    onClick={() => setSelectedLeagueFilter(league.slug)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                      active
                        ? "bg-white/15 text-white border border-white/20 font-bold"
                        : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-white/5"
                    }`}
                  >
                    {league.logoUrl && (
                      <img
                        src={league.logoUrl}
                        alt=""
                        className="w-3.5 h-3.5 object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = "none";
                        }}
                      />
                    )}
                    <span>{league.abbreviation || league.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Match List for "Jogos do Dia" */}
            {isLoadingDay ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5 py-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-32 rounded-2xl bg-zinc-900/40 border border-white/5 animate-pulse"
                  />
                ))}
              </div>
            ) : selectedLeagueFilter === "ALL" && groupedByLeague ? (
              /* GROUPED BY LEAGUE */
              groupedByLeague.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center gap-2 bg-[#121214]/30 rounded-2xl border border-dashed border-white/10">
                  <Trophy className="w-8 h-8 text-zinc-600 mb-1" />
                  <p className="text-zinc-300 text-sm font-semibold">
                    Nenhum jogo encontrado para esta data nas ligas cadastradas
                  </p>
                  <p className="text-zinc-500 text-xs">
                    Tente selecionar outra data na barra acima.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {groupedByLeague.map((group) => (
                    <div key={group.leagueName} className="space-y-3">
                      <div className="flex items-center gap-2 px-1">
                        {group.leagueLogo && (
                          <img
                            src={group.leagueLogo}
                            alt=""
                            className="w-4 h-4 object-contain"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = "none";
                            }}
                          />
                        )}
                        <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-emerald-400">
                          {group.leagueName}
                        </h3>
                        <span className="text-[11px] text-zinc-500 font-medium">
                          ({group.matches.length})
                        </span>
                      </div>

                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5">
                        {group.matches.map((match) => (
                          <MatchCard
                            key={match.id}
                            match={match}
                            onClick={setSelectedMatchForModal}
                            isFavorite={Boolean(
                              (match.homeTeam?.id &&
                                trackedSportTeamKeys.has(
                                  `${(match.sport || "").toLowerCase()}::${match.homeTeam.id}`
                                )) ||
                                (match.awayTeam?.id &&
                                  trackedSportTeamKeys.has(
                                    `${(match.sport || "").toLowerCase()}::${match.awayTeam.id}`
                                  )) ||
                                trackedLeagueSlugs.has(match.league || "")
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : dayMatches.length === 0 ? (
              /* EMPTY STATE FOR SINGLE LEAGUE */
              <div className="py-14 text-center flex flex-col items-center justify-center gap-3 bg-[#121214]/30 rounded-2xl border border-dashed border-white/10">
                <Trophy className="w-10 h-10 text-zinc-600 mb-1" />
                <div>
                  <p className="text-zinc-200 text-sm font-semibold">
                    Nenhum jogo agendado para esta competição nesta data
                  </p>
                  <p className="text-zinc-500 text-xs mt-1">
                    Selecione outro dia no seletor acima ou volte para &quot;Todas as Ligas&quot;.
                  </p>
                </div>
              </div>
            ) : (
              /* FLAT MATCH LIST FOR SINGLE LEAGUE */
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5">
                {dayMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onClick={setSelectedMatchForModal}
                    isFavorite={Boolean(
                      (match.homeTeam?.id &&
                        trackedSportTeamKeys.has(
                          `${(match.sport || "").toLowerCase()}::${match.homeTeam.id}`
                        )) ||
                        (match.awayTeam?.id &&
                          trackedSportTeamKeys.has(
                            `${(match.sport || "").toLowerCase()}::${match.awayTeam.id}`
                          )) ||
                        trackedLeagueSlugs.has(match.league || "")
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* COLUNA DIREITA: ÚLTIMOS RESULTADOS (col-span-12 lg:col-span-5) */}
          {/* ============================================================== */}
          <div className="lg:col-span-5 space-y-4 lg:border-l lg:border-white/[0.08] lg:pl-8">
            {/* Header da Direita */}
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base md:text-lg font-black text-white tracking-tight">
                      Últimos Resultados
                    </h2>
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                      Favoritos
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Placares recentes dos seus times
                  </p>
                </div>
              </div>

              <Link
                href="/sports/favoritos"
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 shrink-0 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20"
              >
                <span>Times</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Finished Matches List */}
            {isLoadingHistory ? (
              <div className="space-y-3 py-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-32 rounded-2xl bg-zinc-900/40 border border-white/5 animate-pulse"
                  />
                ))}
              </div>
            ) : !preferences?.trackedTeams || preferences.trackedTeams.length === 0 ? (
              <div className="py-12 px-4 text-center flex flex-col items-center justify-center gap-3 bg-[#121214]/40 rounded-2xl border border-dashed border-white/10">
                <Shield className="w-9 h-9 text-emerald-400/50 mb-1" />
                <div>
                  <p className="text-zinc-200 text-sm font-semibold">
                    Nenhum time favorito selecionado
                  </p>
                  <p className="text-zinc-500 text-xs mt-1">
                    Adicione seus clubes na página de favoritos para ver seus placares recentes aqui.
                  </p>
                </div>
                <Link
                  href="/sports/favoritos"
                  className="mt-1 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-black hover:bg-emerald-400 transition-all shadow-md"
                >
                  Escolher Times Favoritos
                </Link>
              </div>
            ) : historyMatches.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center gap-2 bg-[#121214]/30 rounded-2xl border border-dashed border-white/10">
                <History className="w-8 h-8 text-zinc-600 mb-1" />
                <p className="text-zinc-300 text-sm font-semibold">
                  Nenhum resultado recente encontrado
                </p>
                <p className="text-zinc-500 text-xs">
                  Acompanhe as próximas partidas no Radar no topo da página.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[820px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent pr-1">
                {historyMatches.map((match) => (
                  <MatchCard
                    key={`hist-${match.id}`}
                    match={match}
                    onClick={setSelectedMatchForModal}
                    isFavorite={true}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. MODAL DE DETALHES DA PARTIDA (ESTATÍSTICAS, LANCES E INFORMAÇÕES) */}
      <MatchDetailModal
        match={selectedMatchForModal}
        isOpen={Boolean(selectedMatchForModal)}
        onClose={() => setSelectedMatchForModal(null)}
      />
    </div>
  );
}
