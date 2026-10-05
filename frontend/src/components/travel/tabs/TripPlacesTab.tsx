"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Plus,
  Search,
  CheckCircle2,
  Circle,
  ExternalLink,
  Edit3,
  Trash2,
  CalendarPlus,
  Utensils,
  Camera,
  Coffee,
  Trees,
  Landmark,
  Eye,
  ShoppingBag,
  Moon,
  Sparkles,
  X,
  Star,
} from "lucide-react";
import { PlaceToVisit, PlaceCategory, PlacePriority } from "@/lib/types";

interface TripPlacesTabProps {
  places: PlaceToVisit[];
  onSavePlaces: (updated: PlaceToVisit[]) => Promise<void>;
  onSchedulePlace: (place: PlaceToVisit) => void;
}

export function TripPlacesTab({
  places,
  onSavePlaces,
  onSchedulePlace,
}: TripPlacesTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "WANT_TO_GO" | "VISITED">("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<PlaceToVisit | null>(null);

  // Form States
  const [name, setName] = useState("");
  const [category, setCategory] = useState<PlaceCategory>("ATTRACTION");
  const [neighborhood, setNeighborhood] = useState("");
  const [address, setAddress] = useState("");
  const [priority, setPriority] = useState<PlacePriority>("MUST_VISIT");
  const [notes, setNotes] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");

  const handleOpenModal = (place?: PlaceToVisit | null) => {
    if (place) {
      setEditingPlace(place);
      setName(place.name);
      setCategory(place.category);
      setNeighborhood(place.neighborhood || "");
      setAddress(place.address || "");
      setPriority(place.priority || "MUST_VISIT");
      setNotes(place.notes || "");
      setEstimatedCost(place.estimatedCost || "");
    } else {
      setEditingPlace(null);
      setName("");
      setCategory("ATTRACTION");
      setNeighborhood("");
      setAddress("");
      setPriority("MUST_VISIT");
      setNotes("");
      setEstimatedCost("");
    }
    setIsModalOpen(true);
  };

  const handleSavePlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingPlace) {
      const updated = places.map((p) =>
        p.id === editingPlace.id
          ? {
              ...p,
              name: name.trim(),
              category,
              neighborhood: neighborhood.trim() || undefined,
              address: address.trim() || undefined,
              priority,
              notes: notes.trim() || undefined,
              estimatedCost: estimatedCost.trim() || undefined,
            }
          : p
      );
      await onSavePlaces(updated);
    } else {
      const newPlace: PlaceToVisit = {
        id: String(Date.now()),
        name: name.trim(),
        category,
        neighborhood: neighborhood.trim() || undefined,
        address: address.trim() || undefined,
        priority,
        notes: notes.trim() || undefined,
        estimatedCost: estimatedCost.trim() || undefined,
        visited: false,
      };
      await onSavePlaces([...places, newPlace]);
    }
    setIsModalOpen(false);
  };

  const handleToggleVisited = async (id: string) => {
    const updated = places.map((p) =>
      p.id === id ? { ...p, visited: !p.visited } : p
    );
    await onSavePlaces(updated);
  };

  const handleDeletePlace = async (id: string) => {
    if (!confirm("Remover este lugar da sua lista?")) return;
    const updated = places.filter((p) => p.id !== id);
    await onSavePlaces(updated);
  };

  // Filtered List
  const filteredPlaces = useMemo(() => {
    return places.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.notes?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === "ALL"
          ? true
          : filterStatus === "VISITED"
          ? p.visited
          : !p.visited;

      const matchesCategory =
        filterCategory === "ALL" || p.category === filterCategory;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [places, searchTerm, filterStatus, filterCategory]);

  const getCategoryConfig = (cat: PlaceCategory) => {
    switch (cat) {
      case "RESTAURANT":
        return { label: "Restaurante", icon: Utensils, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
      case "CAFE":
        return { label: "Café", icon: Coffee, color: "text-orange-400 bg-orange-500/10 border-orange-500/20" };
      case "MUSEUM":
        return { label: "Museu / Cultura", icon: Landmark, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" };
      case "VIEWPOINT":
        return { label: "Mirante", icon: Eye, color: "text-sky-400 bg-sky-500/10 border-sky-500/20" };
      case "PARK":
        return { label: "Parque / Natureza", icon: Trees, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
      case "SHOPPING":
        return { label: "Compras", icon: ShoppingBag, color: "text-pink-400 bg-pink-500/10 border-pink-500/20" };
      case "NIGHTLIFE":
        return { label: "Vida Noturna", icon: Moon, color: "text-violet-400 bg-violet-500/10 border-violet-500/20" };
      default:
        return { label: "Ponto Turístico", icon: Camera, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" };
    }
  };

  const getPriorityBadge = (prio: PlacePriority) => {
    switch (prio) {
      case "MUST_VISIT":
        return { label: "Imperdível ⭐", color: "text-amber-400 bg-amber-500/15 border-amber-500/30 font-bold" };
      case "HIGH":
        return { label: "Alta prioridade", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
      case "LOW":
        return { label: "Se sobrar tempo", color: "text-zinc-500 bg-zinc-900 border-zinc-800" };
      default:
        return { label: "Média prioridade", color: "text-sky-400 bg-sky-500/10 border-sky-500/20" };
    }
  };

  const visitedCount = places.filter((p) => p.visited).length;

  return (
    <div className="space-y-6">
      {/* Top Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MapPin className="text-amber-400" size={20} />
            Lugares que Quero Ir
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Sua lista de desejos de atrações, mirantes, restaurantes e pontos turísticos imperdíveis.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal(null)}
          className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={15} strokeWidth={2.5} />
          Adicionar Lugar
        </button>
      </div>

      {/* Progress & Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-zinc-900/40 border border-white/5 p-3 rounded-2xl">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por nome, bairro ou dica..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setFilterStatus("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === "ALL"
                ? "bg-amber-500 text-black font-bold"
                : "bg-white/5 text-zinc-400 hover:text-white"
            }`}
          >
            Todos ({places.length})
          </button>
          <button
            onClick={() => setFilterStatus("WANT_TO_GO")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === "WANT_TO_GO"
                ? "bg-amber-500 text-black font-bold"
                : "bg-white/5 text-zinc-400 hover:text-white"
            }`}
          >
            Quero Ir ({places.length - visitedCount})
          </button>
          <button
            onClick={() => setFilterStatus("VISITED")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === "VISITED"
                ? "bg-amber-500 text-black font-bold"
                : "bg-white/5 text-zinc-400 hover:text-white"
            }`}
          >
            Visitados ({visitedCount})
          </button>
        </div>
      </div>

      {/* Grid of Places */}
      {filteredPlaces.length === 0 ? (
        <div className="text-center py-16 px-4 bg-zinc-900/20 rounded-3xl border border-dashed border-white/10 max-w-lg mx-auto">
          <MapPin className="text-zinc-500 w-10 h-10 mx-auto mb-3 opacity-60" />
          <h4 className="text-sm font-bold text-zinc-300">Nenhum lugar encontrado</h4>
          <p className="text-zinc-500 text-xs mt-1">
            {places.length === 0
              ? "Salve os pontos turísticos e restaurantes que você sonha em visitar nesta viagem."
              : "Nenhum lugar corresponde aos filtros aplicados."}
          </p>
          <button
            onClick={() => handleOpenModal(null)}
            className="mt-4 inline-flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-semibold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer border border-amber-500/20"
          >
            <Plus size={13} />
            Adicionar Primeiro Lugar
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlaces.map((place, idx) => {
            const cat = getCategoryConfig(place.category);
            const CatIcon = cat.icon;
            const prio = getPriorityBadge(place.priority);

            return (
              <motion.div
                key={place.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`group relative rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                  place.visited
                    ? "bg-zinc-950/40 border-white/5 opacity-65"
                    : "bg-zinc-900/40 border-white/10 hover:border-amber-500/30 hover:bg-zinc-900/70 shadow-md"
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`text-[10px] font-semibold py-0.5 px-2 rounded-lg border flex items-center gap-1 ${cat.color}`}>
                        <CatIcon size={11} />
                        {cat.label}
                      </span>
                      <span className={`text-[10px] py-0.5 px-2 rounded-lg border ${prio.color}`}>
                        {prio.label}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleVisited(place.id)}
                      className={`cursor-pointer transition-colors p-1 rounded-lg ${
                        place.visited
                          ? "text-emerald-400 hover:text-zinc-400"
                          : "text-zinc-500 hover:text-emerald-400"
                      }`}
                      title={place.visited ? "Desmarcar como visitado" : "Marcar como visitado"}
                    >
                      {place.visited ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <Circle size={18} />
                      )}
                    </button>
                  </div>

                  {/* Place Name */}
                  <h3
                    className={`text-base font-bold leading-tight ${
                      place.visited ? "line-through text-zinc-500" : "text-white"
                    }`}
                  >
                    {place.name}
                  </h3>

                  {/* Neighborhood / Address */}
                  {(place.neighborhood || place.address) && (
                    <p className="text-zinc-400 text-xs mt-1.5 flex items-center gap-1">
                      <MapPin size={11} className="text-amber-400 shrink-0" />
                      <span className="truncate">
                        {place.neighborhood ? `${place.neighborhood}` : ""}
                        {place.neighborhood && place.address ? " • " : ""}
                        {place.address || ""}
                      </span>
                    </p>
                  )}

                  {/* Notes */}
                  {place.notes && (
                    <p className="text-zinc-400 text-xs mt-2.5 bg-white/5 p-2.5 rounded-xl border border-white/5 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                      {place.notes}
                    </p>
                  )}

                  {/* Estimated cost */}
                  {place.estimatedCost && (
                    <div className="text-[11px] text-zinc-400 mt-2 font-mono">
                      Preço / Entrada: <span className="text-amber-300 font-semibold">{place.estimatedCost}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSchedulePlace(place)}
                    className="flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 px-3 py-1.5 rounded-xl border border-sky-500/20 transition-all cursor-pointer"
                    title="Adicionar este lugar a um dia específico do seu roteiro"
                  >
                    <CalendarPlus size={13} />
                    <span>Agendar no Roteiro</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        place.name + " " + (place.neighborhood || "") + " " + (place.address || "")
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                      title="Abrir no Google Maps"
                    >
                      <ExternalLink size={13} />
                    </a>
                    <button
                      onClick={() => handleOpenModal(place)}
                      className="p-1.5 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => handleDeletePlace(place.id)}
                      className="p-1.5 text-zinc-400 hover:text-red-400 bg-white/5 hover:bg-red-500/15 rounded-lg transition-colors cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal: Adicionar / Editar Lugar */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-[#0c0c12] border border-white/10 rounded-3xl p-6 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <MapPin className="text-amber-400" size={18} />
                  {editingPlace ? "Editar Lugar" : "Novo Lugar para Conhecer"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-zinc-500 hover:text-white p-1 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSavePlace} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Nome do Local *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Museu do Louvre, Central Park, Mirante..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Categoria
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as PlaceCategory)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="ATTRACTION">Ponto Turístico</option>
                      <option value="RESTAURANT">Restaurante</option>
                      <option value="CAFE">Café</option>
                      <option value="MUSEUM">Museu / Cultura</option>
                      <option value="VIEWPOINT">Mirante</option>
                      <option value="PARK">Parque / Natureza</option>
                      <option value="SHOPPING">Compras</option>
                      <option value="NIGHTLIFE">Vida Noturna</option>
                      <option value="OTHER">Outro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Prioridade
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as PlacePriority)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="MUST_VISIT">⭐ Imperdível</option>
                      <option value="HIGH">Alta Prioridade</option>
                      <option value="MEDIUM">Média Prioridade</option>
                      <option value="LOW">Se Sobrar Tempo</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Bairro / Região
                    </label>
                    <input
                      type="text"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      placeholder="Ex: Manhattan, Montmartre..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Preço Estimado
                    </label>
                    <input
                      type="text"
                      value={estimatedCost}
                      onChange={(e) => setEstimatedCost(e.target.value)}
                      placeholder="Ex: Gratuito, $25, €15..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Endereço Completo
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ex: Rua, número, cidade..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Notas & Dicas Importantes
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Reservar com antecedência, melhor pôr do sol às 18h..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold text-black bg-amber-500 hover:bg-amber-400 transition-colors cursor-pointer shadow-md shadow-amber-500/20"
                  >
                    Salvar Lugar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
