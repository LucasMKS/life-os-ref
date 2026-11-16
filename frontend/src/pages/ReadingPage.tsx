import { BookOpen } from "lucide-react";
import { ReadingDashboard } from "@/components/reading/reading-page";
import { PageShell, PageHeader } from "@/components/ui/page-shell";

export default function ReadingHub() {
  return (
    <PageShell maxWidth="7xl">
      <PageHeader
        eyebrow="Biblioteca"
        accent="emerald"
        icon={<BookOpen className="w-4 h-4" />}
        title="Minha Estante"
        subtitle="Acompanhe seu progresso de leitura, anote páginas diárias e organize sua biblioteca pessoal."
      />
      <ReadingDashboard />
    </PageShell>
  );
}
