"use client";

import { useState, useMemo } from "react";
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
  X,
} from "lucide-react";
import { PlaceToVisit, PlaceCategory, PlacePriority } from "@/lib/types";
import { FilterPill, EmptyState } from "@/components/ui/page-shell";
import { sanitizeUrl } from "@/lib/security";

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
      setName(place.name || "");
      setCategory(place.category || "ATTRACTION");
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
    const q = searchTerm.trim().toLowerCase();
    return places.filter((p) => {
      const matchesSearch =
        !q ||
        (p.name || "").toLowerCase().includes(q) ||
        (p.neighborhood || "").toLowerCase().includes(q) ||
        (p.notes || "").toLowerCase().includes(q);

      const matchesStatus =
        filterStatus === "ALL"
          ? true
          : filterStatus === "VISITED"
          ? p.visited
          : !p.visited;

      return matchesSearch && matchesStatus;
    });
  }, [places, searchTerm, filterStatus]);

  const getCategoryConfig = (cat: PlaceCategory) => {
    switch (cat) {
      case "RESTAURANT":
        return { label: "Restaurante", icon: Utensils, color: "text-amber-300 bg-amber-500/10 border-amber-500/20" };
      case "CAFE":
        return { label: "Café", icon: Coffee, color: "text-orange-300 bg-orange-500/10 border-orange-500/20" };
      case "MUSEUM":
        return { label: "Museu / Cultura", icon: Landmark, color: "text-purple-300 bg-purple-500/10 border-purple-500/20" };
      case "VIEWPOINT":
        return { label: "Mirante", icon: Eye, color: "text-zinc-200 bg-white/[0.06] border-white/[0.1]" };
      case "PARK":
        return { label: "Parque / Natureza", icon: Trees, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
      case "SHOPPING":
        return { label: "Compras", icon: ShoppingBag, color: "text-pink-300 bg-pink-500/10 border-pink-500/20" };
      case "NIGHTLIFE":
        return { label: "Vida Noturna", icon: Moon, color: "text-violet-300 bg-violet-500/10 border-violet-500/20" };
      default:
        return { label: "Ponto Turístico", icon: Camera, color: "text-zinc-300 bg-white/[0.05] border-white/[0.08]" };
    }
  };

  const getPriorityBadge = (prio: PlacePriority) => {
    switch (prio) {
      case "MUST_VISIT":
        return { label: "Imperdível", color: "text-amber-300 bg-amber-500/10 border-amber-500/20 font-semibold" };
      case "HIGH":
        return { label: "Alta prioridade", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
      case "LOW":
        return { label: "Se sobrar tempo", color: "text-zinc-500 bg-white/[0.03] border-white/[0.06]" };
      default:
        return { label: "Média prioridade", color: "text-zinc-300 bg-white/[0.05] border-white/[0.08]" };
    }
  };

  const visitedCount = places.filter((p) => p.visited).length;

  return (
    <div className="space-y-5">
      {/* Top Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <MapPin className="text-zinc-400" size={18} />
            Lugares para Ir
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Sua lista de desejos de atrações, mirantes, restaurantes e pontos turísticos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenModal(null)}
          className="inline-flex items-center justify-center gap-1.5 bg-zinc-100 text-zinc-950 hover:bg-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus size={15} strokeWidth={2.2} />
          <span>Adicionar Lugar</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#09090b] border border-white/[0.06] p-3 rounded-xl">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por nome, bairro ou dica..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#111113] border border-white/[0.06] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/25 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 md:pb-0">
          <FilterPill active={filterStatus === "ALL"} onClick={() => setFilterStatus("ALL")}>
            Todos ({places.length})
          </FilterPill>
          <FilterPill
            active={filterStatus === "WANT_TO_GO"}
            onClick={() => setFilterStatus("WANT_TO_GO")}
          >
            Quero Ir ({places.length - visitedCount})
          </FilterPill>
          <FilterPill
            active={filterStatus === "VISITED"}
            onClick={() => setFilterStatus("VISITED")}
          >
            Visitados ({visitedCount})
          </FilterPill>
        </div>
      </div>

      {/* Grid of Places */}
      {filteredPlaces.length === 0 ? (
        <EmptyState
          icon={<MapPin size={24} />}
          title="Nenhum lugar encontrado"
          description={
            places.length === 0
              ? "Salve os pontos turísticos e restaurantes que você deseja visitar nesta viagem."
              : "Nenhum lugar corresponde aos filtros aplicados."
          }
          action={
            <button
              type="button"
              onClick={() => handleOpenModal(null)}
              className="inline-flex items-center gap-1.5 bg-white/[0.05] text-zinc-200 border border-white/[0.08] hover:bg-white/[0.1] font-medium text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Plus size={13} />
              <span>Adicionar Primeiro Lugar</span>
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlaces.map((place) => {
            const cat = getCategoryConfig(place.category);
            const CatIcon = cat.icon;
            const prio = getPriorityBadge(place.priority);
            const safeMapUrl = sanitizeUrl(
              place.mapUrl ||
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${place.name || ""} ${place.neighborhood || ""} ${place.address || ""}`.trim()
                )}`
            );

            return (
              <div
                key={place.id}
                className={`group rounded-2xl border p-4 sm:p-5 flex flex-col justify-between transition-colors ${
                  place.visited
                    ? "bg-[#09090b] border-white/[0.04] opacity-65"
                    : "bg-[#09090b] border-white/[0.06] hover:border-white/[0.14]"
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`text-[10px] font-medium py-0.5 px-2 rounded-md border flex items-center gap-1 ${cat.color}`}
                      >
                        <CatIcon size={11} />
                        {cat.label}
                      </span>
                      <span className={`text-[10px] py-0.5 px-2 rounded-md border ${prio.color}`}>
                        {prio.label}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleVisited(place.id)}
                      className={`cursor-pointer transition-colors p-1 rounded-lg ${
                        place.visited
                          ? "text-emerald-400 hover:text-zinc-400"
                          : "text-zinc-500 hover:text-emerald-400"
                      }`}
                      title={place.visited ? "Desmarcar como visitado" : "Marcar como visitado"}
                    >
                      {place.visited ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                    </button>
                  </div>

                  {/* Place Name */}
                  <h3
                    className={`text-sm sm:text-base font-bold leading-snug ${
                      place.visited ? "line-through text-zinc-500" : "text-white"
                    }`}
                  >
                    {place.name}
                  </h3>

                  {/* Neighborhood / Address */}
                  {(place.neighborhood || place.address) && (
                    <p className="text-zinc-400 text-xs mt-1.5 flex items-center gap-1.5">
                      <MapPin size={11} className="text-zinc-500 shrink-0" />
                      <span className="truncate">
                        {place.neighborhood || ""}
                        {place.neighborhood && place.address ? " · " : ""}
                        {place.address || ""}
                      </span>
                    </p>
                  )}

                  {/* Notes */}
                  {place.notes && (
                    <p className="text-zinc-400 text-xs mt-2.5 bg-[#111113] p-2.5 rounded-xl border border-white/[0.05] line-clamp-3 leading-relaxed whitespace-pre-wrap">
                      {place.notes}
                    </p>
                  )}

                  {/* Estimated cost */}
                  {place.estimatedCost && (
                    <div className="text-[11px] text-zinc-400 mt-2.5 font-mono">
                      Entrada: <span className="text-zinc-200 font-semibold">{place.estimatedCost}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3.5 mt-4 border-t border-white/[0.06] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onSchedulePlace(place)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-200 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] px-3 py-1.5 rounded-lg border border-white/[0.08] transition-colors cursor-pointer"
                    title="Adicionar este lugar a um dia do roteiro"
                  >
                    <CalendarPlus size={13} />
                    <span>Agendar no Roteiro</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {safeMapUrl && (
                      <a
                        href={safeMapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] rounded-lg border border-white/[0.06] transition-colors"
                        title="Abrir no Google Maps"
                      >
                        <ExternalLink size={13} />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenModal(place)}
                      className="p-1.5 text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] rounded-lg border border-white/[0.06] transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePlace(place.id)}
                      className="p-1.5 text-zinc-400 hover:text-red-400 bg-white/[0.04] hover:bg-red-500/10 rounded-lg border border-white/[0.06] transition-colors cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Adicionar / Editar Lugar */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={() => setIsModalOpen(false)}
            className="absolute inset-0 bg-black/80"
          />
          <div className="relative w-full max-w-lg bg-[#111113] border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-2xl z-10 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MapPin className="text-zinc-400" size={18} />
                {editingPlace ? "Editar Lugar" : "Novo Lugar para Conhecer"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePlace} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Nome do Local *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Museu do Louvre, Central Park, Mirante..."
                  className="w-full bg-[#09090b] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/25 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as PlaceCategory)}
                    className="w-full bg-[#09090b] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/25"
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
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    Prioridade
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as PlacePriority)}
                    className="w-full bg-[#09090b] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/25"
                  >
                    <option value="MUST_VISIT">Imperdível</option>
                    <option value="HIGH">Alta Prioridade</option>
                    <option value="MEDIUM">Média Prioridade</option>
                    <option value="LOW">Se Sobrar Tempo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    Bairro / Região
                  </label>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Ex: Manhattan, Montmartre..."
                    className="w-full bg-[#09090b] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/25"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    Preço Estimado
                  </label>
                  <input
                    type="text"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    placeholder="Ex: Gratuito, $25, €15..."
                    className="w-full bg-[#09090b] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/25"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Endereço Completo
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Rua, número, cidade..."
                  className="w-full bg-[#09090b] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/25"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Notas & Dicas Importantes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Reservar com antecedência, melhor pôr do sol às 18h..."
                  className="w-full bg-[#09090b] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/25 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-white/[0.05] text-zinc-200 border border-white/[0.08] hover:bg-white/[0.1] px-4 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-zinc-100 text-zinc-950 hover:bg-white px-5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Salvar Lugar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
