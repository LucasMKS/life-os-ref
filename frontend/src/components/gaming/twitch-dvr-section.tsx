"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { gamingApi } from "@/lib/api";
import { sanitizeUrl } from "@/lib/security";
import { TwitchDvrStatus, TwitchDvrVod } from "@/lib/types";
import { EmptyState, SurfacePanel } from "@/components/ui/page-shell";
import {
  Video,
  HardDrive,
  CloudUpload,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Radio,
  FileVideo,
  Info,
  ChevronDown,
} from "lucide-react";

function getDvrPanelUrl(): string | null {
  const envUrl = (import.meta as unknown as { env?: Record<string, string> })
    ?.env?.VITE_TWITCH_DVR_URL;
  const fallback =
    typeof window !== "undefined" && window.location.hostname === "localhost"
      ? "http://localhost:8082"
      : "https://dvr.lucasmks.com.br";
  return sanitizeUrl(envUrl || fallback);
}

export function TwitchDvrSection() {
  const [showStorageNote, setShowStorageNote] = useState(false);

  const {
    data: status,
    isLoading: isLoadingStatus,
    refetch: refetchStatus,
  } = useQuery<TwitchDvrStatus>({
    queryKey: ["twitch-dvr-status"],
    queryFn: gamingApi.getTwitchDvrStatus,
    refetchInterval: 1000 * 60,
  });

  const {
    data: vods = [],
    isLoading: isLoadingVods,
    refetch: refetchVods,
  } = useQuery<TwitchDvrVod[]>({
    queryKey: ["twitch-dvr-vods"],
    queryFn: gamingApi.getTwitchDvrVods,
    refetchInterval: 1000 * 60 * 2,
  });

  const isOnline = status?.online !== false;
  const dvrPanelUrl = getDvrPanelUrl();

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes <= 0) return "0 MB";
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds || seconds <= 0) return "-";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <SurfacePanel
      title="Twitch DVR & Gravações"
      icon={<Video className="w-3.5 h-3.5" />}
      action={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              refetchStatus();
              refetchVods();
            }}
            className="p-1.5 text-zinc-400 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] rounded-xl transition-colors"
            title="Atualizar status"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {dvrPanelUrl && (
            <a
              href={dvrPanelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-200 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] rounded-xl transition-colors"
            >
              <span className="hidden sm:inline">Painel TwitchAutomator</span>
              <span className="sm:hidden">Painel DVR</span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
            </a>
          )}
        </div>
      }
    >
      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-[#09090b] border border-white/[0.06] rounded-xl p-3.5 flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
              isOnline
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border-red-500/20"
            }`}
          >
            {isOnline ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider block">
              Gravador Docker
            </span>
            <p className="text-sm font-semibold text-white truncate">
              {isLoadingStatus
                ? "Verificando..."
                : isOnline
                ? "Online & Conectado"
                : "Indisponível"}
            </p>
          </div>
        </div>

        <div className="bg-[#09090b] border border-white/[0.06] rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/[0.04] text-zinc-300 border border-white/[0.06] flex items-center justify-center shrink-0">
            <CloudUpload className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider block">
              Destino na Nuvem
            </span>
            <p className="text-sm font-semibold text-white truncate">
              Google Drive (Rclone)
            </p>
          </div>
        </div>

        <div className="bg-[#09090b] border border-white/[0.06] rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/[0.04] text-zinc-300 border border-white/[0.06] flex items-center justify-center shrink-0">
            <HardDrive className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider block">
              Proteção de Disco
            </span>
            <p className="text-sm font-semibold text-white truncate">
              Auto-Move pós gravação
            </p>
          </div>
        </div>
      </div>

      {/* Collapsible Storage Note */}
      <div className="mb-5">
        <button
          type="button"
          onClick={() => setShowStorageNote((prev) => !prev)}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <Info className="w-3.5 h-3.5 text-zinc-500" />
          <span>Como funciona a proteção de disco da VPS</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${
              showStorageNote ? "rotate-180" : ""
            }`}
          />
        </button>
        {showStorageNote && (
          <div className="mt-2 bg-[#09090b] border border-white/[0.06] rounded-xl p-3 text-xs text-zinc-400 leading-relaxed">
            Para proteger o disco de 50GB da VPS, os arquivos gravados são
            mantidos temporariamente no servidor e, 10 minutos após o término da
            transmissão, o <strong className="text-zinc-200">Rclone</strong>{" "}
            move o arquivo completo para o{" "}
            <strong className="text-zinc-200">Google Drive</strong> e remove a
            cópia local.
          </div>
        )}
      </div>

      {/* Recent VODs */}
      <div>
        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <FileVideo className="w-3.5 h-3.5 text-zinc-500" />
          VODs e Gravações Recentes
        </h4>

        {isLoadingVods ? (
          <div className="p-8 text-center text-zinc-500 text-xs">
            Carregando gravações...
          </div>
        ) : Array.isArray(vods) && vods.length > 0 ? (
          <div className="flex flex-col gap-2">
            {vods.map((vod, idx) => (
              <div
                key={vod.stream_id || vod.basename || idx}
                className="bg-[#09090b] border border-white/[0.06] hover:border-white/[0.12] rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-400 shrink-0">
                    {vod.is_recording ? (
                      <Radio className="w-4 h-4 text-red-400" />
                    ) : (
                      <FileVideo className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white truncate">
                        {vod.channel_name || vod.streamer_name || "Stream"}
                      </span>
                      {vod.is_recording && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded font-semibold shrink-0">
                          GRAVANDO
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {vod.title || vod.basename || "Transmissão ao vivo"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-zinc-400 shrink-0 pl-11 sm:pl-0">
                  {vod.duration ? (
                    <span className="tabular-nums">
                      {formatDuration(vod.duration)}
                    </span>
                  ) : null}
                  <span className="font-mono text-zinc-300 tabular-nums">
                    {formatBytes(vod.total_size || vod.segments_raw_size)}
                  </span>
                  <span className="text-[11px] text-zinc-500 tabular-nums">
                    {vod.started_at
                      ? new Date(vod.started_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Recente"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Radio className="w-5 h-5" />}
            title="Nenhuma gravação no histórico"
            description="Ative o botão REC ao lado de um streamer no Radar Twitch acima para iniciar capturas automáticas."
          />
        )}
      </div>
    </SurfacePanel>
  );
}
