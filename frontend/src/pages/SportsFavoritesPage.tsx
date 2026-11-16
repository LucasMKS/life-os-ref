import { PageShell } from "@/components/ui/page-shell";
import { SportsFavoritesManager } from "@/components/sports/sports-favorites-manager";

export default function SportsFavoritesPage() {
  return (
    <PageShell maxWidth="7xl">
      <SportsFavoritesManager />
    </PageShell>
  );
}
