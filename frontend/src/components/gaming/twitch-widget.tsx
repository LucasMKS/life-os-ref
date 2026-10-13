"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gamingApi } from "@/lib/api";
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
import { motion, AnimatePresence } from "framer-motion";
import { TrackedTwitchChannel } from "@/lib/types";

interface TwitchWidgetProps {
  showManagement?: boolean;
}

export function TwitchWidget({ showManagement = false }: TwitchWidgetProps) {
  const queryClient = useQueryClient();
  const [twitchChannelInput, setTwitchChannelInput] = useState("");
  const [recordVodInput, setRecordVodInput] = useState(false);
  const [recordQualityInput, setRecordQualityInput] = useState("720p60");
  const [activeEmbedChannel, setActiveEmbedChannel] = useState<string | null>(null);

  const { data: liveStreams = [], isLoading } = useQuery({
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
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Erro ao adicionar canal.");
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
    mutationFn: (payload: { id: string; recordVod: boolean; recordQuality?: string }) =>
      gamingApi.toggleTrackedTwitchRecord(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["twitch-preferences"] });
      queryClient.invalidateQueries({ queryKey: ["twitch-dvr-channels"] });
      if (variables.recordVod) {
        toast.success(`Gravação DVR configurada (${variables.recordQuality || "720p60"})!`);
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
    if (twitchChannelInput.trim().length < 2) return;
    addTwitchChannelMutation.mutate({
      channelName: twitchChannelInput.trim(),
      recordVod: recordVodInput,
      recordQuality: recordQualityInput,
    });
  };

  if (isLoading) {
    return (
      <div className="bg-[#121214]/60 border border-white/5 rounded-3xl p-5 md:p-6 lg:p-8 animate-pulse h-64 flex flex-col items-center justify-center backdrop-blur-md">
        <MonitorPlay className="text-zinc-800 w-10 h-10 mb-4" />
        <div className="h-4 w-32 bg-white/5 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {showManagement && (
        <div className="bg-[#121214]/70 backdrop-blur-xl border border-white/5 border-t-purple-500/30 rounded-3xl p-5 md:p-6 lg:p-7 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none transition-opacity group-hover:opacity-100 opacity-30"></div>

          <div className="flex items-center justify-between mb-5 md:mb-6 relative z-10">
            <h4 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Twitch className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
              Radar Twitch
            </h4>
          </div>

          <div className="flex flex-col gap-5 md:gap-6 relative z-10">
            <form
              onSubmit={handleAddTwitchChannel}
              className="flex flex-col gap-2.5"
            >
              <div className="flex gap-2 md:gap-3">
                <div className="relative flex-1">
                  <MonitorPlay className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={twitchChannelInput}
                    onChange={(e) => setTwitchChannelInput(e.target.value)}
                    placeholder="Usuário (ex: alanzoka)"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl pl-11 pr-4 py-3 md:py-3.5 text-sm text-zinc-200 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-zinc-600"
                  />
                </div>
                <button
                  type="submit"
                  disabled={
                    addTwitchChannelMutation.isPending ||
                    twitchChannelInput.trim().length < 2
                  }
                  className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 md:px-5 rounded-2xl font-medium transition-colors flex items-center justify-center shadow-[0_0_20px_rgba(147,51,234,0.3)]"
                >
                  {addTwitchChannelMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 md:w-4 md:h-4" />
                  )}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 px-1 text-xs text-zinc-400">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={recordVodInput}
                    onChange={(e) => setRecordVodInput(e.target.checked)}
                    className="rounded border-zinc-700 bg-black/50 text-purple-600 focus:ring-purple-500 accent-purple-600"
                  />
                  <span>Gravar lives automaticamente (DVR)</span>
                </label>
                {recordVodInput && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-zinc-500">Qualidade:</span>
                    <select
                      value={recordQualityInput}
                      onChange={(e) => setRecordQualityInput(e.target.value)}
                      className="bg-black/60 border border-white/10 rounded-lg text-[11px] text-zinc-300 px-2 py-0.5 focus:outline-none focus:border-purple-500"
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

            <div className="bg-black/20 border border-white/5 rounded-2xl p-4 md:p-5">
              <h5 className="text-[9px] md:text-[10px] font-bold text-zinc-500 mb-3 uppercase tracking-wider">
                Canais Rastreados
              </h5>
              {isLoadingTwitchChannels ? (
                <div className="flex items-center gap-2 text-zinc-500 text-xs md:text-sm">
                  <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" />{" "}
                  Sincronizando...
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
                        className="inline-flex items-center gap-1.5 md:gap-2 text-[11px] md:text-xs font-medium text-zinc-200 bg-purple-500/10 border border-purple-500/20 rounded-lg pl-2.5 pr-1 py-1 md:pl-3 md:pr-1.5 md:py-1.5 shadow-sm transition-all"
                      >
                        <span className="font-semibold">{channel.channelName}</span>

                        {/* Botão Toggle REC */}
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
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                            channel.recordVod
                              ? "bg-red-500/20 text-red-400 border border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.2)]"
                              : "bg-white/5 text-zinc-500 hover:text-zinc-300 hover:bg-white/10"
                          }`}
                          title={
                            channel.recordVod
                              ? `Gravação ativada (${channel.recordQuality || "720p60"}). Clique para desligar.`
                              : "Gravação desativada. Clique para ativar gravação automática."
                          }
                        >
                          {isChannelPending ? (
                            <Loader2 className="w-2.5 h-2.5 animate-spin text-zinc-300" />
                          ) : (
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                channel.recordVod
                                  ? "bg-red-500 animate-pulse"
                                  : "bg-zinc-600"
                              }`}
                            />
                          )}
                          <span>REC</span>
                        </button>

                        {/* Seletor de Qualidade por canal */}
                        {channel.recordVod && (
                          <select
                            value={channel.recordQuality || "720p60"}
                            disabled={isBusy}
                            onChange={(e) => {
                              const newQuality = e.target.value;
                              toggleRecordMutation.mutate({
                                id: channel.id,
                                recordVod: true,
                                recordQuality: newQuality,
                              });
                            }}
                            className="bg-black/60 border border-red-500/30 text-red-300 hover:text-white text-[10px] rounded px-1.5 py-0.5 outline-none focus:border-red-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Alterar qualidade da gravação deste canal no LiveStreamDVR"
                          >
                            <option value="1080p60">1080p60</option>
                            <option value="720p60">720p60</option>
                            <option value="720p">720p</option>
                            <option value="480p">480p</option>
                            <option value="best">best (máx)</option>
                          </select>
                        )}

                        <button
                          onClick={() =>
                            removeTwitchChannelMutation.mutate(channel.id)
                          }
                          disabled={isBusy}
                          className="p-1 text-zinc-400 hover:text-white hover:bg-red-500/80 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Parar de monitorar"
                        >
                          {isRemovingThisChannel ? (
                            <Loader2 className="w-3 h-3 md:w-3.5 md:h-3.5 animate-spin text-red-400" />
                          ) : (
                            <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
                          )}
                        </button>
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-zinc-600 text-xs md:text-sm text-center py-2">
                  Lista vazia.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#121214]/60 border border-white/5 rounded-3xl p-5 md:p-6 lg:p-8 flex flex-col backdrop-blur-md">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <MonitorPlay className="text-purple-400 w-4 h-4 md:w-5 md:h-5" />
            </div>
            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
              Ao Vivo Agora
            </h2>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2 bg-red-500/10 border border-red-500/20 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            <span className="relative flex h-1.5 w-1.5 md:h-2 md:w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 md:h-2 md:w-2 bg-red-500"></span>
            </span>
            <span className="text-[9px] md:text-[10px] font-bold text-red-400 uppercase tracking-widest">
              {liveStreams.length}{" "}
              {liveStreams.length === 1 ? "Stream" : "Streams"}
            </span>
          </div>
        </div>

        {liveStreams.length === 0 ? (
          <div className="text-center flex flex-col items-center justify-center gap-3 min-h-[150px]">
            <MonitorPlay className="text-zinc-700 w-8 h-8 md:w-10 md:h-10 mb-1 md:mb-2" />
            <p className="text-xs md:text-sm font-medium text-zinc-400">
              Nenhum canal monitorado ao vivo agora.
            </p>
            <p className="text-[10px] md:text-xs text-zinc-600">
              Eles devem estar dormindo... ou jogando offline.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {liveStreams.map((stream: any, index: number) => (
              <a
                key={index}
                href={`https://twitch.tv/${stream.user_name?.toLowerCase() ?? ""}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-2.5 md:gap-3"
              >
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/50 border border-white/5 lg:group-hover:ring-2 lg:group-hover:ring-purple-500/50 transition-all duration-300 shadow-lg">
                  <img
                    src={stream.thumbnail_url}
                    alt={stream.title}
                    className="w-full h-full object-cover lg:group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[9px] md:text-[10px] font-bold text-white flex items-center gap-1.5 border border-white/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    {stream.viewer_count?.toLocaleString("pt-BR") ?? "0"}
                  </div>
                  <div className="hidden lg:flex absolute inset-0 bg-purple-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-center justify-center backdrop-blur-[2px] gap-2.5">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveEmbedChannel(stream.user_name);
                      }}
                      className="bg-purple-600 hover:bg-purple-500 text-white p-2.5 rounded-xl translate-y-4 group-hover:translate-y-0 transition-transform duration-300 shadow-lg shadow-purple-500/30"
                      title="Assistir no Life OS"
                    >
                      <MonitorPlay className="w-4 h-4" />
                    </button>
                    <div className="bg-zinc-800 hover:bg-zinc-700 text-white p-2.5 rounded-xl translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col px-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-zinc-100 font-bold text-sm truncate lg:group-hover:text-purple-400 transition-colors">
                      {stream.user_name}
                    </h3>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveEmbedChannel(stream.user_name);
                        }}
                        className="p-1 text-purple-400 hover:text-purple-300 bg-purple-500/10 rounded-lg border border-purple-500/20"
                        title="Assistir no Life OS"
                      >
                        <MonitorPlay className="w-3 h-3" />
                      </button>
                      <ExternalLink className="w-3 h-3 text-zinc-500 lg:hidden shrink-0" />
                    </div>
                  </div>
                  <p className="text-purple-400/80 text-[10px] md:text-[11px] font-bold uppercase tracking-wider truncate mt-0.5">
                    {stream.game_name}
                  </p>
                  <p
                    className="text-zinc-500 text-[11px] md:text-xs line-clamp-2 mt-1 md:mt-1.5 leading-snug"
                    title={stream.title}
                  >
                    {stream.title}
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Modal para Player Embutido Twitch */}
      <AnimatePresence>
        {activeEmbedChannel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveEmbedChannel(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl aspect-video bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col"
            >
              <div className="absolute top-4 right-4 z-20">
                <button
                  onClick={() => setActiveEmbedChannel(null)}
                  className="p-2 bg-black/60 hover:bg-black/90 text-zinc-400 hover:text-white rounded-full border border-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <iframe
                src={`https://player.twitch.tv/?channel=${activeEmbedChannel.toLowerCase()}&parent=${typeof window !== "undefined" ? window.location.hostname : "localhost"}&autoplay=true`}
                className="w-full h-full border-0"
                allowFullScreen
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

