"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home,
  Flag,
  NotebookText,
  BookOpen,
  Film,
  Gamepad2,
  MoreHorizontal,
  X,
  Compass,
  Trophy,
  Wallet,
} from "lucide-react";
import { AuthButton } from "./auth-button";

const PRIMARY = [
  { href: "/", label: "Início", icon: Home, accent: "text-white" },
  { href: "/f1", label: "F1", icon: Flag, accent: "text-red-400" },
  { href: "/notes", label: "Notas", icon: NotebookText, accent: "text-teal-400" },
  { href: "/reading", label: "Leitura", icon: BookOpen, accent: "text-emerald-400" },
];

const SECONDARY = [
  { href: "/sports", label: "Esportes", icon: Trophy, accent: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  { href: "/travel", label: "Viagens", icon: Compass, accent: "text-sky-400 border-sky-500/30 bg-sky-500/10" },
  { href: "/media", label: "Mídia", icon: Film, accent: "text-purple-400 border-purple-500/30 bg-purple-500/10" },
  { href: "/gaming", label: "Gaming", icon: Gamepad2, accent: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
  { href: "/finance", label: "Finanças", icon: Wallet, accent: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10" },
];

function isRouteActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isOnSecondary = SECONDARY.some((l) => isRouteActive(pathname, l.href));

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-[90] bg-[#09090b]/95 border-t border-white/[0.08] pb-[env(safe-area-inset-bottom)]"
        aria-label="Navegação principal"
      >
        <div className="flex items-stretch justify-around px-1 py-1.5">
          {PRIMARY.map((link) => {
            const Icon = link.icon;
            const active = isRouteActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMoreOpen(false)}
                className={`flex flex-col items-center justify-center gap-1 flex-1 min-w-0 min-h-[52px] rounded-xl transition-colors ${
                  active ? link.accent : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.25 : 1.75} />
                <span className="text-[10px] font-semibold tracking-wide">
                  {link.label}
                </span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center justify-center gap-1 flex-1 min-w-0 min-h-[52px] rounded-xl transition-colors ${
              isOnSecondary ? "text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
            aria-label="Mais opções"
          >
            <MoreHorizontal size={20} strokeWidth={isOnSecondary ? 2.25 : 1.75} />
            <span className="text-[10px] font-semibold tracking-wide">Mais</span>
          </button>
        </div>
      </nav>

      {moreOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-[120] bg-black/75"
            onClick={() => setMoreOpen(false)}
          />
          <div className="md:hidden fixed bottom-0 inset-x-0 z-[121] bg-[#111113] border-t border-white/[0.08] rounded-t-2xl pb-[env(safe-area-inset-bottom)] shadow-2xl">
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-white/15" />
            </div>
            <div className="flex items-center justify-between px-5 pb-3">
              <h3 className="text-sm font-semibold text-white">Módulos</h3>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="p-2 -m-2 text-zinc-400 hover:text-white"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-4 pb-4 grid grid-cols-3 gap-2.5">
              {SECONDARY.map((link) => {
                const Icon = link.icon;
                const active = isRouteActive(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-xl border transition-colors ${
                      active
                        ? link.accent
                        : "text-zinc-400 border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:text-zinc-200"
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-[11px] font-medium">{link.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="px-5 pb-6 pt-3 border-t border-white/[0.06] flex justify-center">
              <AuthButton />
            </div>
          </div>
        </>
      )}
    </>
  );
}
