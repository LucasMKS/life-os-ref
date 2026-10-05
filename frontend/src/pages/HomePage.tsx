import { F1CountdownWidget } from "@/components/f1/f1-countdown-widget";
import { F1ChampionshipBattle } from "@/components/f1/f1-championship-battle";
import { MediaWidget } from "@/components/media/media-widget";
import { GamingWidget } from "@/components/gaming/gaming-widget";
import { ReadingWidget } from "@/components/reading/reading-widget";
import { ReadingPulseWidget } from "@/components/reading/reading-pulse-widget";
import { WeatherWidget } from "@/components/weather/weather-widget";
import { Navbar } from "@/components/navbar";
import { MediaBalanceWidget } from "@/components/media/media-balance-widget";
import { ReleaseRadarWidget } from "@/components/media/release-radar-widget";
import { SportsWidget } from "@/components/sports/sports-widget";
import { LayoutGrid, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col relative bg-[#09090b] text-zinc-100 selection:bg-white/10 overflow-x-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-zinc-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[120px] animate-pulse duration-700" />
        <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-blue-600/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] left-[10%] w-[300px] h-[300px] bg-emerald-600/5 rounded-full blur-[100px]" />
        
        {/* Fine grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
      </div>

      <Navbar />

      <div className="relative z-10 w-full max-w-[1600px] mx-auto mt-4 md:mt-12 px-4 md:px-10 pb-12 md:pb-20">
        {/* HEADER SECTION */}
        <header className="mb-6 md:mb-12 flex flex-col xl:flex-row xl:items-end justify-between gap-6 md:gap-10">
          <div className="animate-in slide-in-from-left-8 fade-in duration-700 ease-out">
            <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-zinc-600 to-zinc-400 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-[#09090b] border border-white/10 flex items-center justify-center shadow-2xl overflow-hidden">
                  <LayoutGrid className="w-5 h-5 md:w-6 md:h-6 text-white group-hover:scale-110 transition-transform duration-500" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white">
                    Life
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-zinc-500">
                      OS
                    </span>
                  </h1>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-zinc-400 uppercase tracking-widest h-fit">
                    <Sparkles className="w-3 h-3 text-zinc-300" /> v1.0
                  </div>
                </div>
              </div>
            </div>
            <p className="text-zinc-500 max-w-xl text-sm md:text-lg font-medium leading-relaxed">
              Bem-vindo ao seu sistema operacional de vida. <br className="hidden md:block" />
              Sua rotina, seus hobbies e o que importa para você hoje, tudo em um só lugar.
            </p>
          </div>

          {/* Compact Weather Widget in Header */}
          <div className="w-full xl:w-[400px] shrink-0 animate-in slide-in-from-right-8 fade-in duration-700 ease-out">
            <div className="group transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,255,255,0.03)] rounded-[32px] overflow-hidden">
              <WeatherWidget />
            </div>
          </div>
        </header>

        <div className="flex flex-col gap-5 md:gap-10 w-full">
          {/* PRIMARY ROW: CORE UPDATES */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-8 w-full items-stretch animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <div className="lg:col-span-6 w-full group order-1">
              <ReadingWidget />
            </div>
            <div className="lg:col-span-3 w-full group order-2">
              <F1CountdownWidget />
            </div>
            <div className="lg:col-span-3 w-full group order-3">
              <F1ChampionshipBattle />
            </div>
          </section>

          {/* SECONDARY ROW: LIVE SPORTS & DISCOVERY */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-8 w-full items-stretch animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <div className="lg:col-span-4 flex flex-col w-full group">
              <SportsWidget />
            </div>
            <div className="lg:col-span-8 flex flex-col w-full group">
              <ReleaseRadarWidget />
            </div>
          </section>

          {/* TERTIARY ROW: MEDIA & ENTERTAINMENT */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-700 delay-250">
            <div className="lg:col-span-7 flex flex-col w-full group">
              <MediaWidget />
            </div>
            <div className="lg:col-span-5 flex flex-col w-full group">
              <GamingWidget />
            </div>
          </section>

          {/* QUATERNARY ROW: PERFORMANCE & STATS */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <div className="lg:col-span-8 group">
              <ReadingPulseWidget />
            </div>
            <div className="lg:col-span-4 group">
              <MediaBalanceWidget />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
