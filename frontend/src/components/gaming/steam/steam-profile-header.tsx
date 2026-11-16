"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Flame, Gamepad2, Play } from "lucide-react";
import { gamingApi, statsApi } from "@/lib/api";
import { sanitizeUrl } from "@/lib/security";
import { SurfacePanel } from "@/components/ui/page-shell";

interface SteamProfileHeaderProps {
  onOpenLibrary?: () => void;
}

export function SteamProfileHeader({ onOpenLibrary }: SteamProfileHeaderProps) {
  const [avatarError, setAvatarError] = useState(false);
  const [recImageError, setRecImageError] = useState(false);

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

  const isPlaying = Boolean(status?.gameextrainfo);
  const weeklyHours = Math.round(
    ((Array.isArray(playtimeStats) ? playtimeStats : []).reduce(
      (acc: number, curr: { minutesPlayed?: number }) =>
        acc + (curr?.minutesPlayed || 0),
      0
    ) || 0) / 60
  );

  const safeProfileUrl = sanitizeUrl(profile.profileUrl);
  const safeAvatarUrl = sanitizeUrl(profile.avatarUrl);
  const topRec = Array.isArray(recommendations) ? recommendations[0] : null;
  const safeRecUrl =
    topRec?.appid != null
      ? sanitizeUrl(`https://store.steampowered.com/app/${encodeURIComponent(String(topRec.appid))}`)
      : null;
  const safeRecCover =
    topRec?.appid != null
      ? sanitizeUrl(
          `https://cdn.akamai.steamstatic.com/steam/apps/${encodeURIComponent(
            String(topRec.appid)
          )}/header.jpg`
        )
      : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Perfil & Atividade */}
      <SurfacePanel className="lg:col-span-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
          <div className="relative shrink-0">
            {safeAvatarUrl && !avatarError ? (
              <img
                src={safeAvatarUrl}
                alt={profile.personaName || "Steam Avatar"}
                loading="lazy"
                decoding="async"
                onError={() => setAvatarError(true)}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border border-white/[0.08] object-cover bg-[#09090b]"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border border-white/[0.08] bg-[#09090b] flex items-center justify-center text-zinc-500">
                <Gamepad2 className="w-7 h-7" />
              </div>
            )}
            <span
              className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#111113] ${
                isPlaying ? "bg-emerald-500" : "bg-zinc-600"
              }`}
              title={isPlaying ? "Jogando agora" : "Offline"}
            />
          </div>

          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg sm:text-xl font-bold text-white truncate">
                {profile.personaName || "Jogador Steam"}
              </h2>
              {safeProfileUrl && (
                <a
                  href={safeProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 text-zinc-500 hover:text-zinc-200 transition-colors shrink-0"
                  title="Abrir perfil na Steam"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            <div className="mb-3 flex items-center gap-2 min-w-0">
              {isPlaying ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 max-w-full">
                  <Play className="w-3 h-3 fill-emerald-400 shrink-0" />
                  <span className="truncate">Jogando {status.gameextrainfo}</span>
                </span>
              ) : (
                <span className="text-xs text-zinc-500">Offline no momento</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <div className="bg-[#09090b] border border-white/[0.06] rounded-xl px-3 py-1.5">
                <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider block">
                  Biblioteca
                </span>
                <span className="text-sm font-bold text-white tabular-nums">
                  {library?.response?.game_count || 0} jogos
                </span>
              </div>

              <div className="bg-[#09090b] border border-white/[0.06] rounded-xl px-3 py-1.5">
                <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider block">
                  Esta Semana
                </span>
                <span className="text-sm font-bold text-zinc-100 tabular-nums">
                  {weeklyHours}h jogadas
                </span>
              </div>

              {onOpenLibrary && (
                <button
                  type="button"
                  onClick={onOpenLibrary}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-100 text-zinc-950 hover:bg-white rounded-xl font-semibold transition-colors sm:ml-auto text-xs"
                >
                  <Gamepad2 className="w-3.5 h-3.5" />
                  <span>Explorar Biblioteca</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </SurfacePanel>

      {/* Sugestão de Jogo */}
      <SurfacePanel
        title="Sugestão de Jogo"
        icon={<Flame className="w-3.5 h-3.5" />}
      >
        {topRec ? (
          <div className="flex items-center gap-3">
            {safeRecCover && !recImageError ? (
              <img
                src={safeRecCover}
                alt={topRec.name || "Capa do jogo"}
                loading="lazy"
                decoding="async"
                onError={() => setRecImageError(true)}
                className="w-24 h-14 rounded-xl object-cover bg-[#09090b] border border-white/[0.06] shrink-0"
              />
            ) : (
              <div className="w-24 h-14 rounded-xl bg-[#09090b] border border-white/[0.06] flex items-center justify-center text-zinc-600 shrink-0">
                <Gamepad2 className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h5 className="text-sm font-semibold text-white truncate">
                {topRec.name || "Título Steam"}
              </h5>
              <p className="text-xs text-zinc-400 mt-0.5">
                {(topRec.playtime_forever ?? 0) > 0
                  ? `${Math.round((topRec.playtime_forever ?? 0) / 60)}h jogadas`
                  : "Ainda não jogado"}
              </p>
              {safeRecUrl && (
                <a
                  href={safeRecUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-300 hover:text-white transition-colors mt-1"
                >
                  <span>Ver na Steam</span>
                  <ExternalLink className="w-3 h-3 text-zinc-500" />
                </a>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-zinc-500 py-2">
            Sincronizando sugestões da biblioteca...
          </p>
        )}
      </SurfacePanel>
    </div>
  );
}
