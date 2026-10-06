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
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { notificationApi } from "@/lib/api";
import { AppNotification } from "@/lib/types";

const navLinks = [
  {
    href: "/f1",
    label: "F1",
    icon: Flag,
    activeColor: "text-red-400",
    activeBg:
      "bg-red-500/10 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.15)]",
    hoverColor: "hover:text-red-400",
  },
  {
    href: "/media",
    label: "Mídia",
    icon: Film,
    activeColor: "text-purple-400",
    activeBg:
      "bg-purple-500/10 border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.15)]",
    hoverColor: "hover:text-purple-400",
  },
  {
    href: "/gaming",
    label: "Gaming",
    icon: Gamepad2,
    activeColor: "text-blue-400",
    activeBg:
      "bg-blue-500/10 border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.15)]",
    hoverColor: "hover:text-blue-400",
  },
  {
    href: "/notes",
    label: "Notas",
    icon: NotebookText,
    activeColor: "text-zinc-300",
    activeBg:
      "bg-white/10 border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.05)]",
    hoverColor: "hover:text-white",
  },
  {
    href: "/reading",
    label: "Leitura",
    icon: BookOpen,
    activeColor: "text-emerald-400",
    activeBg:
      "bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]",
    hoverColor: "hover:text-emerald-400",
  },
  {
    href: "/travel",
    label: "Viagens",
    icon: Compass,
    activeColor: "text-sky-400",
    activeBg:
      "bg-sky-500/10 border-sky-500/20 shadow-[0_0_20px_rgba(56,189,248,0.15)]",
    hoverColor: "hover:text-sky-400",
  },
  {
    href: "/sports",
    label: "Esportes",
    icon: Trophy,
    activeColor: "text-emerald-400",
    activeBg:
      "bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]",
    hoverColor: "hover:text-emerald-400",
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
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Top bar mobile (compacta): logo + bell apenas. Navegação fica no BottomNav. */}
      <div className="md:hidden sticky top-0 z-[100] bg-[#09090b]/85 backdrop-blur-2xl border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-black text-xl tracking-tighter text-white flex items-center">
          Life
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-zinc-500">
            OS
          </span>
        </Link>
        <Link
          href="/notifications"
          className="relative p-2.5 -m-1 text-zinc-300 hover:text-white"
          aria-label="Notificações"
        >
          <Bell size={22} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-[#09090b]" />
          )}
        </Link>
      </div>

      {/* Top bar desktop (a nav original) */}
      <nav
        className={`hidden md:block w-full sticky top-0 z-[100] transition-all duration-500 ${scrolled ? "py-3 px-4 md:px-10" : "py-5 px-6 md:px-12"}`}
      >
        <div
          className={`mx-auto max-w-[1500px] flex justify-between items-center transition-all duration-500 px-6 py-3 rounded-[24px] md:rounded-[32px] border ${scrolled ? "bg-[#09090b]/70 backdrop-blur-2xl border-white/10 shadow-2xl" : "bg-transparent border-white/[0.06]"}`}
        >
          <div className="flex items-center gap-10 lg:gap-14">
            <Link
              href="/"
              className="group relative flex items-center gap-2"
            >
              <div className="font-black text-2xl tracking-tighter text-white flex items-center transition-transform group-hover:scale-105 duration-300">
                Life
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-zinc-500">
                  OS
                </span>
              </div>
              <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-zinc-500 to-transparent group-hover:w-full transition-all duration-500" />
            </Link>

            <div className="flex items-center gap-1.5 lg:gap-2">
              {navLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href));
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`group/nav relative flex items-center gap-2 px-3.5 py-2 rounded-2xl text-[13px] font-bold transition-all duration-500 border overflow-hidden ${
                      isActive
                        ? `${link.activeBg} ${link.activeColor}`
                        : `border-transparent text-zinc-500 ${link.hoverColor} hover:bg-white/5`
                    }`}
                  >
                    <Icon
                      size={16}
                      className={`transition-all duration-500 ${isActive ? "scale-110" : "group-hover/nav:scale-110"}`}
                    />
                    <span className="relative z-10">{link.label}</span>

                    {isActive && (
                      <motion.div
                        layoutId="nav-dot"
                        className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current opacity-60"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-5">
            <Link
              href="/notifications"
              className="relative p-2.5 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 shadow-inner group"
              aria-label="Notificações"
            >
              <Bell
                size={20}
                className="transition-transform group-hover:rotate-12"
              />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-[#09090b] shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-pulse" />
              )}
            </Link>

            <AuthButton />
          </div>
        </div>
      </nav>
    </>
  );
}
