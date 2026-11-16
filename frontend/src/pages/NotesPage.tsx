import { NotesDashboard } from "@/components/notes/notes-dashboard";
import { PageHeader, PageShell } from "@/components/ui/page-shell";
import { Notebook } from "lucide-react";

export default function NotesHub() {
  return (
    <PageShell maxWidth="7xl">
      <PageHeader
        eyebrow="Anotações"
        icon={<Notebook className="w-3.5 h-3.5" />}
        title="Minhas Notas"
        subtitle="Capture pensamentos, organize listas de tarefas e armazene referências rápidas."
        accent="teal"
      />

      <NotesDashboard />
    </PageShell>
  );
}
