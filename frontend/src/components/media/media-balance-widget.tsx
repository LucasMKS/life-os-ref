"use client";

import { Loader2, PlayCircle } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { SurfacePanel } from "@/components/ui/page-shell";
import { statsApi } from "@/lib/api";

interface BalanceItem {
  name: string;
  value: number;
  color: string;
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: BalanceItem }>;
}) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#161619] border border-white/[0.1] p-2.5 rounded-xl shadow-xl flex items-center gap-2.5">
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: data.color }}
        />
        <div>
          <p className="text-zinc-400 text-[10px] uppercase tracking-wider font-semibold leading-none mb-1">
            {data.name}
          </p>
          <p className="text-white font-mono font-bold text-xs leading-none tabular-nums">
            {data.value}{" "}
            <span className="text-zinc-500 font-normal">títulos</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function MediaBalanceWidget() {
  const { data: rawData = [], isLoading } = useQuery({
    queryKey: ["media-balance-stats"],
    queryFn: statsApi.getMediaBalance,
  });

  const data: BalanceItem[] = Array.isArray(rawData)
    ? rawData.map((item: Partial<BalanceItem>, idx: number) => ({
        name: String(item?.name ?? `Item ${idx + 1}`),
        value: Number(item?.value ?? 0) || 0,
        color:
          typeof item?.color === "string" && item.color
            ? item.color
            : idx === 0
              ? "#38bdf8"
              : "#10b981",
      }))
    : rawData && typeof rawData === "object"
      ? [
          {
            name: "Filmes",
            value:
              Number(
                (rawData as Record<string, unknown>).totalMovies ??
                  (rawData as Record<string, unknown>).movies ??
                  0,
              ) || 0,
            color: "#38bdf8",
          },
          {
            name: "Séries",
            value:
              Number(
                (rawData as Record<string, unknown>).totalSeries ??
                  (rawData as Record<string, unknown>).series ??
                  0,
              ) || 0,
            color: "#10b981",
          },
        ]
      : [];

  const totalMedia = data.reduce((acc, curr) => acc + (curr.value || 0), 0);

  return (
    <SurfacePanel
      accent="purple"
      title="Balanço de Mídia"
      icon={<PlayCircle className="w-4 h-4 text-purple-400" />}
      action={
        <span className="text-[11px] font-medium text-zinc-500">
          Títulos Finalizados
        </span>
      }
      className="h-full flex flex-col border-t-2 border-t-purple-500/60"
    >
      <div className="w-full relative flex items-center justify-center h-[180px] md:h-[200px]">
        {isLoading ? (
          <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
        ) : (
          <>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl md:text-3xl font-bold text-white leading-none tracking-tight tabular-nums">
                {totalMedia}
              </span>
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-widest mt-1">
                Total
              </span>
            </div>

            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "transparent" }}
                />
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={6}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={8}
                  animationDuration={800}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      className="hover:opacity-85 transition-opacity outline-none"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 md:gap-4 mt-4">
        {data.map((item) => (
          <div
            key={item.name}
            className="flex items-center gap-2.5 bg-[#161619] px-3 py-2 rounded-xl border border-white/[0.06]"
          >
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider leading-none mb-1">
                {item.name}
              </span>
              <span className="text-white font-mono text-xs md:text-sm font-bold leading-none tabular-nums">
                {item.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </SurfacePanel>
  );
}
