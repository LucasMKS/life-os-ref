"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Award, Flame, Gamepad2, Zap } from "lucide-react";
import { gamingApi, statsApi } from "@/lib/api";
import { sanitizeUrl } from "@/lib/security";
import { SurfacePanel } from "@/components/ui/page-shell";

const formatHours = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

function GameCoverThumb({ appId, alt }: { appId?: number | string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const coverUrl =
    appId != null
      ? sanitizeUrl(
          `https://cdn.akamai.steamstatic.com/steam/apps/${encodeURIComponent(
            String(appId)
          )}/header.jpg`
        )
      : null;

  if (!coverUrl || failed) {
    return (
      <div className="w-20 h-12 rounded-xl bg-[#09090b] border border-white/[0.06] flex items-center justify-center text-zinc-600 shrink-0">
        <Gamepad2 className="w-4 h-4" />
      </div>
    );
  }

  return (
    <img
      src={coverUrl}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="w-20 h-12 rounded-xl object-cover bg-[#09090b] border border-white/[0.06] shrink-0"
    />
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
    const stats = Array.isArray(playtimeStats) ? playtimeStats : [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    const games = Array.isArray(library?.response?.games)
      ? library.response.games
      : [];

    const lookupName = (appId: number) => {
      const fromLibrary = games.find(
        (g: { appid?: number; name?: string }) => Number(g.appid) === Number(appId)
      );
      return fromLibrary?.name ?? `App ${appId}`;
    };

    const weekTotals = new Map<number, number>();
    stats.forEach((log: { date?: string; appId?: number; minutesPlayed?: number }) => {
      if (!log?.date || log.appId == null) return;
      const logDate = new Date(log.date);
      if (Number.isNaN(logDate.getTime())) return;
      logDate.setHours(0, 0, 0, 0);
      if (logDate >= sevenDaysAgo && logDate <= today) {
        weekTotals.set(
          log.appId,
          (weekTotals.get(log.appId) ?? 0) + (log.minutesPlayed ?? 0)
        );
      }
    });

    const topWeekly = [...weekTotals.entries()].sort((a, b) => b[1] - a[1])[0];

    const mostPlayed = topWeekly
      ? {
          appId: topWeekly[0],
          minutes: topWeekly[1],
          name: lookupName(topWeekly[0]),
        }
      : null;

    const activeDates = new Set(
      stats
        .filter((log: { minutesPlayed?: number; date?: string }) => (log?.minutesPlayed ?? 0) > 0 && log?.date)
        .map((log: { date: string }) => log.date)
    );
    let streak = 0;
    const cursor = new Date(today);
    while (activeDates.has(cursor.toISOString().slice(0, 10))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    const allTimeTop =
      games.length > 0
        ? games
            .slice()
            .sort(
              (a: { playtime_forever?: number }, b: { playtime_forever?: number }) =>
                (b.playtime_forever ?? 0) - (a.playtime_forever ?? 0)
            )[0]
        : null;

    return { mostPlayed, streak, allTimeTop };
  }, [library, playtimeStats]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <SurfacePanel
        title="Destaque da Semana"
        icon={<Flame className="w-3.5 h-3.5" />}
      >
        {insights.mostPlayed ? (
          <div className="flex items-center gap-3">
            <GameCoverThumb
              appId={insights.mostPlayed.appId}
              alt={insights.mostPlayed.name}
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {insights.mostPlayed.name}
              </p>
              <p className="text-xs text-zinc-400 font-mono mt-0.5 tabular-nums">
                {formatHours(insights.mostPlayed.minutes)} esta semana
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-zinc-500 py-1">
            Nenhuma sessão registrada nos últimos 7 dias.
          </p>
        )}
      </SurfacePanel>

      <SurfacePanel
        title="Sequência Ativa"
        icon={<Zap className="w-3.5 h-3.5" />}
      >
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold text-white tabular-nums leading-none">
            {insights.streak}
          </span>
          <span className="text-xs text-zinc-400 font-medium">
            {insights.streak === 1 ? "dia seguido" : "dias seguidos"}
          </span>
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          {insights.streak > 0
            ? "Mantenha o ritmo jogando hoje."
            : "Abra um jogo para iniciar uma nova sequência."}
        </p>
      </SurfacePanel>

      <SurfacePanel
        title="Maior Registro Histórico"
        icon={<Award className="w-3.5 h-3.5" />}
      >
        {insights.allTimeTop ? (
          <div className="flex items-center gap-3">
            <GameCoverThumb
              appId={insights.allTimeTop.appid}
              alt={insights.allTimeTop.name || "Jogo"}
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {insights.allTimeTop.name || "Título Steam"}
              </p>
              <p className="text-xs text-zinc-400 font-mono mt-0.5 tabular-nums">
                {Math.round((insights.allTimeTop.playtime_forever ?? 0) / 60)}h no total
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-zinc-500 py-1">
            Biblioteca sincronizando...
          </p>
        )}
      </SurfacePanel>
    </div>
  );
}
