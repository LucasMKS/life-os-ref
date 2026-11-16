"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy, TrendingUp, Loader2 } from "lucide-react";
import { f1Api } from "@/lib/api";

interface F1DriverStanding {
  id: string;
  position: number;
  driverName: string;
  constructorName: string;
  points: number;
}

const getInitials = (name: string) => {
  const safe = (name || "").trim();
  if (!safe) return "F1";
  const parts = safe.split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return safe.substring(0, 2).toUpperCase();
};

const formatFileName = (name: string) => {
  return (name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
};

const DriverAvatar = ({ name }: { name: string }) => {
  const [hasError, setHasError] = useState(false);
  const imageUrl = `/f1/drivers/${formatFileName(name)}.png`;

  if (hasError || !name) {
    return (
      <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center overflow-hidden shrink-0">
        <span className="text-xs font-bold text-zinc-400 tracking-tight">
          {getInitials(name)}
        </span>
      </div>
    );
  }

  return (
    <div className="w-10 h-10 rounded-xl border border-white/[0.08] overflow-hidden shrink-0 bg-white/[0.03]">
      <img
        src={imageUrl}
        alt={name}
        loading="lazy"
        decoding="async"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover object-top"
      />
    </div>
  );
};

export function F1ChampionshipBattle() {
  const { data: standings = [], isLoading } = useQuery<F1DriverStanding[]>({
    queryKey: ["f1-driver-standings"],
    queryFn: async () => {
      const data = await f1Api.getStandings();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 1000 * 60 * 15,
  });

  if (isLoading) {
    return (
      <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5 h-full flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
      </div>
    );
  }

  const p1 = standings[0];
  const p2 = standings[1];

  if (!p1 || !p2) return null;

  const p1Points = typeof p1.points === "number" ? p1.points : 0;
  const p2Points = typeof p2.points === "number" ? p2.points : 0;
  const gap = Math.max(0, p1Points - p2Points);

  const p1LastName = (p1.driverName || "P1").trim().split(/\s+/).pop() || "P1";
  const p2LastName = (p2.driverName || "P2").trim().split(/\s+/).pop() || "P2";

  return (
    <section className="bg-[#111113] border border-white/[0.06] border-t-2 border-t-red-500/70 hover:border-white/[0.12] hover:border-t-red-500/80 transition-colors rounded-2xl p-5 flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 pb-3.5 mb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-red-400" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
            Duelo pelo Título
          </h2>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/25 text-[10px] font-semibold text-red-300 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          F1
        </span>
      </div>

      <div className="flex-grow flex flex-col justify-between gap-4">
        {/* P1 */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <DriverAvatar name={p1.driverName} />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wider mb-0.5">
                Líder · P1
              </span>
              <span className="text-base font-bold text-white leading-tight truncate">
                {p1LastName}
              </span>
              <span className="text-[11px] text-zinc-500 font-medium truncate">
                {p1.constructorName || "-"}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-2xl font-mono font-bold text-white tabular-nums">
              {p1Points}
            </span>
            <span className="text-[10px] text-zinc-500 font-medium uppercase block">
              pts
            </span>
          </div>
        </div>

        {/* Gap divider */}
        <div className="relative flex items-center justify-center py-0.5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/[0.06]" />
          </div>
          <div className="relative bg-[#111113] px-3 py-1 rounded-full border border-white/[0.08] flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3 text-red-400" />
            <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider tabular-nums">
              Gap: {gap} pts
            </span>
          </div>
        </div>

        {/* P2 */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <DriverAvatar name={p2.driverName} />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-0.5">
                Desafiante · P2
              </span>
              <span className="text-base font-bold text-zinc-200 leading-tight truncate">
                {p2LastName}
              </span>
              <span className="text-[11px] text-zinc-500 font-medium truncate">
                {p2.constructorName || "-"}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-2xl font-mono font-bold text-zinc-300 tabular-nums">
              {p2Points}
            </span>
            <span className="text-[10px] text-zinc-500 font-medium uppercase block">
              pts
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
