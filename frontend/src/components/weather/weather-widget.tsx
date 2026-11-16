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

interface WeatherItem {
  name?: string;
  weather?: Array<{
    main?: string;
    description?: string;
  }>;
  main?: {
    temp?: number;
    humidity?: number;
  };
  wind?: {
    speed?: number;
  };
}

function getWeatherMeta(condition?: string) {
  switch (condition) {
    case "Thunderstorm":
      return { Icon: CloudLightning, iconColor: "text-indigo-400" };
    case "Rain":
    case "Drizzle":
      return { Icon: CloudRain, iconColor: "text-sky-400" };
    case "Clouds":
      return { Icon: Cloud, iconColor: "text-zinc-400" };
    default:
      return { Icon: Sun, iconColor: "text-amber-400" };
  }
}

export function WeatherWidget() {
  const { data: weatherList = [], isLoading } = useQuery<WeatherItem[]>({
    queryKey: ["current-weather"],
    queryFn: async () => {
      const res = await gamingApi.getRoutineWeather();
      return Array.isArray(res) ? res : [];
    },
    refetchInterval: 1000 * 60 * 15,
  });

  if (isLoading) {
    return (
      <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-4 sm:p-5 min-h-[116px] flex items-center justify-center w-full">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!weatherList || weatherList.length === 0) return null;

  return (
    <div
      className={`grid gap-3 w-full ${
        weatherList.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
      }`}
    >
      {weatherList.map((weather, index) => {
        const primaryCondition = weather?.weather?.[0];
        const { Icon: WeatherIcon, iconColor } = getWeatherMeta(
          primaryCondition?.main,
        );
        const cityName = weather?.name?.trim() || "Local";
        const description = primaryCondition?.description?.trim() || "—";
        const temp =
          typeof weather?.main?.temp === "number"
            ? `${Math.round(weather.main.temp)}°`
            : "--°";
        const humidity =
          typeof weather?.main?.humidity === "number"
            ? `${weather.main.humidity}%`
            : "--";
        const windSpeed =
          typeof weather?.wind?.speed === "number"
            ? `${weather.wind.speed} m/s`
            : "--";

        return (
          <div
            key={`${cityName}-${index}`}
            className="bg-[#111113] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-4 sm:p-5 transition-colors flex flex-col justify-between gap-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <MapPin className={`w-3.5 h-3.5 shrink-0 ${iconColor}`} />
                <h2 className="text-xs sm:text-sm font-semibold text-zinc-100 tracking-tight truncate">
                  {cityName}
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-zinc-400 uppercase tracking-wider bg-white/[0.04] px-2 py-0.5 rounded-lg border border-white/[0.06] shrink-0">
                <WeatherIcon className={`w-3 h-3 ${iconColor}`} />
                {description}
              </span>
            </div>

            <div className="flex items-end justify-between gap-3">
              <span className="text-3xl font-bold text-white tracking-tight tabular-nums leading-none">
                {temp}
              </span>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 bg-white/[0.03] px-2.5 py-1 rounded-lg border border-white/[0.06] tabular-nums">
                  <Droplets className="w-3 h-3 text-sky-400/80" />
                  <span>{humidity}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 bg-white/[0.03] px-2.5 py-1 rounded-lg border border-white/[0.06] tabular-nums">
                  <Wind className="w-3 h-3 text-zinc-400" />
                  <span>{windSpeed}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
