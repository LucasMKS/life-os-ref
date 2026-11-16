"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { AuthButton } from "./auth-button";
import {
  Flag,
  Film,
  BookOpen,
  Gamepad2,
  NotebookText,
  Bell,
  Compass,
  Trophy,
  Wallet,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { notificationApi } from "@/lib/api";
import { AppNotification } from "@/lib/types";

const navLinks = [
  {
    href: "/f1",
    label: "F1",
    icon: Flag,
    activeClass: "bg-red-500/12 border-red-500/30 text-red-400",
    hoverClass: "hover:text-red-400 hover:bg-red-500/[0.06]",
    dotClass: "bg-red-400",
  },
  {
    href: "/media",
    label: "Mídia",
    icon: Film,
    activeClass: "bg-purple-500/12 border-purple-500/30 text-purple-400",
    hoverClass: "hover:text-purple-400 hover:bg-purple-500/[0.06]",
    dotClass: "bg-purple-400",
  },
  {
    href: "/gaming",
    label: "Gaming",
    icon: Gamepad2,
    activeClass: "bg-blue-500/12 border-blue-500/30 text-blue-400",
    hoverClass: "hover:text-blue-400 hover:bg-blue-500/[0.06]",
    dotClass: "bg-blue-400",
  },
  {
    href: "/notes",
    label: "Notas",
    icon: NotebookText,
    activeClass: "bg-teal-500/12 border-teal-500/30 text-teal-400",
    hoverClass: "hover:text-teal-400 hover:bg-teal-500/[0.06]",
    dotClass: "bg-teal-400",
  },
  {
    href: "/reading",
    label: "Leitura",
    icon: BookOpen,
    activeClass: "bg-emerald-500/12 border-emerald-500/30 text-emerald-400",
    hoverClass: "hover:text-emerald-400 hover:bg-emerald-500/[0.06]",
    dotClass: "bg-emerald-400",
  },
  {
    href: "/travel",
    label: "Viagens",
    icon: Compass,
    activeClass: "bg-sky-500/12 border-sky-500/30 text-sky-400",
    hoverClass: "hover:text-sky-400 hover:bg-sky-500/[0.06]",
    dotClass: "bg-sky-400",
  },
  {
    href: "/sports",
    label: "Esportes",
    icon: Trophy,
    activeClass: "bg-emerald-500/12 border-emerald-500/30 text-emerald-400",
    hoverClass: "hover:text-emerald-400 hover:bg-emerald-500/[0.06]",
    dotClass: "bg-emerald-400",
  },
  {
    href: "/finance",
    label: "Finanças",
    icon: Wallet,
    activeClass: "bg-cyan-500/12 border-cyan-500/30 text-cyan-400",
    hoverClass: "hover:text-cyan-400 hover:bg-cyan-500/[0.06]",
    dotClass: "bg-cyan-400",
  },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  const { data: notifications = [] } = useQuery<AppNotification[]>({
    queryKey: ["notifications"],
    queryFn: notificationApi.getAll,
    refetchInterval: 30000,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Top bar mobile */}
      <div className="md:hidden sticky top-0 z-[100] bg-[#09090b]/95 border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-black text-xl tracking-tighter text-white flex items-center">
          Life<span className="text-zinc-400">OS</span>
        </Link>
        <Link
          href="/notifications"
          className="relative p-2 -m-1 text-zinc-300 hover:text-white transition-colors"
          aria-label="Notificações"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-[#09090b]" />
          )}
        </Link>
      </div>

      {/* Floating pill bar desktop */}
      <nav
        className={`hidden md:block w-full sticky top-0 z-[100] transition-all duration-200 ${
          scrolled ? "py-2.5 px-4 lg:px-8" : "py-4 px-6 lg:px-10"
        }`}
      >
        <div
          className={`mx-auto max-w-[1560px] flex justify-between items-center gap-4 px-5 py-2.5 rounded-2xl border transition-colors duration-200 ${
            scrolled
              ? "bg-[#111113]/95 border-white/[0.1] shadow-xl shadow-black/40"
              : "bg-[#111113]/75 border-white/[0.06]"
          }`}
        >
          <div className="flex items-center gap-6 lg:gap-8 min-w-0">
            <Link
              href="/"
              className="group font-black text-2xl tracking-tighter text-white flex items-center shrink-0 hover:opacity-90 transition-opacity"
            >
              Life
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-zinc-500">
                OS
              </span>
            </Link>

            <div className="flex items-center gap-1 lg:gap-1.5 overflow-x-auto scrollbar-none">
              {navLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href));
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] font-semibold transition-colors border shrink-0 ${
                      isActive
                        ? link.activeClass
                        : `border-transparent text-zinc-400 ${link.hoverClass}`
                    }`}
                  >
                    <Icon size={15} />
                    <span>{link.label}</span>
                    {isActive && (
                      <span
                        className={`w-1 h-1 rounded-full ${link.dotClass} opacity-80 ml-0.5`}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/notifications"
              className="relative p-2 text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] rounded-xl transition-colors border border-white/[0.06]"
              aria-label="Notificações"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-[#111113]" />
              )}
            </Link>

            <AuthButton />
          </div>
        </div>
      </nav>
    </>
  );
}
