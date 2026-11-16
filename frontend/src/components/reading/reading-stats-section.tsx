"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  CheckCircle2,
  Bookmark,
  FileText,
  Star,
  Layers,
  StickyNote,
  BarChart3,
  Flame,
  Trophy,
} from "lucide-react";
import { readingApi } from "@/lib/api";
import { SmartBookCover } from "@/components/reading/smart-book-cover";
import { SurfacePanel, EmptyState } from "@/components/ui/page-shell";

type ReadingSummary = {
  readingCount: number;
  readCount: number;
  wantToReadCount: number;
  totalPagesRead: number;
  totalSessions: number;
  averageRating: number | null;
  currentStreak: number;
  longestStreak: number;
};

type RecentNote = {
  id: string;
  note: string;
  createdAt: string;
  bookId: string;
  bookTitle: string;
  bookCoverUrl?: string | null;
};

const formatRelativeDate = (iso?: string) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "Agora";
  if (diffMinutes < 60) return `${diffMinutes}m atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
};

const TotalCard = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) => (
  <div className="bg-[#09090b] border border-white/[0.06] rounded-xl p-4 flex flex-col gap-2">
    <div className="flex items-center gap-2 text-zinc-400">
      {icon}
      <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </span>
    </div>
    <div className="text-2xl font-bold text-white tabular-nums">{value}</div>
  </div>
);

export function ReadingStatsSection() {
  const { data: summary, isLoading: loadingSummary } = useQuery<ReadingSummary>({
    queryKey: ["reading-summary"],
    queryFn: readingApi.getReadingSummary,
    staleTime: 1000 * 60 * 5,
  });

  const { data: rawNotes = [], isLoading: loadingNotes } = useQuery<
    RecentNote[]
  >({
    queryKey: ["reading-recent-notes"],
    queryFn: () => readingApi.getRecentNotes(5),
    staleTime: 1000 * 60 * 5,
  });

  const recentNotes = Array.isArray(rawNotes) ? rawNotes : [];

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <SurfacePanel
        title="Totais gerais"
        icon={<BarChart3 className="w-4 h-4" />}
      >
        {loadingSummary ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 bg-white/[0.04] animate-pulse rounded-xl"
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <TotalCard
                icon={<BookOpen className="w-3.5 h-3.5 text-emerald-400" />}
                label="Lendo"
                value={summary?.readingCount ?? 0}
              />
              <TotalCard
                icon={<CheckCircle2 className="w-3.5 h-3.5 text-zinc-300" />}
                label="Finalizados"
                value={summary?.readCount ?? 0}
              />
              <TotalCard
                icon={<Bookmark className="w-3.5 h-3.5 text-zinc-400" />}
                label="Na fila"
                value={summary?.wantToReadCount ?? 0}
              />
              <TotalCard
                icon={<FileText className="w-3.5 h-3.5 text-zinc-400" />}
                label="Páginas lidas"
                value={(summary?.totalPagesRead ?? 0).toLocaleString("pt-BR")}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-white/[0.06] pt-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                    Sessões
                  </span>
                  <span className="text-sm font-semibold text-white tabular-nums">
                    {summary?.totalSessions ?? 0}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                    Nota média
                  </span>
                  <span className="text-sm font-semibold text-white tabular-nums">
                    {summary?.averageRating != null
                      ? summary.averageRating.toFixed(1)
                      : "—"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                  <Flame className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                    Sequência
                  </span>
                  <span className="text-sm font-semibold text-white tabular-nums">
                    {summary?.currentStreak ?? 0} dias
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                  <Trophy className="w-4 h-4 text-zinc-300" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                    Recorde
                  </span>
                  <span className="text-sm font-semibold text-white tabular-nums">
                    {summary?.longestStreak ?? 0} dias
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </SurfacePanel>

      <SurfacePanel
        title="Últimas anotações"
        icon={<StickyNote className="w-4 h-4" />}
      >
        <div className="flex flex-col gap-2.5">
          {loadingNotes ? (
            [1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-18 bg-white/[0.04] animate-pulse rounded-xl"
              />
            ))
          ) : recentNotes.length > 0 ? (
            recentNotes.map((n) => (
              <Link
                key={n.id}
                href={`/reading/${n.bookId}`}
                className="flex items-start gap-3 p-3 bg-[#09090b] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03] rounded-xl transition-colors group/note"
              >
                <div className="w-9 h-12 bg-zinc-900 rounded-md overflow-hidden shrink-0 border border-white/[0.06]">
                  <SmartBookCover
                    url={n.bookCoverUrl}
                    title={n.bookTitle}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex flex-col flex-grow min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-medium text-xs sm:text-sm text-zinc-200 truncate group-hover/note:text-white transition-colors">
                      {n.bookTitle}
                    </h3>
                    <span className="text-[11px] text-zinc-500 shrink-0 tabular-nums">
                      {formatRelativeDate(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed whitespace-pre-wrap">
                    {n.note}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <EmptyState
              icon={<StickyNote className="w-5 h-5" />}
              title="Nenhuma anotação ainda"
              description="Suas citações e notas de leitura aparecerão aqui."
            />
          )}
        </div>
      </SurfacePanel>
    </div>
  );
}
