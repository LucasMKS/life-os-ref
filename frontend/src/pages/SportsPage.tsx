import { PageShell } from "@/components/ui/page-shell";
import { SportsDashboard } from "@/components/sports/sports-dashboard";

export default function SportsPage() {
  return (
    <PageShell maxWidth="full">
      <SportsDashboard />
    </PageShell>
  );
}
