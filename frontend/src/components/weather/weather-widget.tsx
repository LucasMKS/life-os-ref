"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Droplets,
  Loader2,
  MapPin,
  CloudLightning,
} from "lucide-react";
import { gamingApi } from "@/lib/api";

export function WeatherWidget() {
  const { data: weatherList = [], isLoading } = useQuery({
    queryKey: ["current-weather"],
    queryFn: async () => {
      const res = await gamingApi.getRoutineWeather();
      return Array.isArray(res) ? res : [];
    },
    refetchInterval: 1000 * 60 * 15,
  });

  if (isLoading) {
    return (
      <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-5 md:p-6 h-full min-h-[140px] md:min-h-[160px] flex items-center justify-center shadow-lg w-full">
        <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin text-sky-500/50" />
      </div>
    );
  }

  if (!weatherList || weatherList.length === 0) return null;

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full h-full">
      {weatherList.map((weather: any, index: number) => {
        const condition = weather.weather[0].main;
        const isRaining = condition === "Rain" || condition === "Drizzle";
        const isStorm = condition === "Thunderstorm";
        const isCloudy = condition === "Clouds";

        const WeatherIcon = isStorm
          ? CloudLightning
          : isRaining
            ? CloudRain
            : isCloudy
              ? Cloud
              : Sun;
        const iconColor = isStorm
          ? "text-indigo-400"
          : isRaining
            ? "text-blue-400"
            : isCloudy
              ? "text-zinc-400"
              : "text-amber-400";
        const glowColor = isStorm
          ? "bg-indigo-500/10"
          : isRaining
            ? "bg-blue-500/10"
            : isCloudy
              ? "bg-zinc-500/10"
              : "bg-amber-500/10";
        const borderColor = isStorm
          ? "border-t-indigo-500/30"
          : isRaining
            ? "border-t-sky-500/30"
            : isCloudy
              ? "border-t-zinc-500/30"
              : "border-t-amber-500/30";

        return (
          <div
            key={index}
            className={`flex-1 bg-[#121214]/80 backdrop-blur-xl border border-white/5 ${borderColor} rounded-3xl p-5 md:p-6 shadow-2xl relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 flex flex-col justify-between`}
          >
            <div
              className={`absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 ${glowColor} rounded-full blur-[40px] md:blur-[60px] pointer-events-none transition-opacity group-hover:opacity-100 opacity-50`}
            />

            <WeatherIcon
              className={`absolute -bottom-4 -right-4 md:-bottom-6 md:-right-6 w-24 h-24 md:w-32 md:h-32 ${iconColor} opacity-[0.03] pointer-events-none -rotate-12`}
              strokeWidth={1}
            />

            <div className="flex items-center justify-between mb-4 md:mb-4 relative z-10">
              <div className="flex items-center gap-1.5 md:gap-2">
                <MapPin className={`${iconColor} w-3.5 h-3.5 md:w-4 md:h-4`} />
                <h2 className="text-xs md:text-sm font-bold text-white tracking-tight">
                  {weather.name}
                </h2>
              </div>
              <span className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-black/40 px-2 py-0.5 md:py-1 rounded-md border border-white/5">
                {weather.weather[0].description}
              </span>
            </div>

            <div className="flex items-end justify-between relative z-10 mt-auto">
              <div className="flex items-baseline gap-1 font-mono">
                <span className="text-3xl md:text-4xl text-white font-black drop-shadow-md leading-none">
                  {Math.round(weather.main.temp)}°
                </span>
              </div>

              <div className="flex flex-col gap-1.5 md:gap-2">
                <div className="flex items-center justify-between gap-2 text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-wider bg-black/20 px-2 md:px-2.5 py-1 rounded-lg border border-white/5 shadow-inner w-full md:w-auto">
                  <span className="flex items-center gap-1.5">
                    <Droplets className="w-2.5 h-2.5 md:w-3 md:h-3 text-sky-400 drop-shadow-sm" />{" "}
                    UR
                  </span>
                  <span>{weather.main.humidity}%</span>
                </div>
                <div className="flex items-center justify-between gap-2 text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-wider bg-black/20 px-2 md:px-2.5 py-1 rounded-lg border border-white/5 shadow-inner w-full md:w-auto">
                  <span className="flex items-center gap-1.5">
                    <Wind className="w-2.5 h-2.5 md:w-3 md:h-3 text-zinc-400 drop-shadow-sm" />{" "}
                    Vento
                  </span>
                  <span>{weather.wind.speed}m/s</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
