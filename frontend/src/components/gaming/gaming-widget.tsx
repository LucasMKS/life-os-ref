"use client";

import { useQuery } from "@tanstack/react-query";
import { Gamepad2, ChevronRight, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import { gamingApi } from "@/lib/api";
import { sanitizeUrl } from "@/lib/security";

interface GamingNews {
  id: string;
  title: string;
  game?: string;
  publishedAt?: string;
  url?: string;
  type?: string;
}

export function GamingWidget() {
  const { data: news = [], isLoading } = useQuery<GamingNews[]>({
    queryKey: ["gaming-news"],
    queryFn: gamingApi.getNews,
  });

  const latestNews = (Array.isArray(news) ? news : []).slice(0, 4);

  const getBadgeStyle = (type?: string, game?: string) => {
    if (type === "PATCH_NOTE" || game === "LoL" || game === "TFT") {
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    }
    return "text-blue-400 bg-blue-500/10 border-blue-500/20";
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Recente";
    const safeDate = dateString.endsWith("Z") ? dateString : `${dateString}Z`;
    const parsed = new Date(safeDate);
    if (Number.isNaN(parsed.getTime())) return "Recente";
    return parsed.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  };

  return (
    <div className="bg-[#111113] border border-white/[0.06] border-t-2 border-t-blue-500/60 rounded-2xl p-5 sm:p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gamepad2 className="text-blue-400 w-4 h-4" />
          <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
            Radar de Updates
          </h2>
        </div>
        <Link
          href="/gaming"
          className="text-xs font-medium text-zinc-400 hover:text-blue-300 flex items-center gap-0.5 transition-colors bg-white/[0.04] hover:bg-blue-500/10 px-2.5 py-1 rounded-xl border border-white/[0.06] hover:border-blue-500/25"
        >
          Gerenciar <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex flex-col gap-2.5 flex-grow">
        {isLoading ? (
          <div className="flex-grow flex items-center justify-center py-8 text-zinc-500">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : latestNews.length > 0 ? (
          latestNews.map((item) => {
            const safeUrl = sanitizeUrl(item.url);
            const inner = (
              <>
                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getBadgeStyle(
                      item.type,
                      item.game
                    )}`}
                  >
                    {item.game || "Game"}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-medium">
                    {formatDate(item.publishedAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-xs sm:text-sm font-medium text-zinc-200 truncate group-hover/item:text-white transition-colors">
                    {item.title || "Atualização"}
                  </h4>
                  {safeUrl && (
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-600 group-hover/item:text-zinc-300 shrink-0 transition-colors" />
                  )}
                </div>
              </>
            );

            return safeUrl ? (
              <a
                key={item.id}
                href={safeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group/item flex flex-col justify-center py-2.5 px-3 bg-[#09090b] hover:bg-white/[0.03] rounded-xl transition-colors border border-white/[0.06] hover:border-white/[0.12]"
              >
                {inner}
              </a>
            ) : (
              <div
                key={item.id}
                className="flex flex-col justify-center py-2.5 px-3 bg-[#09090b] rounded-xl border border-white/[0.06]"
              >
                {inner}
              </div>
            );
          })
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-6 bg-[#09090b] border border-white/[0.06] border-dashed rounded-xl">
            <Gamepad2 className="w-6 h-6 text-zinc-600 mb-2" />
            <p className="text-zinc-400 text-xs font-medium">
              Nenhum update recente.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
