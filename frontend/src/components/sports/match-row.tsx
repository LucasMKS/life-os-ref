import { memo, useState } from "react";
import { ChevronRight, Star } from "lucide-react";
import { SportMatch, TeamCompetitor } from "@/lib/types";
import {
  translateLeagueName,
  translateStatusDetail,
  translateTeamName,
} from "@/lib/sports-translations";
import { parseMatchDate } from "@/lib/date-utils";
import {
  formatKickoff,
  isCanceledStatus,
  isFinishedStatus,
  isLiveStatus,
} from "./sports-utils";

/* ------------------------------------------------------------------ */
/* Logo do time com fallback de iniciais (sem re-render do row inteiro) */
/* ------------------------------------------------------------------ */
export const TeamLogo = memo(function TeamLogo({
  src,
  name,
  size = 20,
}: {
  src?: string;
  name: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className="object-contain shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="shrink-0 rounded-md bg-zinc-800 text-zinc-400 font-semibold flex items-center justify-center"
      style={{ width: size, height: size, fontSize: Math.max(8, size * 0.4) }}
    >
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
});

function TeamLine({
  team,
  fallback,
  score,
  showScore,
  dimmed,
  highlighted,
}: {
  team?: TeamCompetitor;
  fallback: string;
  score?: number | null;
  showScore: boolean;
  dimmed: boolean;
  highlighted: boolean;
}) {
  const name = translateTeamName(team?.displayName || team?.name || fallback);
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <TeamLogo src={team?.logoUrl} name={name} />
      <span
        className={`flex-1 truncate text-[13px] ${
          highlighted
            ? "text-white font-semibold"
            : dimmed
            ? "text-zinc-500"
            : "text-zinc-200 font-medium"
        }`}
      >
        {name}
      </span>
      {showScore && (
        <span
          className={`w-6 text-right font-mono tabular-nums text-[13px] ${
            highlighted ? "text-white font-semibold" : dimmed ? "text-zinc-500" : "text-zinc-200"
          }`}
        >
          {score ?? "-"}
        </span>
      )}
    </div>
  );
}

export interface MatchRowProps {
  match: SportMatch;
  isFavorite?: boolean;
  /** Mostra o nome da liga abaixo dos times (usado nas listas laterais). */
  showLeague?: boolean;
  /** Exibe a data (dd/mmm) no lugar da hora — usado em resultados recentes. */
  showDate?: boolean;
  onSelect?: (match: SportMatch) => void;
}

/**
 * Linha compacta de partida (padrão de apps esportivos: status à esquerda,
 * times empilhados e placar alinhado à direita). Memoizada para listas longas.
 */
export const MatchRow = memo(function MatchRow({
  match,
  isFavorite,
  showLeague,
  showDate,
  onSelect,
}: MatchRowProps) {
  const live = isLiveStatus(match.status);
  const finished = isFinishedStatus(match.status);
  const canceled = isCanceledStatus(match.status);

  const homeScore = match.homeTeam?.score ?? null;
  const awayScore = match.awayTeam?.score ?? null;
  const showScore = (live || finished) && homeScore !== null && awayScore !== null;

  const homeWin = finished && !!match.homeTeam?.winner;
  const awayWin = finished && !!match.awayTeam?.winner;

  let statusTop: string;
  let statusBottom: string | null = null;
  if (live) {
    statusTop = match.displayClock || "Ao vivo";
    const detail = translateStatusDetail(match.statusDetail, match.status);
    if ((match.status || "").toUpperCase().includes("HALFTIME")) statusTop = "Intervalo";
    else if (detail && detail !== statusTop && detail.length <= 10) statusBottom = detail;
  } else if (canceled) {
    statusTop = "Adiado";
  } else if (finished) {
    statusTop = "Fim";
    if (showDate) {
      const d = parseMatchDate(match.matchDate || match.date);
      statusBottom = d
        ? d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "")
        : null;
    }
  } else {
    statusTop = formatKickoff(match);
    if (showDate) {
      const d = parseMatchDate(match.matchDate || match.date);
      statusBottom = d
        ? d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "")
        : null;
    }
  }

  return (
    <button
      type="button"
      onClick={() => onSelect?.(match)}
      className="group relative w-full grid grid-cols-[56px_1fr_auto] items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03] focus-visible:bg-white/[0.04] focus-visible:outline-none"
    >
      {live && (
        <span aria-hidden className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full bg-emerald-400/70" />
      )}

      {/* Status / horário */}
      <div className="flex flex-col items-start leading-tight">
        <span
          className={`flex items-center gap-1.5 text-xs tabular-nums ${
            live ? "text-emerald-300 font-semibold" : finished || canceled ? "text-zinc-500" : "text-zinc-300 font-medium"
          }`}
        >
          {live && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
          {statusTop}
        </span>
        {statusBottom && (
          <span className="text-[10px] text-zinc-500 mt-0.5 capitalize">{statusBottom}</span>
        )}
      </div>

      {/* Times */}
      <div className="min-w-0 space-y-1.5">
        <TeamLine
          team={match.homeTeam}
          fallback="Mandante"
          score={homeScore}
          showScore={showScore}
          highlighted={homeWin}
          dimmed={awayWin}
        />
        <TeamLine
          team={match.awayTeam}
          fallback="Visitante"
          score={awayScore}
          showScore={showScore}
          highlighted={awayWin}
          dimmed={homeWin}
        />
        {showLeague && (
          <span className="block text-[10px] text-zinc-500 truncate pt-0.5">
            {translateLeagueName(match.leagueName, match.league)}
          </span>
        )}
      </div>

      {/* Ações */}
      <div className="flex items-center gap-1.5 text-zinc-600">
        {isFavorite && <Star className="w-3.5 h-3.5 fill-zinc-300 text-zinc-300" aria-label="Favorito" />}
        <ChevronRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
      </div>
    </button>
  );
});
