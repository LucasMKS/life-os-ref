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
    },
    {
      id: "places" as TravelTabType,
      label: "Lugares para Ir",
      icon: MapPin,
      count: counts.places,
    },
    {
      id: "shopping" as TravelTabType,
      label: "Lista de Compras",
      icon: ShoppingBag,
      count:
        counts.shoppingPending !== undefined && counts.shoppingPending > 0
          ? counts.shoppingPending
          : counts.shopping,
    },
    {
      id: "notes" as TravelTabType,
      label: "Anotações",
      icon: FileText,
      count: null,
    },
    {
      id: "transport" as TravelTabType,
      label: "Voo & Hotel",
      icon: Plane,
      count: null,
    },
    {
      id: "map" as TravelTabType,
      label: "Ver no Mapa",
      icon: MapIcon,
      count: null,
    },
  ];

  return (
    <nav
      aria-label="Navegação da viagem"
      className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-5"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChangeTab(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer shrink-0 border ${
              isActive
                ? "bg-sky-500/15 text-sky-300 border-sky-500/30"
                : "bg-[#111113] text-zinc-400 border-white/[0.06] hover:text-zinc-100 hover:border-white/[0.12]"
            }`}
          >
            <Icon size={14} className={isActive ? "text-sky-400" : "text-zinc-400"} />
            <span>{tab.label}</span>
            {tab.count !== null && tab.count > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                  isActive
                    ? "bg-sky-500/20 text-sky-300"
                    : "bg-white/[0.06] text-zinc-300"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
