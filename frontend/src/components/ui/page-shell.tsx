import type { ReactNode } from "react";
import { Navbar } from "@/components/navbar";

export type ModuleAccent =
  | "zinc"
  | "red"
  | "purple"
  | "blue"
  | "teal"
  | "emerald"
  | "sky"
  | "cyan";

const ACCENT_ICON_BADGE: Record<ModuleAccent, string> = {
  zinc: "bg-white/[0.05] border-white/[0.08] text-zinc-300",
  red: "bg-red-500/10 border-red-500/25 text-red-400",
  purple: "bg-purple-500/10 border-purple-500/25 text-purple-400",
  blue: "bg-blue-500/10 border-blue-500/25 text-blue-400",
  teal: "bg-teal-500/10 border-teal-500/25 text-teal-400",
  emerald: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400",
  sky: "bg-sky-500/10 border-sky-500/25 text-sky-400",
  cyan: "bg-cyan-500/10 border-cyan-500/25 text-cyan-400",
};

const ACCENT_TOP_BORDER: Record<ModuleAccent, string> = {
  zinc: "",
  red: "border-t-2 border-t-red-500/60",
  purple: "border-t-2 border-t-purple-500/60",
  blue: "border-t-2 border-t-blue-500/60",
  teal: "border-t-2 border-t-teal-500/60",
  emerald: "border-t-2 border-t-emerald-500/60",
  sky: "border-t-2 border-t-sky-500/60",
  cyan: "border-t-2 border-t-cyan-500/60",
};

const ACCENT_EYEBROW: Record<ModuleAccent, string> = {
  zinc: "text-zinc-500",
  red: "text-red-400/90",
  purple: "text-purple-400/90",
  blue: "text-blue-400/90",
  teal: "text-teal-400/90",
  emerald: "text-emerald-400/90",
  sky: "text-sky-400/90",
  cyan: "text-cyan-400/90",
};

const ACCENT_PILL: Record<ModuleAccent, string> = {
  zinc: "bg-white/[0.1] text-white border-white/20",
  red: "bg-red-500/15 text-red-300 border-red-500/30",
  purple: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  blue: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  teal: "bg-teal-500/15 text-teal-300 border-teal-500/30",
  emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  sky: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  cyan: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
};

interface PageShellProps {
  children: ReactNode;
  maxWidth?: "5xl" | "6xl" | "7xl" | "full";
  className?: string;
}

const MAX_WIDTH_MAP = {
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-[1440px]",
  full: "max-w-[1600px]",
};

/**
 * Unified dark page shell for all LifeOS modules.
 * Avoids heavy GPU blur blobs for smooth 60fps scrolling on desktop and mobile.
 */
export function PageShell({
  children,
  maxWidth = "7xl",
  className = "",
}: PageShellProps) {
  return (
    <main className="min-h-screen flex flex-col relative bg-[#09090b] text-zinc-100 selection:bg-white/15 overflow-x-hidden">
      {/* Subtle static dot grid (zero GPU blur cost) */}
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none z-0"
      />

      <Navbar />

      <div
        className={`relative z-10 w-full ${MAX_WIDTH_MAP[maxWidth]} mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-7 pb-16 md:pb-24 ${className}`}
      >
        {children}
      </div>
    </main>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  badge?: ReactNode;
  accent?: ModuleAccent;
}

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  icon,
  actions,
  badge,
  accent = "zinc",
}: PageHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 mb-6 border-b border-white/[0.06]">
      <div className="space-y-1.5 min-w-0">
        {eyebrow && (
          <div
            className={`flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest ${ACCENT_EYEBROW[accent]}`}
          >
            {icon}
            <span>{eyebrow}</span>
          </div>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          {!eyebrow && icon && (
            <span
              className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${ACCENT_ICON_BADGE[accent]}`}
            >
              {icon}
            </span>
          )}
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {title}
          </h1>
          {badge}
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {actions}
        </div>
      )}
    </header>
  );
}

interface SurfacePanelProps {
  children: ReactNode;
  title?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
  noPadding?: boolean;
  accent?: ModuleAccent;
}

export function SurfacePanel({
  children,
  title,
  icon,
  action,
  className = "",
  noPadding = false,
  accent = "zinc",
}: SurfacePanelProps) {
  return (
    <section
      className={`bg-[#111113] border border-white/[0.06] rounded-2xl overflow-hidden ${ACCENT_TOP_BORDER[accent]} ${className}`}
    >
      {(title || action) && (
        <div className="px-4 sm:px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {icon && <span className="text-zinc-400 shrink-0">{icon}</span>}
            {title && (
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 truncate">
                {title}
              </h2>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={noPadding ? "" : "p-4 sm:p-5"}>{children}</div>
    </section>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  className?: string;
  accent?: ModuleAccent;
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  className = "",
  accent = "zinc",
}: StatCardProps) {
  return (
    <div
      className={`bg-[#111113] border border-white/[0.06] rounded-2xl p-4 flex flex-col justify-between gap-2 ${ACCENT_TOP_BORDER[accent]} ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          {label}
        </span>
        {icon && <span className="text-zinc-400">{icon}</span>}
      </div>
      <div className="text-xl sm:text-2xl font-bold text-white tracking-tight tabular-nums">
        {value}
      </div>
      {hint && <span className="text-xs text-zinc-500">{hint}</span>}
    </div>
  );
}

interface FilterPillProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
  accent?: ModuleAccent;
}

export function FilterPill({
  active,
  onClick,
  children,
  className = "",
  accent = "zinc",
}: FilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors shrink-0 border ${
        active
          ? ACCENT_PILL[accent]
          : "bg-[#111113] text-zinc-400 border-white/[0.06] hover:text-zinc-200 hover:border-white/[0.12]"
      } ${className}`}
    >
      {children}
    </button>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="py-12 px-6 text-center flex flex-col items-center justify-center gap-2.5 bg-[#111113] border border-dashed border-white/[0.08] rounded-2xl">
      {icon && (
        <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-400 mb-1">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      {description && (
        <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
