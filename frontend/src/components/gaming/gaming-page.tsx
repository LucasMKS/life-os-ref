"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Gamepad2,
  BarChart3,
  Tv,
  Rss,
  ExternalLink,
} from "lucide-react";
import { gamingApi } from "@/lib/api";
import { SteamProfileHeader } from "./steam/steam-profile-header";
import { SteamStatsChart } from "./steam/steam-stats-chart";
import { SteamTopInsights } from "./steam/steam-top-insights";
import { SteamLibraryModal } from "./steam/steam-library-modal";
import { SteamLinkPrompt } from "./steam/steam-link-prompt";
import { TwitchWidget } from "./twitch-widget";
import { TwitchDvrSection } from "./twitch-dvr-section";
import { GamingNewsTab } from "./tabs/gaming-news-tab";

export function GamingDashboard() {
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["steam-profile"],
    queryFn: gamingApi.getSteamProfile,
    retry: false,
  });

  return (
    <div className="flex flex-col gap-8 md:gap-10 w-full">
      {/* 1. SEÇÃO STEAM: PERFIL E ATIVIDADE ATUAL */}
      <section className="flex flex-col gap-4">
        {profile ? (
          <SteamProfileHeader
            onOpenLibrary={() => setIsLibraryModalOpen(true)}
          />
        ) : (
          <SteamLinkPrompt />
        )}
      </section>

      {/* 2. SEÇÃO ESTATÍSTICAS STEAM (EM DESTAQUE) */}
      {profile && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-bold text-white tracking-tight">
                  Estatísticas & Pulso de Jogo
                </h3>
                <p className="text-xs text-zinc-400">
                  Tempo jogado, consistência e recordes da sua conta Steam.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsLibraryModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 transition-colors"
            >
              <Gamepad2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Ver Biblioteca</span>
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <SteamStatsChart />
            <SteamTopInsights />
          </div>
        </section>
      )}

      {/* 3. SEÇÃO TWITCH & GRAVAÇÃO AUTOMÁTICA (DVR) */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Tv className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-bold text-white tracking-tight">
                Twitch Radar & Gravador
              </h3>
              <p className="text-xs text-zinc-400">
                Transmissões ao vivo, canais monitorados e gravações automáticas.
              </p>
            </div>
          </div>

          <a
            href={
              (import.meta as any).env?.VITE_TWITCH_DVR_URL ||
              (typeof window !== "undefined" &&
              window.location.hostname === "localhost"
                ? "http://localhost:8082"
                : "https://dvr.lucasmks.com.br")
            }
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 transition-colors"
          >
            <span>Painel DVR</span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
          </a>
        </div>

        <div className="flex flex-col gap-6">
          <TwitchWidget showManagement={true} />
          <TwitchDvrSection />
        </div>
      </section>

      {/* 4. SEÇÃO NOTÍCIAS & ATUALIZAÇÕES */}
      <section className="flex flex-col gap-4">
        <GamingNewsTab />
      </section>

      {/* MODAL DA BIBLIOTECA STEAM */}
      <SteamLibraryModal
        isOpen={isLibraryModalOpen}
        onClose={() => setIsLibraryModalOpen(false)}
      />
    </div>
  );
}
