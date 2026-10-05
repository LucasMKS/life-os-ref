import { useParams, useRouter } from "next/navigation";
import { TripDashboard } from "@/components/travel/TripDashboard";
import { Navbar } from "@/components/navbar";
import { BottomNav } from "@/components/bottom-nav";
import { ArrowLeft, Compass } from "lucide-react";

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id;
  const tripId = Number(rawId);

  if (!tripId || isNaN(tripId)) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white">
        <Navbar />
        <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-20 text-center">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto mb-4 border border-sky-500/20">
            <Compass size={24} />
          </div>
          <h2 className="text-xl font-bold">Identificador de viagem inválido</h2>
          <p className="text-zinc-400 text-xs mt-2 mb-6">
            A URL informada não contém um ID numérico válido de viagem.
          </p>
          <button
            onClick={() => router.push("/travel")}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs rounded-xl cursor-pointer transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Voltar para Minhas Viagens</span>
          </button>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 md:py-10">
        <TripDashboard tripId={tripId} />
      </main>

      <BottomNav />
    </div>
  );
}
