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
  const parts = name.split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const formatFileName = (name: string) => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
};

const DriverAvatar = ({ name }: { name: string }) => {
  const [hasError, setHasError] = useState(false);
  const imageUrl = `/f1/drivers/${formatFileName(name)}.png`;

  if (hasError) {
    return (
      <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner backdrop-blur-md">
        <span className="text-xs font-black text-zinc-500 tracking-tighter">
          {getInitials(name)}
        </span>
      </div>
    );
  }

  return (
    <div className="w-10 h-10 rounded-xl border border-white/10 overflow-hidden shrink-0 bg-black/40 shadow-lg group-hover:border-yellow-500/20 transition-all duration-300">
      <img
        src={imageUrl}
        alt={name}
        onError={() => setHasError(true)}
        className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500"
      />
    </div>
  );
};

export function F1ChampionshipBattle() {
  const { data: standings = [], isLoading } = useQuery<F1DriverStanding[]>({
    queryKey: ["f1-driver-standings"],
    queryFn: f1Api.getStandings,
    staleTime: 1000 * 60 * 15,
  });

  if (isLoading) {
    return (
      <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-yellow-500/50" />
      </div>
    );
  }

  const p1 = standings[0];
  const p2 = standings[1];

  if (!p1 || !p2) return null;

  const gap = p1.points - p2.points;

  return (
    <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-yellow-500/50 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col h-full group hover:-translate-y-1 transition-transform duration-300">
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-yellow-500/5 blur-[80px] rounded-full pointer-events-none group-hover:opacity-100 opacity-50 transition-opacity" />
      
      <div className="flex items-center gap-2 mb-6 relative z-10">
        <Trophy className="text-yellow-500 w-5 h-5" />
        <h2 className="text-lg font-bold text-white tracking-tight">Duelo pelo Título</h2>
      </div>

      <div className="flex-grow flex flex-col justify-between relative z-10 gap-4">
        {/* P1 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DriverAvatar name={p1.driverName} />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-yellow-500 uppercase tracking-[0.2em] mb-0.5">Líder</span>
              <span className="text-lg font-black text-white leading-tight">{p1.driverName.split(' ').pop()}</span>
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">{p1.constructorName}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-2xl font-mono font-black text-white">{p1.points}</span>
            <span className="text-[8px] text-zinc-500 font-bold uppercase block">pontos</span>
          </div>
        </div>

        {/* Gap divider */}
        <div className="relative flex items-center justify-center py-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-dashed border-white/10"></div>
          </div>
          <div className="relative bg-[#121214] px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5 shadow-xl">
            <TrendingUp size={12} className="text-red-500" />
            <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">GAP: {gap} pts</span>
          </div>
        </div>

        {/* P2 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DriverAvatar name={p2.driverName} />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-0.5">P2</span>
              <span className="text-lg font-black text-zinc-300 leading-tight">{p2.driverName.split(' ').pop()}</span>
              <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider">{p2.constructorName}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-2xl font-mono font-black text-zinc-400">{p2.points}</span>
            <span className="text-[8px] text-zinc-600 font-bold uppercase block">pontos</span>
          </div>
        </div>
      </div>
    </div>
  );
}
