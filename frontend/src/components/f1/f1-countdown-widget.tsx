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
  const [timeLeft, setTimeLeft] = useState<{
    d: number;
    h: number;
    m: number;
    s: number;
  } | null>(null);

  const { data: sessions = [], isLoading } = useQuery<F1Session[]>({
    queryKey: ["f1-next-sessions"],
    queryFn: async () => {
      const data = await f1Api.getNextSessions();
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 1000 * 60 * 5,
    staleTime: 1000 * 60 * 2,
  });

  const { data: weather } = useF1Weather();

  const nextSession = sessions[0];

  useEffect(() => {
    if (!nextSession?.date) {
      setTimeLeft(null);
      return;
    }

    const target = new Date(nextSession.date).getTime();
    if (Number.isNaN(target)) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft(null);
        return false;
      }

      setTimeLeft({
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((diff % (1000 * 60)) / 1000),
      });
      return true;
    };

    if (!updateTimer()) return;

    const timer = setInterval(() => {
      if (!updateTimer()) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [nextSession?.date]);

  if (isLoading) {
    return (
      <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5 h-full flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!nextSession) return null;

  const normalizedStatus = (nextSession.status || "").toLowerCase();
  const isLive = normalizedStatus === "ao vivo" || normalizedStatus === "live";

  return (
    <section className="bg-[#111113] border border-white/[0.06] border-t-2 border-t-red-500/70 hover:border-white/[0.12] hover:border-t-red-500/80 transition-colors rounded-2xl p-5 flex flex-col h-full">
      <div className="flex items-start justify-between gap-3 pb-3.5 mb-4 border-b border-white/[0.06]">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Timer className="w-4 h-4 text-red-400 shrink-0" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
              Próxima Sessão
            </h2>
          </div>
          <p className="text-xs font-medium text-zinc-500 truncate">
            {nextSession.meetingName || "Fórmula 1"}
          </p>
        </div>

        {isLive && (
          <div className="inline-flex items-center gap-1.5 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-red-400">
              Live
            </span>
          </div>
        )}
      </div>

      <div className="flex-grow flex flex-col justify-center">
        <h3 className="text-xl font-bold text-white mb-4 tracking-tight leading-snug">
          {nextSession.name || "Sessão F1"}
        </h3>

        {isLive ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 text-center">
            <p className="text-red-400 font-semibold text-xs uppercase tracking-wider">
              Sessão em Andamento
            </p>
            <p className="text-zinc-400 text-xs mt-1">
              Acompanhe os detalhes na aba F1
            </p>
          </div>
        ) : timeLeft ? (
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Dias", val: timeLeft.d },
              { label: "Hrs", val: timeLeft.h },
              { label: "Min", val: timeLeft.m },
              { label: "Seg", val: timeLeft.s },
            ].map((unit) => (
              <div
                key={unit.label}
                className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-2 flex flex-col items-center"
              >
                <span className="text-lg sm:text-xl font-mono font-bold text-white tabular-nums">
                  {unit.val.toString().padStart(2, "0")}
                </span>
                <span className="text-[10px] font-medium uppercase text-zinc-500">
                  {unit.label}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-zinc-500 font-mono text-xs">Calculando...</div>
        )}
      </div>

      <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-xs font-medium text-zinc-300 tabular-nums">
              {weather?.trackTemperature != null
                ? `${weather.trackTemperature}°`
                : "--"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <CloudRain
              className={`w-3.5 h-3.5 ${
                (weather?.rainfall ?? 0) > 0 ? "text-sky-400" : "text-zinc-500"
              }`}
            />
            <span className="text-xs font-medium text-zinc-300">
              {(weather?.rainfall ?? 0) > 0 ? "Chuva" : "Seco"}
            </span>
          </div>
        </div>
        <Flag className="w-3.5 h-3.5 text-red-500/70" />
      </div>
    </section>
  );
}
