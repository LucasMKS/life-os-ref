import { useEffect, useRef, useState, type ReactNode } from "react";

interface MasonryGridProps {
  children: ReactNode;
  className?: string;
}

/**
 * Dynamic auto-packing masonry grid.
 * Uses CSS Grid (`auto-rows-[1px]` + `grid-auto-flow: dense`) paired with
 * ResizeObserver so cards keep left-to-right order, adapt to any screen width,
 * and pack tightly with zero empty vertical gaps even as async data loads.
 */
export function MasonryGrid({ children, className = "" }: MasonryGridProps) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-x-5 gap-y-0 auto-rows-[1px] items-start w-full ${className}`}
      style={{ gridAutoFlow: "dense" }}
    >
      {children}
    </div>
  );
}

interface MasonryItemProps {
  children: ReactNode;
  /** Optional column span on md+ screens (1 or 2). Ignored on mobile (< md). */
  colSpan?: 1 | 2;
  className?: string;
}

const GAP_PX = 20;

export function MasonryItem({
  children,
  colSpan = 1,
  className = "",
}: MasonryItemProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [rowSpan, setRowSpan] = useState<number>(320);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const measure = () => {
      const height = el.getBoundingClientRect().height;
      const nextSpan = Math.max(1, Math.ceil(height) + GAP_PX);
      setRowSpan((prev) => (prev === nextSpan ? prev : nextSpan));
    };

    measure();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const spanClass = colSpan === 2 ? "md:col-span-2" : "col-span-1";

  return (
    <div
      className={`w-full min-w-0 ${spanClass} ${className}`}
      style={{ gridRowEnd: `span ${rowSpan}` }}
    >
      <div ref={contentRef} className="w-full min-w-0">
        {children}
      </div>
    </div>
  );
}
