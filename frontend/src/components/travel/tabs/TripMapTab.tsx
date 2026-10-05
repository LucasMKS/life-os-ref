"use client";

import { useState } from "react";
import TravelMap from "@/components/travel/Map";
import { Map as MapIcon, Compass, MapPin, Layers } from "lucide-react";
import { ItineraryItem, PlaceToVisit, Trip } from "@/lib/types";

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MapIcon className="text-sky-400" size={20} />
            Mapa Interativo dos Pontos
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Visualize no mapa tanto as atividades do seu Roteiro quanto os seus Lugares para Ir em {trip.destination}.
          </p>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-zinc-900/60 p-1 rounded-2xl border border-white/5">
          <button
            onClick={() => setFilterSource("ALL")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterSource === "ALL"
                ? "bg-sky-500 text-black shadow-md shadow-sky-500/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Layers size={13} />
            <span>Todos ({totalPointsCount})</span>
          </button>

          <button
            onClick={() => setFilterSource("ITINERARY")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterSource === "ITINERARY"
                ? "bg-sky-500 text-black shadow-md shadow-sky-500/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Compass size={13} />
            <span>Roteiro ({items.length})</span>
          </button>

          <button
            onClick={() => setFilterSource("PLACES")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterSource === "PLACES"
                ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <MapPin size={13} />
            <span>Lugares ({places.length})</span>
          </button>
        </div>
      </div>

      {/* Interactive Map Container */}
      <div className="h-[580px] rounded-3xl overflow-hidden border border-sky-500/20 shadow-2xl relative">
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
