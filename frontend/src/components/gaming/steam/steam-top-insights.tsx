"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Flame, Trophy, Zap } from "lucide-react";
import { gamingApi, statsApi } from "@/lib/api";

const formatHours = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const daysSince = (iso: string) => {
  const then = new Date(iso);
  then.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((now.getTime() - then.getTime()) / 86_400_000);
};

interface InsightCardProps {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  accent: "blue" | "amber" | "rose";
}

const accentMap = {
  blue: "border-t-blue-500/50 text-blue-400",
  amber: "border-t-amber-500/50 text-amber-400",
  rose: "border-t-rose-500/50 text-rose-400",
};

function InsightCard({ icon, label, children, accent }: InsightCardProps) {
  return (
    <div
      className={`bg-[#121214]/80 backdrop-blur-xl border border-white/5 ${accentMap[accent]} rounded-3xl p-5 flex flex-col gap-3`}
    >
      <div className={`flex items-center gap-2 ${accentMap[accent].split(" ")[1]}`}>
        {icon}
        <h4 className="text-[10px] font-bold uppercase tracking-widest">
          {label}
        </h4>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export function SteamTopInsights() {
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["steam-profile"],
    queryFn: gamingApi.getSteamProfile,
    retry: false,
  });

  const { data: journal } = useQuery({
    queryKey: ["gaming-journal"],
    queryFn: gamingApi.getJournal,
    enabled: !!profile,
  });

  const { data: library } = useQuery({
    queryKey: ["steam-library"],
    queryFn: gamingApi.getSteamLibrary,
    enabled: !!profile,
  });

  const { data: playtimeStats } = useQuery({
    queryKey: ["gaming-playtime"],
    queryFn: () => statsApi.getDailyPlaytime(),
    enabled: !!profile,
  });

  const updateJournalMutation = useMutation({
    mutationFn: gamingApi.updateJournal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gaming-journal"] });
      toast.success("Marcado como abandonado.");
    },
  });

  const insights = useMemo(() => {
    const stats = playtimeStats ?? [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    const lookupName = (appId: number) => {
      const fromJournal = (journal ?? []).find(
        (j: any) => Number(j.appId) === Number(appId)
      );
      if (fromJournal) return fromJournal.name as string;
      const fromLibrary = (library?.response?.games ?? []).find(
        (g: any) => Number(g.appid) === Number(appId)
      );
      return fromLibrary?.name ?? `App ${appId}`;
    };

    const weekTotals = new Map<number, number>();
    stats.forEach((log: any) => {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      if (logDate >= sevenDaysAgo && logDate <= today) {
        weekTotals.set(
          log.appId,
          (weekTotals.get(log.appId) ?? 0) + (log.minutesPlayed ?? 0)
        );
      }
    });
    const topWeekly = [...weekTotals.entries()].sort(
      (a, b) => b[1] - a[1]
    )[0];
    const mostPlayed = topWeekly
      ? {
          appId: topWeekly[0],
          minutes: topWeekly[1],
          name: lookupName(topWeekly[0]),
        }
      : null;

    const activeDates = new Set(
      stats
        .filter((log: any) => (log.minutesPlayed ?? 0) > 0)
        .map((log: any) => log.date)
    );
    let streak = 0;
    const cursor = new Date(today);
    while (activeDates.has(cursor.toISOString().slice(0, 10))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    const lastSeen = new Map<number, string>();
    stats.forEach((log: any) => {
      const prev = lastSeen.get(log.appId);
      if (!prev || log.date > prev) lastSeen.set(log.appId, log.date);
    });
    const candidates = (journal ?? []).filter(
      (g: any) => g.status === "PLAYING" || g.status === "ON_HOLD"
    );
    const forgotten = candidates
      .map((g: any) => {
        const last = lastSeen.get(Number(g.appId));
        const days = last ? daysSince(last) : 999;
        return { game: g, days };
      })
      .sort((a: any, b: any) => b.days - a.days)[0];

    return { mostPlayed, streak, forgotten };
  }, [journal, library, playtimeStats]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <InsightCard
        icon={<Flame className="w-4 h-4 fill-blue-400" />}
        label="Mais jogado da semana"
        accent="blue"
      >
        {insights.mostPlayed ? (
          <div className="flex items-center gap-3">
            <img
              src={`https://cdn.akamai.steamstatic.com/steam/apps/${insights.mostPlayed.appId}/header.jpg`}
              alt={insights.mostPlayed.name}
              className="w-20 h-12 rounded-lg object-cover shadow-lg shrink-0"
            />
            <div className="min-w-0">
              <p className="text-sm font-bold text-white line-clamp-1">
                {insights.mostPlayed.name}
              </p>
              <p className="text-xs text-blue-400 font-mono mt-1">
                {formatHours(insights.mostPlayed.minutes)} esta semana
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-zinc-500">
            — Nenhuma sessão registrada nos últimos 7 dias.
          </p>
        )}
      </InsightCard>

      <InsightCard
        icon={<Zap className="w-4 h-4 fill-amber-400" />}
        label="Sequência atual"
        accent="amber"
      >
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-white tabular-nums leading-none">
            {insights.streak}
          </span>
          <span className="text-xs text-zinc-400 font-medium">
            {insights.streak === 1 ? "dia" : "dias"} seguidos
          </span>
        </div>
        <p className="text-[11px] text-zinc-500 mt-2">
          {insights.streak > 0
            ? "Continue jogando hoje para manter a sequência."
            : "Sem sessão hoje — comece uma para iniciar a contagem."}
        </p>
      </InsightCard>

      <InsightCard
        icon={<Trophy className="w-4 h-4 fill-rose-400" />}
        label="Esquecido há mais tempo"
        accent="rose"
      >
        {insights.forgotten ? (
          <div className="flex items-center gap-3">
            <img
              src={`https://cdn.akamai.steamstatic.com/steam/apps/${insights.forgotten.game.appId}/header.jpg`}
              alt={insights.forgotten.game.name}
              className="w-20 h-12 rounded-lg object-cover shadow-lg shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white line-clamp-1">
                {insights.forgotten.game.name}
              </p>
              <p className="text-xs text-rose-400 mt-1">
                {insights.forgotten.days >= 999
                  ? "Sem registros"
                  : `${insights.forgotten.days} dias inativo`}
              </p>
              <button
                onClick={() =>
                  updateJournalMutation.mutate({
                    appId: insights.forgotten.game.appId,
                    name: insights.forgotten.game.name,
                    status: "ABANDONED",
                  })
                }
                className="text-[10px] font-bold text-rose-400 hover:text-rose-300 mt-1 transition-colors"
              >
                Marcar abandonado →
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-zinc-500">
            — Nenhum jogo &quot;Jogando&quot; ou &quot;Em pausa&quot; no diário.
          </p>
        )}
      </InsightCard>
    </div>
  );
}
