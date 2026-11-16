"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gamingApi } from "@/lib/api";
import { sanitizeUrl } from "@/lib/security";
import {
  MonitorPlay,
  ExternalLink,
  Plus,
  Trash2,
  Loader2,
  X,
} from "lucide-react";
import { Twitch } from "./twitch-icon";
import { toast } from "sonner";
import { TrackedTwitchChannel } from "@/lib/types";
import { EmptyState, SurfacePanel } from "@/components/ui/page-shell";

interface TwitchWidgetProps {
  showManagement?: boolean;
}

interface LiveStream {
  user_name?: string;
  thumbnail_url?: string;
  title?: string;
  game_name?: string;
  viewer_count?: number;
}

function StreamThumbnail({
  src,
  alt,
}: {
  src?: string;
  alt: string;
}) {
  const [failed, setFailed] = useState(false);
  const safeSrc = sanitizeUrl(src);

  if (!safeSrc || failed) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#09090b] text-zinc-700">
        <MonitorPlay className="w-7 h-7" />
      </div>
    );
  }

  return (
    <img
      src={safeSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
    />
  );
}

export function TwitchWidget({ showManagement = false }: TwitchWidgetProps) {
  const queryClient = useQueryClient();
  const [twitchChannelInput, setTwitchChannelInput] = useState("");
  const [recordVodInput, setRecordVodInput] = useState(false);
  const [recordQualityInput, setRecordQualityInput] = useState("720p60");
  const [activeEmbedChannel, setActiveEmbedChannel] = useState<string | null>(
    null
  );

  const { data: liveStreams = [], isLoading } = useQuery<LiveStream[]>({
    queryKey: ["twitch-live-streams"],
    queryFn: gamingApi.getLiveStreams,
    refetchInterval: 1000 * 60 * 5,
  });

  const { data: trackedTwitchChannels, isLoading: isLoadingTwitchChannels } =
    useQuery<TrackedTwitchChannel[]>({
      queryKey: ["twitch-preferences"],
      queryFn: gamingApi.getTrackedTwitchChannels,
      enabled: showManagement,
    });

  const addTwitchChannelMutation = useMutation({
    mutationFn: gamingApi.addTrackedTwitchChannel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["twitch-preferences"] });
      queryClient.invalidateQueries({ queryKey: ["twitch-live-streams"] });
      queryClient.invalidateQueries({ queryKey: ["twitch-dvr-channels"] });
      setTwitchChannelInput("");
      setRecordVodInput(false);
      toast.success("Canal adicionado com sucesso!");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error?.response?.data?.message || "Erro ao adicionar canal.");
    },
  });

  const removeTwitchChannelMutation = useMutation({
    mutationFn: gamingApi.deleteTrackedTwitchChannel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["twitch-preferences"] });
      queryClient.invalidateQueries({ queryKey: ["twitch-live-streams"] });
      queryClient.invalidateQueries({ queryKey: ["twitch-dvr-channels"] });
      toast.success("Canal removido.");
    },
  });

  const toggleRecordMutation = useMutation({
    mutationFn: (payload: {
      id: string;
      recordVod: boolean;
      recordQuality?: string;
    }) => gamingApi.toggleTrackedTwitchRecord(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["twitch-preferences"] });
      queryClient.invalidateQueries({ queryKey: ["twitch-dvr-channels"] });
      if (variables.recordVod) {
        toast.success(
          `Gravação DVR configurada (${variables.recordQuality || "720p60"})!`
        );
      } else {
        toast.info("Gravação desativada no DVR.");
      }
    },
    onError: () => {
      toast.error("Erro ao alterar status de gravação.");
    },
  });

  const handleAddTwitchChannel = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = twitchChannelInput.trim();
    if (cleaned.length < 2) return;
    addTwitchChannelMutation.mutate({
      channelName: cleaned,
      recordVod: recordVodInput,
      recordQuality: recordQualityInput,
    });
  };

  const safeEmbedUrl = activeEmbedChannel
    ? sanitizeUrl(
        `https://player.twitch.tv/?channel=${encodeURIComponent(
          activeEmbedChannel.toLowerCase()
        )}&parent=${
          typeof window !== "undefined" ? encodeURIComponent(window.location.hostname) : "localhost"
        }&autoplay=true`
      )
    : null;

  if (isLoading) {
    return (
      <SurfacePanel className="h-56 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-zinc-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-xs">Carregando streams...</span>
        </div>
      </SurfacePanel>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {showManagement && (
        <SurfacePanel
          title="Radar Twitch"
          icon={<Twitch className="w-3.5 h-3.5 text-blue-400" />}
          accent="blue"
        >
          <div className="flex flex-col gap-5">
            <form
              onSubmit={handleAddTwitchChannel}
              className="flex flex-col gap-2.5"
            >
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MonitorPlay className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={twitchChannelInput}
                    onChange={(e) => setTwitchChannelInput(e.target.value)}
                    placeholder="Usuário Twitch (ex: alanzoka)"
                    className="w-full bg-[#09090b] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-white/25 transition-colors placeholder:text-zinc-600"
                  />
                </div>
                <button
                  type="submit"
                  disabled={
                    addTwitchChannelMutation.isPending ||
                    twitchChannelInput.trim().length < 2
                  }
                  className="bg-zinc-100 text-zinc-950 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed px-4 rounded-xl font-semibold transition-colors flex items-center justify-center shrink-0"
                  title="Adicionar canal"
                >
                  {addTwitchChannelMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 px-0.5 text-xs text-zinc-400">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={recordVodInput}
                    onChange={(e) => setRecordVodInput(e.target.checked)}
                    className="rounded border-zinc-700 bg-[#09090b] accent-zinc-200"
                  />
                  <span>Gravar lives automaticamente (DVR)</span>
                </label>
                {recordVodInput && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-zinc-500">Qualidade:</span>
                    <select
                      value={recordQualityInput}
                      onChange={(e) => setRecordQualityInput(e.target.value)}
                      className="bg-[#09090b] border border-white/[0.08] rounded-lg text-[11px] text-zinc-300 px-2 py-1 focus:outline-none focus:border-white/25"
                    >
                      <option value="1080p60">1080p60 (Full HD)</option>
                      <option value="720p60">720p60 (Recomendado)</option>
                      <option value="720p">720p (HD 30fps)</option>
                      <option value="480p">480p (Econômico)</option>
                      <option value="best">Melhor (best)</option>
                    </select>
                  </div>
                )}
              </div>
            </form>

            <div className="bg-[#09090b] border border-white/[0.06] rounded-xl p-3.5 sm:p-4">
              <h5 className="text-[10px] font-semibold text-zinc-500 mb-3 uppercase tracking-wider">
                Canais Rastreados
              </h5>
              {isLoadingTwitchChannels ? (
                <div className="flex items-center gap-2 text-zinc-500 text-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sincronizando...</span>
                </div>
              ) : trackedTwitchChannels && trackedTwitchChannels.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {trackedTwitchChannels.map((channel) => {
                    const isChannelPending =
                      toggleRecordMutation.isPending &&
                      toggleRecordMutation.variables?.id === channel.id;
                    const isRemovingThisChannel =
                      removeTwitchChannelMutation.isPending &&
                      removeTwitchChannelMutation.variables === channel.id;
                    const isBusy = isChannelPending || isRemovingThisChannel;

                    return (
                      <span
                        key={channel.id}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-200 bg-[#111113] border border-white/[0.08] rounded-xl pl-3 pr-1.5 py-1.5"
                      >
                        <span className="font-semibold">
                          {channel.channelName}
                        </span>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            toggleRecordMutation.mutate({
                              id: channel.id,
                              recordVod: !channel.recordVod,
                              recordQuality: channel.recordQuality || "720p60",
                            })
                          }
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed border ${
                            channel.recordVod
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : "bg-white/[0.04] text-zinc-500 border-transparent hover:text-zinc-300"
                          }`}
                          title={
                            channel.recordVod
                              ? `Gravação ativada (${
                                  channel.recordQuality || "720p60"
                                }). Clique para desligar.`
                              : "Gravação desativada. Clique para ativar."
                          }
                        >
                          {isChannelPending ? (
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          ) : (
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                channel.recordVod
                                  ? "bg-red-400"
                                  : "bg-zinc-600"
                              }`}
                            />
                          )}
                          <span>REC</span>
                        </button>

                        {channel.recordVod && (
                          <select
                            value={channel.recordQuality || "720p60"}
                            disabled={isBusy}
                            onChange={(e) => {
                              toggleRecordMutation.mutate({
                                id: channel.id,
                                recordVod: true,
                                recordQuality: e.target.value,
                              });
                            }}
                            className="bg-[#09090b] border border-white/[0.08] text-zinc-300 text-[10px] rounded-md px-1.5 py-0.5 outline-none focus:border-white/25 cursor-pointer disabled:opacity-50"
                            title="Alterar qualidade da gravação"
                          >
                            <option value="1080p60">1080p60</option>
                            <option value="720p60">720p60</option>
                            <option value="720p">720p</option>
                            <option value="480p">480p</option>
                            <option value="best">best</option>
                          </select>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            removeTwitchChannelMutation.mutate(channel.id)
                          }
                          disabled={isBusy}
                          className="p-1 text-zinc-500 hover:text-red-400 hover:bg-white/[0.05] rounded-lg transition-colors disabled:opacity-50"
                          title="Parar de monitorar"
                        >
                          {isRemovingThisChannel ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-zinc-500 text-xs text-center py-2">
                  Nenhum canal rastreado ainda.
                </p>
              )}
            </div>
          </div>
        </SurfacePanel>
      )}

      <SurfacePanel
        title="Ao Vivo Agora"
        icon={<MonitorPlay className="w-3.5 h-3.5 text-blue-400" />}
        accent="blue"
        action={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            {liveStreams.length}{" "}
            {liveStreams.length === 1 ? "Stream" : "Streams"}
          </span>
        }
      >
        {liveStreams.length === 0 ? (
          <EmptyState
            icon={<MonitorPlay className="w-5 h-5" />}
            title="Nenhum canal ao vivo agora"
            description="Os canais monitorados estão offline no momento."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {liveStreams.map((stream, index) => {
              const userName = stream.user_name || "canal";
              const streamUrl = sanitizeUrl(
                `https://twitch.tv/${encodeURIComponent(userName.toLowerCase())}`
              );

              return (
                <div
                  key={`${userName}-${index}`}
                  className="group flex flex-col gap-2.5 bg-[#09090b] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-2.5 transition-colors"
                >
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-[#111113]">
                    <StreamThumbnail
                      src={stream.thumbnail_url}
                      alt={stream.title || userName}
                    />
                    <div className="absolute bottom-2 left-2 bg-black/75 px-2 py-0.5 rounded-md text-[10px] font-semibold text-zinc-100 flex items-center gap-1.5 border border-white/[0.08] tabular-nums">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      {stream.viewer_count?.toLocaleString("pt-BR") ?? "0"}
                    </div>
                  </div>

                  <div className="flex flex-col px-1 pb-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-zinc-100 font-semibold text-sm truncate">
                        {userName}
                      </h3>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setActiveEmbedChannel(userName)}
                          className="p-1.5 text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] rounded-lg transition-colors"
                          title="Assistir no Life OS"
                        >
                          <MonitorPlay className="w-3.5 h-3.5" />
                        </button>
                        {streamUrl && (
                          <a
                            href={streamUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] rounded-lg transition-colors"
                            title="Abrir na Twitch"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                    {stream.game_name && (
                      <p className="text-zinc-400 text-[11px] font-medium truncate mt-0.5">
                        {stream.game_name}
                      </p>
                    )}
                    {stream.title && (
                      <p
                        className="text-zinc-500 text-xs line-clamp-2 mt-1 leading-snug"
                        title={stream.title}
                      >
                        {stream.title}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SurfacePanel>

      {/* Modal Player Embutido Twitch */}
      {activeEmbedChannel && safeEmbedUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setActiveEmbedChannel(null)}
            className="absolute inset-0 bg-black/80"
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Player Twitch: ${activeEmbedChannel}`}
            className="relative w-full max-w-4xl aspect-video bg-[#111113] border border-white/[0.1] rounded-2xl overflow-hidden shadow-2xl z-10 flex flex-col"
          >
            <button
              type="button"
              onClick={() => setActiveEmbedChannel(null)}
              className="absolute top-3 right-3 z-20 p-2 bg-black/75 hover:bg-black text-zinc-300 hover:text-white rounded-full border border-white/[0.1] transition-colors"
              title="Fechar player"
            >
              <X className="w-4 h-4" />
            </button>
            <iframe
              src={safeEmbedUrl}
              title={`Twitch stream ${activeEmbedChannel}`}
              className="w-full h-full border-0"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}
