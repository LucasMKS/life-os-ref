"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ExternalLink,
  Gamepad2,
  MonitorPlay,
  Play,
  Rss,
} from "lucide-react";
import { Twitch } from "../twitch-icon";
import { gamingApi, statsApi } from "@/lib/api";

const formatDate = (dateString?: string) => {
  if (!dateString) return "Recente";
  const safeDate = dateString.endsWith("Z") ? dateString : `${dateString}Z`;
  return new Date(safeDate).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
};

function SectionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors"
    >
      {label} <ArrowRight className="w-3 h-3" />
    </Link>
  );
}

function SteamMiniCard() {
  const { data: profile } = useQuery({
    queryKey: ["steam-profile"],
    queryFn: gamingApi.getSteamProfile,
    retry: false,
  });

  const { data: status } = useQuery({
    queryKey: ["steam-status"],
    queryFn: gamingApi.getSteamStatus,
    enabled: !!profile,
    refetchInterval: 30000,
  });

  const { data: library } = useQuery({
    queryKey: ["steam-library"],
    queryFn: gamingApi.getSteamLibrary,
    enabled: !!profile,
  });

  const { data: playtimeStats } = useQuery({
    queryKey: ["gaming-playtime"],
    queryFn: () => statsApi.getDailyPlaytime(),
    enabled: !!profile,
  });

  if (!profile) {
    return (
      <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-blue-500/50 rounded-3xl p-6 flex flex-col items-center text-center gap-3">
        <Gamepad2 className="w-10 h-10 text-blue-500/60" />
        <h4 className="text-base font-bold text-white">
          Conecte sua conta Steam
        </h4>
        <p className="text-xs text-zinc-400 max-w-xs">
          Vincule para ver biblioteca, horas jogadas e diário no Life OS.
        </p>
        <SectionLink href="/gaming?tab=steam" label="Vincular agora" />
      </div>
    );
  }

  const isPlaying = status?.gameextrainfo;
  const weeklyHours = Math.round(
    (playtimeStats?.reduce(
      (acc: number, curr: any) => acc + curr.minutesPlayed,
      0
    ) || 0) / 60
  );

  return (
    <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-blue-500/50 rounded-3xl p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <img
          src={profile.avatarUrl}
          alt={profile.personaName}
          className="w-14 h-14 rounded-2xl border-2 border-blue-500/30 shadow-lg"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-base font-bold text-white truncate">
              {profile.personaName}
            </h4>
            <span
              className={`w-2 h-2 rounded-full ${
                isPlaying ? "bg-green-500 animate-pulse" : "bg-zinc-600"
              }`}
            ></span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1.5 truncate">
            {isPlaying ? (
              <>
                <Play className="w-3 h-3 text-green-400 fill-green-400 shrink-0" />
                <span className="text-green-400 font-semibold truncate">
                  {status.gameextrainfo}
                </span>
              </>
            ) : (
              "Offline"
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-black/30 rounded-xl p-3 border border-white/5">
          <p className="text-lg font-black text-white tabular-nums">
            {library?.response?.game_count || 0}
          </p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
            Jogos
          </p>
        </div>
        <div className="bg-black/30 rounded-xl p-3 border border-white/5">
          <p className="text-lg font-black text-blue-400 tabular-nums">
            {weeklyHours}h
          </p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
            Esta semana
          </p>
        </div>
      </div>

      <SectionLink href="/gaming?tab=steam" label="Ver biblioteca" />
    </div>
  );
}

function TwitchTopLives() {
  const { data: liveStreams = [], isLoading } = useQuery({
    queryKey: ["twitch-live-streams"],
    queryFn: gamingApi.getLiveStreams,
    refetchInterval: 1000 * 60 * 5,
  });

  const top = (liveStreams as any[]).slice(0, 3);

  return (
    <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-purple-500/50 rounded-3xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Twitch className="w-4 h-4 text-purple-400" />
          Ao Vivo Agora
        </h4>
        <SectionLink href="/gaming?tab=twitch" label="Ver todas" />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-14 bg-white/5 rounded-2xl animate-pulse"
            ></div>
          ))}
        </div>
      ) : top.length > 0 ? (
        <div className="flex flex-col gap-2">
          {top.map((stream: any, idx: number) => (
            <a
              key={idx}
              href={`https://twitch.tv/${stream.user_name?.toLowerCase() ?? ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-black/30 hover:bg-black/50 border border-white/5 hover:border-purple-500/30 rounded-2xl p-2 transition-all group"
            >
              <div className="relative w-20 h-12 shrink-0 rounded-lg overflow-hidden">
                <img
                  src={stream.thumbnail_url
                    ?.replace("{width}", "320")
                    .replace("{height}", "180")}
                  alt={stream.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 left-1 text-[9px] font-bold text-white bg-black/70 px-1 rounded">
                  {stream.viewer_count?.toLocaleString("pt-BR") ?? "0"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate group-hover:text-purple-400 transition-colors">
                  {stream.user_name}
                </p>
                <p className="text-[10px] text-purple-400/80 font-semibold uppercase tracking-wider truncate">
                  {stream.game_name}
                </p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-purple-400 shrink-0 transition-colors" />
            </a>
          ))}
        </div>
      ) : (
        <div className="bg-black/20 rounded-2xl p-6 text-center border border-dashed border-white/10">
          <MonitorPlay className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
          <p className="text-xs text-zinc-500">
            Nenhum canal monitorado ao vivo agora.
          </p>
        </div>
      )}
    </div>
  );
}

function NewsPreview() {
  const { data: news = [], isLoading } = useQuery({
    queryKey: ["gaming-news"],
    queryFn: gamingApi.getNews,
  });

  const top = (news as any[]).slice(0, 4);

  return (
    <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-blue-500/50 rounded-3xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Rss className="w-4 h-4 text-blue-400" />
          Últimas Atualizações
        </h4>
        <SectionLink href="/gaming?tab=news" label="Feed completo" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 bg-white/5 rounded-2xl animate-pulse"
            ></div>
          ))}
        </div>
      ) : top.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {top.map((item: any) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col gap-1.5 bg-black/30 hover:bg-black/50 border border-white/5 hover:border-blue-500/30 rounded-2xl p-3 transition-all group"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                  {item.game}
                </span>
                <span className="text-[9px] text-zinc-500 font-semibold">
                  {formatDate(item.publishedAt || item.date)}
                </span>
              </div>
              <p className="text-xs font-bold text-zinc-100 group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                {item.title}
              </p>
            </a>
          ))}
        </div>
      ) : (
        <div className="bg-black/20 rounded-2xl p-6 text-center border border-dashed border-white/10">
          <Rss className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
          <p className="text-xs text-zinc-500">
            Nenhuma novidade no radar agora.
          </p>
        </div>
      )}
    </div>
  );
}

export function GamingOverviewTab() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SteamMiniCard />
        <TwitchTopLives />
      </div>
      <NewsPreview />
    </div>
  );
}
