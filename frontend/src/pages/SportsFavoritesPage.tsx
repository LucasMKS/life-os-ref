import { Navbar } from "@/components/navbar";
import { SportsFavoritesManager } from "@/components/sports/sports-favorites-manager";
import { Trophy } from "lucide-react";

export default function SportsFavoritesPage() {
  return (
    <main className="min-h-screen flex flex-col relative bg-[#09090b] text-zinc-100 selection:bg-emerald-500/30 overflow-x-hidden">
      {/* Background Glows (Emerald & Teal) */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none -mt-20" />
      <div className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-teal-500/10 rounded-full blur-[130px] pointer-events-none -mt-20" />
      <div className="absolute top-0 inset-x-0 h-[380px] bg-gradient-to-b from-emerald-950/20 via-zinc-950/40 to-transparent pointer-events-none" />

      {/* Decorative Watermark */}
      <Trophy
        className="absolute top-24 right-6 w-[550px] h-[550px] text-white opacity-[0.012] pointer-events-none -rotate-12"
        strokeWidth={1}
      />

      <Navbar />

      <div className="z-10 w-full max-w-[1440px] mx-auto mt-4 md:mt-8 px-4 md:px-8 pb-16 md:pb-24">
        <SportsFavoritesManager />
      </div>
    </main>
  );
}
