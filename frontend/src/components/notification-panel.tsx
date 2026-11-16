"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  X,
  CheckCheck,
  BellRing,
  Clock,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { notificationApi } from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";
import { AppNotification } from "@/lib/types";
import { sanitizeNotificationHtml } from "@/lib/security";
import { NotificationCategoryIcon } from "@/components/notifications/category-icon";
import { toast } from "sonner";

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatTime(isoDate?: string): string {
  if (!isoDate) return "--:--";
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return "--:--";
  return parsed.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(isoDate?: string): string {
  if (!isoDate) return "";
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("pt-BR");
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<AppNotification[]>({
    queryKey: ["notifications-recent"],
    queryFn: notificationApi.getRecent,
    refetchOnWindowFocus: true,
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
      toast.success("Todas as notificações foram lidas");
    },
  });

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let isDisposed = false;

    const setupSSE = () => {
      if (isDisposed) return;
      const { token, userId } = useAuthStore.getState();
      const baseOrigin =
        typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      const streamUrl = new URL(notificationApi.getStreamUrl(), baseOrigin);
      if (token) streamUrl.searchParams.set("token", token);
      if (userId) streamUrl.searchParams.set("userId", userId);

      eventSource = new EventSource(streamUrl.toString());

      eventSource.addEventListener("NOTIFICATION", (event) => {
        try {
          const newNotif: AppNotification = JSON.parse(event.data);
          if (!newNotif || !newNotif.id) return;

          queryClient.setQueryData<AppNotification[]>(["notifications-recent"], (old) => {
            const existing = Array.isArray(old) ? old : [];
            return [newNotif, ...existing].slice(0, 10);
          });
          queryClient.invalidateQueries({ queryKey: ["notifications"] });

          const plainText = (newNotif.message ?? "").replace(/<[^>]*>?/gm, "").trim();
          toast("Nova Notificação", {
            description: plainText || "Você recebeu um novo alerta.",
            icon: <Bell size={16} className="text-zinc-300" />,
          });
        } catch {
          // Ignore malformed SSE payload
        }
      });

      eventSource.onerror = () => {
        eventSource?.close();
        if (!isDisposed) {
          reconnectTimer = setTimeout(setupSSE, 5000);
        }
      };
    };

    setupSSE();

    return () => {
      isDisposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      eventSource?.close();
    };
  }, [queryClient]);

  const safeList = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeList.filter((n) => !n.isRead).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop (no heavy GPU blur) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 z-[150]"
          />

          {/* Panel */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            aria-label="Painel de notificações"
            className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-[#09090b] border-l border-white/[0.08] z-[160] flex flex-col"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Bell className="text-zinc-400 shrink-0" size={17} />
                  <span>Notificações</span>
                </h2>
                <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider mt-0.5 tabular-nums">
                  {unreadCount} não {unreadCount === 1 ? "lida" : "lidas"}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllAsReadMutation.mutate()}
                    disabled={markAllAsReadMutation.isPending}
                    className="p-2 text-zinc-400 hover:text-emerald-400 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-xl transition-colors disabled:opacity-50"
                    title="Marcar todas como lidas"
                    aria-label="Marcar todas como lidas"
                  >
                    <CheckCheck size={17} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-xl transition-colors"
                  aria-label="Fechar painel"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                </div>
              ) : safeList.length > 0 ? (
                safeList.map((notif) => {
                  const safeHtml = sanitizeNotificationHtml(notif.message);
                  return (
                    <div
                      key={notif.id}
                      className={`relative p-3.5 rounded-2xl border bg-[#111113] transition-colors ${
                        notif.isRead
                          ? "border-white/[0.04] opacity-60 hover:opacity-85"
                          : "border-white/[0.1] hover:border-white/[0.16]"
                      }`}
                    >
                      {!notif.isRead && (
                        <button
                          type="button"
                          onClick={() => markAsReadMutation.mutate(notif.id)}
                          className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-emerald-400/80 hover:bg-emerald-400 transition-colors"
                          title="Marcar como lida"
                          aria-label="Marcar notificação como lida"
                        />
                      )}

                      <div className="flex items-start gap-3 pr-4">
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
                            <span className="tabular-nums">{formatDate(notif.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center px-8">
                  <div className="w-12 h-12 bg-[#111113] border border-white/[0.06] rounded-2xl flex items-center justify-center mb-3">
                    <BellRing className="text-zinc-500" size={22} />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">Tudo limpo por aqui</h3>
                  <p className="text-zinc-500 text-xs">
                    Você não tem nenhuma notificação no momento.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-white/[0.06] bg-[#0c0c0e] flex items-center justify-between">
              <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-widest">
                Últimas 10
              </p>
              <Link
                href="/notifications"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-200 hover:text-white transition-colors"
              >
                <span>Ver central</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
