"use client";

import { PlayCircle, Loader2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { statsApi } from "@/lib/api";

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#09090b]/90 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl flex items-center gap-3">
        <div
          className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.3)]"
          style={{ backgroundColor: data.color }}
        />
        <div>
          <p className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold leading-none mb-1">
            {data.name}
          </p>
          <p className="text-white font-mono font-bold text-sm leading-none drop-shadow-md">
            {data.value}{" "}
            <span className="text-zinc-500 text-xs font-normal">títulos</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function MediaBalanceWidget() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["media-balance-stats"],
    queryFn: statsApi.getMediaBalance,
  });

  const totalMedia = data.reduce(
    (acc: number, curr: any) => acc + curr.value,
    0,
  );

  return (
    <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-purple-500/50 rounded-3xl p-5 md:p-6 lg:p-8 shadow-2xl relative overflow-hidden flex flex-col h-full group hover:-translate-y-1 transition-transform duration-300">
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-yellow-500/10 blur-[70px] rounded-full pointer-events-none transition-opacity duration-700 opacity-50 group-hover:opacity-100" />
      <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-purple-500/10 blur-[70px] rounded-full pointer-events-none transition-opacity duration-700 opacity-50 group-hover:opacity-100" />

      <PlayCircle
        className="absolute -bottom-10 -left-10 w-48 h-48 text-white opacity-[0.015] pointer-events-none -rotate-12"
        strokeWidth={1}
      />

      <div className="flex items-start justify-between mb-4 md:mb-2 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <PlayCircle className="text-purple-400 w-4 h-4 md:w-5 md:h-5" />
            <h2 className="text-base md:text-lg font-bold text-white tracking-tight">
              Balanço de Mídia
            </h2>
          </div>
          <p className="text-[10px] md:text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Títulos Finalizados
          </p>
        </div>
      </div>

      {/* CORREÇÃO DO RECHARTS AQUI: w-full e h-[200px] fixo */}
      <div className="w-full relative z-10 flex items-center justify-center h-[180px] md:h-[200px]">
        {isLoading ? (
          <Loader2 className="w-6 h-6 animate-spin text-purple-500/50" />
        ) : (
          <>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl md:text-3xl font-black text-white leading-none tracking-tighter drop-shadow-md">
                {totalMedia}
              </span>
              <span className="text-[9px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                Total
              </span>
            </div>

            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={0}
            >
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
                  cornerRadius={10}
                  animationDuration={1500}
                >
                  {data.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      className="hover:opacity-80 transition-opacity duration-300 outline-none drop-shadow-xl"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 md:gap-6 mt-4 relative z-10">
        {data.map((item: any) => (
          <div
            key={item.name}
            className="flex items-center gap-2 md:gap-2.5 bg-black/20 px-2.5 py-1.5 md:px-3 md:py-2 rounded-xl border border-white/5"
          >
            <div
              className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full shadow-sm"
              style={{
                backgroundColor: item.color,
                boxShadow: `0 0 8px ${item.color}60`,
              }}
            />
            <div className="flex flex-col">
              <span className="text-[9px] md:text-[10px] text-zinc-400 font-bold uppercase tracking-wider leading-none mb-1">
                {item.name}
              </span>
              <span className="text-white font-mono text-xs md:text-sm font-bold leading-none">
                {item.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
