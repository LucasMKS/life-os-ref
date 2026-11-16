"use client";

import { BookOpen, TrendingUp, Loader2 } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { readingApi } from "@/lib/api";

interface PulseTooltipProps {
  active?: boolean;
  payload?: Array<{
    value?: number;
    payload?: { day?: string };
  }>;
}

const CustomTooltip = ({ active, payload }: PulseTooltipProps) => {
  if (active && payload && payload.length > 0) {
    const point = payload[0];
    return (
      <div className="bg-[#161619] border border-white/[0.12] p-2.5 rounded-xl">
        <p className="text-zinc-400 text-[10px] uppercase tracking-wider mb-0.5 font-semibold">
          {point.payload?.day ?? ""}
        </p>
        <p className="text-emerald-400 font-mono font-bold text-base leading-none tabular-nums">
          {point.value ?? 0}{" "}
          <span className="text-zinc-500 text-xs font-normal">págs</span>
        </p>
      </div>
    );
  }
  return null;
};

export function ReadingPulseWidget() {
  const { data: rawData = [], isLoading } = useQuery({
    queryKey: ["reading-pulse-stats"],
    queryFn: readingApi.getReadingPulse,
  });

  const { data: summary } = useQuery<{ currentStreak?: number }>({
    queryKey: ["reading-summary"],
    queryFn: readingApi.getReadingSummary,
    staleTime: 1000 * 60 * 5,
  });

  const data = Array.isArray(rawData) ? rawData : [];

  const totalPagesLast7Days = data.reduce(
    (acc: number, curr: { pages?: number }) => acc + (Number(curr?.pages) || 0),
    0,
  );

  return (
    <div className="bg-[#111113] border border-white/[0.06] border-t-2 border-t-emerald-500/60 rounded-2xl p-5 sm:p-6 flex flex-col h-full min-h-[280px]">
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="text-emerald-400 w-4 h-4" />
            <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Pulso de Leitura
            </h2>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-xs text-zinc-500">Últimos 7 dias</p>
            {summary && (summary.currentStreak ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-full tabular-nums">
                {summary.currentStreak} dias seguidos
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1.5 text-zinc-100">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="font-mono font-bold text-xl leading-none tabular-nums">
              {isLoading ? "-" : totalPagesLast7Days}
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mt-1">
            Total Lido
          </span>
        </div>
      </div>

      <div className="flex-grow w-full -ml-2 -mb-1 mt-1 min-h-[160px]">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 4, left: 4, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorPages" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
              />
              <Area
                type="monotone"
                dataKey="pages"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPages)"
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
