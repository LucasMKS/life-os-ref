"use client";

import { useMemo } from "react";
import {
  Clock,
  Plus,
  MapPin,
  ExternalLink,
  Edit3,
  Trash2,
  CheckCircle2,
  FileText,
  Utensils,
  Camera,
  Car,
  Hotel,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { ItineraryItem, Trip } from "@/lib/types";
import { EmptyState } from "@/components/ui/page-shell";
import { sanitizeUrl } from "@/lib/security";

interface TripItineraryTabProps {
  trip: Trip;
  selectedDayStr: string | null;
  onSelectDay: (dayStr: string) => void;
  onOpenActivityModal: (activity?: ItineraryItem | null) => void;
  onToggleActivity: (activityId: number) => void;
  onDeleteActivity: (activityId: number) => void;
}

export function TripItineraryTab({
  trip,
  selectedDayStr,
  onSelectDay,
  onOpenActivityModal,
  onToggleActivity,
  onDeleteActivity,
}: TripItineraryTabProps) {
  // Generate all days in date range safely
  const tripDays = useMemo(() => {
    if (!trip.startDate || !trip.endDate) return [];
    const startClean = trip.startDate.split("T")[0];
    const endClean = trip.endDate.split("T")[0];
    const start = new Date(`${startClean}T00:00:00`);
    const end = new Date(`${endClean}T00:00:00`);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return [];

    const days: string[] = [];
    const current = new Date(start);
    let safety = 0;
    while (current <= end && safety < 180) {
      days.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
      safety += 1;
    }
    return days;
  }, [trip.startDate, trip.endDate]);

  // Filter and sort activities chronologically for the selected day
  const filteredActivities = useMemo(() => {
    if (!Array.isArray(trip.itinerary) || !selectedDayStr) return [];
    return trip.itinerary
      .filter((item) => {
        if (!item?.dateTime) return false;
        const itemDate = item.dateTime.split("T")[0];
        return itemDate === selectedDayStr;
      })
      .sort((a, b) => (a.dateTime || "").localeCompare(b.dateTime || ""));
  }, [trip.itinerary, selectedDayStr]);

  const formatTabDate = (dateStr: string, index: number) => {
    const d = new Date(`${dateStr}T00:00:00`);
    if (isNaN(d.getTime())) {
      return { label: dateStr, weekday: "", dayNum: index + 1 };
    }
    const label = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const weekday = d
      .toLocaleDateString("pt-BR", { weekday: "short" })
      .toUpperCase()
      .replace(".", "");
    return { label, weekday, dayNum: index + 1 };
  };

  const formatActivityTime = (dateTime?: string) => {
    if (!dateTime) return "--:--";
    const d = new Date(dateTime);
    if (isNaN(d.getTime())) return "--:--";
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const getCategoryConfig = (cat?: string) => {
    switch (cat) {
      case "FOOD":
        return {
          label: "Gastronomia",
          icon: Utensils,
          color: "text-amber-300 bg-amber-500/10 border-amber-500/20",
        };
      case "TRANSPORT":
        return {
          label: "Transporte",
          icon: Car,
          color: "text-zinc-200 bg-white/[0.06] border-white/[0.1]",
        };
      case "LODGING":
        return {
          label: "Hospedagem",
          icon: Hotel,
          color: "text-indigo-300 bg-indigo-500/10 border-indigo-500/20",
        };
      case "SHOPPING":
        return {
          label: "Compras",
          icon: ShoppingBag,
          color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        };
      case "LEISURE":
        return {
          label: "Lazer",
          icon: Sparkles,
          color: "text-purple-300 bg-purple-500/10 border-purple-500/20",
        };
      default:
        return {
          label: "Passeio",
          icon: Camera,
          color: "text-zinc-300 bg-white/[0.05] border-white/[0.08]",
        };
    }
  };

  return (
    <div className="space-y-5">
      {/* Header with Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="text-zinc-400" size={18} />
            Cronograma do Roteiro
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Organize os horários e atrações para cada dia da viagem.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenActivityModal(null)}
          className="inline-flex items-center justify-center gap-1.5 bg-zinc-100 text-zinc-950 hover:bg-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus size={15} strokeWidth={2.2} />
          <span>Nova Atividade no Dia</span>
        </button>
      </div>

      {/* Days carousel tabs */}
      {tripDays.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tripDays.map((dayStr, idx) => {
            const active = selectedDayStr === dayStr;
            const { label, weekday, dayNum } = formatTabDate(dayStr, idx);
            const countForDay =
              trip.itinerary?.filter((i) => i.dateTime?.startsWith(dayStr)).length || 0;

            return (
              <button
                key={dayStr}
                type="button"
                onClick={() => onSelectDay(dayStr)}
                className={`flex flex-col items-center min-w-[78px] py-2.5 px-3 rounded-xl border transition-colors cursor-pointer shrink-0 ${
                  active
                    ? "bg-sky-500/15 text-sky-300 border-sky-500/30"
                    : "bg-[#09090b] border-white/[0.06] text-zinc-400 hover:text-zinc-100 hover:border-white/[0.14]"
                }`}
              >
                <span className="text-[10px] tracking-wider font-bold uppercase opacity-80">
                  Dia {dayNum}
                </span>
                <span className="text-xs font-mono font-bold mt-0.5">{label}</span>
                <span className="text-[10px] opacity-75 mt-0.5">
                  {weekday} · {countForDay}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Timeline of activities */}
      <div>
        {filteredActivities.length === 0 ? (
          <EmptyState
            icon={<Clock size={24} />}
            title="Nenhuma atividade neste dia"
            description="Adicione os passeios, restaurantes ou eventos que pretende fazer nesta data."
            action={
              <button
                type="button"
                onClick={() => onOpenActivityModal(null)}
                className="inline-flex items-center gap-1.5 bg-white/[0.05] text-zinc-200 border border-white/[0.08] hover:bg-white/[0.1] font-medium text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <Plus size={13} />
                <span>Criar primeira atividade</span>
              </button>
            }
          />
        ) : (
          <div className="relative pl-6 sm:pl-8 border-l border-white/[0.1] ml-2.5 sm:ml-3.5 space-y-3.5 py-1">
            {filteredActivities.map((item) => {
              const timeStr = formatActivityTime(item.dateTime);
              const isCompleted = !!item.completed;
              const catConfig = getCategoryConfig(item.category);
              const CatIcon = catConfig.icon;

              const rawMapUrl =
                typeof item.latitude === "number" &&
                typeof item.longitude === "number" &&
                !isNaN(item.latitude) &&
                !isNaN(item.longitude)
                  ? `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`
                  : item.address || item.locationName
                  ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${item.locationName || ""} ${item.address || ""}`.trim()
                    )}`
                  : null;
              const safeMapUrl = sanitizeUrl(rawMapUrl);

              return (
                <div
                  key={item.id}
                  className={`group relative rounded-2xl border p-4 sm:p-5 transition-colors ${
                    isCompleted
                      ? "bg-[#09090b] border-white/[0.04] opacity-65"
                      : "bg-[#09090b] border-white/[0.06] hover:border-white/[0.14]"
                  }`}
                >
                  {/* Timeline Bullet */}
                  <button
                    type="button"
                    onClick={() => onToggleActivity(item.id)}
                    title={isCompleted ? "Marcar como pendente" : "Marcar como concluído"}
                    className={`absolute -left-[31px] sm:-left-[39px] top-5 w-4 h-4 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                      isCompleted
                        ? "bg-emerald-500 border-emerald-400 text-zinc-950"
                        : "bg-[#111113] border-white/30 hover:border-white"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={11} strokeWidth={3} />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                    )}
                  </button>

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3.5">
                    <div className="flex-1 min-w-0">
                      {/* Meta badges */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-mono font-semibold text-zinc-100 bg-white/[0.06] border border-white/[0.08] py-0.5 px-2 rounded-lg flex items-center gap-1">
                          <Clock size={11} className="text-zinc-400" />
                          {timeStr}
                        </span>

                        <span
                          className={`text-[11px] font-medium py-0.5 px-2 rounded-lg border flex items-center gap-1 ${catConfig.color}`}
                        >
                          <CatIcon size={11} />
                          {catConfig.label}
                        </span>

                        {item.locationName && (
                          <span className="text-[11px] text-zinc-400 bg-white/[0.03] border border-white/[0.06] py-0.5 px-2 rounded-lg truncate max-w-[220px]">
                            {item.locationName}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4
                        className={`text-sm sm:text-base font-semibold mt-2 leading-snug ${
                          isCompleted ? "line-through text-zinc-500" : "text-white"
                        }`}
                      >
                        {item.title}
                      </h4>

                      {/* Address */}
                      {item.address && (
                        <p className="text-zinc-400 text-xs mt-1.5 flex items-center gap-1.5">
                          <MapPin size={12} className="text-zinc-500 shrink-0" />
                          <span className="truncate">{item.address}</span>
                        </p>
                      )}

                      {/* Notes */}
                      {item.notes && (
                        <div className="mt-3 bg-[#111113] border border-white/[0.05] p-3 rounded-xl text-xs text-zinc-300 flex items-start gap-2">
                          <FileText size={13} className="text-zinc-500 mt-0.5 shrink-0" />
                          <p className="whitespace-pre-wrap leading-relaxed">{item.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col items-center sm:items-end gap-1.5 shrink-0">
                      {safeMapUrl && (
                        <a
                          href={safeMapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white/[0.06] text-zinc-200 hover:bg-white/[0.12] hover:text-white border border-white/[0.08] py-1.5 px-2.5 rounded-lg transition-colors"
                          title="Abrir no Google Maps"
                        >
                          <span>Maps</span>
                          <ExternalLink size={11} />
                        </a>
                      )}

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onToggleActivity(item.id)}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isCompleted
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                              : "bg-white/[0.04] border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.08]"
                          }`}
                          title={isCompleted ? "Desmarcar" : "Marcar como realizado"}
                        >
                          <CheckCircle2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenActivityModal(item)}
                          className="p-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white rounded-lg transition-colors border border-white/[0.06] cursor-pointer"
                          title="Editar atividade"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteActivity(item.id)}
                          className="p-1.5 bg-white/[0.04] hover:bg-red-500/10 text-zinc-400 hover:text-red-400 rounded-lg transition-colors border border-white/[0.06] cursor-pointer"
                          title="Excluir atividade"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
