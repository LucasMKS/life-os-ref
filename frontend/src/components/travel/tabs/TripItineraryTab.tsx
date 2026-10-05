"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Plus,
  MapPin,
  ExternalLink,
  Edit3,
  Trash2,
  CheckCircle2,
  Circle,
  FileText,
  Utensils,
  Camera,
  Car,
  Hotel,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { ItineraryItem, Trip } from "@/lib/types";

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
  // Generate all days in date range
  const tripDays = useMemo(() => {
    if (!trip.startDate || !trip.endDate) return [];
    const start = new Date(trip.startDate + "T00:00:00");
    const end = new Date(trip.endDate + "T00:00:00");
    const days: string[] = [];

    let current = new Date(start);
    while (current <= end) {
      days.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }
    return days;
  }, [trip.startDate, trip.endDate]);

  // Filter activities for the selected day
  const filteredActivities = useMemo(() => {
    if (!trip.itinerary || !selectedDayStr) return [];
    return trip.itinerary.filter((item) => {
      const itemDate = item.dateTime.split("T")[0];
      return itemDate === selectedDayStr;
    });
  }, [trip.itinerary, selectedDayStr]);

  const formatTabDate = (dateStr: string, index: number) => {
    const d = new Date(dateStr + "T00:00:00");
    const label = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const weekday = d.toLocaleDateString("pt-BR", { weekday: "short" }).toUpperCase().replace(".", "");
    return { label, weekday, dayNum: index + 1 };
  };

  const getCategoryConfig = (cat?: string) => {
    switch (cat) {
      case "FOOD":
        return { label: "Gastronomia", icon: Utensils, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
      case "TRANSPORT":
        return { label: "Transporte", icon: Car, color: "text-sky-400 bg-sky-500/10 border-sky-500/20" };
      case "LODGING":
        return { label: "Hospedagem", icon: Hotel, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" };
      case "SHOPPING":
        return { label: "Compras", icon: ShoppingBag, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
      case "LEISURE":
        return { label: "Lazer", icon: Sparkles, color: "text-pink-400 bg-pink-500/10 border-pink-500/20" };
      default:
        return { label: "Passeio", icon: Camera, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Day Tabs and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="text-sky-400" size={20} />
            Cronograma do Roteiro
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Organize os horários e atrações para cada dia da viagem.
          </p>
        </div>

        <button
          onClick={() => onOpenActivityModal(null)}
          className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-sky-500/20 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={15} strokeWidth={2.5} />
          Nova Atividade no Dia
        </button>
      </div>

      {/* Days carousel tabs */}
      {tripDays.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {tripDays.map((dayStr, idx) => {
            const active = selectedDayStr === dayStr;
            const { label, weekday, dayNum } = formatTabDate(dayStr, idx);
            const countForDay = trip.itinerary?.filter(i => i.dateTime.startsWith(dayStr)).length || 0;

            return (
              <button
                key={dayStr}
                onClick={() => onSelectDay(dayStr)}
                className={`flex flex-col items-center min-w-[76px] py-2.5 px-3 rounded-2xl border transition-all cursor-pointer ${
                  active
                    ? "bg-sky-500 text-black border-sky-400 font-bold scale-[1.02] shadow-[0_4px_16px_rgba(56,189,248,0.25)]"
                    : "bg-zinc-900/60 border-white/5 text-zinc-400 hover:text-white hover:border-white/15"
                }`}
              >
                <span className="text-[10px] tracking-wider font-extrabold uppercase opacity-75">
                  Dia {dayNum}
                </span>
                <span className="text-xs font-mono font-bold mt-0.5">{label}</span>
                <span className="text-[10px] opacity-70 mt-0.5">
                  {weekday} • {countForDay} {countForDay === 1 ? "item" : "itens"}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Timeline of activities */}
      <div>
        {filteredActivities.length === 0 ? (
          <div className="text-center py-16 px-4 bg-zinc-900/20 rounded-3xl border border-dashed border-white/10 max-w-lg mx-auto">
            <Clock className="text-zinc-500 w-10 h-10 mx-auto mb-3 opacity-60" />
            <h4 className="text-sm font-bold text-zinc-300">Nenhuma atividade neste dia</h4>
            <p className="text-zinc-500 text-xs mt-1">
              Adicione os passeios, restaurantes ou eventos que pretende fazer nesta data.
            </p>
            <button
              onClick={() => onOpenActivityModal(null)}
              className="mt-4 inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-sky-400 font-semibold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer border border-sky-500/20"
            >
              <Plus size={13} />
              Criar primeira atividade
            </button>
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 border-l-2 border-sky-500/20 ml-3 sm:ml-4 space-y-4 py-2">
            {filteredActivities.map((item, idx) => {
              const timeStr = new Date(item.dateTime).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              });
              const isCompleted = !!item.completed;
              const catConfig = getCategoryConfig(item.category);
              const CatIcon = catConfig.icon;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className={`group relative rounded-2xl border p-4 sm:p-5 transition-all ${
                    isCompleted
                      ? "bg-zinc-950/40 border-white/5 opacity-60"
                      : "bg-zinc-900/40 border-white/10 hover:border-sky-500/30 hover:bg-zinc-900/60 shadow-md"
                  }`}
                >
                  {/* Timeline Bullet */}
                  <div
                    onClick={() => onToggleActivity(item.id)}
                    title={isCompleted ? "Marcar como pendente" : "Marcar como concluído"}
                    className={`absolute -left-[32px] sm:-left-[41px] top-5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                      isCompleted
                        ? "bg-emerald-500 border-emerald-400 text-black shadow-md shadow-emerald-500/30"
                        : "bg-[#09090b] border-sky-500 hover:scale-110"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={12} strokeWidth={3} />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Meta badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 py-0.5 px-2 rounded-lg flex items-center gap-1">
                          <Clock size={11} />
                          {timeStr}
                        </span>

                        <span className={`text-[11px] font-semibold py-0.5 px-2 rounded-lg border flex items-center gap-1 ${catConfig.color}`}>
                          <CatIcon size={11} />
                          {catConfig.label}
                        </span>

                        {item.locationName && (
                          <span className="text-[11px] text-zinc-400 bg-white/5 border border-white/5 py-0.5 px-2 rounded-lg truncate max-w-[200px]">
                            {item.locationName}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4
                        className={`text-base font-bold mt-2 leading-snug ${
                          isCompleted ? "line-through text-zinc-500" : "text-white"
                        }`}
                      >
                        {item.title}
                      </h4>

                      {/* Address */}
                      {item.address && (
                        <p className="text-zinc-400 text-xs mt-1.5 flex items-center gap-1.5">
                          <MapPin size={12} className="text-sky-400 shrink-0" />
                          <span className="truncate">{item.address}</span>
                        </p>
                      )}

                      {/* Notes */}
                      {item.notes && (
                        <div className="mt-3 bg-white/5 border border-white/5 p-3 rounded-xl text-xs text-zinc-300 flex items-start gap-2">
                          <FileText size={13} className="text-sky-400 mt-0.5 shrink-0" />
                          <p className="whitespace-pre-wrap leading-relaxed">{item.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col items-center gap-1.5 shrink-0 self-end sm:self-start">
                      {(item.address || item.locationName) && (
                        <a
                          href={
                            item.latitude && item.longitude
                              ? `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`
                              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                  (item.locationName || "") + " " + (item.address || "")
                                )}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] font-bold bg-sky-500 text-black hover:bg-sky-400 py-1.5 px-3 rounded-xl transition-all cursor-pointer"
                          title="Abrir no Google Maps"
                        >
                          <span>Maps</span>
                          <ExternalLink size={11} />
                        </a>
                      )}

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onToggleActivity(item.id)}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isCompleted
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                              : "bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                          }`}
                          title={isCompleted ? "Desmarcar" : "Marcar como realizado"}
                        >
                          <CheckCircle2 size={13} />
                        </button>
                        <button
                          onClick={() => onOpenActivityModal(item)}
                          className="p-1.5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-colors border border-white/5 cursor-pointer"
                          title="Editar atividade"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => onDeleteActivity(item.id)}
                          className="p-1.5 bg-white/5 hover:bg-red-500/15 text-zinc-400 hover:text-red-400 rounded-lg transition-colors border border-white/5 cursor-pointer"
                          title="Excluir atividade"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
