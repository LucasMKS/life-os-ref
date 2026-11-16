import { Suspense } from "react";
import { Gamepad2, Loader2 } from "lucide-react";
import { PageHeader, PageShell } from "@/components/ui/page-shell";
import { GamingDashboard } from "@/components/gaming/gaming-page";

export default function GamingPage() {
  return (
    <PageShell maxWidth="7xl">
      <PageHeader
        eyebrow="Gaming Hub"
        title="Mundo Gamer"
        subtitle="Estatísticas da Steam, transmissões ao vivo na Twitch, gravador DVR e notícias dos seus jogos."
        icon={<Gamepad2 className="w-4 h-4" />}
        accent="blue"
      />

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20 text-zinc-500">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        }
      >
        <GamingDashboard />
      </Suspense>
    </PageShell>
  );
}
