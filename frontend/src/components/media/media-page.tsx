"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { MediaStatsStrip } from "@/components/media/media-stats-strip";
import { RecentWatchlistPreview } from "@/components/media/recent-watchlist-preview";
import { EpisodeWatchlist } from "@/components/media/episode-watchlist";
import { MediaStats } from "@/components/media/media-stats";
import { UpcomingReleasesRadar } from "@/components/media/upcoming-releases-radar";

const LMS_URL = "https://filmes.lucasmks.com.br";

export function MediaDashboard() {
  const [activeView, setActiveView] = useState<"dashboard" | "stats">("dashboard");

  return (
    <div className="w-full flex flex-col gap-5 md:gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#121214]/60 backdrop-blur-md border border-white/5 rounded-2xl px-4 py-3 md:px-5 md:py-4">
        <div className="flex flex-col">
          <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-zinc-500">
            Catálogo principal
          </span>
          <span className="text-sm md:text-base text-zinc-200 font-medium">
            O LMS Filmes é a fonte de verdade da sua watchlist.
          </span>
        </div>
        <a
          href={LMS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="self-stretch sm:self-auto flex items-center justify-center gap-1.5 text-xs md:text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 px-4 py-2.5 md:px-5 md:py-2.5 rounded-full transition-all shadow-lg shadow-purple-500/20"
        >
          Gerenciar no LMS Filmes
          <ArrowUpRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </a>
      </div>

      <MediaStatsStrip />

      {/* Sub-navigation Tabs */}
      <div className="flex border-b border-white/5 gap-6">
        <button
          onClick={() => setActiveView("dashboard")}
          className={`pb-3 text-xs md:text-sm font-bold uppercase tracking-wider transition-all relative ${
            activeView === "dashboard"
              ? "text-purple-400"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          Minha Watchlist
          {activeView === "dashboard" && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-purple-500 rounded-full animate-in fade-in duration-200" />
          )}
        </button>
        <button
          onClick={() => setActiveView("stats")}
          className={`pb-3 text-xs md:text-sm font-bold uppercase tracking-wider transition-all relative ${
            activeView === "stats"
              ? "text-purple-400"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          Estatísticas
          {activeView === "stats" && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-purple-500 rounded-full animate-in fade-in duration-200" />
          )}
        </button>
      </div>

      {activeView === "dashboard" ? (
        <>
          {/* Grid: Radar de Lançamentos e Últimos adicionados (Lado a Lado no Desktop) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-8 items-stretch">
            <div className="lg:col-span-8 xl:col-span-9 flex flex-col">
              <UpcomingReleasesRadar />
            </div>
            <div className="lg:col-span-4 xl:col-span-3 flex flex-col">
              <RecentWatchlistPreview />
            </div>
          </div>

          {/* Watchlist principal centralizada */}
          <EpisodeWatchlist />
        </>
      ) : (
        <MediaStats />
      )}
    </div>
  );
}
