import { ReactNode } from "react";

/** Superfície padrão da Central de Esportes: sólida (sem blur) para manter o scroll leve. */
export function SportsPanel({
  title,
  icon,
  action,
  children,
  className = "",
}: {
  title?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-white/[0.06] bg-[#111113] overflow-hidden ${className}`}
    >
      {title && (
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.05]">
          <h2 className="flex items-center gap-2 text-[13px] font-semibold text-zinc-100">
            {icon && <span className="text-zinc-500">{icon}</span>}
            {title}
          </h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function PanelEmpty({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-2 px-6 py-10">
      {icon && <div className="text-zinc-600 mb-1">{icon}</div>}
      <p className="text-sm font-medium text-zinc-300">{title}</p>
      {description && <p className="text-xs text-zinc-500 max-w-xs">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function RowSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="divide-y divide-white/[0.04]">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-[56px_1fr] gap-3 px-4 py-3.5">
          <div className="h-3 w-10 rounded bg-white/[0.05] animate-pulse" />
          <div className="space-y-2">
            <div className="h-3 w-2/3 rounded bg-white/[0.05] animate-pulse" />
            <div className="h-3 w-1/2 rounded bg-white/[0.05] animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
