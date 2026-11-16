"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Clock, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { gamingApi, statsApi } from "@/lib/api";
import { SurfacePanel } from "@/components/ui/page-shell";

const DAYS_WINDOW = 14;

const formatHours = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

interface TooltipPayloadItem {
  payload: {
    fullDay: string;
    minutes: number;
  };
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}) => {
  if (active && payload && payload.length) {
    const point = payload[0].payload;
    return (
      <div className="bg-[#161619] border border-white/[0.1] p-2.5 rounded-xl shadow-lg">
        <p className="text-zinc-400 text-[10px] uppercase tracking-wider mb-1 font-semibold">
          {point.fullDay}
        </p>
        <p className="text-zinc-100 font-mono font-bold text-base leading-none tabular-nums">
          {formatHours(point.minutes)}
        </p>
      </div>
    );
  }
  return null;
};

export function SteamStatsChart() {
  const { data: profile } = useQuery({
    queryKey: ["steam-profile"],
    queryFn: gamingApi.getSteamProfile,
    retry: false,
  });

  const { data: playtimeStats, isLoading } = useQuery({
    queryKey: ["gaming-playtime"],
    queryFn: () => statsApi.getDailyPlaytime(),
    enabled: !!profile,
  });

  const { dataset, totalMinutes, weekDelta } = useMemo(() => {
    const byDate = new Map<string, number>();
    const logs = Array.isArray(playtimeStats) ? playtimeStats : [];
    logs.forEach((log: { date?: string; minutesPlayed?: number }) => {
      if (!log?.date) return;
      byDate.set(log.date, (byDate.get(log.date) ?? 0) + (log.minutesPlayed ?? 0));
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: { day: string; fullDay: string; minutes: number; iso: string }[] =
      [];
    for (let i = DAYS_WINDOW - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const minutes = byDate.get(iso) ?? 0;
      days.push({
        iso,
        minutes,
        day: d.toLocaleDateString("pt-BR", {
          weekday: "short",
          day: "2-digit",
        }),
        fullDay: d.toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        }),
      });
    }

    const total = days.reduce((acc, d) => acc + d.minutes, 0);
    const lastWeek = days.slice(-7).reduce((acc, d) => acc + d.minutes, 0);
    const previousWeek = days.slice(0, 7).reduce((acc, d) => acc + d.minutes, 0);
    const delta =
      previousWeek === 0
        ? lastWeek > 0
          ? 100
          : 0
        : Math.round(((lastWeek - previousWeek) / previousWeek) * 100);

    return { dataset: days, totalMinutes: total, weekDelta: delta };
  }, [playtimeStats]);

  const totalHours = Math.round(totalMinutes / 60);
  const isPositive = weekDelta >= 0;

  return (
    <SurfacePanel
      title={`Pulso de Jogo · Últimos ${DAYS_WINDOW} dias`}
      icon={<Clock className="w-3.5 h-3.5" />}
      action={
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-base sm:text-lg text-white tabular-nums leading-none">
            {isLoading ? "—" : `${totalHours}h`}
          </span>
          {!isLoading && totalMinutes > 0 && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                isPositive
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-red-500/10 text-red-400 border-red-500/20"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {Math.abs(weekDelta)}%
            </span>
          )}
        </div>
      }
    >
      <div className="w-full h-[210px]">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center text-zinc-500">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={dataset}
              margin={{ top: 10, right: 6, left: 6, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorPlaytime" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a1a1aa" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#a1a1aa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: "#52525b",
                  strokeWidth: 1,
                  strokeDasharray: "3 3",
                }}
              />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#71717a", fontSize: 10, fontWeight: 500 }}
                dy={8}
                interval="preserveStartEnd"
              />
              <Area
                type="monotone"
                dataKey="minutes"
                stroke="#e4e4e7"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPlaytime)"
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </SurfacePanel>
  );
}
