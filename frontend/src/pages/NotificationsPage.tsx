import { PageShell } from "@/components/ui/page-shell";
import { NotificationsPage } from "@/components/notifications/notifications-page";

export default function Notifications() {
  return (
    <PageShell maxWidth="5xl">
      <NotificationsPage />
    </PageShell>
  );
}
