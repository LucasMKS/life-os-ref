import { F1Dashboard } from "@/components/f1/f1-dashboard";
import { Navbar } from "@/components/navbar";

export default function F1Page() {
  return (
    <main className="min-h-screen flex flex-col relative bg-[#09090b] text-zinc-100 selection:bg-white/10">
      {/* Glow sutil vermelho no topo para manter a identidade da F1 */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-red-900/10 to-transparent pointer-events-none"></div>

      <Navbar />

      <div className="z-10 w-full max-w-[1400px] mx-auto mt-4 md:mt-16 px-4 md:px-6 pb-12 md:pb-20">
        <div className="mb-5 md:mb-10">
          <h1 className="text-2xl md:text-4xl font-semibold tracking-tight mb-1 md:mb-2 text-white">
            Fórmula 1
          </h1>
          <p className="text-zinc-500 max-w-xl text-xs md:text-base">
            O calendário da temporada, horários das sessões e como está a briga
            pelo campeonato.
          </p>
        </div>

        <F1Dashboard />
      </div>
    </main>
  );
}
