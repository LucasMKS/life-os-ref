import { Navbar } from "@/components/navbar";
import { NotificationsPage } from "@/components/notifications/notifications-page";

export default function Notifications() {
  return (
    <main className="min-h-screen flex flex-col bg-[#09090b] text-zinc-100">
      <Navbar />
      <NotificationsPage />
    </main>
  );
}
