"use client";

import { useQuery } from "@tanstack/react-query";
import { f1Api } from "@/lib/api";

interface F1Session {
  id: string;
  name: string;
  date: string;
  status: string;
}

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

function isWithinNextFourHours(dateIso: string): boolean {
  const target = new Date(dateIso).getTime();
  if (Number.isNaN(target)) return false;
  const diff = target - Date.now();
  return diff > 0 && diff <= FOUR_HOURS_MS;
}

/**
 * Faz polling do clima da pista a cada 60s **apenas** quando há sessão ao vivo
 * ou sessão começando nas próximas 4h. Fora disso, busca uma vez e fica parado
 * — o dado do último GP não muda quando não há corrida acontecendo.
 */
export function useF1Weather() {
  const { data: sessions = [] } = useQuery<F1Session[]>({
    queryKey: ["f1-next-sessions"],
    queryFn: f1Api.getNextSessions,
    refetchInterval: 1000 * 60 * 5,
    staleTime: 1000 * 60 * 2,
  });

  const hasLiveOrImminent = sessions.some(
    (s) => s.status === "ao vivo" || isWithinNextFourHours(s.date)
  );

  return useQuery({
    queryKey: ["f1-weather-latest"],
    queryFn: f1Api.getLiveWeather,
    refetchInterval: hasLiveOrImminent ? 60_000 : false,
    staleTime: hasLiveOrImminent ? 30_000 : 1000 * 60 * 10,
  });
}
