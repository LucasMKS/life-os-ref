"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Clock, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { gamingApi, statsApi } from "@/lib/api";

const DAYS_WINDOW = 14;

const formatHours = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const point = payload[0].payload;
    return (
      <div className="bg-[#09090b]/90 backdrop-blur-md border border-blue-500/30 p-3 rounded-xl shadow-xl">
        <p className="text-zinc-400 text-[10px] uppercase tracking-wider mb-1 font-bold">
          {point.fullDay}
        </p>
        <p className="text-blue-400 font-mono font-bold text-lg leading-none drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">
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
    (playtimeStats ?? []).forEach((log: any) => {
      const key = log.date;
      byDate.set(key, (byDate.get(key) ?? 0) + (log.minutesPlayed ?? 0));
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
    <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-blue-500/50 rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden flex flex-col min-h-[320px] group">
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />

      <div className="flex items-start justify-between mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Clock className="text-blue-400 w-5 h-5" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Pulso de Jogo
            </h2>
          </div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Últimos {DAYS_WINDOW} dias
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-2xl text-white leading-none">
              {isLoading ? "-" : `${totalHours}h`}
            </span>
            {!isLoading && totalMinutes > 0 && (
              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  isPositive
                    ? "bg-green-500/10 text-green-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(weekDelta)}%
              </div>
            )}
          </div>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
            Total Jogado
          </span>
        </div>
      </div>

      <div className="flex-grow w-full h-[220px] relative z-10 -ml-4 -mb-2">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500/50" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={dataset}
              margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorPlaytime" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: "#3b82f6",
                  strokeWidth: 1,
                  strokeDasharray: "3 3",
                  opacity: 0.5,
                }}
              />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#52525b", fontSize: 10, fontWeight: 600 }}
                dy={10}
                interval="preserveStartEnd"
              />
              <Area
                type="monotone"
                dataKey="minutes"
                stroke="#3b82f6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorPlaytime)"
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
