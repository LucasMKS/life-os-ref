"use client";

import { lazy, Suspense, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CheckCheck,
  BellRing,
  Clock,
  Loader2,
  Sliders,
  AlarmClock,
} from "lucide-react";
import { notificationApi } from "@/lib/api";
import { AppNotification } from "@/lib/types";
import { sanitizeNotificationHtml } from "@/lib/security";
import {
  PageHeader,
  SurfacePanel,
  FilterPill,
  EmptyState,
} from "@/components/ui/page-shell";
import { NotificationCategoryIcon, getCategoryLabel } from "./category-icon";
import { toast } from "sonner";

const CustomNotificationsView = lazy(() =>
  import("./custom-notifications-view").then((m) => ({
    default: m.CustomNotificationsView,
  }))
);

const NotificationSettingsView = lazy(() =>
  import("./notification-settings-view").then((m) => ({
    default: m.NotificationSettingsView,
  }))
);

type FilterType =
  | "ALL"
  | "SPORTS"
  | "F1"
  | "FINANCE"
  | "GAMING"
  | "READING"
  | "MEDIA"
  | "TWITCH"
  | "WEATHER"
  | "CUSTOM"
  | "SYSTEM";

const FILTERS: { label: string; value: FilterType }[] = [
  { label: "Todas", value: "ALL" },
  { label: "Esportes", value: "SPORTS" },
  { label: "F1", value: "F1" },
  { label: "Finanças", value: "FINANCE" },
  { label: "Gaming", value: "GAMING" },
  { label: "Leitura", value: "READING" },
  { label: "Mídia", value: "MEDIA" },
  { label: "Twitch", value: "TWITCH" },
  { label: "Clima", value: "WEATHER" },
  { label: "Personalizadas", value: "CUSTOM" },
];

function formatTime(isoDate?: string): string {
  if (!isoDate) return "--:--";
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return "--:--";
  return parsed.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupByDate(notifications: AppNotification[]): Record<string, AppNotification[]> {
  return (Array.isArray(notifications) ? notifications : []).reduce((acc, n) => {
    const parsed = n?.createdAt ? new Date(n.createdAt) : null;
    const date =
      parsed && !Number.isNaN(parsed.getTime())
        ? parsed.toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
          })
        : "Sem data";
    if (!acc[date]) acc[date] = [];
    acc[date].push(n);
    return acc;
  }, {} as Record<string, AppNotification[]>);
}

