"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpen, Bookmark, ChevronRight } from "lucide-react";
import Link from "next/link";
import { readingApi } from "@/lib/api";
import { SmartBookCover } from "@/components/reading/smart-book-cover";

interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string | null;
  totalPages: number;
  readPages: number;
  status: "READING" | "READ" | "WANT_TO_READ";
}

export function ReadingWidget() {
  const { data: rawLibrary = [], isLoading: loading } = useQuery<Book[]>({
    queryKey: ["reading-library"],
    queryFn: readingApi.getLibrary,
    staleTime: 1000 * 60 * 5,
  });

  const library = Array.isArray(rawLibrary) ? rawLibrary : [];
  const currentlyReading = library.find((b) => b.status === "READING");
  const wantToRead = library
    .filter((b) => b.status === "WANT_TO_READ")
    .slice(0, 2);

  const totalPages = currentlyReading?.totalPages ?? 0;
  const readPages = currentlyReading?.readPages ?? 0;
  const progressPct =
    totalPages > 0
      ? Math.min(100, Math.max(0, Math.round((readPages / totalPages) * 100)))
      : 0;

  return (
    <div className="bg-[#111113] border border-white/[0.06] border-t-2 border-t-emerald-500/60 rounded-2xl p-5 sm:p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            Leitura Atual
          </h4>
        </div>
        <Link
          href="/reading"
          className="text-xs font-medium text-zinc-400 hover:text-emerald-400 inline-flex items-center gap-1 transition-colors bg-white/[0.04] hover:bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-white/[0.06] hover:border-emerald-500/25"
        >
          Estante <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex flex-col gap-5 h-full">
        {loading ? (
          <div className="h-36 bg-white/[0.04] animate-pulse rounded-xl" />
        ) : currentlyReading ? (
          <Link
            href={`/reading/${currentlyReading.id}`}
            className="flex gap-4 items-center group/book bg-[#09090b] p-3.5 rounded-xl border border-white/[0.06] hover:border-white/[0.12] transition-colors"
          >
            <div className="w-20 h-28 sm:w-24 sm:h-36 shrink-0 rounded-lg overflow-hidden border border-white/[0.08] bg-zinc-900">
              <SmartBookCover
                url={currentlyReading.coverUrl}
                title={currentlyReading.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col flex-grow min-w-0 py-0.5">
              <h3 className="font-semibold text-zinc-100 text-base leading-snug mb-1 line-clamp-2 group-hover/book:text-white transition-colors">
                {currentlyReading.title}
              </h3>
              <p className="text-zinc-400 text-xs font-medium truncate mb-4">
                {currentlyReading.author || "Autor desconhecido"}
              </p>

              <div className="w-full mt-auto">
                <div className="flex justify-between text-[11px] font-medium text-zinc-500 mb-1.5">
                  <span>Progresso</span>
                  <span className="text-zinc-200 tabular-nums">
                    {progressPct}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1.5 tabular-nums">
                  {readPages} de {totalPages} páginas
                </p>
              </div>
            </div>
          </Link>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-6 bg-[#09090b] border border-white/[0.06] border-dashed rounded-xl">
            <BookOpen className="w-7 h-7 text-zinc-700 mb-2" />
            <p className="text-zinc-400 text-xs font-medium">
              Nenhum livro em andamento.
            </p>
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-white/[0.06]">
          <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 mb-3">
            <Bookmark className="w-3.5 h-3.5 text-zinc-500" /> Próximos na Fila
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {loading ? (
              [1, 2].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-white/[0.04] animate-pulse rounded-xl"
                />
              ))
            ) : wantToRead.length > 0 ? (
              wantToRead.map((book) => (
                <Link
                  key={book.id}
                  href={`/reading/${book.id}`}
                  className="flex items-center gap-3 bg-[#09090b] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] rounded-xl p-2.5 group/queue transition-colors"
                >
                  <div className="w-10 h-14 bg-zinc-900 rounded-md shrink-0 overflow-hidden border border-white/[0.08]">
                    <SmartBookCover
                      url={book.coverUrl}
                      title={book.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h4 className="font-medium text-xs text-zinc-200 truncate group-hover/queue:text-white transition-colors">
                      {book.title}
                    </h4>
                    <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                      {book.author || "Autor desconhecido"}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-zinc-500 text-xs py-3 bg-[#09090b] rounded-xl text-center border border-white/[0.06]">
                Fila de leitura vazia.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
