"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Clock,
  X,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { travelApi } from "@/lib/api";
import {
  Trip,
  ItineraryItem,
  PlaceToVisit,
  ShoppingItem,
  TripTask,
  PackingItem,
} from "@/lib/types";
import { TripHeader } from "@/components/travel/TripHeader";
import { TripTabsNav, TravelTabType } from "@/components/travel/TripTabsNav";
import { TripItineraryTab } from "@/components/travel/tabs/TripItineraryTab";
import { TripPlacesTab } from "@/components/travel/tabs/TripPlacesTab";
import { TripShoppingTab } from "@/components/travel/tabs/TripShoppingTab";
import { TripNotesTab } from "@/components/travel/tabs/TripNotesTab";
import { TripTransportHotelTab } from "@/components/travel/tabs/TripTransportHotelTab";
import { TripMapTab } from "@/components/travel/tabs/TripMapTab";
import { toast } from "sonner";

interface TripDashboardProps {
  tripId: number;
}

export function TripDashboard({ tripId }: TripDashboardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TravelTabType>("itinerary");

  // Modals state
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ItineraryItem | null>(null);

  // Active day string in Itinerary
  const [selectedDayStr, setSelectedDayStr] = useState<string | null>(null);

  // Form states - Trip
  const [tripDestination, setTripDestination] = useState("");
  const [tripStartDate, setTripStartDate] = useState("");
  const [tripEndDate, setTripEndDate] = useState("");
  const [tripFlightInfo, setTripFlightInfo] = useState("");
  const [tripHotelInfo, setTripHotelInfo] = useState("");
  const [tripNotes, setTripNotes] = useState("");

  // Form states - Activity
  const [actTitle, setActTitle] = useState("");
  const [actDateTime, setActDateTime] = useState("");
  const [actLocationName, setActLocationName] = useState("");
  const [actAddress, setActAddress] = useState("");
  const [actCategory, setActCategory] = useState("ATTRACTION");
  const [actNotes, setActNotes] = useState("");
  const [actLat, setActLat] = useState("");
  const [actLng, setActLng] = useState("");

  // Weather state
  const [weather, setWeather] = useState<{
    temp: number;
    windSpeed: number;
    humidity: number;
    condition: string;
    icon: string;
  } | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  // Fetch Trip Details
  const {
    data: tripDetails,
    isLoading: isLoadingDetails,
    isError,
  } = useQuery<Trip>({
    queryKey: ["trip", tripId],
    queryFn: () => travelApi.getTrip(tripId),
    enabled: !!tripId && !isNaN(tripId),
  });

  // Parse JSON collections safely (handles direct arrays, strings, double-encoded JSON, or wrapped objects)
  const parseJsonCollection = <T,>(rawInput: any): T[] => {
    if (!rawInput) return [];
    try {
      let current: any = rawInput;
      if (typeof current === "string") {
        try {
          current = JSON.parse(current);
        } catch {}
      }
      // If double-encoded as a string
      if (typeof current === "string") {
        try {
          current = JSON.parse(current);
        } catch {}
      }
      // If wrapped in an object like { placesJson: ... } or { shoppingJson: ... }
      if (current && typeof current === "object" && !Array.isArray(current)) {
        for (const key of Object.keys(current)) {
          const val = current[key];
          if (Array.isArray(val)) return val;
          if (typeof val === "string") {
            try {
              const inner = JSON.parse(val);
              if (Array.isArray(inner)) return inner;
            } catch {}
          }
        }
      }
      return Array.isArray(current) ? current : [];
    } catch {
      return [];
    }
  };

  const placesList: PlaceToVisit[] = useMemo(() => {
    return parseJsonCollection<PlaceToVisit>(
      tripDetails?.placesJson ?? (tripDetails as any)?.places_json
    );
  }, [tripDetails?.placesJson, (tripDetails as any)?.places_json]);

  const shoppingList: ShoppingItem[] = useMemo(() => {
    return parseJsonCollection<ShoppingItem>(
      tripDetails?.shoppingJson ?? (tripDetails as any)?.shopping_json
    );
  }, [tripDetails?.shoppingJson, (tripDetails as any)?.shopping_json]);

  const tasksList: TripTask[] = useMemo(() => {
    return parseJsonCollection<TripTask>(
      tripDetails?.tasksJson ?? (tripDetails as any)?.tasks_json
    );
  }, [tripDetails?.tasksJson, (tripDetails as any)?.tasks_json]);

  const packingList: PackingItem[] = useMemo(() => {
    return parseJsonCollection<PackingItem>(
      tripDetails?.checklistJson ?? (tripDetails as any)?.checklist_json
    );
  }, [tripDetails?.checklistJson, (tripDetails as any)?.checklist_json]);

  // Trip Days Range
  const tripDays = useMemo(() => {
    if (!tripDetails?.startDate || !tripDetails?.endDate) return [];
    const start = new Date(tripDetails.startDate + "T00:00:00");
    const end = new Date(tripDetails.endDate + "T00:00:00");
    const days: string[] = [];

    let current = new Date(start);
    while (current <= end) {
      days.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }
    return days;
  }, [tripDetails?.startDate, tripDetails?.endDate]);

  // Auto-select first day when trip opens
  useEffect(() => {
    if (tripDays.length > 0) {
      if (!selectedDayStr || !tripDays.includes(selectedDayStr)) {
        setSelectedDayStr(tripDays[0]);
      }
    } else {
      setSelectedDayStr(null);
    }
  }, [tripDays, selectedDayStr]);

  // Fetch Weather
  useEffect(() => {
    const dest = tripDetails?.destination || "";
    if (!dest) {
      setWeather(null);
      return;
    }

    let active = true;
    async function fetchWeather() {
      setLoadingWeather(true);
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dest)}&limit=1`
        );
        const geoData = await geoRes.json();
        if (!active) return;

        if (geoData && geoData.length > 0) {
          const lat = parseFloat(geoData[0].lat);
          const lon = parseFloat(geoData[0].lon);

          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
          );
          const weatherData = await weatherRes.json();
          if (!active) return;

          if (weatherData && weatherData.current_weather) {
            const cur = weatherData.current_weather;
            const code = cur.weathercode;

            let condition = "Limpo";
            let icon = "☀️";
            if (code === 0) { condition = "Céu Limpo"; icon = "☀️"; }
            else if (code >= 1 && code <= 3) { condition = "Parcialmente Nublado"; icon = "⛅"; }
            else if (code >= 45 && code <= 48) { condition = "Nevoeiro"; icon = "🌫️"; }
            else if (code >= 51 && code <= 55) { condition = "Garoa"; icon = "🌦️"; }
            else if (code >= 61 && code <= 65) { condition = "Chuva"; icon = "🌧️"; }
            else if (code >= 71 && code <= 77) { condition = "Neve"; icon = "❄️"; }
            else if (code >= 80 && code <= 82) { condition = "Pancadas de Chuva"; icon = "🌧️"; }
            else if (code >= 95 && code <= 99) { condition = "Tempestade"; icon = "⛈️"; }

            setWeather({
              temp: cur.temperature,
              windSpeed: cur.windspeed,
              humidity: 60,
              condition,
              icon,
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch weather", err);
      } finally {
        if (active) setLoadingWeather(false);
      }
    }

    fetchWeather();
    return () => {
      active = false;
    };
  }, [tripDetails?.destination]);

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
        startDate: tripStartDate,
        endDate: tripEndDate,
        flightInfo: tripFlightInfo,
        hotelInfo: tripHotelInfo,
        notes: tripNotes,
        checklistJson: editingTrip?.checklistJson,
        placesJson: editingTrip?.placesJson,
        shoppingJson: editingTrip?.shoppingJson,
        tasksJson: editingTrip?.tasksJson,
      };

      if (editingTrip) {
        await travelApi.updateTrip(editingTrip.id, payload);
        toast.success("Viagem atualizada com sucesso!");
      } else {
        await travelApi.createTrip(payload);
        toast.success("Nova viagem criada!");
      }

      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
      setIsTripModalOpen(false);
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
      router.push("/travel");
    } catch (err) {
      toast.error("Erro ao deletar viagem.");
    }
  };

  // Handlers - Activity CRUD
  const handleOpenActivityModal = (activity: ItineraryItem | null = null) => {
    if (activity) {
      setEditingActivity(activity);
      setActTitle(activity.title);
      setActDateTime(activity.dateTime.slice(0, 16));
      setActLocationName(activity.locationName || "");
      setActAddress(activity.address || "");
      setActCategory(activity.category || "ATTRACTION");
      setActNotes(activity.notes || "");
      setActLat(activity.latitude ? String(activity.latitude) : "");
      setActLng(activity.longitude ? String(activity.longitude) : "");
    } else {
      setEditingActivity(null);
      setActTitle("");
      const defaultTimeStr = selectedDayStr ? `${selectedDayStr}T10:00` : "";
      setActDateTime(defaultTimeStr);
      setActLocationName("");
      setActAddress("");
      setActCategory("ATTRACTION");
      setActNotes("");
      setActLat("");
      setActLng("");
    }
    setIsActivityModalOpen(true);
  };

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actTitle || !actDateTime || !tripId) {
      toast.error("O título e a data/hora são obrigatórios.");
      return;
    }

    try {
      const payload = {
        title: actTitle,
        dateTime: actDateTime,
        locationName: actLocationName || undefined,
        address: actAddress || undefined,
        category: actCategory,
        notes: actNotes || undefined,
        latitude: actLat ? parseFloat(actLat) : undefined,
        longitude: actLng ? parseFloat(actLng) : undefined,
        completed: editingActivity ? editingActivity.completed : false,
      };

      if (editingActivity) {
        await travelApi.updateItineraryItem(tripId, editingActivity.id, payload);
        toast.success("Atividade atualizada!");
      } else {
        await travelApi.addItineraryItem(tripId, payload);
        toast.success("Atividade adicionada ao roteiro!");
      }

      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
      setIsActivityModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao salvar atividade");
    }
  };

  const handleToggleActivity = async (activityId: number) => {
    try {
      await travelApi.toggleItineraryItem(tripId, activityId);
      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
    } catch (err) {
      toast.error("Erro ao alterar status da atividade");
    }
  };

  const handleDeleteActivity = async (activityId: number) => {
    if (!confirm("Deseja remover esta atividade do roteiro?")) return;
    try {
      await travelApi.deleteItineraryItem(tripId, activityId);
      toast.success("Atividade removida.");
      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
    } catch (err) {
      toast.error("Erro ao deletar atividade");
    }
  };

  // Schedule place to itinerary
  const handleSchedulePlaceToItinerary = (place: PlaceToVisit) => {
    setEditingActivity(null);
    setActTitle(place.name);
    setActLocationName(place.name);
    setActAddress(place.address || place.neighborhood || "");
    setActCategory(place.category || "ATTRACTION");
    setActNotes(place.notes || "");
    const defaultTimeStr = selectedDayStr ? `${selectedDayStr}T11:00` : "";
    setActDateTime(defaultTimeStr);
    setActLat("");
    setActLng("");
    setIsActivityModalOpen(true);
  };

  // Handlers - Persistence for Collections with Optimistic Update and Resilient Fallback
  const handleSavePlaces = async (updated: PlaceToVisit[]) => {
    if (!tripDetails) return;
    const placesJsonStr = JSON.stringify(updated);

    // 1. Immediate optimistic UI update
    queryClient.setQueryData<Trip>(["trip", tripId], (old) => {
      if (!old) return old;
      const next = { ...old, placesJson: placesJsonStr };
      (next as any).places_json = placesJsonStr;
      return next;
    });

    try {
      let updatedTrip: Trip | null = null;
      try {
        const payload = {
          destination: tripDetails.destination,
          startDate: (tripDetails.startDate || "").split("T")[0],
          endDate: (tripDetails.endDate || "").split("T")[0],
          flightInfo: tripDetails.flightInfo || "",
          hotelInfo: tripDetails.hotelInfo || "",
          notes: tripDetails.notes || "",
          checklistJson: tripDetails.checklistJson ?? (tripDetails as any)?.checklist_json ?? "",
          placesJson: placesJsonStr,
          shoppingJson: tripDetails.shoppingJson ?? (tripDetails as any)?.shopping_json ?? "",
          tasksJson: tripDetails.tasksJson ?? (tripDetails as any)?.tasks_json ?? "",
        };
        updatedTrip = await travelApi.updateTrip(tripId, payload);
      } catch (putErr) {
        console.warn("PUT updateTrip failed, falling back to PATCH:", putErr);
        updatedTrip = await travelApi.updatePlaces(tripId, placesJsonStr);
      }

      if (updatedTrip) {
        const normalized = {
          ...tripDetails,
          ...updatedTrip,
          placesJson: updatedTrip.placesJson || placesJsonStr,
        };
        (normalized as any).places_json = (updatedTrip as any).places_json || placesJsonStr;
        queryClient.setQueryData(["trip", tripId], normalized);
      }
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      toast.success("Lugares atualizados com sucesso!");
    } catch (err: any) {
      console.error("Erro ao salvar lugares:", err);
      // Revert cache on error
      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
      toast.error(err?.response?.data?.message || "Erro ao salvar lugares");
    }
  };

  const handleSaveShopping = async (updated: ShoppingItem[]) => {
    if (!tripDetails) return;
    const shoppingJsonStr = JSON.stringify(updated);

    // 1. Immediate optimistic UI update
    queryClient.setQueryData<Trip>(["trip", tripId], (old) => {
      if (!old) return old;
      const next = { ...old, shoppingJson: shoppingJsonStr };
      (next as any).shopping_json = shoppingJsonStr;
      return next;
    });

    try {
      let updatedTrip: Trip | null = null;
      try {
        const payload = {
          destination: tripDetails.destination,
          startDate: (tripDetails.startDate || "").split("T")[0],
          endDate: (tripDetails.endDate || "").split("T")[0],
          flightInfo: tripDetails.flightInfo || "",
          hotelInfo: tripDetails.hotelInfo || "",
          notes: tripDetails.notes || "",
          checklistJson: tripDetails.checklistJson ?? (tripDetails as any)?.checklist_json ?? "",
          placesJson: tripDetails.placesJson ?? (tripDetails as any)?.places_json ?? "",
          shoppingJson: shoppingJsonStr,
          tasksJson: tripDetails.tasksJson ?? (tripDetails as any)?.tasks_json ?? "",
        };
        updatedTrip = await travelApi.updateTrip(tripId, payload);
      } catch (putErr) {
        console.warn("PUT updateTrip failed, falling back to PATCH:", putErr);
        updatedTrip = await travelApi.updateShopping(tripId, shoppingJsonStr);
      }

      if (updatedTrip) {
        const normalized = {
          ...tripDetails,
          ...updatedTrip,
          shoppingJson: updatedTrip.shoppingJson || shoppingJsonStr,
        };
        (normalized as any).shopping_json = (updatedTrip as any).shopping_json || shoppingJsonStr;
        queryClient.setQueryData(["trip", tripId], normalized);
      }
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      toast.success("Lista de compras atualizada com sucesso!");
    } catch (err: any) {
      console.error("Erro ao salvar lista de compras:", err);
      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
      toast.error(err?.response?.data?.message || "Erro ao salvar lista de compras");
    }
  };

  const handleSaveNotes = async (notes: string) => {
    if (!tripDetails) return;

    queryClient.setQueryData<Trip>(["trip", tripId], (old) => {
      if (!old) return old;
      return { ...old, notes };
    });

    try {
      let updatedTrip: Trip | null = null;
      try {
        updatedTrip = await travelApi.updateTrip(tripId, {
          destination: tripDetails.destination,
          startDate: (tripDetails.startDate || "").split("T")[0],
          endDate: (tripDetails.endDate || "").split("T")[0],
          flightInfo: tripDetails.flightInfo || "",
          hotelInfo: tripDetails.hotelInfo || "",
          notes: notes,
          checklistJson: tripDetails.checklistJson ?? (tripDetails as any)?.checklist_json ?? "",
          placesJson: tripDetails.placesJson ?? (tripDetails as any)?.places_json ?? "",
          shoppingJson: tripDetails.shoppingJson ?? (tripDetails as any)?.shopping_json ?? "",
          tasksJson: tripDetails.tasksJson ?? (tripDetails as any)?.tasks_json ?? "",
        });
      } catch (putErr) {
        updatedTrip = await travelApi.updateNotes(tripId, notes);
      }

      if (updatedTrip) {
        queryClient.setQueryData(["trip", tripId], updatedTrip);
      }
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      toast.success("Anotações salvas com sucesso!");
    } catch (err: any) {
      console.error("Erro ao salvar anotações:", err);
      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
      toast.error(err?.response?.data?.message || "Erro ao salvar anotações");
      throw err;
    }
  };

  // Loading state
  if (isLoadingDetails) {
    return (
      <div className="space-y-6">
        <div className="h-44 rounded-3xl bg-zinc-900/50 animate-pulse border border-white/5" />
        <div className="h-12 w-full max-w-md rounded-2xl bg-zinc-900/50 animate-pulse border border-white/5" />
        <div className="h-96 rounded-3xl bg-zinc-900/50 animate-pulse border border-white/5" />
      </div>
    );
  }

  // Error / Not Found state
  if (isError || !tripDetails) {
    return (
      <div className="text-center py-20 px-4 bg-zinc-900/20 rounded-3xl border border-dashed border-white/10 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
          <AlertCircle size={24} />
        </div>
        <h3 className="text-lg font-bold text-white">Viagem não encontrada</h3>
        <p className="text-zinc-400 text-xs mt-1.5 mb-6">
          A viagem de ID #{tripId} não existe ou foi removida.
        </p>
        <button
          onClick={() => router.push("/travel")}
          className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Voltar para Minhas Viagens</span>
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Top Header */}
      <TripHeader
        trip={tripDetails}
        weather={weather}
        loadingWeather={loadingWeather}
        onBack={() => router.push("/travel")}
        onEdit={() => handleOpenTripModal(tripDetails)}
        onDelete={() => handleDeleteTrip(tripDetails.id)}
      />

      {/* Modular Navigation Tabs */}
      <TripTabsNav
        activeTab={activeTab}
        onChangeTab={(t) => setActiveTab(t)}
        counts={{
          itinerary: tripDetails.itinerary?.length || 0,
          places: placesList.length,
          shopping: shoppingList.length,
          shoppingPending: shoppingList.filter((i) => !i.purchased).length,
          hasNotes: !!tripDetails.notes,
        }}
      />

      {/* Tab Contents */}
      <div className="bg-zinc-950/40 border border-white/5 rounded-3xl p-4 sm:p-7 shadow-xl">
        {activeTab === "itinerary" && (
          <TripItineraryTab
            trip={tripDetails}
            selectedDayStr={selectedDayStr}
            onSelectDay={(day) => setSelectedDayStr(day)}
            onOpenActivityModal={(act) => handleOpenActivityModal(act)}
            onToggleActivity={handleToggleActivity}
            onDeleteActivity={handleDeleteActivity}
          />
        )}

        {activeTab === "places" && (
          <TripPlacesTab
            places={placesList}
            onSavePlaces={handleSavePlaces}
            onSchedulePlace={handleSchedulePlaceToItinerary}
          />
        )}

        {activeTab === "shopping" && (
          <TripShoppingTab
            items={shoppingList}
            onSaveShopping={handleSaveShopping}
          />
        )}

        {activeTab === "notes" && (
          <TripNotesTab
            notes={tripDetails.notes || ""}
            onSaveNotes={handleSaveNotes}
          />
        )}

        {activeTab === "transport" && (
          <TripTransportHotelTab
            trip={tripDetails}
            onEditTrip={() => handleOpenTripModal(tripDetails)}
          />
        )}

        {activeTab === "map" && (
          <TripMapTab
            trip={tripDetails}
            items={tripDetails.itinerary || []}
            places={placesList}
          />
        )}
      </div>

      {/* ========================================================
         MODAL: EDITAR VIAGEM
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

      {/* ========================================================
         MODAL: NOVA / EDITAR ATIVIDADE NO ROTEIRO
         ======================================================== */}
      <AnimatePresence>
        {isActivityModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsActivityModalOpen(false)}
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
                  <Clock className="text-sky-400" size={20} />
                  {editingActivity ? "Editar Atividade" : "Adicionar Atividade no Roteiro"}
                </h3>
                <button
                  onClick={() => setIsActivityModalOpen(false)}
                  className="text-zinc-500 hover:text-white p-1 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveActivity} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Título da Atividade *
                  </label>
                  <input
                    type="text"
                    required
                    value={actTitle}
                    onChange={(e) => setActTitle(e.target.value)}
                    placeholder="Ex: Visita ao Museu, Almoço no Bistrô..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Data e Hora *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={actDateTime}
                      onChange={(e) => setActDateTime(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Categoria
                    </label>
                    <select
                      value={actCategory}
                      onChange={(e) => setActCategory(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="ATTRACTION">📸 Passeio / Atração</option>
                      <option value="FOOD">🍽️ Gastronomia / Refeição</option>
                      <option value="TRANSPORT">🚗 Transporte / Deslocamento</option>
                      <option value="LODGING">🏨 Hospedagem / Check-in</option>
                      <option value="SHOPPING">🛍️ Compras</option>
                      <option value="LEISURE">✨ Lazer / Descanso</option>
                      <option value="OTHER">Outro</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Nome do Local
                    </label>
                    <input
                      type="text"
                      value={actLocationName}
                      onChange={(e) => setActLocationName(e.target.value)}
                      placeholder="Ex: Museu do Louvre"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Endereço
                    </label>
                    <input
                      type="text"
                      value={actAddress}
                      onChange={(e) => setActAddress(e.target.value)}
                      placeholder="Ex: Rue de Rivoli, 75001"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Notas / Dicas de Acesso
                  </label>
                  <textarea
                    value={actNotes}
                    onChange={(e) => setActNotes(e.target.value)}
                    placeholder="Dicas de transporte, ingressos, horários ideais..."
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-colors resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-white/5 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsActivityModalOpen(false)}
                    className="bg-white/5 hover:bg-white/10 text-zinc-300 font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-sky-500 hover:bg-sky-400 text-black font-bold px-5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-sky-500/20"
                  >
                    Salvar Atividade
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
