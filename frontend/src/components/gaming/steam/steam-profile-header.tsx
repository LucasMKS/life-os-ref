"use client";

import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Flame, Gamepad2, Play } from "lucide-react";
import { gamingApi, statsApi } from "@/lib/api";

interface SteamProfileHeaderProps {
  onOpenLibrary?: () => void;
}

export function SteamProfileHeader({ onOpenLibrary }: SteamProfileHeaderProps) {
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
    ((Array.isArray(playtimeStats) ? playtimeStats : []).reduce(
      (acc: number, curr: any) => acc + (curr?.minutesPlayed || 0),
      0
    ) || 0) / 60
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
      {/* Card do Perfil & Atividade */}
      <div className="lg:col-span-2 bg-[#121214]/70 backdrop-blur-xl border border-white/5 rounded-3xl p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 relative overflow-hidden group shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-opacity group-hover:opacity-100 opacity-30" />

        <div className="relative shrink-0">
          <img
            src={profile.avatarUrl}
            alt={profile.personaName}
            className="w-16 h-16 md:w-20 md:h-20 rounded-2xl border-2 border-white/10 shadow-lg object-cover"
          />
          <span
            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#121214] ${
              isPlaying ? "bg-emerald-500 animate-pulse" : "bg-zinc-600"
            }`}
            title={isPlaying ? "Jogando agora" : "Offline"}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl md:text-2xl font-bold text-white truncate">
              {profile.personaName}
            </h2>
            <a
              href={profile.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-zinc-500 hover:text-white transition-colors"
              title="Abrir perfil na Steam"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <p className="text-zinc-400 text-xs md:text-sm mb-3 flex items-center gap-1.5 truncate">
            {isPlaying ? (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400 shrink-0" />
                <span className="text-zinc-400">Jogando</span>
                <span className="text-emerald-400 font-semibold truncate">
                  {status.gameextrainfo}
                </span>
              </>
            ) : (
              <span className="text-zinc-500">Offline no momento</span>
            )}
          </p>

          <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs">
            <div className="bg-black/30 border border-white/5 rounded-xl px-3 py-1.5">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                Na Conta
              </span>
              <span className="text-sm font-bold text-white tabular-nums">
                {library?.response?.game_count || 0} jogos
              </span>
            </div>

            <div className="bg-black/30 border border-white/5 rounded-xl px-3 py-1.5">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                Esta Semana
              </span>
              <span className="text-sm font-bold text-blue-400 tabular-nums">
                {weeklyHours}h jogadas
              </span>
            </div>

            {onOpenLibrary && (
              <button
                onClick={onOpenLibrary}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 border border-blue-500/20 rounded-xl font-semibold transition-colors ml-auto text-xs"
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>Explorar Biblioteca</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Card de Recomendação Inteligente */}
      <div className="bg-[#121214]/70 backdrop-blur-xl border border-white/5 rounded-3xl p-5 md:p-6 flex flex-col justify-between shadow-xl relative overflow-hidden group">
        <div>
          <div className="flex items-center gap-2 text-blue-400 mb-3">
            <Flame className="w-4 h-4 fill-blue-400" />
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Sugestão de Jogo
            </h4>
          </div>

          {recommendations && recommendations.length > 0 ? (
            <div className="flex items-center gap-3">
              <img
                src={`https://cdn.akamai.steamstatic.com/steam/apps/${recommendations[0].appid}/header.jpg`}
                alt={recommendations[0].name}
                className="w-24 h-14 rounded-xl object-cover shadow-md shrink-0"
              />
              <div className="min-w-0">
                <h5 className="text-sm font-bold text-white line-clamp-1">
                  {recommendations[0].name}
                </h5>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {(recommendations[0].playtime_forever ?? 0) > 0
                    ? `${Math.round((recommendations[0].playtime_forever ?? 0) / 60)}h jogadas`
                    : "Ainda não jogado"}
                </p>
                <a
                  href={`https://store.steampowered.com/app/${recommendations[0].appid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-semibold text-blue-400 hover:text-blue-300 transition-colors inline-block mt-1"
                >
                  Ver na Steam →
                </a>
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-500 py-2">
              Sincronizando sugestões da biblioteca...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