function TabFallback() {
  return (
    <SurfacePanel>
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    </SurfacePanel>
  );
}

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"feed" | "custom" | "settings">("feed");
  const [activeFilter, setActiveFilter] = useState<FilterType>("ALL");

  const { data: notifications = [], isLoading } = useQuery<AppNotification[]>({
    queryKey: ["notifications"],
    queryFn: notificationApi.getAll,
  });

  const markAsReadMutation = useMutation({
    mutationFn: notificationApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-recent"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-recent"] });
      toast.success("Todas as notificações foram marcadas como lidas");
    },
  });

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const filtered =
    activeFilter === "ALL"
      ? safeNotifications
      : safeNotifications.filter((n) => n.type === activeFilter);

  const grouped = groupByDate(filtered);
  const unreadCount = safeNotifications.filter((n) => !n.isRead).length;

  return (
    <div>
      <PageHeader
        eyebrow="Sistema & Alertas"
        icon={<Bell className="w-3.5 h-3.5" />}
        title="Central de Notificações"
        subtitle="Gerencie seus alertas, lembretes personalizados, briefings diários e integração com o Telegram."
        badge={
          unreadCount > 0 ? (
            <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 tabular-nums">
              {unreadCount} não {unreadCount === 1 ? "lida" : "lidas"}
            </span>
          ) : undefined
        }
        actions={
          activeTab === "feed" && unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-white/[0.05] text-zinc-200 border border-white/[0.08] hover:bg-white/[0.1] rounded-xl transition-colors disabled:opacity-50"
            >
              <CheckCheck size={15} className="text-emerald-400" />
              <span>Marcar todas como lidas</span>
            </button>
          ) : undefined
        }
      />

      {/* Abas Superiores */}
      <div
        role="tablist"
        aria-label="Seções de notificações"
        className="flex flex-wrap items-center gap-1 mb-6 p-1 bg-[#111113] border border-white/[0.06] rounded-2xl w-full sm:w-fit"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "feed"}
          onClick={() => setActiveTab("feed")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors border ${
            activeTab === "feed"
              ? "bg-white/[0.08] text-white border-white/[0.12]"
              : "text-zinc-400 hover:text-zinc-200 border-transparent"
          }`}
        >
          <Bell size={15} className={activeTab === "feed" ? "text-white" : "text-zinc-500"} />
          <span>Feed</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-full tabular-nums">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "custom"}
          onClick={() => setActiveTab("custom")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors border ${
            activeTab === "custom"
              ? "bg-white/[0.08] text-white border-white/[0.12]"
              : "text-zinc-400 hover:text-zinc-200 border-transparent"
          }`}
        >
          <AlarmClock size={15} className={activeTab === "custom" ? "text-white" : "text-zinc-500"} />
          <span>Lembretes</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "settings"}
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors border ${
            activeTab === "settings"
              ? "bg-white/[0.08] text-white border-white/[0.12]"
              : "text-zinc-400 hover:text-zinc-200 border-transparent"
          }`}
        >
          <Sliders size={15} className={activeTab === "settings" ? "text-white" : "text-zinc-500"} />
          <span>Configurações & Horários</span>
        </button>
      </div>

      {/* ABA: LEMBRETES PERSONALIZADOS */}
      {activeTab === "custom" && (
        <Suspense fallback={<TabFallback />}>
          <CustomNotificationsView />
        </Suspense>
      )}

      {/* ABA: CONFIGURAÇÕES */}
      {activeTab === "settings" && (
        <Suspense fallback={<TabFallback />}>
          <NotificationSettingsView />
        </Suspense>
      )}

      {/* ABA: FEED DE NOTIFICAÇÕES */}
      {activeTab === "feed" && (
        <div className="space-y-6">
          {/* Filtros */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {FILTERS.map((f) => (
              <FilterPill
                key={f.value}
                active={activeFilter === f.value}
                onClick={() => setActiveFilter(f.value)}
              >
                {f.label}
              </FilterPill>
            ))}
          </div>

          {/* Conteúdo */}
          {isLoading ? (
            <SurfacePanel>
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
              </div>
            </SurfacePanel>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<BellRing size={20} />}
              title="Nenhuma notificação"
              description={
                activeFilter === "ALL"
                  ? "Você ainda não recebeu nenhuma notificação."
                  : `Sem notificações na categoria "${getCategoryLabel(activeFilter)}".`
              }
            />
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([date, items]) => (
                <section key={date} className="space-y-2.5">
                  <h2 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-1 capitalize">
                    {date}
                  </h2>
                  <div className="space-y-2">
                    {items.map((notif) => {
                      const safeHtml = sanitizeNotificationHtml(notif.message);
                      return (
                        <div
                          key={notif.id}
                          className={`relative p-4 rounded-2xl border bg-[#111113] transition-colors ${
                            notif.isRead
                              ? "border-white/[0.04] opacity-60 hover:opacity-85"
                              : "border-white/[0.1] hover:border-white/[0.16]"
                          }`}
                        >
                          {!notif.isRead && (
                            <button
                              type="button"
                              onClick={() => markAsReadMutation.mutate(notif.id)}
                              className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-400/80 hover:bg-emerald-400 transition-colors"
                              title="Marcar como lida"
                              aria-label="Marcar notificação como lida"
                            />
                          )}

                          <div className="flex items-start gap-3 pr-5">
                            <div className="mt-0.5">
                              <NotificationCategoryIcon type={notif.type} size={15} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div
                                className="text-sm text-zinc-200 leading-relaxed break-words [&_b]:font-semibold [&_b]:text-white [&_strong]:font-semibold [&_strong]:text-white [&_a]:text-zinc-100 [&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-white/30 hover:[&_a]:decoration-white [&_a]:break-all"
                                dangerouslySetInnerHTML={{ __html: safeHtml }}
                              />
                              <div className="flex items-center gap-2 mt-2 text-[11px] text-zinc-500">
                                <Clock size={11} className="text-zinc-600 shrink-0" />
                                <span className="tabular-nums">{formatTime(notif.createdAt)}</span>
                                <span className="text-zinc-700">·</span>
                                <span className="uppercase tracking-wider font-medium text-zinc-500">
                                  {getCategoryLabel(notif.type)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
