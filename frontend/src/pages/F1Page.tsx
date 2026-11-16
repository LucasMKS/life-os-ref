import { Flag } from "lucide-react";
import { F1Dashboard } from "@/components/f1/f1-dashboard";
import { PageHeader, PageShell } from "@/components/ui/page-shell";

export default function F1Page() {
  const season = new Date().getFullYear();

  return (
    <PageShell maxWidth="7xl">
      <PageHeader
        accent="red"
        eyebrow="Paddock"
        icon={<Flag className="w-3.5 h-3.5 text-red-400" />}
        title="Fórmula 1"
        subtitle="Calendário da temporada, horários das sessões e classificação de pilotos e construtores."
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/25 text-[11px] font-semibold text-red-300 tabular-nums">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Temporada {season}
          </span>
        }
      />

      <F1Dashboard />
    </PageShell>
  );
}
