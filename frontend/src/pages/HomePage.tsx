import { LayoutGrid } from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { MasonryGrid, MasonryItem } from "@/components/ui/masonry-grid";
import { F1CountdownWidget } from "@/components/f1/f1-countdown-widget";
import { F1ChampionshipBattle } from "@/components/f1/f1-championship-battle";
import { MediaWidget } from "@/components/media/media-widget";
import { GamingWidget } from "@/components/gaming/gaming-widget";
import { ReadingWidget } from "@/components/reading/reading-widget";
import { ReadingPulseWidget } from "@/components/reading/reading-pulse-widget";
import { WeatherWidget } from "@/components/weather/weather-widget";
import { MediaBalanceWidget } from "@/components/media/media-balance-widget";
import { ReleaseRadarWidget } from "@/components/media/release-radar-widget";
import { SportsWidget } from "@/components/sports/sports-widget";

export default function Home() {
  return (
    <PageShell maxWidth="full">
      {/* Header + Weather */}
      <header className="pb-6 mb-6 border-b border-white/[0.06] flex flex-col xl:flex-row xl:items-end justify-between gap-5">
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#111113] border border-white/[0.08] flex items-center justify-center shrink-0">
              <LayoutGrid className="w-5 h-5 text-zinc-200" />
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-white">
                Life<span className="text-zinc-400">OS</span>
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                v1.0
              </span>
            </div>
          </div>

          <p className="text-zinc-400 text-xs sm:text-sm max-w-xl leading-relaxed">
            Seu sistema operacional de vida — rotina, hobbies e atualizações do
            dia em um só lugar.
          </p>
        </div>

        <div className="w-full xl:w-[420px] shrink-0">
          <WeatherWidget />
        </div>
      </header>

      {/* Auto-fitting Masonry Dashboard Grid (zero empty vertical gaps) */}
      <MasonryGrid>
        <MasonryItem colSpan={2}>
          <ReadingWidget />
        </MasonryItem>

        <MasonryItem colSpan={1}>
          <F1CountdownWidget />
        </MasonryItem>

        <MasonryItem colSpan={1}>
          <F1ChampionshipBattle />
        </MasonryItem>

        <MasonryItem colSpan={1}>
          <SportsWidget />
        </MasonryItem>

        <MasonryItem colSpan={2}>
          <ReleaseRadarWidget />
        </MasonryItem>

        <MasonryItem colSpan={2}>
          <MediaWidget />
        </MasonryItem>

        <MasonryItem colSpan={1}>
          <GamingWidget />
        </MasonryItem>

        <MasonryItem colSpan={2}>
          <ReadingPulseWidget />
        </MasonryItem>

        <MasonryItem colSpan={1}>
          <MediaBalanceWidget />
        </MasonryItem>
      </MasonryGrid>
    </PageShell>
  );
}
