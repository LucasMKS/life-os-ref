import { Suspense } from "react";
import { GamingDashboard } from "@/components/gaming/gaming-page";
import { Navbar } from "@/components/navbar";
import { Gamepad2, Loader2, Sparkles } from "lucide-react";

export default function GamingPage() {
  return (
    <main className="min-h-screen flex flex-col relative bg-[#09090b] text-zinc-100 selection:bg-blue-500/30 overflow-x-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[140px]" />
        <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] bg-purple-600/5 rounded-full blur-[140px]" />

        {/* Fine grid pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
      </div>

      <Navbar />

      <div className="z-10 w-full max-w-[1500px] mx-auto mt-4 md:mt-10 px-4 md:px-8 pb-16 md:pb-24">
        {/* HEADER SECTION */}
        <header className="mb-6 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="animate-in slide-in-from-left-6 fade-in duration-500 ease-out">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-blue-400 shadow-lg">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white">
                  Mundo{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                    Gamer
                  </span>
                </h1>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                  <Sparkles className="w-2.5 h-2.5 text-blue-400" /> HUB
                </div>
              </div>
            </div>
            <p className="text-zinc-400 text-xs md:text-sm font-medium max-w-xl">
              Estatísticas da Steam, transmissões ao vivo na Twitch, gravador DVR e notícias dos seus jogos favoritos.
            </p>
          </div>
        </header>

        <div className="relative">
          <Suspense
            fallback={
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500/60" />
              </div>
            }
          >
            <GamingDashboard />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
