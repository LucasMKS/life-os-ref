import { ArrowUpRight, Film } from "lucide-react";
import { MediaDashboard } from "@/components/media/media-page";
import { PageHeader, PageShell } from "@/components/ui/page-shell";
import { LMS_BASE_URL } from "@/components/media/media-poster";
import { sanitizeUrl } from "@/lib/security";

export default function MediaPage() {
  const safeLmsUrl = sanitizeUrl(LMS_BASE_URL);

  return (
    <PageShell maxWidth="7xl">
      <PageHeader
        accent="purple"
        eyebrow="Watchlist"
        icon={<Film className="w-3.5 h-3.5" />}
        title="Filmes & Séries"
        subtitle="Próximos lançamentos, episódios para continuar assistindo e estatísticas da sua watchlist."
        actions={
          safeLmsUrl ? (
            <a
              href={safeLmsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.05] text-zinc-200 border border-white/[0.08] hover:bg-white/[0.1] text-xs font-medium transition-colors"
            >
              <span>Gerenciar no LMS Filmes</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" />
            </a>
          ) : null
        }
      />

      <MediaDashboard />
    </PageShell>
  );
}
