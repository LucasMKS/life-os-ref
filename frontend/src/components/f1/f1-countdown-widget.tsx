"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Timer, Flag, CloudRain, Thermometer, Loader2 } from "lucide-react";
import { f1Api } from "@/lib/api";
import { useF1Weather } from "@/lib/hooks/use-f1-weather";

interface F1Session {
  id: string;
  name: string;
  meetingName?: string;
  date: string;
  status: string;
}

export function F1CountdownWidget() {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  const { data: sessions = [], isLoading } = useQuery<F1Session[]>({
    queryKey: ["f1-next-sessions"],
    queryFn: f1Api.getNextSessions,
    refetchInterval: 1000 * 60 * 5,
    staleTime: 1000 * 60 * 2,
  });

  const { data: weather } = useF1Weather();

  const nextSession = sessions[0];

  useEffect(() => {
    if (!nextSession?.date) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(nextSession.date).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft(null);
        clearInterval(timer);
      } else {
        setTimeLeft({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [nextSession]);

  if (isLoading) {
    return (
      <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-red-500/50" />
      </div>
    );
  }

  if (!nextSession) return null;

  const isLive = nextSession.status === "ao vivo";

  return (
    <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-red-500/50 rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden flex flex-col h-full group">
      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-red-500/10 blur-[80px] rounded-full pointer-events-none group-hover:opacity-100 opacity-50 transition-opacity" />
      
      <div className="flex items-start justify-between mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Timer className="text-red-500 w-5 h-5" />
            <h2 className="text-lg font-bold text-white tracking-tight">Próxima Sessão</h2>
          </div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider line-clamp-1">
            {nextSession.meetingName || "Fórmula 1"}
          </p>
        </div>

        {isLive && (
          <div className="flex items-center gap-1.5 bg-red-500/20 px-2.5 py-1 rounded-full border border-red-500/30 animate-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-red-400">LIVE</span>
          </div>
        )}
      </div>

      <div className="flex-grow flex flex-col justify-center relative z-10">
        <h3 className="text-2xl font-black text-white mb-4 tracking-tighter leading-none group-hover:text-red-400 transition-colors">
          {nextSession.name}
        </h3>

        {isLive ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center">
            <p className="text-red-400 font-bold text-sm uppercase tracking-widest">Sessão em Andamento</p>
            <p className="text-zinc-400 text-[10px] mt-1">Acompanhe a telemetria na aba F1</p>
          </div>
        ) : timeLeft ? (
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Dias", val: timeLeft.d },
              { label: "Hrs", val: timeLeft.h },
              { label: "Min", val: timeLeft.m },
              { label: "Seg", val: timeLeft.s },
            ].map((unit) => (
              <div key={unit.label} className="bg-black/40 border border-white/5 rounded-xl p-2 flex flex-col items-center">
                <span className="text-xl font-mono font-black text-white">{unit.val.toString().padStart(2, "0")}</span>
                <span className="text-[8px] font-bold uppercase text-zinc-500 tracking-tighter">{unit.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-zinc-500 font-mono text-sm">Calculando...</div>
        )}
      </div>

      {/* Weather Mini Stats */}
      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-xs font-bold text-zinc-300">{weather?.trackTemperature ? `${weather.trackTemperature}°` : "--"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CloudRain className={`w-3.5 h-3.5 ${weather?.rainfall > 0 ? "text-sky-400" : "text-zinc-500"}`} />
            <span className="text-xs font-bold text-zinc-300">{weather?.rainfall > 0 ? "Chuva" : "Seco"}</span>
          </div>
        </div>
        <Flag className="w-4 h-4 text-zinc-700 opacity-50" />
      </div>
    </div>
  );
}
