"use client";

import { useState } from "react";
import { BarChart2, Calendar, LayoutGrid, PlayCircle } from "lucide-react";
import { FilterPill } from "@/components/ui/page-shell";
import { MediaStatsStrip } from "@/components/media/media-stats-strip";
import { RecentWatchlistPreview } from "@/components/media/recent-watchlist-preview";
import { EpisodeWatchlist } from "@/components/media/episode-watchlist";
import { MediaStats } from "@/components/media/media-stats";
import { UpcomingReleasesRadar } from "@/components/media/upcoming-releases-radar";

type MediaSectionTab = "all" | "watching" | "radar" | "stats";

const TABS: { id: MediaSectionTab; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "Visão Geral", icon: <LayoutGrid className="w-3.5 h-3.5" /> },
  { id: "watching", label: "Assistindo", icon: <PlayCircle className="w-3.5 h-3.5" /> },
  { id: "radar", label: "Radar", icon: <Calendar className="w-3.5 h-3.5" /> },
  { id: "stats", label: "Estatísticas", icon: <BarChart2 className="w-3.5 h-3.5" /> },
];

export function MediaDashboard() {
  const [activeSection, setActiveSection] = useState<MediaSectionTab>("all");

  const showWatching = activeSection === "all" || activeSection === "watching";
  const showRadar = activeSection === "all" || activeSection === "radar";
  const showStats = activeSection === "all" || activeSection === "stats";

  return (
    <div className="w-full flex flex-col gap-6 md:gap-8">
      {/* 1. Resumo Rápido */}
      <MediaStatsStrip />

      {/* Navegação por Seção */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {TABS.map((tab) => (
          <FilterPill
            key={tab.id}
            accent="purple"
            active={activeSection === tab.id}
            onClick={() => setActiveSection(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </FilterPill>
        ))}
      </div>

      {/* 2. Continuar Assistindo */}
      {showWatching && (
        <section className="flex flex-col gap-3">
          <EpisodeWatchlist />
        </section>
      )}

      {/* 3. Radar de Estreias & Recentes */}
      {showRadar && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 items-stretch">
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col">
            <UpcomingReleasesRadar />
          </div>
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col">
            <RecentWatchlistPreview />
          </div>
        </section>
      )}

      {/* 4. Estatísticas e Hábitos */}
      {showStats && (
        <section className="flex flex-col gap-4">
          <MediaStats />
        </section>
      )}
    </div>
  );
}
