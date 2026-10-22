import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock } from "lucide-react";
import { sportsApi } from "@/lib/api";
import { SportMatch } from "@/lib/types";
import { parseMatchDate } from "@/lib/date-utils";
import { MatchRow } from "./match-row";
import { PanelEmpty, RowSkeleton, SportsPanel } from "./sports-panel";
import { isCanceledStatus, isFinishedStatus, matchTimestamp } from "./sports-utils";

interface SportsRadarProps {
  onSelectMatch?: (match: SportMatch) => void;
  /** Quantidade de partidas visíveis antes de "Mostrar mais". */
  initialVisible?: number;
}

function dayGroupLabel(m: SportMatch): string {
  const d = parseMatchDate(m.matchDate || m.date);
  if (!d) return "Sem data";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((day - today) / 86_400_000);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  const label = d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "short" });
  return label.charAt(0).toUpperCase() + label.slice(1).replace(".", "");
}

/**
 * Agenda dos próximos 14 dias dos times e ligas favoritos,
 * agrupada por dia em uma lista vertical compacta.
 */
export function SportsRadar({ onSelectMatch, initialVisible = 6 }: SportsRadarProps) {
  const [expanded, setExpanded] = useState(false);

  const { data: radarMatches = [], isLoading } = useQuery<SportMatch[]>({
    queryKey: ["sports-radar-matches"],
    queryFn: () => sportsApi.getRadarMatches(14),
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  });

  const upcoming = useMemo(
    () =>
      radarMatches
        .filter((m) => !isFinishedStatus(m.status) && !isCanceledStatus(m.status))
        .sort((a, b) => matchTimestamp(a) - matchTimestamp(b)),
    [radarMatches]
  );

  const groups = useMemo(() => {
    const visible = expanded ? upcoming : upcoming.slice(0, initialVisible);
    const map = new Map<string, SportMatch[]>();
    for (const m of visible) {
      const key = dayGroupLabel(m);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return Array.from(map.entries());
  }, [upcoming, expanded, initialVisible]);

  const hiddenCount = upcoming.length - initialVisible;

  return (
    <SportsPanel
      title="Próximos jogos"
      icon={<CalendarClock className="w-4 h-4" />}
      action={
        upcoming.length > 0 ? (
          <span className="text-[11px] text-zinc-500">14 dias</span>
        ) : undefined
      }
    >
      {isLoading ? (
        <RowSkeleton rows={3} />
      ) : upcoming.length === 0 ? (
        <PanelEmpty
          title="Nenhum jogo agendado"
          description="Siga times ou campeonatos para montar sua agenda dos próximos dias."
          action={
            <Link
              href="/sports/favoritos"
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 transition-colors"
            >
              Escolher favoritos
            </Link>
          }
        />
      ) : (
        <>
          {groups.map(([label, matches]) => (
            <div key={label}>
              <div className="px-4 pt-3 pb-1 text-[11px] font-medium text-zinc-500">{label}</div>
              <div className="divide-y divide-white/[0.04]">
                {matches.map((m) => (
                  <MatchRow key={m.id} match={m} showLeague isFavorite onSelect={onSelectMatch} />
                ))}
              </div>
            </div>
          ))}
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="w-full px-4 py-2.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.03] border-t border-white/[0.05] transition-colors"
            >
              {expanded ? "Mostrar menos" : `Mostrar mais ${hiddenCount}`}
            </button>
          )}
        </>
      )}
    </SportsPanel>
  );
}
