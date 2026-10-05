"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { History, Library, Loader2, Trophy } from "lucide-react";
import { gamingApi } from "@/lib/api";
import { SteamLinkPrompt } from "../steam/steam-link-prompt";
import { SteamProfileHeader } from "../steam/steam-profile-header";
import { SteamLibraryGrid } from "../steam/steam-library-grid";
import { SteamJournalSection } from "../steam/steam-journal-section";
import { SteamStatsChart } from "../steam/steam-stats-chart";
import { SteamTopInsights } from "../steam/steam-top-insights";

type SteamSubTab = "library" | "journal" | "stats";

const SUB_TABS: { value: SteamSubTab; label: string; icon: typeof Library }[] = [
  { value: "library", label: "Biblioteca", icon: Library },
  { value: "journal", label: "Diário & Fila", icon: Trophy },
  { value: "stats", label: "Estatísticas", icon: History },
];

export function GamingSteamTab() {
  const [activeSubTab, setActiveSubTab] = useState<SteamSubTab>("library");

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["steam-profile"],
    queryFn: gamingApi.getSteamProfile,
    retry: false,
  });

  if (isLoadingProfile) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!profile) return <SteamLinkPrompt />;

  return (
    <div className="flex flex-col gap-6">
      <SteamProfileHeader />

      <div className="flex gap-1 bg-[#121214]/60 p-1 rounded-2xl border border-white/5 self-start overflow-x-auto">
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveSubTab(tab.value)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-[400px]">
        {activeSubTab === "library" && <SteamLibraryGrid />}
        {activeSubTab === "journal" && <SteamJournalSection />}
        {activeSubTab === "stats" && (
          <div className="flex flex-col gap-6">
            <SteamStatsChart />
            <SteamTopInsights />
          </div>
        )}
      </div>
    </div>
  );
}
