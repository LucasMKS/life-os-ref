"use client";

import { Suspense, lazy, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  ExternalLink,
  Gamepad2,
  LayoutGrid,
  Rss,
  Tv,
} from "lucide-react";
import { gamingApi } from "@/lib/api";
import { sanitizeUrl } from "@/lib/security";
import { FilterPill } from "@/components/ui/page-shell";
import { SteamProfileHeader } from "./steam/steam-profile-header";
import { SteamStatsChart } from "./steam/steam-stats-chart";
import { SteamTopInsights } from "./steam/steam-top-insights";
import { SteamLinkPrompt } from "./steam/steam-link-prompt";
import { TwitchWidget } from "./twitch-widget";
import { TwitchDvrSection } from "./twitch-dvr-section";
import { GamingNewsTab } from "./tabs/gaming-news-tab";

const SteamLibraryModal = lazy(() =>
  import("./steam/steam-library-modal").then((m) => ({
    default: m.SteamLibraryModal,
  }))
);

type GamingSectionTab = "all" | "steam" | "twitch" | "news";

const TABS: { id: GamingSectionTab; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "Visão Geral", icon: <LayoutGrid className="w-3.5 h-3.5" /> },
  { id: "steam", label: "Steam", icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { id: "twitch", label: "Twitch & DVR", icon: <Tv className="w-3.5 h-3.5" /> },
  { id: "news", label: "Notícias", icon: <Rss className="w-3.5 h-3.5" /> },
];

function getDvrUrl(): string | null {
  const envUrl = (import.meta as unknown as { env?: Record<string, string> })
    ?.env?.VITE_TWITCH_DVR_URL;
  const fallback =
    typeof window !== "undefined" && window.location.hostname === "localhost"
      ? "http://localhost:8082"
      : "https://dvr.lucasmks.com.br";
  return sanitizeUrl(envUrl || fallback);
}

export function GamingDashboard() {
  const [activeTab, setActiveTab] = useState<GamingSectionTab>("all");
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["steam-profile"],
    queryFn: gamingApi.getSteamProfile,
    retry: false,
  });

  const dvrUrl = getDvrUrl();
  const showSteam = activeTab === "all" || activeTab === "steam";
  const showTwitch = activeTab === "all" || activeTab === "twitch";
  const showNews = activeTab === "all" || activeTab === "news";

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Navigation Filter Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 max-w-full">
          {TABS.map((tab) => (
            <FilterPill
              key={tab.id}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              accent="blue"
            >
              {tab.icon}
              <span>{tab.label}</span>
            </FilterPill>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {profile && (
            <button
              type="button"
              onClick={() => setIsLibraryModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] text-zinc-200 border border-white/[0.08] hover:bg-white/[0.1] text-xs font-medium transition-colors"
            >
              <Gamepad2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Biblioteca Steam</span>
            </button>
          )}
          {dvrUrl && (
            <a
              href={dvrUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] text-zinc-200 border border-white/[0.08] hover:bg-white/[0.1] text-xs font-medium transition-colors"
            >
              <span>Painel DVR</span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
            </a>
          )}
        </div>
      </div>

      {/* 1. STEAM SECTION */}
      {showSteam && (
        <section className="flex flex-col gap-4">
          {profile ? (
            <>
              <SteamProfileHeader
                onOpenLibrary={() => setIsLibraryModalOpen(true)}
              />
              <SteamStatsChart />
              <SteamTopInsights />
            </>
          ) : (
            <SteamLinkPrompt />
          )}
        </section>
      )}

      {/* 2. TWITCH & DVR SECTION */}
      {showTwitch && (
        <section className="flex flex-col gap-4">
          <TwitchWidget showManagement={true} />
          <TwitchDvrSection />
        </section>
      )}

      {/* 3. GAMING NEWS SECTION */}
      {showNews && (
        <section className="flex flex-col gap-4">
          <GamingNewsTab />
        </section>
      )}

      {/* LAZY STEAM LIBRARY MODAL */}
      {isLibraryModalOpen && (
        <Suspense fallback={null}>
          <SteamLibraryModal
            isOpen={isLibraryModalOpen}
            onClose={() => setIsLibraryModalOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
