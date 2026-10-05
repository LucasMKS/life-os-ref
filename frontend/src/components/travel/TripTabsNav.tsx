"use client";

import {
  Compass,
  MapPin,
  ShoppingBag,
  FileText,
  Plane,
  Map as MapIcon,
} from "lucide-react";

export type TravelTabType =
  | "itinerary"
  | "places"
  | "shopping"
  | "notes"
  | "transport"
  | "map";

interface TripTabsNavProps {
  activeTab: TravelTabType;
  onChangeTab: (tab: TravelTabType) => void;
  counts: {
    itinerary: number;
    places: number;
    shopping: number;
    shoppingPending?: number;
    hasNotes?: boolean;
  };
}

export function TripTabsNav({ activeTab, onChangeTab, counts }: TripTabsNavProps) {
  const tabs = [
    {
      id: "itinerary" as TravelTabType,
      label: "Roteiro & Itinerário",
      icon: Compass,
      count: counts.itinerary,
      countColor: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    },
    {
      id: "places" as TravelTabType,
      label: "Lugares para Ir",
      icon: MapPin,
      count: counts.places,
      countColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    {
      id: "shopping" as TravelTabType,
      label: "Lista de Compras",
      icon: ShoppingBag,
      count: counts.shoppingPending !== undefined && counts.shoppingPending > 0 ? counts.shoppingPending : counts.shopping,
      countColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    {
      id: "notes" as TravelTabType,
      label: "Anotações",
      icon: FileText,
      count: null,
      countColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    {
      id: "transport" as TravelTabType,
      label: "Voo & Hotel",
      icon: Plane,
      count: null,
      countColor: "",
    },
    {
      id: "map" as TravelTabType,
      label: "Ver no Mapa",
      icon: MapIcon,
      count: null,
      countColor: "",
    },
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent mb-6">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 border ${
              isActive
                ? "bg-sky-500 text-black border-sky-400 shadow-[0_2px_10px_rgba(56,189,248,0.25)] font-extrabold"
                : "bg-zinc-900/60 text-zinc-400 border-white/5 hover:text-white hover:bg-zinc-800/80 hover:border-white/10"
            }`}
          >
            <Icon size={15} className={isActive ? "text-black" : "text-sky-400"} />
            <span>{tab.label}</span>
            {tab.count !== null && tab.count > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full border font-mono ${
                  isActive
                    ? "bg-black/20 text-black border-black/20"
                    : tab.countColor
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
