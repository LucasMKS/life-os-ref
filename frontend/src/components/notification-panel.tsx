"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  X,
  CheckCheck,
  Flag,
  Wallet,
  Gamepad2,
  BookOpen,
  BellRing,
  Clock,
  Loader2,
  ArrowRight,
  Trophy,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { notificationApi } from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";
import { AppNotification } from "@/lib/types";
import { toast } from "sonner";

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const getIcon = (type: string) => {
  switch (type) {
    case "SPORTS": return <Trophy className="text-amber-400" size={16} />;
    case "F1": return <Flag className="text-red-400" size={16} />;
    case "FINANCE": return <Wallet className="text-amber-400" size={16} />;
    case "GAMING": return <Gamepad2 className="text-blue-400" size={16} />;
    case "READING": return <BookOpen className="text-emerald-400" size={16} />;
    default: return <BellRing className="text-zinc-400" size={16} />;
  }
};

const renderMessage = (html: string) =>
  html
    .replace(/\n/g, "<br>")
    .replace(/<a\s/gi, '<a target="_blank" rel="noopener noreferrer" ');

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
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Todas as notificações foram lidas");
    },
  });

  useEffect(() => {
    let eventSource: EventSource | null = null;
    const { token, userId } = useAuthStore.getState();

    const setupSSE = () => {
      // EventSource não suporta headers customizados, por isso passamos via query parameter
      const streamUrl = new URL(notificationApi.getStreamUrl());
      if (token) streamUrl.searchParams.set("token", token);
      if (userId) streamUrl.searchParams.set("userId", userId);

      eventSource = new EventSource(streamUrl.toString());

      eventSource.addEventListener("NOTIFICATION", (event) => {
        const newNotif: AppNotification = JSON.parse(event.data);
        
        queryClient.setQueryData(["notifications-recent"], (old: AppNotification[] | undefined) => {
          const updated = [newNotif, ...(old ?? [])];
          return updated.slice(0, 10);
        });
        queryClient.invalidateQueries({ queryKey: ["notifications"] });

        toast("Nova Notificação", {
          description: newNotif.message.replace(/<[^>]*>?/gm, ""),
          icon: <Bell size={16} className="text-blue-400" />,
        });
      });

      eventSource.onerror = () => {
        eventSource?.close();
        setTimeout(setupSSE, 5000);
      };
    };

    setupSSE();

    return () => {
      eventSource?.close();
    };
  }, [queryClient]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-[#09090b]/95 backdrop-blur-2xl border-l border-white/10 z-[160] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Bell className="text-blue-400" size={20} />
                  Notificações
                </h2>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mt-1">
                  {unreadCount} não lidas
                </p>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsReadMutation.mutate()}
                    className="p-2 text-zinc-400 hover:text-emerald-400 transition-colors"
                    title="Marcar todas como lidas"
                  >
                    <CheckCheck size={20} />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 text-zinc-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-xl"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-grow overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500/50" />
                </div>
              ) : notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`relative p-4 rounded-2xl border transition-all group ${
                      notif.isRead 
                        ? "bg-white/[0.02] border-white/5 opacity-60" 
                        : `${getBgColor(notif.type)} shadow-lg`
                    }`}
                  >
                    {!notif.isRead && (
                      <div className="absolute top-4 right-4">
                        <button
                          onClick={() => markAsReadMutation.mutate(notif.id)}
                          className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                          title="Marcar como lida"
                        />
                      </div>
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
                            {new Date(notif.createdAt).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-zinc-800">•</span>
                          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                            {new Date(notif.createdAt).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center px-10">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <BellRing className="text-zinc-700" size={32} />
                  </div>
                  <h3 className="text-white font-bold mb-1">Tudo limpo por aqui</h3>
                  <p className="text-zinc-500 text-xs">Você não tem nenhuma notificação no momento.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-black/20 flex items-center justify-between">
              <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.2em]">
                Últimas 10
              </p>
              <Link
                href="/notifications"
                onClick={onClose}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
              >
                Ver central
                <ArrowRight size={13} />
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
