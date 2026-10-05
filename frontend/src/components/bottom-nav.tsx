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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthButton } from "./auth-button";

const PRIMARY = [
  { href: "/", label: "Início", icon: Home, accent: "text-zinc-200" },
  { href: "/f1", label: "F1", icon: Flag, accent: "text-red-400" },
  { href: "/notes", label: "Notas", icon: NotebookText, accent: "text-teal-400" },
  { href: "/reading", label: "Leitura", icon: BookOpen, accent: "text-emerald-400" },
];

const SECONDARY = [
  { href: "/sports", label: "Esportes", icon: Trophy, accent: "text-emerald-400" },
  { href: "/travel", label: "Viagens", icon: Compass, accent: "text-sky-400" },
  { href: "/media", label: "Mídia", icon: Film, accent: "text-purple-400" },
  { href: "/gaming", label: "Gaming", icon: Gamepad2, accent: "text-blue-400" },
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
        className="md:hidden fixed bottom-0 inset-x-0 z-[90] bg-[#09090b]/95 backdrop-blur-2xl border-t border-white/10 pb-[env(safe-area-inset-bottom)]"
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
                className={`flex flex-col items-center justify-center gap-1 flex-1 min-w-0 min-h-[56px] rounded-xl transition-colors ${
                  active ? link.accent : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-bold tracking-wide">
                  {link.label}
                </span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center justify-center gap-1 flex-1 min-w-0 min-h-[56px] rounded-xl transition-colors ${
              isOnSecondary ? "text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
            aria-label="Mais opções"
          >
            <MoreHorizontal size={22} strokeWidth={isOnSecondary ? 2.5 : 2} />
            <span className="text-[10px] font-bold tracking-wide">Mais</span>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm"
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 280 }}
              className="md:hidden fixed bottom-0 inset-x-0 z-[121] bg-[#09090b] border-t border-white/10 rounded-t-3xl pb-[env(safe-area-inset-bottom)] shadow-[0_-20px_50px_rgba(0,0,0,0.6)]"
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-white/15" />
              </div>
              <div className="flex items-center justify-between px-5 pb-4">
                <h3 className="text-sm font-bold text-white">Mais</h3>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  className="p-2 -m-2 text-zinc-400 hover:text-white"
                  aria-label="Fechar"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="px-4 pb-4 grid grid-cols-3 gap-3">
                {SECONDARY.map((link) => {
                  const Icon = link.icon;
                  const active = isRouteActive(pathname, link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMoreOpen(false)}
                      className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border transition-colors ${
                        active
                          ? `${link.accent} border-white/20 bg-white/5`
                          : "text-zinc-400 border-white/5 hover:border-white/10 hover:bg-white/5"
                      }`}
                    >
                      <Icon size={26} />
                      <span className="text-[11px] font-bold">{link.label}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="px-5 pb-6 pt-2 border-t border-white/5 flex justify-center">
                <AuthButton />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
