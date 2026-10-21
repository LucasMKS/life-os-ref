import { Navbar } from "@/components/navbar";
import { SportsDashboard } from "@/components/sports/sports-dashboard";

export default function SportsPage() {
  return (
    <main className="min-h-screen flex flex-col relative bg-[#09090b] text-zinc-100 selection:bg-emerald-500/30 overflow-x-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/5 rounded-full blur-[80px]" />
        <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] bg-teal-600/5 rounded-full blur-[80px]" />

        {/* Fine grid pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
      </div>

      <Navbar />

      <div className="z-10 w-full max-w-[1500px] mx-auto mt-4 md:mt-8 px-4 md:px-8 pb-16 md:pb-24">
        {/* Main Sports Dashboard */}
        <SportsDashboard />
      </div>
    </main>
  );
}
