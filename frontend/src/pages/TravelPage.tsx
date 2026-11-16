import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Calendar,
  Compass,
  ChevronRight,
  Edit3,
  Trash2,
  X,
  Clock,
  MapPin,
  ShoppingBag,
  Search,
  Plane,
  CheckCircle2,
} from "lucide-react";
import { travelApi } from "@/lib/api";
import { Trip } from "@/lib/types";
import { BottomNav } from "@/components/bottom-nav";
import {
  PageShell,
  PageHeader,
  StatCard,
  FilterPill,
  EmptyState,
} from "@/components/ui/page-shell";
import { toast } from "sonner";

type TripFilter = "ALL" | "UPCOMING" | "PAST";

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

function safeJsonArrayLength(rawInput: unknown): number {
  if (!rawInput) return 0;
  try {
    if (Array.isArray(rawInput)) return rawInput.length;
    if (typeof rawInput === "string") {
      const parsed = JSON.parse(rawInput);
      return Array.isArray(parsed) ? parsed.length : 0;
    }
  } catch {
    return 0;
  }
  return 0;
}

export default function TravelPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<TripFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form states - Trip
  const [tripDestination, setTripDestination] = useState("");
  const [tripStartDate, setTripStartDate] = useState("");
  const [tripEndDate, setTripEndDate] = useState("");
  const [tripFlightInfo, setTripFlightInfo] = useState("");
  const [tripHotelInfo, setTripHotelInfo] = useState("");
  const [tripNotes, setTripNotes] = useState("");

  // 1. Fetch Trips List
  const { data: trips = [], isLoading } = useQuery<Trip[]>({
    queryKey: ["trips"],
    queryFn: travelApi.getTrips,
  });

  const getTripStatusInfo = (trip: Trip) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = parseSafeDate(trip.startDate);
    const end = parseSafeDate(trip.endDate);

    if (!start || !end) {
      return {
        state: "UPCOMING" as const,
        label: "Datas pendentes",
        badgeClass: "text-zinc-400 bg-white/[0.05] border-white/[0.08]",
      };
    }

    if (today < start) {
      const diffTime = Math.abs(start.getTime() - today.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
        state: "UPCOMING" as const,
        label: `Faltam ${diffDays} ${diffDays === 1 ? "dia" : "dias"}`,
        badgeClass: "text-zinc-200 bg-white/[0.06] border-white/[0.1]",
      };
    }

    if (today > end) {
      return {
        state: "PAST" as const,
        label: "Realizada",
        badgeClass: "text-zinc-500 bg-white/[0.03] border-white/[0.06]",
      };
    }

    const diffTime = Math.abs(today.getTime() - start.getTime());
    const currentDay = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const totalDays =
      Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return {
      state: "ACTIVE" as const,
      label: `Em andamento · Dia ${currentDay}/${totalDays}`,
      badgeClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    };
  };

  // Stats & Filtering
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let upcomingOrActive = 0;
    let past = 0;
    let totalItinerary = 0;

    trips.forEach((t) => {
      const end = parseSafeDate(t.endDate);
      if (end && today > end) {
        past += 1;
      } else {
        upcomingOrActive += 1;
      }
      totalItinerary += Array.isArray(t.itinerary) ? t.itinerary.length : 0;
    });

    return {
      total: trips.length,
      upcomingOrActive,
      past,
      totalItinerary,
    };
  }, [trips]);

  const filteredTrips = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return trips.filter((trip) => {
      const status = getTripStatusInfo(trip);
      if (filter === "UPCOMING" && status.state === "PAST") return false;
      if (filter === "PAST" && status.state !== "PAST") return false;
      if (q && !(trip.destination || "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [trips, filter, searchQuery]);

  // Handlers - Trip CRUD
  const handleOpenTripModal = (trip: Trip | null = null) => {
    if (trip) {
      setEditingTrip(trip);
      setTripDestination(trip.destination || "");
      setTripStartDate((trip.startDate || "").split("T")[0]);
      setTripEndDate((trip.endDate || "").split("T")[0]);
      setTripFlightInfo(trip.flightInfo || "");
      setTripHotelInfo(trip.hotelInfo || "");
      setTripNotes(trip.notes || "");
    } else {
      setEditingTrip(null);
      setTripDestination("");
      setTripStartDate("");
      setTripEndDate("");
      setTripFlightInfo("");
      setTripHotelInfo("");
      setTripNotes("");
    }
    setIsTripModalOpen(true);
  };

  const handleSaveTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedDest = tripDestination.trim();
    const start = tripStartDate.split("T")[0];
    const end = tripEndDate.split("T")[0];

    if (!trimmedDest || !start || !end) {
      toast.error("Por favor, preencha o destino e as datas.");
      return;
    }

    if (end < start) {
      toast.error("A data de volta não pode ser anterior à data de ida.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        destination: trimmedDest,
        startDate: start,
        endDate: end,
        flightInfo: tripFlightInfo.trim(),
        hotelInfo: tripHotelInfo.trim(),
        notes: tripNotes.trim(),
        checklistJson: editingTrip?.checklistJson ?? (editingTrip as any)?.checklist_json,
        placesJson: editingTrip?.placesJson ?? (editingTrip as any)?.places_json,
        shoppingJson: editingTrip?.shoppingJson ?? (editingTrip as any)?.shopping_json,
        tasksJson: editingTrip?.tasksJson ?? (editingTrip as any)?.tasks_json,
      };

      if (editingTrip) {
        await travelApi.updateTrip(editingTrip.id, payload);
        toast.success("Viagem atualizada com sucesso!");
        queryClient.invalidateQueries({ queryKey: ["trips"] });
        setIsTripModalOpen(false);
      } else {
        const createdTrip = await travelApi.createTrip(payload);
        toast.success("Nova viagem criada!");
        queryClient.invalidateQueries({ queryKey: ["trips"] });
        setIsTripModalOpen(false);
        if (createdTrip && createdTrip.id) {
          router.push(`/travel/${createdTrip.id}`);
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao salvar viagem");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTrip = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta viagem?")) return;

    try {
      await travelApi.deleteTrip(id);
      toast.success("Viagem excluída.");
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    } catch {
      toast.error("Erro ao deletar viagem.");
    }
  };

  return (
    <>
      <PageShell maxWidth="7xl">
        <PageHeader
          accent="sky"
          eyebrow="Planejamento"
          icon={<Compass size={14} />}
          title="Minhas Viagens"
          subtitle="Organize roteiros diários, lugares para visitar, compras, hospedagem e mapa em um só lugar."
          actions={
            <button
              type="button"
              onClick={() => handleOpenTripModal()}
              className="inline-flex items-center justify-center gap-2 bg-zinc-100 text-zinc-950 hover:bg-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              <Plus size={16} strokeWidth={2.2} />
              <span>Nova Viagem</span>
            </button>
          }
        />

        {/* Overview Stats */}
        {!isLoading && trips.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <StatCard
              accent="sky"
              label="Total de Viagens"
              value={stats.total}
              icon={<Compass size={16} className="text-sky-400" />}
            />
            <StatCard
              accent="sky"
              label="Próximas / Ativas"
              value={stats.upcomingOrActive}
              icon={<Plane size={16} className="text-sky-400" />}
            />
            <StatCard
              accent="sky"
              label="Realizadas"
              value={stats.past}
              icon={<CheckCircle2 size={16} className="text-emerald-400" />}
            />
            <StatCard
              accent="sky"
              label="Atividades no Roteiro"
              value={stats.totalItinerary}
              icon={<Clock size={16} className="text-sky-400" />}
            />
          </div>
        )}

        {/* Filter & Search Bar */}
        {!isLoading && trips.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <FilterPill accent="sky" active={filter === "ALL"} onClick={() => setFilter("ALL")}>
                Todas ({stats.total})
              </FilterPill>
              <FilterPill accent="sky" active={filter === "UPCOMING"} onClick={() => setFilter("UPCOMING")}>
                Próximas & Ativas ({stats.upcomingOrActive})
              </FilterPill>
              <FilterPill accent="sky" active={filter === "PAST"} onClick={() => setFilter("PAST")}>
                Realizadas ({stats.past})
              </FilterPill>
            </div>

            <div className="relative w-full sm:w-64">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar destino..."
                className="w-full bg-[#111113] border border-white/[0.06] rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Loader */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-52 rounded-2xl bg-[#111113] border border-white/[0.06] animate-pulse"
              />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <EmptyState
            icon={<Compass size={26} />}
            title="Nenhuma viagem planejada ainda"
            description="Crie sua próxima viagem para começar a salvar pontos turísticos, montar o roteiro diário e gerenciar compras."
            action={
              <button
                type="button"
                onClick={() => handleOpenTripModal()}
                className="inline-flex items-center gap-2 bg-zinc-100 text-zinc-950 hover:bg-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                <Plus size={15} />
                <span>Adicionar Viagem</span>
              </button>
            }
          />
        ) : filteredTrips.length === 0 ? (
          <EmptyState
            icon={<Search size={24} />}
            title="Nenhuma viagem encontrada"
            description="Nenhuma viagem corresponde aos filtros aplicados."
            action={
              <button
                type="button"
                onClick={() => {
                  setFilter("ALL");
                  setSearchQuery("");
                }}
                className="bg-white/[0.05] text-zinc-200 border border-white/[0.08] hover:bg-white/[0.1] text-xs font-medium px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Limpar filtros
              </button>
            }
          />
        ) : (
          /* Grid de Viagens */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredTrips.map((trip) => {
              const status = getTripStatusInfo(trip);
              const isPast = status.state === "PAST";
              const parsedPlacesCount = safeJsonArrayLength(
                trip.placesJson ?? (trip as any).places_json
              );
              const parsedShoppingCount = safeJsonArrayLength(
                trip.shoppingJson ?? (trip as any).shopping_json
              );
              const itineraryCount = Array.isArray(trip.itinerary)
                ? trip.itinerary.length
                : 0;

              return (
                <article
                  key={trip.id}
                  onClick={() => router.push(`/travel/${trip.id}`)}
                  className={`group relative rounded-2xl border p-5 transition-colors flex flex-col justify-between cursor-pointer bg-[#111113] ${
                    isPast
                      ? "border-white/[0.05] opacity-75 hover:opacity-100 hover:border-white/[0.12]"
                      : "border-white/[0.06] hover:border-white/[0.14] hover:bg-[#141417]"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start gap-3">
                      <span
                        className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border ${status.badgeClass}`}
                      >
                        {status.label}
                      </span>

                      <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTripModal(trip);
                          }}
                          className="p-1.5 hover:bg-white/[0.08] rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
                          title="Editar viagem"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTrip(trip.id);
                          }}
                          className="p-1.5 hover:bg-red-500/10 rounded-lg text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                          title="Excluir viagem"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-white mt-4 leading-snug">
                      {trip.destination || "Destino sem nome"}
                    </h3>

                    <div className="flex items-center gap-2 text-zinc-400 text-xs mt-2 font-medium">
                      <Calendar size={13} className="text-zinc-500 shrink-0" />
                      <span>
                        {formatDateBR(trip.startDate)} – {formatDateBR(trip.endDate)}
                      </span>
                    </div>

                    {/* Quick Counters */}
                    <div className="flex flex-wrap gap-1.5 mt-4 pt-3.5 border-t border-white/[0.06] text-[11px] text-zinc-400">
                      <span className="flex items-center gap-1 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.05]">
                        <Clock size={11} className="text-zinc-400" />
                        {itineraryCount} roteiro
                      </span>
                      <span className="flex items-center gap-1 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.05]">
                        <MapPin size={11} className="text-zinc-400" />
                        {parsedPlacesCount} lugares
                      </span>
                      <span className="flex items-center gap-1 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.05]">
                        <ShoppingBag size={11} className="text-zinc-400" />
                        {parsedShoppingCount} compras
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between w-full py-2 px-3 bg-white/[0.03] group-hover:bg-white/[0.07] border border-white/[0.05] rounded-xl text-xs font-medium text-zinc-300 group-hover:text-white transition-colors">
                    <span>Abrir planejamento</span>
                    <ChevronRight size={14} className="text-zinc-500 group-hover:text-white" />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </PageShell>

      {/* ========================================================
         MODAL: NOVA / EDITAR VIAGEM
         ======================================================== */}
      {isTripModalOpen && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={() => setIsTripModalOpen(false)}
            className="absolute inset-0 bg-black/80"
          />
          <div className="relative w-full max-w-xl bg-[#111113] border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Compass className="text-zinc-400" size={18} />
                {editingTrip ? "Editar Viagem" : "Nova Viagem"}
              </h3>
              <button
                type="button"
                onClick={() => setIsTripModalOpen(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
                aria-label="Fechar modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTrip} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Destino da Viagem *
                </label>
                <input
                  type="text"
                  required
                  value={tripDestination}
                  onChange={(e) => setTripDestination(e.target.value)}
                  placeholder="Ex: Tóquio, Paris, Santiago, Nova York..."
                  className="w-full bg-[#09090b] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/25 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Data de Ida *
                  </label>
                  <input
                    type="date"
                    required
                    value={tripStartDate}
                    onChange={(e) => setTripStartDate(e.target.value)}
                    className="w-full bg-[#09090b] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white/25 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Data de Volta *
                  </label>
                  <input
                    type="date"
                    required
                    value={tripEndDate}
                    onChange={(e) => setTripEndDate(e.target.value)}
                    className="w-full bg-[#09090b] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white/25 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Voo & Transporte (Opcional)
                </label>
                <textarea
                  value={tripFlightInfo}
                  onChange={(e) => setTripFlightInfo(e.target.value)}
                  placeholder="Ex: Voo LA-8084 GRU -> JFK, Localizador: AB12CD"
                  rows={2}
                  className="w-full bg-[#09090b] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/25 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Hotel & Hospedagem (Opcional)
                </label>
                <textarea
                  value={tripHotelInfo}
                  onChange={(e) => setTripHotelInfo(e.target.value)}
                  placeholder="Ex: Grand Hotel Shinjuku, Check-in: 15h"
                  rows={2}
                  className="w-full bg-[#09090b] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/25 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Notas Gerais
                </label>
                <textarea
                  value={tripNotes}
                  onChange={(e) => setTripNotes(e.target.value)}
                  placeholder="Dicas de câmbio, regras da alfândega, etc."
                  rows={2}
                  className="w-full bg-[#09090b] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/25 transition-colors resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsTripModalOpen(false)}
                  className="bg-white/[0.05] text-zinc-200 border border-white/[0.08] hover:bg-white/[0.1] font-medium px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-zinc-100 text-zinc-950 hover:bg-white disabled:opacity-50 font-semibold px-5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  {isSaving ? "Salvando..." : "Salvar Viagem"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </>
  );
}
