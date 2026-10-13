"use client";

import { useQuery } from "@tanstack/react-query";
import { gamingApi } from "@/lib/api";
import { TwitchDvrStatus, TwitchDvrVod } from "@/lib/types";
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
} from "lucide-react";

export function TwitchDvrSection() {
  const {
    data: status,
    isLoading: isLoadingStatus,
    refetch: refetchStatus,
  } = useQuery<TwitchDvrStatus>({
    queryKey: ["twitch-dvr-status"],
    queryFn: gamingApi.getTwitchDvrStatus,
    refetchInterval: 1000 * 60, // A cada 1 minuto
  });

  const {
    data: vods = [],
    isLoading: isLoadingVods,
    refetch: refetchVods,
  } = useQuery<TwitchDvrVod[]>({
    queryKey: ["twitch-dvr-vods"],
    queryFn: gamingApi.getTwitchDvrVods,
    refetchInterval: 1000 * 60 * 2, // A cada 2 minutos
  });

  const isOnline = status?.online !== false;

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
    <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-red-500/40 rounded-3xl p-5 md:p-6 lg:p-8 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/5 rounded-full blur-3xl pointer-events-none transition-opacity group-hover:opacity-100 opacity-40"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Video className="w-5 h-5 text-red-400" />
            <h3 className="text-base md:text-lg font-bold text-white tracking-tight">
              Twitch DVR & Gravações
            </h3>
          </div>
          <p className="text-xs text-zinc-400">
            Captura automática de lives em 720p com descarregamento contínuo para o Google Drive.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              refetchStatus();
              refetchVods();
            }}
            className="p-2 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
            title="Atualizar status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <a
            href={
              (import.meta as any).env?.VITE_TWITCH_DVR_URL ||
              (typeof window !== "undefined" && window.location.hostname === "localhost"
                ? "http://localhost:8082"
                : "https://dvr.lucasmks.com.br")
            }
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-200 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
          >
            <span>Painel TwitchAutomator</span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
          </a>
        </div>
      </div>

      {/* Cards de Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 relative z-10">
        {/* Status do Gravador */}
        <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              isOnline
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border-red-500/20"
            }`}
          >
            {isOnline ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
              Gravador Docker
            </span>
            <p className="text-sm font-semibold text-white">
              {isLoadingStatus
                ? "Verificando..."
                : isOnline
                ? "Online & Conectado"
                : "Indisponível"}
            </p>
          </div>
        </div>

        {/* Upload Google Drive */}
        <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
            <CloudUpload className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
              Destino na Nuvem
            </span>
            <p className="text-sm font-semibold text-white">
              Google Drive (Rclone)
            </p>
          </div>
        </div>

        {/* Proteção de Espaço VPS */}
        <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
              Proteção de Disco
            </span>
            <p className="text-sm font-semibold text-white">
              Auto-Move pós gravação
            </p>
          </div>
        </div>
      </div>

      {/* Aviso informativo de segurança de disco */}
      <div className="bg-blue-500/5 border border-blue-500/15 rounded-2xl p-3.5 mb-6 flex items-start gap-3 relative z-10">
        <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
        <p className="text-xs text-zinc-300 leading-relaxed">
          Para proteger o disco de 50GB da VPS, os arquivos gravados são mantidos temporariamente no servidor e, 10 minutos após o término da transmissão, o <strong>Rclone</strong> move o arquivo completo para sua pasta no <strong>Google Drive</strong> e o deleta do disco local.
        </p>
      </div>

      {/* Lista de VODs recentes */}
      <div className="relative z-10">
        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <FileVideo className="w-3.5 h-3.5 text-zinc-500" />
          VODs e Gravações Recentes
        </h4>

        {isLoadingVods ? (
          <div className="p-8 text-center text-zinc-500 text-xs">
            Carregando gravações...
          </div>
        ) : vods && vods.length > 0 ? (
          <div className="flex flex-col gap-2">
            {vods.map((vod, idx) => (
              <div
                key={vod.stream_id || vod.basename || idx}
                className="bg-black/40 border border-white/5 hover:border-white/10 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
                    {vod.is_recording ? (
                      <Radio className="w-4 h-4 animate-pulse text-red-500" />
                    ) : (
                      <FileVideo className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        {vod.channel_name || vod.streamer_name || "Stream"}
                      </span>
                      {vod.is_recording && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-red-500/20 text-red-400 border border-red-500/30 rounded font-semibold animate-pulse">
                          GRAVANDO AGORA
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 line-clamp-1">
                      {vod.title || vod.basename || "Transmissão ao vivo"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-zinc-400 shrink-0">
                  {vod.duration ? (
                    <span>{formatDuration(vod.duration)}</span>
                  ) : null}
                  <span className="font-mono text-zinc-300">
                    {formatBytes(vod.total_size || vod.segments_raw_size)}
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    {vod.started_at
                      ? new Date(vod.started_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Recent"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-black/20 border border-white/5 rounded-2xl p-8 text-center">
            <Radio className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-zinc-400 mb-1">
              Nenhuma gravação no histórico ainda.
            </p>
            <p className="text-[11px] text-zinc-600 max-w-sm mx-auto">
              Ative o botão <strong>REC</strong> ao lado do streamer desejado no Radar Twitch acima para iniciar as capturas automáticas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
