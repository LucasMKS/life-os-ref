"use client";

import { useState } from "react";
import TravelMap from "@/components/travel/Map";
import { Map as MapIcon, Compass, MapPin, Layers } from "lucide-react";
import { ItineraryItem, PlaceToVisit, Trip } from "@/lib/types";
import { FilterPill } from "@/components/ui/page-shell";

interface TripMapTabProps {
  trip: Trip;
  items: ItineraryItem[];
  places?: PlaceToVisit[];
}

export function TripMapTab({ trip, items, places = [] }: TripMapTabProps) {
  const [filterSource, setFilterSource] = useState<"ALL" | "ITINERARY" | "PLACES">("ALL");

  const totalPointsCount = items.length + places.length;

  return (
    <div className="space-y-4">
      {/* Header & Source Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <MapIcon className="text-zinc-400" size={18} />
            Mapa Interativo
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Visualize atividades do roteiro e lugares salvos em {trip.destination}.
          </p>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <FilterPill
            accent="sky"
            active={filterSource === "ALL"}
            onClick={() => setFilterSource("ALL")}
          >
            <Layers size={12} />
            <span>Todos ({totalPointsCount})</span>
          </FilterPill>

          <FilterPill
            accent="sky"
            active={filterSource === "ITINERARY"}
            onClick={() => setFilterSource("ITINERARY")}
          >
            <Compass size={12} />
            <span>Roteiro ({items.length})</span>
          </FilterPill>

          <FilterPill
            accent="sky"
            active={filterSource === "PLACES"}
            onClick={() => setFilterSource("PLACES")}
          >
            <MapPin size={12} />
            <span>Lugares ({places.length})</span>
          </FilterPill>
        </div>
      </div>

      {/* Interactive Map Container */}
      <div className="h-[420px] sm:h-[560px] rounded-2xl overflow-hidden border border-white/[0.06] relative">
        <TravelMap
          destination={trip.destination}
          items={items}
          places={places}
          filterSource={filterSource}
        />
      </div>
    </div>
  );
}
