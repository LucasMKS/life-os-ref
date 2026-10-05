import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import { travelApi } from "@/lib/api";
import { Trip } from "@/lib/types";
import { Navbar } from "@/components/navbar";
import { BottomNav } from "@/components/bottom-nav";
import { toast } from "sonner";

export default function TravelPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Modals state
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

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

  // Handlers - Trip CRUD
  const handleOpenTripModal = (trip: Trip | null = null) => {
    if (trip) {
      setEditingTrip(trip);
      setTripDestination(trip.destination);
      setTripStartDate(trip.startDate);
      setTripEndDate(trip.endDate);
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
    if (!tripDestination || !tripStartDate || !tripEndDate) {
      toast.error("Por favor, preencha o destino e as datas.");
      return;
    }

    try {
      const payload = {
        destination: tripDestination,
        startDate: (tripStartDate || "").split("T")[0],
        endDate: (tripEndDate || "").split("T")[0],
        flightInfo: tripFlightInfo,
        hotelInfo: tripHotelInfo,
        notes: tripNotes,
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
      toast.error(err.response?.data?.message || "Erro ao salvar viagem");
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

  const formatDateBR = (dateStr: string) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  const getTripStatusText = (trip: Trip) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(trip.startDate + "T00:00:00");
    const end = new Date(trip.endDate + "T00:00:00");

    if (today < start) {
      const diffTime = Math.abs(start.getTime() - today.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
        label: `Faltam ${diffDays} ${diffDays === 1 ? "dia" : "dias"} ✈️`,
        color: "text-sky-400 bg-sky-500/10 border-sky-500/20",
      };
    } else if (today > end) {
      return {
        label: "Realizada 🌍",
        color: "text-zinc-400 bg-zinc-900/30 border-zinc-800",
      };
    } else {
      const diffTime = Math.abs(today.getTime() - start.getTime());
      const currentDay = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const totalDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return {
        label: `Ativa! 🌴 (Dia ${currentDay} de ${totalDays})`,
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 animate-pulse",
      };
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 md:py-10">
        <motion.div
          key="list"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black tracking-tight flex items-center gap-2.5">
                <Compass className="text-sky-400 w-8 h-8" />
                Minhas Viagens
              </h1>
              <p className="text-zinc-400 text-sm mt-1">
                Planeje roteiros, wishlist de lugares, compras, afazeres e preparativos em um só lugar.
              </p>
            </div>

            <button
              onClick={() => handleOpenTripModal()}
              className="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 transition-colors text-black font-bold px-5 py-3 rounded-2xl shadow-[0_0_20px_rgba(56,189,248,0.2)] cursor-pointer"
            >
              <Plus size={18} strokeWidth={2.5} />
              Nova Viagem
            </button>
          </div>

          {/* Loader */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-52 rounded-3xl bg-zinc-900/50 animate-pulse border border-white/5" />
              ))}
            </div>
          ) : trips.length === 0 ? (
            /* Empty state */
            <div className="text-center py-20 px-4 bg-zinc-900/20 rounded-3xl border border-dashed border-white/10 max-w-xl mx-auto mt-6">
              <div className="bg-sky-500/10 text-sky-400 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-sky-500/20">
                <Compass size={28} />
              </div>
              <h3 className="text-lg font-bold">Nenhuma viagem planejada ainda</h3>
              <p className="text-zinc-500 text-sm mt-2 max-w-md mx-auto">
                Crie sua próxima viagem para começar a salvar pontos turísticos, montar o roteiro e gerenciar compras e pendências.
              </p>
              <button
                onClick={() => handleOpenTripModal()}
                className="mt-6 inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-black font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                <Plus size={16} />
                Adicionar Viagem
              </button>
            </div>
          ) : (
            /* Grid de Viagens */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip, idx) => {
                const status = getTripStatusText(trip);
                const isPast = new Date(trip.endDate) < new Date();

                let parsedPlacesCount = 0;
                try {
                  const rawP = trip.placesJson || (trip as any).places_json;
                  if (rawP) {
                    const parsed = JSON.parse(rawP);
                    parsedPlacesCount = Array.isArray(parsed) ? parsed.length : 0;
                  }
                } catch {}

                let parsedShoppingCount = 0;
                try {
                  const rawS = trip.shoppingJson || (trip as any).shopping_json;
                  if (rawS) {
                    const parsed = JSON.parse(rawS);
                    parsedShoppingCount = Array.isArray(parsed) ? parsed.length : 0;
                  }
                } catch {}

                return (
                  <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    onClick={() => router.push(`/travel/${trip.id}`)}
                    className={`group relative rounded-3xl border p-6 transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                      isPast
                        ? "border-zinc-800/80 bg-zinc-900/30 opacity-70 hover:opacity-100 hover:border-zinc-700"
                        : "border-sky-500/20 bg-gradient-to-br from-sky-950/20 via-zinc-900/40 to-zinc-950 hover:border-sky-500/40 hover:shadow-lg hover:shadow-sky-500/5"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${status.color}`}>
                          {status.label}
                        </span>
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenTripModal(trip);
                            }}
                            className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
                            title="Editar"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTrip(trip.id);
                            }}
                            className="p-1.5 hover:bg-red-500/15 rounded-lg text-zinc-400 hover:text-red-400 cursor-pointer"
                            title="Deletar"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-xl font-bold mt-4 leading-snug group-hover:text-sky-300 transition-colors">
                        {trip.destination}
                      </h3>

                      <div className="flex items-center gap-2 text-zinc-400 text-xs mt-3 font-semibold">
                        <Calendar size={13} className="text-sky-400" />
                        {formatDateBR(trip.startDate)} - {formatDateBR(trip.endDate)}
                      </div>

                      {/* Quick Counters */}
                      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/5 text-[11px] text-zinc-400">
                        {trip.itinerary?.length > 0 && (
                          <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-lg">
                            <Clock size={10} className="text-sky-400" />
                            {trip.itinerary.length} roteiro
                          </span>
                        )}
                        {parsedPlacesCount > 0 && (
                          <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-lg">
                            <MapPin size={10} className="text-amber-400" />
                            {parsedPlacesCount} lugares
                          </span>
                        )}
                        {parsedShoppingCount > 0 && (
                          <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-lg">
                            <ShoppingBag size={10} className="text-emerald-400" />
                            {parsedShoppingCount} compras
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between w-full py-2.5 px-4 bg-white/5 group-hover:bg-sky-500 group-hover:text-black rounded-xl text-xs font-bold text-zinc-300 transition-all">
                      <span>Acessar Viagem (#{trip.id})</span>
                      <ChevronRight size={14} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </main>

      {/* ========================================================
         MODAL: NOVA / EDITAR VIAGEM
         ======================================================== */}
      <AnimatePresence>
        {isTripModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTripModalOpen(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-xl bg-[#09090b] border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl z-10"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-5">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Compass className="text-sky-400" size={20} />
                  {editingTrip ? "Editar Viagem" : "Nova Viagem"}
                </h3>
                <button
                  onClick={() => setIsTripModalOpen(false)}
                  className="text-zinc-500 hover:text-white p-1 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveTrip} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Destino da Viagem *
                  </label>
                  <input
                    type="text"
                    required
                    value={tripDestination}
                    onChange={(e) => setTripDestination(e.target.value)}
                    placeholder="Ex: Tóquio, Paris, Santiago, Nova York..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Data de Ida *
                    </label>
                    <input
                      type="date"
                      required
                      value={tripStartDate}
                      onChange={(e) => setTripStartDate(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Data de Volta *
                    </label>
                    <input
                      type="date"
                      required
                      value={tripEndDate}
                      onChange={(e) => setTripEndDate(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Voo & Transporte (Opcional)
                  </label>
                  <textarea
                    value={tripFlightInfo}
                    onChange={(e) => setTripFlightInfo(e.target.value)}
                    placeholder="Ex: Voo LA-8084 GRU ➔ JFK, Localizador: AB12CD&#10;Assentos: 14A/14B, Terminal 3"
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Hotel & Hospedagem (Opcional)
                  </label>
                  <textarea
                    value={tripHotelInfo}
                    onChange={(e) => setTripHotelInfo(e.target.value)}
                    placeholder="Ex: Grand Hotel Shinjuku, Check-in: 15h&#10;Reserva #987654, Endereço: 2-Chrome..."
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Notas Gerais
                  </label>
                  <textarea
                    value={tripNotes}
                    onChange={(e) => setTripNotes(e.target.value)}
                    placeholder="Dicas de câmbio, regras da alfândega, etc."
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-colors resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-white/5 mt-5">
                  <button
                    type="button"
                    onClick={() => setIsTripModalOpen(false)}
                    className="bg-white/5 hover:bg-white/10 text-zinc-300 font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-sky-500 hover:bg-sky-400 text-black font-bold px-5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-sky-500/20"
                  >
                    Salvar Viagem
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
