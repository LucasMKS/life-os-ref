"use client";

import { useQuery } from "@tanstack/react-query";
import { Gamepad2, ChevronRight, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import { gamingApi } from "@/lib/api";

interface GamingNews {
  id: string;
  title: string;
  game: string;
  publishedAt?: string;
  url: string;
  type?: string;
}

export function GamingWidget() {
  const { data: news = [], isLoading } = useQuery<GamingNews[]>({
    queryKey: ["gaming-news"],
    queryFn: gamingApi.getNews,
  });

  const latestNews = news.slice(0, 4);

  const getBadgeStyle = (type?: string, game?: string) => {
    if (type === "PATCH_NOTE" || game === "LoL" || game === "TFT")
      return "text-red-400 bg-red-500/10 border-red-500/20";
    return "text-blue-400 bg-blue-500/10 border-blue-500/20";
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Recente";
    const safeDate = dateString.endsWith("Z") ? dateString : `${dateString}Z`;
    return new Date(safeDate).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  };

  return (
    <div className="relative bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-blue-500/50 rounded-3xl p-5 md:p-6 lg:p-8 shadow-2xl flex flex-col h-full overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none -ml-20 -mb-20 transition-opacity group-hover:opacity-100 opacity-60"></div>

      <Gamepad2
        className="absolute -bottom-10 -right-10 w-64 h-64 text-white opacity-[0.015] pointer-events-none -rotate-12"
        strokeWidth={1}
      />

      <div className="flex items-center justify-between mb-5 md:mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <Gamepad2 className="text-blue-400 w-4 h-4 md:w-5 md:h-5" />
          <h2 className="text-base md:text-lg font-bold text-white tracking-tight">
            Radar de Updates
          </h2>
        </div>
        <Link
          href="/gaming"
          className="text-[10px] md:text-xs font-bold text-zinc-500 hover:text-blue-400 flex items-center transition-colors uppercase tracking-wider bg-white/5 hover:bg-blue-500/10 px-2.5 py-1.5 md:px-3 md:py-1.5 rounded-full border border-white/5 hover:border-blue-500/30"
        >
          Gerenciar <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
        </Link>
      </div>

      <div className="flex flex-col gap-2.5 md:gap-3 flex-grow relative z-10">
        {isLoading ? (
          <div className="flex-grow flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500/50" />
          </div>
        ) : latestNews.length > 0 ? (
          latestNews.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group/item flex flex-col justify-center py-2.5 px-3 md:py-3 md:px-4 bg-black/20 hover:bg-blue-500/10 rounded-xl transition-all border border-white/5 hover:border-blue-500/30 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]"
            >
              <div className="flex items-center justify-between mb-1.5 md:mb-2">
                <span
                  className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border backdrop-blur-sm ${getBadgeStyle(item.type, item.game)}`}
                >
                  {item.game}
                </span>
                <span className="text-[9px] md:text-[10px] text-zinc-500 font-semibold bg-white/5 px-2 py-0.5 rounded">
                  {formatDate(item.publishedAt)}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3 md:gap-4">
                <h4 className="text-xs md:text-sm font-bold text-zinc-300 truncate group-hover/item:text-blue-400 transition-colors">
                  {item.title}
                </h4>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-600 group-hover/item:text-blue-400 shrink-0 transition-colors opacity-100 lg:opacity-0 lg:group-hover/item:opacity-100 translate-x-0 lg:-translate-x-2 lg:group-hover/item:translate-x-0" />
              </div>
            </a>
          ))
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-6 bg-black/20 border border-white/5 border-dashed rounded-2xl">
            <Gamepad2 className="w-8 h-8 text-zinc-700 mb-2" />
            <p className="text-zinc-500 text-xs md:text-sm font-medium">
              Nenhum update recente.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
