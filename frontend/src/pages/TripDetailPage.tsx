import { useParams, useRouter } from "next/navigation";
import { TripDashboard } from "@/components/travel/TripDashboard";
import { BottomNav } from "@/components/bottom-nav";
import { PageShell, EmptyState } from "@/components/ui/page-shell";
import { ArrowLeft, Compass } from "lucide-react";

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id;
  const tripId = Number(rawId);

  if (!tripId || isNaN(tripId)) {
    return (
      <>
        <PageShell maxWidth="7xl">
          <div className="py-12">
            <EmptyState
              icon={<Compass size={26} className="text-sky-400" />}
              title="Identificador de viagem inválido"
              description="A URL informada não contém um ID numérico válido de viagem."
              action={
                <button
                  type="button"
                  onClick={() => router.push("/travel")}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-100 text-zinc-950 hover:bg-white font-semibold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  <ArrowLeft size={14} />
                  <span>Voltar para Minhas Viagens</span>
                </button>
              }
            />
          </div>
        </PageShell>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <PageShell maxWidth="7xl">
        <TripDashboard tripId={tripId} />
      </PageShell>
      <BottomNav />
    </>
  );
}
