"use client";

import { Calendar, Compass, Edit3, Trash2, ArrowLeft, Loader2 } from "lucide-react";
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

function parseSafeDate(dateStr?: string | null): Date | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const clean = dateStr.split("T")[0];
  const d = new Date(`${clean}T00:00:00`);
  return isNaN(d.getTime()) ? null : d;
}

function formatDateBR(dateStr?: string | null): string {
  if (!dateStr) return "--/--/----";
  const clean = dateStr.split("T")[0];
  const parts = clean.split("-");
  if (parts.length !== 3) return clean;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

export function TripHeader({
  trip,
  weather,
  loadingWeather,
  onBack,
  onEdit,
  onDelete,
}: TripHeaderProps) {
  const start = parseSafeDate(trip.startDate);
  const end = parseSafeDate(trip.endDate);
  const totalDays =
    start && end
      ? Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      : 1;

  const getStatus = () => {
    if (!start || !end) {
      return {
        label: "Datas pendentes",
        color: "text-zinc-400 bg-white/[0.05] border-white/[0.08]",
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (today < start) {
      const diffTime = Math.abs(start.getTime() - today.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
        label: `Faltam ${diffDays} ${diffDays === 1 ? "dia" : "dias"}`,
        color: "text-sky-300 bg-sky-500/10 border-sky-500/20",
      };
    } else if (today > end) {
      return {
        label: "Viagem Realizada",
        color: "text-zinc-500 bg-white/[0.03] border-white/[0.06]",
      };
    } else {
      const diffTime = Math.abs(today.getTime() - start.getTime());
      const currentDay = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return {
        label: `Em andamento · Dia ${currentDay} de ${totalDays}`,
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      };
    }
  };

  const status = getStatus();

  return (
    <section className="rounded-2xl border border-white/[0.06] border-t-sky-500/40 bg-[#111113] p-5 sm:p-6 mb-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-zinc-300 hover:text-white font-medium text-xs transition-colors bg-white/[0.05] hover:bg-white/[0.1] px-3 py-2 rounded-xl border border-white/[0.08] cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Voltar para Viagens</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 hover:text-white text-xs font-medium border border-white/[0.08] transition-colors cursor-pointer"
            title="Editar informações da viagem"
          >
            <Edit3 size={13} />
            <span className="hidden sm:inline">Editar</span>
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/15 text-red-400 text-xs font-medium border border-red-500/20 transition-colors cursor-pointer"
            title="Excluir viagem"
          >
            <Trash2 size={13} />
            <span className="hidden sm:inline">Excluir</span>
          </button>
        </div>
      </div>

      {/* Main destination & weather */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-2.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border ${status.color}`}>
              {status.label}
            </span>
            <span className="text-[11px] font-medium text-zinc-400 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.06] flex items-center gap-1.5">
              <Calendar size={12} className="text-zinc-500" />
              {formatDateBR(trip.startDate)} – {formatDateBR(trip.endDate)} · {totalDays}{" "}
              {totalDays === 1 ? "dia" : "dias"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Compass className="text-sky-400 w-6 h-6 sm:w-7 sm:h-7 shrink-0" />
            <span className="truncate">{trip.destination || "Viagem"}</span>
          </h1>

          {trip.notes && (
            <p className="text-zinc-400 text-xs sm:text-sm max-w-2xl leading-relaxed line-clamp-2">
              {trip.notes}
            </p>
          )}
        </div>

        {/* Compact weather box */}
        <div className="bg-[#09090b] border border-white/[0.06] rounded-xl p-3.5 min-w-[230px] flex items-center justify-between gap-4 self-start lg:self-center">
          {loadingWeather ? (
            <div className="flex items-center gap-2 text-zinc-500 text-xs py-1.5 w-full justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
              <span>Verificando clima...</span>
            </div>
          ) : weather ? (
            <>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{weather.icon}</span>
                <div>
                  <div className="text-base font-bold text-white font-mono tabular-nums">
                    {weather.temp}°C
                  </div>
                  <div className="text-zinc-400 text-[11px] leading-tight">
                    {weather.condition}
                  </div>
                </div>
              </div>
              <div className="text-right text-[11px] text-zinc-500 space-y-0.5 border-l border-white/[0.06] pl-3">
                <div>
                  Vento: <span className="text-zinc-200 font-mono">{weather.windSpeed} km/h</span>
                </div>
                <div>
                  Umidade: <span className="text-zinc-200 font-mono">{weather.humidity}%</span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-zinc-500 text-xs py-1 text-center w-full">
              Clima indisponível
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
