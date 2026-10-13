import { MediaDashboard } from "@/components/media/media-page";
import { Navbar } from "@/components/navbar";
import { ArrowUpRight, Film, Sparkles } from "lucide-react";

const LMS_URL = "https://filmes.lucasmks.com.br";

export default function MediaPage() {
  return (
    <main className="min-h-screen flex flex-col relative bg-[#09090b] text-zinc-100 selection:bg-purple-500/30 overflow-x-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[140px]" />
        <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] bg-fuchsia-600/5 rounded-full blur-[140px]" />

        {/* Fine grid pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
      </div>

      <Navbar />

      <div className="z-10 w-full max-w-[1500px] mx-auto mt-4 md:mt-10 px-4 md:px-8 pb-16 md:pb-24">
        {/* HEADER SECTION */}
        <header className="mb-6 md:mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="animate-in slide-in-from-left-6 fade-in duration-500 ease-out">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 border border-white/10 flex items-center justify-center text-purple-400 shadow-lg">
                <Film className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white">
                  Filmes &{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400">
                    Séries
                  </span>
                </h1>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                  <Sparkles className="w-2.5 h-2.5 text-purple-400" /> WATCHLIST
                </div>
              </div>
            </div>
            <p className="text-zinc-400 text-xs md:text-sm font-medium max-w-xl">
              Próximos lançamentos, episódios para continuar assistindo e estatísticas da sua watchlist.
            </p>
          </div>

          <a
            href={LMS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-200 transition-colors shadow-sm self-start sm:self-auto"
          >
            <span>Gerenciar no LMS Filmes</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" />
          </a>
        </header>

        <div className="relative">
          <MediaDashboard />
        </div>
      </div>
    </main>
  );
}
