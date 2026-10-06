"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CheckCheck,
  Flag,
  Wallet,
  Gamepad2,
  BookOpen,
  BellRing,
  Clock,
  Loader2,
  Filter,
  Trophy,
  Sliders,
} from "lucide-react";
import { notificationApi } from "@/lib/api";
import { AppNotification } from "@/lib/types";
import { toast } from "sonner";
import { NotificationSettingsView } from "./notification-settings-view";

type FilterType = "ALL" | "SPORTS" | "F1" | "FINANCE" | "GAMING" | "READING" | "SYSTEM";

const FILTERS: { label: string; value: FilterType; color: string; activeClass: string }[] = [
  { label: "Todas", value: "ALL", color: "text-zinc-400", activeClass: "bg-white/10 border-white/20 text-white" },
  { label: "Esportes", value: "SPORTS", color: "text-amber-400", activeClass: "bg-amber-500/10 border-amber-500/30 text-amber-400" },
  { label: "F1", value: "F1", color: "text-red-400", activeClass: "bg-red-500/10 border-red-500/30 text-red-400" },
  { label: "Finanças", value: "FINANCE", color: "text-amber-400", activeClass: "bg-amber-500/10 border-amber-500/30 text-amber-400" },
  { label: "Gaming", value: "GAMING", color: "text-blue-400", activeClass: "bg-blue-500/10 border-blue-500/30 text-blue-400" },
  { label: "Leitura", value: "READING", color: "text-emerald-400", activeClass: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" },
];

const getIcon = (type: string) => {
  switch (type) {
    case "SPORTS": return <Trophy className="text-amber-400" size={15} />;
    case "F1": return <Flag className="text-red-400" size={15} />;
    case "FINANCE": return <Wallet className="text-amber-400" size={15} />;
    case "GAMING": return <Gamepad2 className="text-blue-400" size={15} />;
    case "READING": return <BookOpen className="text-emerald-400" size={15} />;
    default: return <BellRing className="text-zinc-400" size={15} />;
  }
};

const getBgColor = (type: string) => {
  switch (type) {
    case "SPORTS": return "bg-amber-500/10 border-amber-500/20";
    case "F1": return "bg-red-500/10 border-red-500/20";
    case "FINANCE": return "bg-amber-500/10 border-amber-500/20";
    case "GAMING": return "bg-blue-500/10 border-blue-500/20";
    case "READING": return "bg-emerald-500/10 border-emerald-500/20";
    default: return "bg-white/5 border-white/10";
  }
};

const renderMessage = (html: string) =>
  html
    .replace(/\n/g, "<br>")
    .replace(/<a\s/gi, '<a target="_blank" rel="noopener noreferrer" ');

function groupByDate(notifications: AppNotification[]): Record<string, AppNotification[]> {
  return notifications.reduce((acc, n) => {
    const date = new Date(n.createdAt).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(n);
    return acc;
  }, {} as Record<string, AppNotification[]>);
}

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"feed" | "settings">("feed");
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

  const filtered = activeFilter === "ALL"
    ? notifications
    : notifications.filter((n) => n.type === activeFilter);

  const grouped = groupByDate(filtered);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-[#09090b] px-4 py-8 md:px-10 lg:px-16">
      {/* Glow de fundo */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3 tracking-tight">
              <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-2xl shrink-0">
                <Bell className="text-blue-400" size={24} />
              </div>
              <span>Central de Notificações</span>
            </h1>
            <p className="text-zinc-500 text-sm mt-2 ml-1">
              Gerencie seus alertas, briefings diários e o bot do Telegram.
            </p>
          </div>

          {activeTab === "feed" && unreadCount > 0 && (
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-zinc-300 hover:text-emerald-400 bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 rounded-2xl transition-all"
              >
                <CheckCheck size={16} />
                <span>Marcar todas como lidas</span>
              </button>
            </div>
          )}
        </div>

        {/* Abas Superiores */}
        <div className="flex items-center gap-2 mb-8 p-1.5 bg-white/[0.03] border border-white/10 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("feed")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === "feed"
                ? "bg-white/10 text-white shadow-sm border border-white/10"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Bell size={16} className={activeTab === "feed" ? "text-blue-400" : "text-zinc-400"} />
            <span>Feed de Notificações</span>
            {unreadCount > 0 && (
              <span className="ml-1 px-2 py-0.5 text-[11px] font-extrabold bg-blue-500 text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === "settings"
                ? "bg-white/10 text-white shadow-sm border border-white/10"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Sliders size={16} className={activeTab === "settings" ? "text-blue-400" : "text-zinc-400"} />
            <span>Configurações & Horários</span>
          </button>
        </div>

        {/* ABA: CONFIGURAÇÕES */}
        {activeTab === "settings" && <NotificationSettingsView />}

        {/* ABA: FEED DE NOTIFICAÇÕES */}
        {activeTab === "feed" && (
          <>
            {/* Filtros */}
            <div className="flex items-center gap-2 mb-6 flex-wrap">
              <Filter size={14} className="text-zinc-600 shrink-0" />
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setActiveFilter(f.value)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                    activeFilter === f.value
                      ? f.activeClass
                      : "border-white/5 text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Conteúdo */}
            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500/50" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <BellRing className="text-zinc-700" size={32} />
                </div>
                <h3 className="text-white font-bold mb-1">Nenhuma notificação</h3>
                <p className="text-zinc-500 text-sm">
                  {activeFilter === "ALL"
                    ? "Você ainda não recebeu nenhuma notificação."
                    : `Sem notificações do tipo "${activeFilter}".`}
                </p>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in duration-300">
                {Object.entries(grouped).map(([date, items]) => (
                  <div key={date}>
                    <h2 className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-3 ml-1 capitalize">
                      {date}
                    </h2>
                    <div className="space-y-2.5">
                      {items.map((notif) => (
                        <div
                          key={notif.id}
                          className={`relative p-4 rounded-2xl border transition-all group ${
                            notif.isRead
                              ? "bg-white/[0.02] border-white/5 opacity-60"
                              : `${getBgColor(notif.type)} shadow-lg`
                          }`}
                        >
                          {!notif.isRead && (
                            <button
                              onClick={() => markAsReadMutation.mutate(notif.id)}
                              className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                              title="Marcar como lida"
                            />
                          )}

                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-xl border ${getBgColor(notif.type)} shrink-0 mt-0.5`}>
                              {getIcon(notif.type)}
                            </div>
                            <div className="flex-grow min-w-0">
                              <div
                                className="text-sm text-zinc-200 leading-relaxed break-words [&_b]:font-bold [&_b]:text-white [&_a]:text-blue-400 [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-blue-300 [&_a]:transition-colors [&_a]:break-all"
                                dangerouslySetInnerHTML={{ __html: renderMessage(notif.message) }}
                              />
                              <div className="flex items-center gap-2 mt-2">
                                <Clock size={10} className="text-zinc-600" />
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                  {new Date(notif.createdAt).toLocaleTimeString("pt-BR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                <span className="text-zinc-800">·</span>
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${getBgColor(notif.type).includes("red") ? "text-red-500/60" : getBgColor(notif.type).includes("amber") ? "text-amber-500/60" : getBgColor(notif.type).includes("blue") ? "text-blue-500/60" : getBgColor(notif.type).includes("emerald") ? "text-emerald-500/60" : "text-zinc-600"}`}>
                                  {notif.type}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
