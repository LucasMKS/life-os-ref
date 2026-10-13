"use client";

import { BarChart2, Calendar, PlayCircle } from "lucide-react";
import { MediaStatsStrip } from "@/components/media/media-stats-strip";
import { RecentWatchlistPreview } from "@/components/media/recent-watchlist-preview";
import { EpisodeWatchlist } from "@/components/media/episode-watchlist";
import { MediaStats } from "@/components/media/media-stats";
import { UpcomingReleasesRadar } from "@/components/media/upcoming-releases-radar";

export function MediaDashboard() {
  return (
    <div className="w-full flex flex-col gap-8 md:gap-10">
      {/* 1. FAIXA DE RESUMO RÁPIDO */}
      <MediaStatsStrip />

      {/* 2. PRÓXIMOS EPISÓDIOS PARA ASSISTIR */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <PlayCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-bold text-white tracking-tight">
              Continuar Assistindo
            </h3>
            <p className="text-xs text-zinc-400">
              Episódios disponíveis das séries que você está acompanhando.
            </p>
          </div>
        </div>

        <EpisodeWatchlist />
      </section>

      {/* 3. RADAR DE ESTREIAS & ADICIONADOS RECENTES */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-bold text-white tracking-tight">
              Radar de Estreias & Recentes
            </h3>
            <p className="text-xs text-zinc-400">
              Próximos episódios a ir ao ar e os títulos mais recentes da sua lista.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-8 items-stretch">
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col">
            <UpcomingReleasesRadar />
          </div>
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col">
            <RecentWatchlistPreview />
          </div>
        </div>
      </section>

      {/* 4. ESTATÍSTICAS E HÁBITOS */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-bold text-white tracking-tight">
              Estatísticas & Hábitos
            </h3>
            <p className="text-xs text-zinc-400">
              Horas assistidas, gêneros favoritos e evolução do seu catálogo.
            </p>
          </div>
        </div>

        <MediaStats />
      </section>
    </div>
  );
}
