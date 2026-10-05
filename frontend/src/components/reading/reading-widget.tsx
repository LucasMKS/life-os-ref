"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpen, Bookmark, ChevronRight, Quote } from "lucide-react";
import Link from "next/link";
import { readingApi } from "@/lib/api";
import { SmartBookCover } from "@/components/reading/smart-book-cover";

interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  totalPages: number;
  readPages: number;
  status: "READING" | "READ" | "WANT_TO_READ";
}

export function ReadingWidget() {
  const { data: library = [], isLoading: loading } = useQuery<Book[]>({
    queryKey: ["reading-library"],
    queryFn: readingApi.getLibrary,
    staleTime: 1000 * 60 * 5,
  });

  const currentlyReading = library.filter((b) => b.status === "READING")[0];
  const wantToRead = library
    .filter((b) => b.status === "WANT_TO_READ")
    .slice(0, 2);

  return (
    <div className="relative bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-emerald-500/50 rounded-3xl p-6 lg:p-8 shadow-2xl flex flex-col h-full overflow-hidden group">
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none -mr-20 -mb-20 transition-opacity group-hover:opacity-100 opacity-60"></div>

      <Quote
        className="absolute top-12 right-12 w-48 h-48 text-white opacity-[0.015] pointer-events-none rotate-12"
        strokeWidth={1}
      />

      <div className="flex items-center justify-between mb-8 relative z-10">
        <h4 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          Leitura Atual
        </h4>
        <Link
          href="/reading"
          className="text-xs font-bold text-zinc-500 hover:text-emerald-400 flex items-center transition-colors uppercase tracking-wider bg-white/5 hover:bg-emerald-500/10 px-3 py-1.5 rounded-full border border-white/5 hover:border-emerald-500/30"
        >
          Hub Completo <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
        </Link>
      </div>

      <div className="flex flex-col gap-6 h-full relative z-10">
        {loading ? (
          <div className="h-36 bg-white/5 animate-pulse rounded-2xl"></div>
        ) : currentlyReading ? (
          <div className="flex gap-5 items-center group/book cursor-pointer bg-black/20 p-4 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all hover:-translate-y-1 hover:shadow-[0_10px_30px_-15px_rgba(16,185,129,0.3)]">
            <div className="w-24 h-36 shrink-0 rounded-xl overflow-hidden shadow-lg border border-white/10 group-hover/book:scale-105 transition-all duration-500">
              <SmartBookCover
                url={currentlyReading.coverUrl}
                title={currentlyReading.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col flex-grow py-1">
              <h3 className="font-bold text-white text-lg leading-tight mb-1 line-clamp-2 group-hover/book:text-emerald-400 transition-colors">
                {currentlyReading.title}
              </h3>
              <p className="text-emerald-400/80 text-xs font-bold uppercase tracking-wider mb-4">
                {currentlyReading.author}
              </p>

              <div className="w-full">
                <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  <span>Progresso</span>
                  <span className="text-zinc-300">
                    {Math.round(
                      (currentlyReading.readPages /
                        currentlyReading.totalPages) *
                        100,
                    )}
                    %
                  </span>
                </div>
                <div className="w-full h-1.5 bg-black/60 border border-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.6)]"
                    style={{
                      width: `${Math.round((currentlyReading.readPages / currentlyReading.totalPages) * 100)}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-zinc-500 mt-2 font-medium">
                  {currentlyReading.readPages} de {currentlyReading.totalPages}{" "}
                  páginas
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-6 bg-black/20 border border-white/5 border-dashed rounded-2xl">
            <BookOpen className="w-8 h-8 text-zinc-700 mb-2" />
            <p className="text-zinc-400 text-sm font-medium">
              Nenhum livro em andamento.
            </p>
          </div>
        )}

        <div className="mt-auto pt-6 border-t border-white/5">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-4">
            <Bookmark className="w-3.5 h-3.5 text-emerald-500/50" /> Próximos na
            Fila
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {loading ? (
              [1, 2].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-white/5 animate-pulse rounded-xl"
                ></div>
              ))
            ) : wantToRead.length > 0 ? (
              wantToRead.map((book) => (
                <Link
                  key={book.id}
                  href="/reading"
                  className="flex items-center gap-3 bg-black/40 hover:bg-black/60 border border-white/5 hover:border-emerald-500/30 rounded-xl p-2.5 cursor-pointer group/queue transition-all shadow-sm"
                >
                  <div className="w-10 h-14 bg-zinc-900 rounded shrink-0 overflow-hidden shadow-sm border border-white/10">
                    <SmartBookCover
                      url={book.coverUrl}
                      title={book.title}
                      className="w-full h-full object-cover group-hover/queue:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex flex-col min-w-0 pr-1">
                    <h4 className="font-bold text-xs text-zinc-300 truncate group-hover/queue:text-emerald-400 transition-colors">
                      {book.title}
                    </h4>
                    <p className="text-[10px] font-medium text-zinc-500 truncate mt-0.5 uppercase tracking-wider">
                      {book.author}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-2 text-zinc-600 text-xs py-2 bg-black/20 rounded-xl text-center border border-white/5">
                Fila de leitura vazia.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
