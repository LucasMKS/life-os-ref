"use client";

import { BookOpen, TrendingUp, Loader2 } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { readingApi } from "@/lib/api";

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#09090b]/90 backdrop-blur-md border border-emerald-500/30 p-3 rounded-xl shadow-xl">
        <p className="text-zinc-400 text-[10px] uppercase tracking-wider mb-1 font-bold">
          {payload[0].payload.day}
        </p>
        <p className="text-emerald-400 font-mono font-bold text-lg leading-none drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
          {payload[0].value}{" "}
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

  const { data: summary } = useQuery<any>({
    queryKey: ["reading-summary"],
    queryFn: readingApi.getReadingSummary,
    staleTime: 1000 * 60 * 5,
  });

  const data = Array.isArray(rawData) ? rawData : [];

  const totalPagesLast7Days = data.reduce(
    (acc: number, curr: any) => acc + (curr?.pages || 0),
    0,
  );

  return (
    <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-emerald-500/50 rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden flex flex-col h-full min-h-[300px] group">
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />

      {/* Watermark */}
      <BookOpen
        className="absolute -bottom-10 -right-10 w-64 h-64 text-white opacity-[0.015] pointer-events-none -rotate-12"
        strokeWidth={1}
      />

      <div className="flex items-start justify-between mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="text-emerald-400 w-5 h-5" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Pulso de Leitura
            </h2>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Últimos 7 dias
            </p>
            {summary && summary.currentStreak > 0 && (
              <span className="inline-flex items-center gap-0.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.2)]">
                {summary.currentStreak} dias 🔥
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <TrendingUp className="w-4 h-4" />
            <span className="font-mono font-bold text-xl leading-none">
              {isLoading ? "-" : totalPagesLast7Days}
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">
            Total Lido
          </span>
        </div>
      </div>

      <div className="flex-grow w-full relative z-10 -ml-4 -mb-2 mt-2">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500/50" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorPages" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: "#10b981",
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
              />
              <Area
                type="monotone"
                dataKey="pages"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorPages)"
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
