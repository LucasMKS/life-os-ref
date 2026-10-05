"use client";

import { Calendar, Compass, Edit3, Trash2, ArrowLeft, Loader2, Clock } from "lucide-react";
import { Trip } from "@/lib/types";

interface TripHeaderProps {
  trip: Trip;
  weather: {
    temp: number;
    windSpeed: number;
    humidity: number;
    condition: string;
    icon: string;
  } | null;
  loadingWeather: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function TripHeader({
  trip,
  weather,
  loadingWeather,
  onBack,
  onEdit,
  onDelete,
}: TripHeaderProps) {
  const formatDateBR = (dateStr: string) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  const start = new Date(trip.startDate + "T00:00:00");
  const end = new Date(trip.endDate + "T00:00:00");
  const totalDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const getStatus = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (today < start) {
      const diffTime = Math.abs(start.getTime() - today.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
        label: `Faltam ${diffDays} ${diffDays === 1 ? "dia" : "dias"} ✈️`,
        color: "text-sky-400 bg-sky-500/10 border-sky-500/20",
      };
    } else if (today > end) {
      return {
        label: "Viagem Realizada 🌍",
        color: "text-zinc-400 bg-zinc-900/40 border-zinc-800",
      };
    } else {
      const diffTime = Math.abs(today.getTime() - start.getTime());
      const currentDay = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return {
        label: `Viagem Ativa! 🌴 (Dia ${currentDay} de ${totalDays})`,
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 animate-pulse",
      };
    }
  };

  const status = getStatus();

  return (
    <div className="relative overflow-hidden rounded-3xl border border-sky-500/20 bg-gradient-to-br from-sky-950/30 via-zinc-900/60 to-zinc-950 p-6 md:p-8 mb-6 shadow-xl">
      {/* Decorative Glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top action bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white font-semibold text-xs transition-colors bg-white/5 hover:bg-white/10 px-3.5 py-2 rounded-xl border border-white/5 cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Voltar para Viagens</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-semibold border border-white/5 transition-colors cursor-pointer"
            title="Editar informações da viagem"
          >
            <Edit3 size={13} />
            <span className="hidden sm:inline">Editar</span>
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20 transition-colors cursor-pointer"
            title="Excluir viagem"
          >
            <Trash2 size={13} />
            <span className="hidden sm:inline">Excluir</span>
          </button>
        </div>
      </div>

      {/* Main destination & info */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${status.color}`}>
              {status.label}
            </span>
            <span className="text-xs font-semibold text-zinc-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/5 flex items-center gap-1">
              <Calendar size={12} className="text-sky-400" />
              {formatDateBR(trip.startDate)} - {formatDateBR(trip.endDate)} • {totalDays} {totalDays === 1 ? "dia" : "dias"}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <Compass className="text-sky-400 w-8 h-8 md:w-9 md:h-9 shrink-0" />
            <span>{trip.destination}</span>
          </h1>

          {trip.notes && (
            <p className="text-zinc-400 text-xs sm:text-sm max-w-2xl leading-relaxed line-clamp-2">
              {trip.notes}
            </p>
          )}
        </div>

        {/* Compact weather box */}
        <div className="bg-black/30 border border-white/5 rounded-2xl p-4 min-w-[240px] flex items-center justify-between gap-4 self-start lg:self-center">
          {loadingWeather ? (
            <div className="flex items-center gap-2 text-zinc-500 text-xs py-2 w-full justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
              <span>Verificando clima...</span>
            </div>
          ) : weather ? (
            <>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{weather.icon}</span>
                <div>
                  <div className="text-lg font-bold text-white font-mono">{weather.temp}°C</div>
                  <div className="text-zinc-400 text-[11px] leading-tight">{weather.condition}</div>
                </div>
              </div>
              <div className="text-right text-[10px] text-zinc-400 font-medium space-y-0.5 border-l border-white/5 pl-3">
                <div>Vento: <span className="text-white font-mono">{weather.windSpeed} km/h</span></div>
                <div>Umidade: <span className="text-white font-mono">{weather.humidity}%</span></div>
              </div>
            </>
          ) : (
            <div className="text-zinc-500 text-xs italic py-1 text-center w-full">
              Clima não disponível
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
