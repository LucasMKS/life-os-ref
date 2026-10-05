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
  bookCoverUrl: string;
};

const formatRelativeDate = (iso: string) => {
  const date = new Date(iso);
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
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: string;
}) => (
  <div className="bg-black/40 border border-white/5 rounded-2xl p-4 md:p-5 flex flex-col gap-2 shadow-sm">
    <div className={`flex items-center gap-2 ${accent}`}>
      {icon}
      <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest">
        {label}
      </span>
    </div>
    <div className="text-2xl md:text-3xl font-bold text-white tabular-nums">
      {value}
    </div>
  </div>
);

export function ReadingStatsSection() {
  const { data: summary, isLoading: loadingSummary } = useQuery<ReadingSummary>({
    queryKey: ["reading-summary"],
    queryFn: readingApi.getReadingSummary,
    staleTime: 1000 * 60 * 5,
  });

  const { data: recentNotes = [], isLoading: loadingNotes } = useQuery<
    RecentNote[]
  >({
    queryKey: ["reading-recent-notes"],
    queryFn: () => readingApi.getRecentNotes(5),
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 animate-in fade-in duration-500">
      {/* TOTAIS GERAIS */}
      <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-emerald-500/50 rounded-3xl p-5 md:p-6 lg:p-8 shadow-2xl relative overflow-hidden group h-fit">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none transition-opacity opacity-50 group-hover:opacity-100"></div>

        <div className="flex items-center gap-2 mb-5 md:mb-6 relative z-10">
          <BarChart3 className="text-emerald-400 w-4 h-4 md:w-5 md:h-5" />
          <h4 className="text-sm font-bold text-white uppercase tracking-widest">
            Totais gerais
          </h4>
        </div>

        {loadingSummary ? (
          <div className="grid grid-cols-2 gap-3 md:gap-4 relative z-10">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 bg-white/5 animate-pulse rounded-2xl"
              ></div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4 relative z-10">
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <TotalCard
                icon={<BookOpen className="w-3.5 h-3.5" />}
                label="Lendo"
                value={summary?.readingCount ?? 0}
                accent="text-emerald-400"
              />
              <TotalCard
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                label="Finalizados"
                value={summary?.readCount ?? 0}
                accent="text-amber-400"
              />
              <TotalCard
                icon={<Bookmark className="w-3.5 h-3.5" />}
                label="Na fila"
                value={summary?.wantToReadCount ?? 0}
                accent="text-blue-400"
              />
              <TotalCard
                icon={<FileText className="w-3.5 h-3.5" />}
                label="Páginas lidas"
                value={(summary?.totalPagesRead ?? 0).toLocaleString("pt-BR")}
                accent="text-zinc-300"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 border-t border-white/5 pt-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Sessões
                  </span>
                  <span className="text-sm md:text-base font-semibold text-white tabular-nums">
                    {summary?.totalSessions ?? 0}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Nota média
                  </span>
                  <span className="text-sm md:text-base font-semibold text-white tabular-nums">
                    {summary?.averageRating != null
                      ? summary.averageRating.toFixed(1)
                      : "—"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-red-500 fill-red-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Sequência
                  </span>
                  <span className="text-sm md:text-base font-semibold text-white tabular-nums">
                    {summary?.currentStreak ?? 0} dias
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-orange-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Recorde
                  </span>
                  <span className="text-sm md:text-base font-semibold text-white tabular-nums">
                    {summary?.longestStreak ?? 0} dias
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ÚLTIMAS ANOTAÇÕES */}
      <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-blue-500/50 rounded-3xl p-5 md:p-6 lg:p-8 shadow-2xl relative overflow-hidden group h-fit">
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-opacity opacity-50 group-hover:opacity-100"></div>

        <div className="flex items-center gap-2 mb-5 md:mb-6 relative z-10">
          <StickyNote className="text-blue-400 w-4 h-4 md:w-5 md:h-5" />
          <h4 className="text-sm font-bold text-white uppercase tracking-widest">
            Últimas anotações
          </h4>
        </div>

        <div className="flex flex-col gap-3 relative z-10">
          {loadingNotes ? (
            [1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-20 bg-white/5 animate-pulse rounded-2xl"
              ></div>
            ))
          ) : recentNotes.length > 0 ? (
            recentNotes.map((n) => (
              <Link
                key={n.id}
                href={`/reading/${n.bookId}`}
                className="flex items-start gap-3 p-3 bg-black/40 border border-white/5 hover:border-blue-500/30 hover:bg-white/[0.04] rounded-2xl transition-all group/note"
              >
                <div className="w-9 h-12 md:w-10 md:h-14 bg-zinc-900 rounded-md overflow-hidden shrink-0 border border-white/5">
                  {n.bookCoverUrl ? (
                    <SmartBookCover
                      url={n.bookCoverUrl}
                      title={n.bookTitle}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-zinc-700" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col flex-grow min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-bold text-xs md:text-sm text-zinc-200 truncate group-hover/note:text-blue-400 transition-colors">
                      {n.bookTitle}
                    </h3>
                    <span className="text-[10px] text-zinc-500 shrink-0 tabular-nums">
                      {formatRelativeDate(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-[11px] md:text-xs text-zinc-400 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                    {n.note}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <div className="p-6 bg-black/20 rounded-2xl border border-white/5 border-dashed text-zinc-600 text-xs text-center">
              Nenhuma anotação ainda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
