import { Navbar } from "@/components/navbar";
import { SportsFavoritesManager } from "@/components/sports/sports-favorites-manager";

export default function SportsFavoritesPage() {
  return (
    <main className="min-h-screen flex flex-col relative bg-[#09090b] text-zinc-100 selection:bg-white/10 overflow-x-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-zinc-600/5 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] bg-zinc-700/5 rounded-full blur-[120px]" />

        {/* Fine grid pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
      </div>

      <Navbar />

      <div className="relative z-10 w-full max-w-[1440px] mx-auto mt-4 md:mt-8 px-4 md:px-8 pb-16 md:pb-24">
        <SportsFavoritesManager />
      </div>
    </main>
  );
}
