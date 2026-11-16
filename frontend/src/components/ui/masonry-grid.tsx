import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

interface MasonryItemProps {
  children: ReactNode;
  /** Optional column span on md+ screens (1 or 2). Ignored on mobile (< 680px). */
  colSpan?: 1 | 2;
  className?: string;
}

export function MasonryItem({
  children,
  className = "",
}: MasonryItemProps) {
  return <div className={`w-full min-w-0 ${className}`}>{children}</div>;
}

interface MasonryGridProps {
  children: ReactNode;
  gap?: number;
  className?: string;
}

interface ItemPosition {
  left: number;
  top: number;
  width: number;
}

function getColumnCount(containerWidth: number): number {
  if (containerWidth < 680) return 1;
  if (containerWidth < 1040) return 2;
  if (containerWidth < 1360) return 3;
  return 4;
}

/**
 * Skyline 2D Masonry Grid with Lookahead.
 * Dynamically packs 1-col and 2-col cards into the lowest available slots
 * without leaving awkward vertical gaps when a wide card waits for an uneven column pair.
 */
export function MasonryGrid({
  children,
  gap = 20,
  className = "",
}: MasonryGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [positions, setPositions] = useState<ItemPosition[]>([]);
  const [containerHeight, setContainerHeight] = useState<number>(0);

  const childArray = Children.toArray(children).filter(isValidElement) as ReactElement<MasonryItemProps>[];
  const itemCount = childArray.length;
  const colSpans = childArray.map((child) => (child.props.colSpan === 2 ? 2 : 1));
  const spansKey = colSpans.join(",");

  const computeLayout = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerWidth = Math.floor(container.clientWidth);
    if (containerWidth <= 0) return;

    const cols = getColumnCount(containerWidth);
    const colWidth = (containerWidth - gap * (cols - 1)) / cols;

    // On 1-column mobile, simple vertical stack
    if (cols === 1) {
      let y = 0;
      const nextPositions: ItemPosition[] = [];
      for (let i = 0; i < itemCount; i++) {
        const el = itemRefs.current[i];
        const h = el ? Math.ceil(el.getBoundingClientRect().height) : 0;
        nextPositions[i] = { left: 0, top: y, width: containerWidth };
        y += h + gap;
      }
      setPositions(nextPositions);
      setContainerHeight(Math.max(0, y - gap));
      return;
    }

    // Read current measured heights (using assigned widths first)
    const heights = new Array<number>(itemCount).fill(0);
    for (let i = 0; i < itemCount; i++) {
      const el = itemRefs.current[i];
      if (!el) continue;
      const span = Math.min(colSpans[i], cols);
      const targetWidth = span * colWidth + (span - 1) * gap;
      if (Math.abs(el.offsetWidth - targetWidth) > 1) {
        el.style.width = `${targetWidth}px`;
      }
      heights[i] = Math.ceil(el.getBoundingClientRect().height);
    }

    // Skyline packing with lookahead for 1-col items to prevent vertical holes
    const colHeights = new Array<number>(cols).fill(0);
    const remaining = Array.from({ length: itemCount }, (_, i) => i);
    const nextPositions: ItemPosition[] = new Array(itemCount);

    const findBestSlot = (span: number) => {
      let bestCol = 0;
      let bestTop = Infinity;
      let bestMinInSpan = Infinity;

      for (let c = 0; c <= cols - span; c++) {
        const slice = colHeights.slice(c, c + span);
        const top = Math.max(...slice);
        const minInSpan = Math.min(...slice);
        if (top < bestTop || (top === bestTop && minInSpan < bestMinInSpan)) {
          bestTop = top;
          bestCol = c;
          bestMinInSpan = minInSpan;
        }
      }
      return { col: bestCol, top: bestTop, minInSpan: bestMinInSpan };
    };

    while (remaining.length > 0) {
      let pickQueueIndex = 0;
      const headIdx = remaining[0];
      const headSpan = Math.min(colSpans[headIdx], cols);
      const headSlot = findBestSlot(headSpan);

      // If placing a 2-col card would leave an empty hole > 60px in one of its columns,
      // look ahead for a 1-col card to fill that shorter column first!
      if (headSpan > 1 && headSlot.top - headSlot.minInSpan > 60) {
        const compactQueueIdx = remaining.findIndex(
          (idx) => Math.min(colSpans[idx], cols) === 1
        );
        if (compactQueueIdx !== -1) {
          pickQueueIndex = compactQueueIdx;
        }
      }

      const itemIdx = remaining.splice(pickQueueIndex, 1)[0];
      const span = Math.min(colSpans[itemIdx], cols);
      const { col, top } = findBestSlot(span);
      const width = span * colWidth + (span - 1) * gap;
      const left = col * (colWidth + gap);

      nextPositions[itemIdx] = { left, top, width };

      const newColHeight = top + heights[itemIdx] + gap;
      for (let k = col; k < col + span; k++) {
        colHeights[k] = newColHeight;
      }
    }

    const totalH = Math.max(0, ...colHeights) - gap;
    setPositions(nextPositions);
    setContainerHeight(Math.max(0, totalH));
  }, [gap, itemCount, spansKey]);

  useLayoutEffect(() => {
    computeLayout();
  }, [computeLayout]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;

    let rafId = 0;
    const scheduleCompute = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        computeLayout();
      });
    };

    const observer = new ResizeObserver(scheduleCompute);
    observer.observe(container);
    for (let i = 0; i < itemCount; i++) {
      const el = itemRefs.current[i];
      if (el) observer.observe(el);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [computeLayout, itemCount]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      style={{ height: containerHeight > 0 ? `${containerHeight}px` : undefined }}
    >
      {childArray.map((child, idx) => {
        const pos = positions[idx];
        return (
          <div
            key={child.key ?? idx}
            ref={(el) => {
              itemRefs.current[idx] = el;
            }}
            className={pos ? "absolute transition-[left,top] duration-200 ease-out" : "mb-5"}
            style={
              pos
                ? {
                    left: `${pos.left}px`,
                    top: `${pos.top}px`,
                    width: `${pos.width}px`,
                  }
                : undefined
            }
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}
