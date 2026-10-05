"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { LayoutGrid, Gamepad2, Rss } from "lucide-react";
import { Twitch } from "./twitch-icon";
import { GamingOverviewTab } from "./tabs/gaming-overview-tab";
import { GamingSteamTab } from "./tabs/gaming-steam-tab";
import { GamingTwitchTab } from "./tabs/gaming-twitch-tab";
import { GamingNewsTab } from "./tabs/gaming-news-tab";

type GamingTab = "overview" | "steam" | "twitch" | "news";

const TABS: { value: GamingTab; label: string; icon: React.ComponentType<{ className?: string; size?: number | string }> }[] = [
  { value: "overview", label: "Visão Geral", icon: LayoutGrid },
  { value: "steam", label: "Steam", icon: Gamepad2 },
  { value: "twitch", label: "Twitch", icon: Twitch },
  { value: "news", label: "Notícias", icon: Rss },
];

function isValidTab(value: string | null): value is GamingTab {
  return TABS.some((t) => t.value === value);
}

export function GamingTabs() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawTab = searchParams.get("tab");
  const activeTab: GamingTab = isValidTab(rawTab) ? rawTab : "overview";

  const handleTabChange = (value: GamingTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`/gaming?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8 h-full">
      <div className="overflow-x-auto -mx-1 px-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        <div className="inline-flex gap-1 bg-[#121214]/60 p-1 rounded-2xl border border-white/5 backdrop-blur-md">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => handleTabChange(tab.value)}
                className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-[400px]">
        {activeTab === "overview" && <GamingOverviewTab />}
        {activeTab === "steam" && <GamingSteamTab />}
        {activeTab === "twitch" && <GamingTwitchTab />}
        {activeTab === "news" && <GamingNewsTab />}
      </div>
    </div>
  );
}
