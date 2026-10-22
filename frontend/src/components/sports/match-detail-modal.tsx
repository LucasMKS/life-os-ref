"use client";

import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  X,
  Trophy,
  Calendar,
  MapPin,
  Tv,
  Users,
  Shield,
  ExternalLink,
  Flame,
  Activity,
  Award,
  Clock,
  ArrowRightLeft,
  Loader2,
} from "lucide-react";
import { SportMatch, MatchSummary } from "@/lib/types";
import { sportsApi } from "@/lib/api";
import {
  translateLeagueName,
  translateTeamName,
  translateStatusDetail,
  translateStatLabel,
} from "@/lib/sports-translations";
import { formatMatchTime } from "@/lib/date-utils";

interface MatchDetailModalProps {
  match: SportMatch | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MatchDetailModal({
  match,
  isOpen,
  onClose,
}: MatchDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"stats" | "events" | "info">("stats");

  // Reset tab on match change
  useEffect(() => {
    if (isOpen) {
      setActiveTab("stats");
    }
  }, [isOpen, match?.id]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  const {
    data: summary,
    isLoading,
    isError,
  } = useQuery<MatchSummary>({
    queryKey: ["sports-match-summary", match?.sport, match?.league, match?.id],
    queryFn: () => {
      if (!match) throw new Error("No match");
      return sportsApi.getMatchSummary(match.sport, match.league, match.id);
    },
    enabled: Boolean(isOpen && match?.id),
    staleTime: 1000 * 30, // 30s
    refetchInterval: (query) => {
      if (!isOpen || !match) return false;
      const s = (match.status || "").toUpperCase();
      const isLive =
        s.includes("IN_PROGRESS") ||
        s.includes("FIRST_HALF") ||
        s.includes("SECOND_HALF") ||
        s.includes("HALFTIME") ||
        s.includes("LIVE");
      return isLive ? 20000 : false;
    },
  });

  if (!isOpen || !match) return null;

  const statusUpper = (match.status || "").toUpperCase();
  const isLive =
    statusUpper.includes("IN_PROGRESS") ||
    statusUpper.includes("FIRST_HALF") ||
    statusUpper.includes("SECOND_HALF") ||
    statusUpper.includes("HALFTIME") ||
    statusUpper.includes("LIVE");
  const isFinished =
    statusUpper.includes("FINISHED") ||
    statusUpper.includes("FINAL") ||
    statusUpper.includes("FT");

  const leagueTitle = translateLeagueName(match.leagueName, match.league);
  const homeName = translateTeamName(
    match.homeTeam?.displayName || match.homeTeam?.name || "Mandante"
  );
  const awayName = translateTeamName(
    match.awayTeam?.displayName || match.awayTeam?.name || "Visitante"
  );
  const statusDetailTranslated = translateStatusDetail(
    match.statusDetail,
    match.status
  );

  const homeScore = match.homeTeam?.score ?? null;
  const awayScore = match.awayTeam?.score ?? null;
  const hasScores =
    (isLive || isFinished) && homeScore !== null && awayScore !== null;
  const homeWinner = isFinished && match.homeTeam?.winner;
  const awayWinner = isFinished && match.awayTeam?.winner;

  const hasLinescores =
    Boolean(summary?.homeLineScores && summary.homeLineScores.length > 0) &&
    Boolean(summary?.awayLineScores && summary.awayLineScores.length > 0);

  const isBasketball = (match.sport || "").toLowerCase() === "basketball";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/75 animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-[#111113] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >

        {/* 1. MODAL TOP BAR: Liga + Fechar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 relative z-10">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-zinc-500">
              <Trophy className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-medium text-zinc-400 truncate">
              {leagueTitle}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all border border-white/5"
            title="Fechar"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. MATCH HERO BANNER (PLACAR & TIMES) */}
        <div className="px-5 py-5 sm:px-7 sm:py-6 border-b border-white/5 relative z-10">
          {/* Status Badge & Horário */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {isLive ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/[0.06] text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  {match.displayClock || statusDetailTranslated || "Ao Vivo"}
                </span>
              </span>
            ) : isFinished ? (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/[0.06] text-zinc-400">
                {statusDetailTranslated || "Finalizado"}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-zinc-300 bg-white/[0.06]">
                <Clock className="w-3 h-3 text-zinc-500" />
                <span>{formatMatchTime(match.matchDate || match.date)}</span>
              </span>
            )}
          </div>

          {/* Times & Placar */}
          <div className="grid grid-cols-12 items-center gap-2">
            {/* Mandante */}
            <div className="col-span-5 flex flex-col sm:flex-row items-center sm:items-center justify-center sm:justify-end gap-2 sm:gap-3 text-center sm:text-right min-w-0">
              <div className="min-w-0 order-2 sm:order-1">
                <h3
                  className={`text-sm sm:text-base md:text-lg font-bold truncate ${
                    homeWinner
                      ? "text-white"
                      : awayWinner
                      ? "text-zinc-400"
                      : "text-white"
                  }`}
                >
                  {homeName}
                </h3>
                {match.homeTeam?.record && (
                  <span className="text-[11px] text-zinc-500 block">
                    {match.homeTeam.record}
                  </span>
                )}
              </div>

              {match.homeTeam?.logoUrl ? (
                <img
                  src={match.homeTeam.logoUrl}
                  alt={homeName}
                  className="w-12 h-12 sm:w-14 sm:h-14 object-contain order-1 sm:order-2 shrink-0 drop-shadow-md"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center text-sm font-bold text-zinc-300 order-1 sm:order-2 shrink-0">
                  {homeName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            {/* Placar Central */}
            <div className="col-span-2 flex flex-col items-center justify-center text-center">
              {hasScores ? (
                <div
                  className={`px-3 py-1.5 rounded-2xl border flex items-center justify-center gap-2 shadow-inner ${
                    isLive
                      ? "bg-white/[0.04] border-white/10"
                      : "bg-black/50 border-white/10"
                  }`}
                >
                  <span
                    className={`text-xl sm:text-2xl md:text-3xl font-black font-mono ${
                      homeWinner
                        ? "text-white"
                        : isLive
                        ? "text-white"
                        : "text-white"
                    }`}
                  >
                    {homeScore}
                  </span>
                  <span className="text-zinc-600 text-sm font-mono">:</span>
                  <span
                    className={`text-xl sm:text-2xl md:text-3xl font-black font-mono ${
                      awayWinner
                        ? "text-white"
                        : isLive
                        ? "text-white"
                        : "text-white"
                    }`}
                  >
                    {awayScore}
                  </span>
                </div>
              ) : (
                <span className="text-xs sm:text-sm font-black text-zinc-500 uppercase px-3 py-1 bg-white/5 rounded-xl border border-white/10">
                  VS
                </span>
              )}
            </div>

            {/* Visitante */}
            <div className="col-span-5 flex flex-col sm:flex-row items-center sm:items-center justify-center sm:justify-start gap-2 sm:gap-3 text-center sm:text-left min-w-0">
              {match.awayTeam?.logoUrl ? (
                <img
                  src={match.awayTeam.logoUrl}
                  alt={awayName}
                  className="w-12 h-12 sm:w-14 sm:h-14 object-contain shrink-0 drop-shadow-md"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center text-sm font-bold text-zinc-300 shrink-0">
                  {awayName.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="min-w-0">
                <h3
                  className={`text-sm sm:text-base md:text-lg font-bold truncate ${
                    awayWinner
                      ? "text-white"
                      : homeWinner
                      ? "text-zinc-400"
                      : "text-white"
                  }`}
                >
                  {awayName}
                </h3>
                {match.awayTeam?.record && (
                  <span className="text-[11px] text-zinc-500 block">
                    {match.awayTeam.record}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* TABLE OF LINESCORES (QUARTOS / PERÍODOS - EX: NBA) */}
          {hasLinescores && (
            <div className="mt-5 pt-4 border-t border-white/5 overflow-x-auto">
              <table className="w-full text-center text-xs">
                <thead>
                  <tr className="text-zinc-500 border-b border-white/5 font-semibold">
                    <th className="text-left py-1 px-2 font-medium">Equipe</th>
                    {summary!.homeLineScores!.map((_, idx) => (
                      <th key={idx} className="py-1 px-2">
                        {isBasketball ? `Q${idx + 1}` : `T${idx + 1}`}
                      </th>
                    ))}
                    <th className="py-1 px-2 font-bold text-zinc-300">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  <tr>
                    <td className="text-left py-1.5 px-2 font-sans font-semibold text-zinc-300 truncate max-w-[120px]">
                      {homeName}
                    </td>
                    {summary!.homeLineScores!.map((ls, idx) => (
                      <td key={idx} className="py-1.5 px-2 text-zinc-400">
                        {ls.displayValue}
                      </td>
                    ))}
                    <td className="py-1.5 px-2 font-bold text-white">
                      {homeScore ?? "-"}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-left py-1.5 px-2 font-sans font-semibold text-zinc-300 truncate max-w-[120px]">
                      {awayName}
                    </td>
                    {summary!.awayLineScores!.map((ls, idx) => (
                      <td key={idx} className="py-1.5 px-2 text-zinc-400">
                        {ls.displayValue}
                      </td>
                    ))}
                    <td className="py-1.5 px-2 font-bold text-white">
                      {awayScore ?? "-"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 3. TABS HEADER */}
        <div className="flex items-center gap-2 px-4 border-b border-white/5">
          <button
            onClick={() => setActiveTab("stats")}
            className={`flex items-center gap-2 px-3 py-2.5 text-xs font-medium border-b-2 -mb-px transition-all ${
              activeTab === "stats"
                ? "border-zinc-100 text-white"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Estatísticas</span>
          </button>

          <button
            onClick={() => setActiveTab("events")}
            className={`flex items-center gap-2 px-3 py-2.5 text-xs font-medium border-b-2 -mb-px transition-all ${
              activeTab === "events"
                ? "border-zinc-100 text-white"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{isBasketball ? "Líderes do Jogo" : "Gols & Lances"}</span>
          </button>

          <button
            onClick={() => setActiveTab("info")}
            className={`flex items-center gap-2 px-3 py-2.5 text-xs font-medium border-b-2 -mb-px transition-all ${
              activeTab === "info"
                ? "border-zinc-100 text-white"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Informações</span>
          </button>
        </div>

        {/* 4. MODAL BODY (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 max-h-[50vh] scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-500">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
              <p className="text-xs font-medium">Carregando dados da ESPN...</p>
            </div>
          ) : isError ? (
            <div className="py-10 text-center text-zinc-400 text-xs">
              Não foi possível carregar os detalhes desta partida no momento.
            </div>
          ) : (
            <>
              {/* TAB 1: ESTATÍSTICAS */}
              {activeTab === "stats" && (
                <div className="space-y-4">
                  {summary?.teamStats?.home && summary.teamStats.home.length > 0 ? (
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between text-xs font-bold text-zinc-400 px-1 pb-1 border-b border-white/5">
                        <span className="truncate max-w-[40%] text-left">
                          {homeName}
                        </span>
                        <span className="text-zinc-500 text-[10px] uppercase tracking-wider">
                          Comparativo
                        </span>
                        <span className="truncate max-w-[40%] text-right">
                          {awayName}
                        </span>
                      </div>

                      {summary.teamStats.home.map((hStat, idx) => {
                        const aStat =
                          summary.teamStats?.away?.find(
                            (a) => a.name && a.name === hStat.name
                          ) || summary.teamStats?.away?.[idx];
                        const labelTranslated = translateStatLabel(
                          hStat.label || hStat.name
                        );

                        // Parse numeric values for comparison bar
                        const numH = parseFloat(
                          String(hStat.displayValue || "").replace("%", "")
                        );
                        const numA = parseFloat(
                          String(aStat?.displayValue || "").replace("%", "")
                        );

                        const total = (isNaN(numH) ? 0 : numH) + (isNaN(numA) ? 0 : numA);
                        const pctH =
                          total > 0 && !isNaN(numH)
                            ? Math.min(100, Math.max(0, Math.round((numH / total) * 100)))
                            : 50;

                        return (
                          <div key={hStat.name || idx} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-mono font-bold text-white">
                                {hStat.displayValue}
                              </span>
                              <span className="text-[11px] font-medium text-zinc-400">
                                {labelTranslated}
                              </span>
                              <span className="font-mono font-bold text-white">
                                {aStat?.displayValue ?? "-"}
                              </span>
                            </div>

                            {/* Dual Comparison Bar */}
                            <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden flex gap-0.5">
                              <div
                                style={{ width: `${pctH}%` }}
                                className="bg-zinc-200 h-full"
                              />
                              <div
                                style={{ width: `${100 - pctH}%` }}
                                className="bg-zinc-600 h-full"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center flex flex-col items-center justify-center gap-2 bg-white/[0.02] rounded-2xl border border-dashed border-white/10">
                      <Activity className="w-8 h-8 text-zinc-600 mb-1" />
                      <p className="text-zinc-300 text-xs font-semibold">
                        Nenhuma estatística disponível ainda
                      </p>
                      <p className="text-zinc-500 text-[11px] max-w-sm">
                        As estatísticas detalhadas de posse, arremessos e faltas são
                        atualizadas em tempo real quando o jogo está ao vivo ou finalizado.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: LANCES / EVENTOS / LÍDERES */}
              {activeTab === "events" && (
                <div className="space-y-4">
                  {/* BASQUETE: LÍDERES INDIVIDUAIS */}
                  {isBasketball && summary?.leaders && summary.leaders.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {summary.leaders.map((teamLeaders, idx) => (
                        <div
                          key={teamLeaders.teamId || idx}
                          className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3"
                        >
                          <h4 className="text-xs font-semibold text-zinc-300">
                            {translateTeamName(teamLeaders.displayName)}
                          </h4>

                          <div className="space-y-2.5">
                            {teamLeaders.leaders.map((cat) => {
                              const top = cat.leaders?.[0];
                              if (!top) return null;
                              const headshotUrl =
                                typeof top.athlete?.headshot === "string"
                                  ? top.athlete.headshot
                                  : (top.athlete?.headshot as any)?.href || undefined;

                              return (
                                <div
                                  key={cat.name}
                                  className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    {headshotUrl ? (
                                      <img
                                        src={headshotUrl}
                                        alt=""
                                        className="w-8 h-8 rounded-full object-cover bg-zinc-800 shrink-0"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 font-semibold flex items-center justify-center text-xs shrink-0">
                                        {top.athlete?.displayName?.slice(0, 1) || "A"}
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <span className="text-xs font-semibold text-white truncate block">
                                        {top.athlete.displayName}
                                      </span>
                                      <span className="text-[10px] text-zinc-400">
                                        {cat.displayName}
                                      </span>
                                    </div>
                                  </div>

                                  <span className="text-sm font-mono font-semibold text-white tabular-nums shrink-0">
                                    {top.displayValue}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : /* FUTEBOL: KEY EVENTS (GOLS, CARTÕES, SUBS) */
                  summary?.keyEvents && summary.keyEvents.length > 0 ? (
                    <div className="space-y-2">
                      {summary.keyEvents.map((event) => {
                        const rawType =
                          typeof event.type === "string"
                            ? event.type
                            : (event.type as any)?.type ||
                              (event.type as any)?.text ||
                              (event.type as any)?.id ||
                              "";
                        const rawTypeText =
                          typeof event.typeText === "string"
                            ? event.typeText
                            : (event.typeText as any)?.text || "";
                        const rawText =
                          typeof event.text === "string"
                            ? event.text
                            : typeof (event.text as any)?.text === "string"
                            ? (event.text as any).text
                            : "";
                        const rawShortText =
                          typeof event.shortText === "string"
                            ? event.shortText
                            : typeof (event.shortText as any)?.text === "string"
                            ? (event.shortText as any).text
                            : "";

                        const typeLower = String(rawType || "").toLowerCase();
                        const typeTextLower = String(rawTypeText || "").toLowerCase();
                        const textLower = String(rawText || "").toLowerCase();

                        const isGoal =
                          Boolean(event.scoringPlay) ||
                          typeLower.includes("goal") ||
                          typeLower.includes("gol") ||
                          textLower.includes("goal") ||
                          textLower.includes("gol");
                        const isCard =
                          typeTextLower.includes("card") ||
                          textLower.includes("card") ||
                          textLower.includes("cartão") ||
                          typeLower.includes("card");
                        const redRe = /red[\s-]?card|vermelho/;
                        const isRed =
                          redRe.test(typeTextLower) ||
                          redRe.test(typeLower) ||
                          redRe.test(textLower);
                        const isSub =
                          typeLower.includes("sub") ||
                          textLower.includes("substitution") ||
                          textLower.includes("substituição");

                        const displayText =
                          rawShortText || rawText || "Lance registrado";

                        return (
                          <div
                            key={event.id}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs ${
                              isGoal ? "bg-white/[0.05] text-zinc-100" : "text-zinc-300"
                            }`}
                          >
                            <span className="font-mono tabular-nums text-zinc-500 shrink-0 w-9">
                              {event.clock || "·"}
                            </span>

                            <span
                              className={`shrink-0 w-9 text-center text-[10px] font-semibold rounded-md py-0.5 ${
                                isGoal ? "bg-zinc-100 text-zinc-900" : "bg-white/[0.06] text-zinc-400"
                              }`}
                              title={isGoal ? "Gol" : isRed ? "Cartão vermelho" : isCard ? "Cartão amarelo" : isSub ? "Substituição" : "Lance"}
                            >
                              {isGoal ? "GOL" : isRed ? "CV" : isCard ? "CA" : isSub ? "SUB" : "•"}
                            </span>

                            <div className="flex-1 min-w-0">
                              <span className="font-medium block">
                                {displayText}
                              </span>
                              {event.teamName && (
                                <span className="text-[10px] text-zinc-400 block mt-0.5">
                                  {translateTeamName(event.teamName)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center flex flex-col items-center justify-center gap-2 bg-white/[0.02] rounded-2xl border border-dashed border-white/10">
                      <Flame className="w-8 h-8 text-zinc-600 mb-1" />
                      <p className="text-zinc-300 text-xs font-semibold">
                        Nenhum lance registrado até o momento
                      </p>
                      <p className="text-zinc-500 text-[11px] max-w-sm">
                        Os gols, cartões e líderes do jogo serão exibidos assim que
                        ocorrerem na partida.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: INFORMAÇÕES DO JOGO */}
              {activeTab === "info" && (
                <div className="space-y-3 text-xs">
                  {/* Local */}
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="p-2 rounded-lg bg-white/[0.04] text-zinc-400 shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] text-zinc-500 block">
                        Local / Estádio
                      </span>
                      <span className="font-semibold text-white">
                        {summary?.venue?.name || match.venue?.name || "Local não informado"}
                        {(summary?.venue?.city || match.venue?.city) && (
                          <span className="text-zinc-400 font-normal">
                            {" "}· {summary?.venue?.city || match.venue?.city}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Transmissão */}
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="p-2 rounded-lg bg-white/[0.04] text-zinc-400 shrink-0">
                      <Tv className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] text-zinc-500 block">
                        Transmissão
                      </span>
                      <span className="font-semibold text-white">
                        {summary?.broadcasts && summary.broadcasts.length > 0
                          ? summary.broadcasts
                              .map((b: any) => {
                                if (!b) return "";
                                if (typeof b === "string") return b.trim();
                                if (typeof b.media?.name === "string") return b.media.name.trim();
                                if (typeof b.media?.shortName === "string") return b.media.shortName.trim();
                                if (Array.isArray(b.names) && b.names.length > 0) {
                                  return b.names.filter((n: any) => typeof n === "string").join("/");
                                }
                                if (typeof b.name === "string") return b.name.trim();
                                if (typeof b.shortName === "string") return b.shortName.trim();
                                if (typeof b.market === "string") return b.market.trim();
                                return "";
                              })
                              .filter(Boolean)
                              .join(", ") || (typeof match.broadcast === "string" ? match.broadcast : "") || "Não divulgada"
                          : (typeof match.broadcast === "string" ? match.broadcast : "") || "Não divulgada"}
                      </span>
                    </div>
                  </div>

                  {/* Horário Confirmado */}
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="p-2 rounded-lg bg-white/[0.04] text-zinc-400 shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] text-zinc-500 block">
                        Data e Horário (Fuso Local de Brasília)
                      </span>
                      <span className="font-semibold text-white">
                        {formatMatchTime(match.matchDate || match.date)}
                      </span>
                    </div>
                  </div>

                  {/* Árbitros */}
                  {summary?.officials && summary.officials.length > 0 && (
                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="p-2 rounded-lg bg-white/[0.04] text-zinc-400 shrink-0">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[11px] text-zinc-500 block">
                          Arbitragem
                        </span>
                        <div className="space-y-0.5 mt-0.5">
                          {summary.officials.map((of, i) => (
                            <span key={i} className="text-zinc-300 block">
                              {of.displayName} ({of.position})
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Público */}
                  {summary?.attendance && summary.attendance > 0 && (
                    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="p-2 rounded-lg bg-white/[0.04] text-zinc-400 shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[11px] text-zinc-500 block">
                          Público Presente
                        </span>
                        <span className="font-semibold text-white">
                          {summary.attendance.toLocaleString("pt-BR")} espectadores
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* 5. MODAL FOOTER */}
        <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between text-xs">
          <span className="text-[11px] text-zinc-500">
            Dados fornecidos em tempo real pela ESPN API
          </span>

          {summary?.gamecastUrl && (
            <a
              href={summary.gamecastUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 hover:text-white transition-colors text-xs font-medium"
            >
              <span>Abrir no ESPN Gamecast</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
