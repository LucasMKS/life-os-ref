"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Award, Flame, Zap } from "lucide-react";
import { gamingApi, statsApi } from "@/lib/api";

const formatHours = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

interface InsightCardProps {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  accent: "blue" | "amber" | "purple";
}

const accentMap = {
  blue: "border-t-blue-500/40 text-blue-400",
  amber: "border-t-amber-500/40 text-amber-400",
  purple: "border-t-purple-500/40 text-purple-400",
};

function InsightCard({ icon, label, children, accent }: InsightCardProps) {
  return (
    <div
      className={`bg-[#121214]/70 backdrop-blur-xl border border-white/5 ${accentMap[accent]} rounded-3xl p-5 flex flex-col gap-3 shadow-lg hover:border-white/10 transition-colors`}
    >
      <div className={`flex items-center gap-2 ${accentMap[accent].split(" ")[1]}`}>
        {icon}
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          {label}
        </h4>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export function SteamTopInsights() {
  const { data: profile } = useQuery({
    queryKey: ["steam-profile"],
    queryFn: gamingApi.getSteamProfile,
    retry: false,
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

  const insights = useMemo(() => {
    const stats = playtimeStats ?? [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    const lookupName = (appId: number) => {
      const fromLibrary = (library?.response?.games ?? []).find(
        (g: any) => Number(g.appid) === Number(appId)
      );
      return fromLibrary?.name ?? `App ${appId}`;
    };

    // 1. Mais jogado dos últimos 7 dias
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

    // 2. Sequência de dias consecutivos jogando
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

    // 3. Jogo mais jogado de todos os tempos da biblioteca
    const games = library?.response?.games ?? [];
    const allTimeTop = games.length > 0
      ? games.slice().sort((a: any, b: any) => (b.playtime_forever ?? 0) - (a.playtime_forever ?? 0))[0]
      : null;

    return { mostPlayed, streak, allTimeTop };
  }, [library, playtimeStats]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <InsightCard
        icon={<Flame className="w-4 h-4 fill-blue-400" />}
        label="Destaque da Semana"
        accent="blue"
      >
        {insights.mostPlayed ? (
          <div className="flex items-center gap-3">
            <img
              src={`https://cdn.akamai.steamstatic.com/steam/apps/${insights.mostPlayed.appId}/header.jpg`}
              alt={insights.mostPlayed.name}
              className="w-20 h-12 rounded-xl object-cover shadow-md shrink-0"
            />
            <div className="min-w-0">
              <p className="text-sm font-bold text-white line-clamp-1">
                {insights.mostPlayed.name}
              </p>
              <p className="text-xs text-blue-400 font-mono mt-0.5">
                {formatHours(insights.mostPlayed.minutes)} esta semana
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-zinc-500 py-2">
            Nenhuma sessão registrada nos últimos 7 dias.
          </p>
        )}
      </InsightCard>

      <InsightCard
        icon={<Zap className="w-4 h-4 fill-amber-400" />}
        label="Sequência Ativa"
        accent="amber"
      >
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-white tabular-nums leading-none">
            {insights.streak}
          </span>
          <span className="text-xs text-zinc-400 font-medium">
            {insights.streak === 1 ? "dia seguido" : "dias seguidos"}
          </span>
        </div>
        <p className="text-[11px] text-zinc-500 mt-2">
          {insights.streak > 0
            ? "Mantenha o ritmo jogando hoje."
            : "Abra um jogo para iniciar uma nova sequência."}
        </p>
      </InsightCard>

      <InsightCard
        icon={<Award className="w-4 h-4 text-purple-400" />}
        label="Maior Registro Histórico"
        accent="purple"
      >
        {insights.allTimeTop ? (
          <div className="flex items-center gap-3">
            <img
              src={`https://cdn.akamai.steamstatic.com/steam/apps/${insights.allTimeTop.appid}/header.jpg`}
              alt={insights.allTimeTop.name}
              className="w-20 h-12 rounded-xl object-cover shadow-md shrink-0"
            />
            <div className="min-w-0">
              <p className="text-sm font-bold text-white line-clamp-1">
                {insights.allTimeTop.name}
              </p>
              <p className="text-xs text-purple-400 font-mono mt-0.5">
                {Math.round((insights.allTimeTop.playtime_forever ?? 0) / 60)}h no total
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-zinc-500 py-2">
            Biblioteca sincronizando...
          </p>
        )}
      </InsightCard>
    </div>
  );
}
