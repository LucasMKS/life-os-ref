"use client";

import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Flame, Play } from "lucide-react";
import { gamingApi, statsApi } from "@/lib/api";

export function SteamProfileHeader() {
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

  const { data: recommendations } = useQuery({
    queryKey: ["steam-recommendations"],
    queryFn: gamingApi.getRecommendations,
    enabled: !!profile,
  });

  const { data: playtimeStats } = useQuery({
    queryKey: ["gaming-playtime"],
    queryFn: () => statsApi.getDailyPlaytime(),
    enabled: !!profile,
  });

  if (!profile) return null;

  const isPlaying = status?.gameextrainfo;
  const weeklyHours = Math.round(
    (playtimeStats?.reduce(
      (acc: number, curr: any) => acc + curr.minutesPlayed,
      0
    ) || 0) / 60
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-[#121214]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex items-center gap-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-opacity group-hover:opacity-100 opacity-50"></div>

        <img
          src={profile.avatarUrl}
          alt={profile.personaName}
          className="w-20 h-20 rounded-2xl border-2 border-blue-500/30 shadow-2xl"
        />

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-white">
              {profile.personaName}
            </h2>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isPlaying ? "bg-green-500 animate-pulse" : "bg-zinc-600"
              }`}
            ></span>
          </div>
          <p className="text-zinc-400 text-sm mb-3 flex items-center gap-2">
            {isPlaying ? (
              <>
                <Play className="w-3.5 h-3.5 text-green-400 fill-green-400" />
                Jogando{" "}
                <span className="text-green-400 font-semibold">
                  {status.gameextrainfo}
                </span>
              </>
            ) : (
              "Atualmente Offline"
            )}
          </p>
          <div className="flex gap-4">
            <div className="text-xs text-zinc-500">
              <span className="block text-zinc-300 font-bold text-sm">
                {library?.response?.game_count || 0}
              </span>
              Jogos na conta
            </div>
            <div className="text-xs text-zinc-500">
              <span className="block text-zinc-300 font-bold text-sm">
                {weeklyHours}h
              </span>
              Jogadas esta semana
            </div>
          </div>
        </div>

        <a
          href={profile.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-zinc-400 hover:text-white"
        >
          <ExternalLink className="w-5 h-5" />
        </a>
      </div>

      <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-6 relative overflow-hidden group">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-blue-400 mb-4">
            <Flame className="w-5 h-5 fill-blue-400" />
            <h4 className="text-xs font-bold uppercase tracking-widest">
              Recomendação
            </h4>
          </div>
          {recommendations && recommendations.length > 0 ? (
            <div className="flex items-center gap-4">
              <img
                src={`https://cdn.akamai.steamstatic.com/steam/apps/${recommendations[0].appid}/header.jpg`}
                alt={recommendations[0].name}
                className="w-24 h-14 rounded-lg object-cover shadow-lg"
              />
              <div>
                <h5 className="text-sm font-bold text-white line-clamp-1">
                  {recommendations[0].name}
                </h5>
                <p className="text-[10px] text-zinc-400 mt-1">
                  {(recommendations[0].playtime_forever ?? 0) > 0
                    ? "Continue de onde parou"
                    : "Ainda não jogado"}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-zinc-400 text-sm">Buscando sugestões...</p>
          )}
        </div>
      </div>
    </div>
  );
}
