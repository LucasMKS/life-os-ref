"use client";

import { useState } from "react";
import { SportMatch } from "@/lib/types";
import { MapPin, Tv, Star, ChevronRight } from "lucide-react";
import {
  translateLeagueName,
  translateTeamName,
  translateStatusDetail,
} from "@/lib/sports-translations";
import { formatMatchTime } from "@/lib/date-utils";

interface MatchCardProps {
  match: SportMatch;
  isFavorite?: boolean;
  onClick?: (match: SportMatch) => void;
}

export function MatchCard({ match, isFavorite, onClick }: MatchCardProps) {
  const [homeLogoError, setHomeLogoError] = useState(false);
  const [awayLogoError, setAwayLogoError] = useState(false);

  const statusUpper = (match.status || "").toUpperCase();
  const isLive =
    statusUpper.includes("IN_PROGRESS") ||
    statusUpper.includes("FIRST_HALF") ||
    statusUpper.includes("SECOND_HALF") ||
    statusUpper.includes("HALFTIME") ||
    statusUpper.includes("LIVE");

  const isFinished = statusUpper.includes("FINISHED") || statusUpper.includes("FINAL") || statusUpper.includes("FT");

  const leagueTitle = translateLeagueName(match.leagueName, match.league);
  const homeName = translateTeamName(match.homeTeam?.displayName || match.homeTeam?.name || "Mandante");
  const awayName = translateTeamName(match.awayTeam?.displayName || match.awayTeam?.name || "Visitante");
  const statusDetailTranslated = translateStatusDetail(match.statusDetail, match.status);

  const homeScore = match.homeTeam?.score ?? null;
  const awayScore = match.awayTeam?.score ?? null;
  const hasScores = (isLive || isFinished) && homeScore !== null && awayScore !== null;

  const homeWinner = isFinished && match.homeTeam?.winner;
  const awayWinner = isFinished && match.awayTeam?.winner;

  const renderLogo = (logoUrl?: string, name?: string, error?: boolean, onError?: () => void) => {
    if (logoUrl && !error) {
      return (
        <img
          src={logoUrl}
          alt={name || ""}
          onError={onError}
          className="w-8 h-8 md:w-9 md:h-9 object-contain shrink-0"
          loading="lazy"
        />
      );
    }
    const initials = (name || "?").slice(0, 2).toUpperCase();
    return (
      <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0">
        {initials}
      </div>
    );
  };

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={() => onClick?.(match)}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick(match);
        }
      }}
      className={`relative group bg-[#131316] hover:bg-[#17171b] border rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between ${
        onClick ? "cursor-pointer hover:border-emerald-500/40 hover:shadow-[0_0_25px_rgba(16,185,129,0.12)]" : ""
      } ${
        isLive
          ? "border-emerald-500/35 bg-gradient-to-br from-emerald-950/20 via-[#131316] to-[#131316] shadow-[0_0_20px_rgba(16,185,129,0.08)]"
          : isFavorite || match.isUserTrackedMatch
          ? "border-emerald-500/25 bg-emerald-950/10"
          : "border-white/[0.06] hover:border-white/15"
      }`}
    >
      {/* Top Header: League and Status */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-white/5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider truncate">
            {leagueTitle}
          </span>
          {(isFavorite || match.isUserTrackedMatch) && (
            <span title="Favorito">
              <Star className="w-3 h-3 fill-emerald-400 text-emerald-400 shrink-0" />
            </span>
          )}
        </div>

        <div>
          {isLive ? (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span>{match.displayClock || statusDetailTranslated || "AO VIVO"}</span>
            </div>
          ) : isFinished ? (
            <span className="text-[11px] font-semibold uppercase text-zinc-500">
              {statusDetailTranslated || "Finalizado"}
            </span>
          ) : (
            <span className="text-[11px] font-medium text-zinc-400">
              {formatMatchTime(match.matchDate || match.date)}
            </span>
          )}
        </div>
      </div>

      {/* Center Matchup: Home Team vs Away Team */}
      <div className="grid grid-cols-12 items-center gap-2 my-1">
        {/* Home Team */}
        <div className="col-span-5 flex items-center gap-2.5 min-w-0">
          {renderLogo(
            match.homeTeam?.logoUrl,
            homeName,
            homeLogoError,
            () => setHomeLogoError(true)
          )}
          <div className="min-w-0 flex-1">
            <span
              className={`text-xs md:text-sm font-semibold truncate block ${
                homeWinner
                  ? "text-white font-bold"
                  : awayWinner
                  ? "text-zinc-400"
                  : "text-zinc-200"
              }`}
            >
              {homeName}
            </span>
            {match.homeTeam?.record && (
              <span className="text-[10px] text-zinc-500 block truncate">
                {match.homeTeam.record}
              </span>
            )}
          </div>
        </div>

        {/* Score or VS */}
        <div className="col-span-2 flex items-center justify-center text-center">
          {hasScores ? (
            <div className={`px-2 py-1 rounded-xl border flex items-center justify-center gap-1.5 ${
              isLive ? "bg-black/60 border-emerald-500/30" : "bg-black/40 border-white/5"
            }`}>
              <span
                className={`text-base md:text-lg font-bold font-mono ${
                  homeWinner ? "text-emerald-400" : isLive ? "text-emerald-300 font-extrabold" : "text-zinc-200"
                }`}
              >
                {homeScore}
              </span>
              <span className="text-zinc-600 text-xs font-mono">:</span>
              <span
                className={`text-base md:text-lg font-bold font-mono ${
                  awayWinner ? "text-emerald-400" : isLive ? "text-emerald-300 font-extrabold" : "text-zinc-200"
                }`}
              >
                {awayScore}
              </span>
            </div>
          ) : (
            <span className="text-[11px] font-bold text-zinc-500 uppercase px-2 py-0.5 bg-white/5 rounded-md border border-white/5">
              vs
            </span>
          )}
        </div>

        {/* Away Team */}
        <div className="col-span-5 flex items-center justify-end gap-2.5 min-w-0 text-right">
          <div className="min-w-0 flex-1">
            <span
              className={`text-xs md:text-sm font-semibold truncate block ${
                awayWinner
                  ? "text-white font-bold"
                  : homeWinner
                  ? "text-zinc-400"
                  : "text-zinc-200"
              }`}
            >
              {awayName}
            </span>
            {match.awayTeam?.record && (
              <span className="text-[10px] text-zinc-500 block truncate">
                {match.awayTeam.record}
              </span>
            )}
          </div>
          {renderLogo(
            match.awayTeam?.logoUrl,
            awayName,
            awayLogoError,
            () => setAwayLogoError(true)
          )}
        </div>
      </div>

      {/* Footer: Venue and Broadcast (clean and minimal) */}
      <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-500">
        {match.venue?.name ? (
          <div className="flex items-center gap-1 truncate max-w-[65%]" title={`${match.venue.name}${match.venue.city ? `, ${match.venue.city}` : ""}`}>
            <MapPin className="w-3 h-3 text-zinc-600 shrink-0" />
            <span className="truncate">
              {match.venue.name}
              {match.venue.city ? ` · ${match.venue.city}` : ""}
            </span>
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2 shrink-0">
          {match.broadcast && (
            <div className="flex items-center gap-1 text-zinc-400 font-medium">
              <Tv className="w-3 h-3 text-emerald-400/80 shrink-0" />
              <span className="truncate max-w-[100px]">{match.broadcast}</span>
            </div>
          )}
          {onClick && (
            <span className="text-[10px] font-semibold text-emerald-400/0 group-hover:text-emerald-400 transition-all flex items-center">
              Detalhes <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
