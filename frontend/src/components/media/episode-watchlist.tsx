"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  RotateCcw,
  Search,
  Sparkles,
  Tv,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState, FilterPill, SurfacePanel } from "@/components/ui/page-shell";
import { MediaPoster, buildLmsMediaUrl } from "@/components/media/media-poster";
import { radarApi } from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";
import { SerieWatchStatusDTO } from "@/lib/types";

type WatchlistTab = "to-watch" | "watch-later" | "up-to-date" | "upcoming";

export function EpisodeWatchlist() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.userId);
  const [activeTab, setActiveTab] = useState<WatchlistTab>("to-watch");
  const [expandedShowId, setExpandedShowId] = useState<string | null>(null);
  const [expandDirection, setExpandDirection] = useState<"up" | "down">("down");
  const [searchQuery, setSearchQuery] = useState("");

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!expandedShowId) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest(".card-container")) {
        setExpandedShowId(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [expandedShowId]);

  const handleTabChange = (tab: WatchlistTab) => {
    setActiveTab(tab);
    setExpandedShowId(null);
  };

  const queryKey = ["media-episodes-to-watch", userId];

  const { data: rawShows = [], isLoading } = useQuery<SerieWatchStatusDTO[]>({
    queryKey,
    queryFn: radarApi.getEpisodesToWatch,
    staleTime: 0,
  });

  const shows = Array.isArray(rawShows) ? rawShows : [];

  const toggleExpand = (tmdbId: string) => {
    if (expandedShowId !== tmdbId) {
      const cardEl = cardRefs.current[tmdbId];
      if (cardEl) {
        const rect = cardEl.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        setExpandDirection(spaceBelow < 350 && spaceAbove > spaceBelow ? "up" : "down");
      }
    }
    setExpandedShowId((prev) => (prev === tmdbId ? null : tmdbId));
  };

  const watchMutation = useMutation({
    mutationFn: ({
      serieId,
      seasonNumber,
      episodeNumber,
    }: {
      serieId: string;
      seasonNumber: number;
      episodeNumber: number;
    }) => radarApi.watchEpisode(serieId, seasonNumber, episodeNumber),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previousShows = queryClient.getQueryData<SerieWatchStatusDTO[]>(queryKey);
      queryClient.setQueryData<SerieWatchStatusDTO[]>(queryKey, (old) => {
        if (!Array.isArray(old)) return [];
        return old.map((show) => {
          if (show.tmdbId !== variables.serieId) return show;
          const episodes = Array.isArray(show.episodes) ? show.episodes : [];
          const updatedEpisodes = episodes.map((ep) =>
            ep.seasonNumber === variables.seasonNumber &&
            ep.episodeNumber === variables.episodeNumber
              ? { ...ep, watched: true }
              : ep,
          );
          const unwatchedCount = updatedEpisodes.filter((ep) => !ep.watched).length;
          const nextToWatch = updatedEpisodes.find((ep) => !ep.watched) || null;
          return { ...show, episodes: updatedEpisodes, unwatchedCount, nextToWatch };
        });
      });
      return { previousShows };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousShows) {
        queryClient.setQueryData(queryKey, context.previousShows);
      }
      toast.error("Erro ao marcar episódio como assistido.");
    },
    onSuccess: (_, variables) => {
      toast.success(
        `S${String(variables.seasonNumber).padStart(2, "0")}-E${String(
          variables.episodeNumber,
        ).padStart(2, "0")} marcado como assistido!`,
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["media-episodes-to-watch"] });
      queryClient.invalidateQueries({ queryKey: ["media-weekly-calendar"] });
    },
  });

  const unwatchMutation = useMutation({
    mutationFn: ({
      serieId,
      seasonNumber,
      episodeNumber,
    }: {
      serieId: string;
      seasonNumber: number;
      episodeNumber: number;
    }) => radarApi.unwatchEpisode(serieId, seasonNumber, episodeNumber),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previousShows = queryClient.getQueryData<SerieWatchStatusDTO[]>(queryKey);
      queryClient.setQueryData<SerieWatchStatusDTO[]>(queryKey, (old) => {
        if (!Array.isArray(old)) return [];
        return old.map((show) => {
          if (show.tmdbId !== variables.serieId) return show;
          const episodes = Array.isArray(show.episodes) ? show.episodes : [];
          const updatedEpisodes = episodes.map((ep) =>
            ep.seasonNumber === variables.seasonNumber &&
            ep.episodeNumber === variables.episodeNumber
              ? { ...ep, watched: false }
              : ep,
          );
          const unwatchedCount = updatedEpisodes.filter((ep) => !ep.watched).length;
          const nextToWatch = updatedEpisodes.find((ep) => !ep.watched) || null;
          return { ...show, episodes: updatedEpisodes, unwatchedCount, nextToWatch };
        });
      });
      return { previousShows };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousShows) {
        queryClient.setQueryData(queryKey, context.previousShows);
      }
      toast.error("Erro ao desmarcar episódio.");
    },
    onSuccess: (_, variables) => {
      toast.info(
        `S${String(variables.seasonNumber).padStart(2, "0")}-E${String(
          variables.episodeNumber,
        ).padStart(2, "0")} marcado como não assistido.`,
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["media-episodes-to-watch"] });
      queryClient.invalidateQueries({ queryKey: ["media-weekly-calendar"] });
    },
  });

  const watchAllUpToMutation = useMutation({
    mutationFn: ({
      serieId,
      seasonNumber,
      episodeNumber,
    }: {
      serieId: string;
      seasonNumber: number;
      episodeNumber: number;
    }) => radarApi.watchAllUpTo(serieId, seasonNumber, episodeNumber),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previousShows = queryClient.getQueryData<SerieWatchStatusDTO[]>(queryKey);
      queryClient.setQueryData<SerieWatchStatusDTO[]>(queryKey, (old) => {
        if (!Array.isArray(old)) return [];
        return old.map((show) => {
          if (show.tmdbId !== variables.serieId) return show;
          const episodes = Array.isArray(show.episodes) ? show.episodes : [];
          const updatedEpisodes = episodes.map((ep) => {
            const isBeforeOrEqual =
              ep.seasonNumber < variables.seasonNumber ||
              (ep.seasonNumber === variables.seasonNumber &&
                ep.episodeNumber <= variables.episodeNumber);
            return isBeforeOrEqual ? { ...ep, watched: true } : ep;
          });
          const unwatchedCount = updatedEpisodes.filter((ep) => !ep.watched).length;
          const nextToWatch = updatedEpisodes.find((ep) => !ep.watched) || null;
          return { ...show, episodes: updatedEpisodes, unwatchedCount, nextToWatch };
        });
      });
      return { previousShows };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousShows) {
        queryClient.setQueryData(queryKey, context.previousShows);
      }
      toast.error("Erro ao marcar episódios.");
    },
    onSuccess: (_, variables) => {
      toast.success(
        `Todos os episódios até S${String(variables.seasonNumber).padStart(
          2,
          "0",
        )}-E${String(variables.episodeNumber).padStart(2, "0")} marcados como assistidos!`,
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["media-episodes-to-watch"] });
      queryClient.invalidateQueries({ queryKey: ["media-weekly-calendar"] });
    },
  });

  const toggleWatchLaterMutation = useMutation({
    mutationFn: ({
      serieId,
      watchLater,
    }: {
      serieId: string;
      watchLater: boolean;
    }) => radarApi.toggleWatchLater(serieId, watchLater),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previousShows = queryClient.getQueryData<SerieWatchStatusDTO[]>(queryKey);
      queryClient.setQueryData<SerieWatchStatusDTO[]>(queryKey, (old) => {
        if (!Array.isArray(old)) return [];
        return old.map((show) =>
          show.tmdbId === variables.serieId
            ? { ...show, watchLater: variables.watchLater }
            : show,
        );
      });
      return { previousShows };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousShows) {
        queryClient.setQueryData(queryKey, context.previousShows);
      }
      toast.error("Erro ao alterar preferência da série.");
    },
    onSuccess: (_, variables) => {
      toast.success(
        variables.watchLater
          ? "Série adicionada a Quero Ver!"
          : "Série removida de Quero Ver!",
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["media-episodes-to-watch"] });
    },
  });

  const startRewatchMutation = useMutation({
    mutationFn: ({ serieId }: { serieId: string }) =>
      radarApi.startRewatch(serieId),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previousShows = queryClient.getQueryData<SerieWatchStatusDTO[]>(queryKey);
      queryClient.setQueryData<SerieWatchStatusDTO[]>(queryKey, (old) => {
        if (!Array.isArray(old)) return [];
        return old.map((show) => {
          if (show.tmdbId !== variables.serieId) return show;
          const episodes = Array.isArray(show.episodes) ? show.episodes : [];
          return {
            ...show,
            rewatching: true,
            rewatchCount: (show.rewatchCount || 0) + 1,
            unwatchedCount: show.totalAiredEpisodes,
            episodes: episodes.map((ep) => ({
              ...ep,
              watched: false,
              rating: undefined,
              watchedAt: undefined,
            })),
          };
        });
      });
      return { previousShows };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousShows) {
        queryClient.setQueryData(queryKey, context.previousShows);
      }
      toast.error("Erro ao iniciar rewatch da série.");
    },
    onSuccess: () => {
      toast.success("Rewatch iniciado! Divirta-se assistindo novamente.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["media-episodes-to-watch"] });
      queryClient.invalidateQueries({ queryKey: ["media-weekly-calendar"] });
    },
  });

  const cancelRewatchMutation = useMutation({
    mutationFn: ({ serieId }: { serieId: string }) =>
      radarApi.cancelRewatch(serieId),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previousShows = queryClient.getQueryData<SerieWatchStatusDTO[]>(queryKey);
      queryClient.setQueryData<SerieWatchStatusDTO[]>(queryKey, (old) => {
        if (!Array.isArray(old)) return [];
        return old.map((show) => {
          if (show.tmdbId !== variables.serieId) return show;
          const episodes = Array.isArray(show.episodes) ? show.episodes : [];
          return {
            ...show,
            rewatching: false,
            rewatchCount: Math.max(0, (show.rewatchCount || 0) - 1),
            unwatchedCount: 0,
            episodes: episodes.map((ep) => ({ ...ep, watched: true })),
          };
        });
      });
      return { previousShows };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousShows) {
        queryClient.setQueryData(queryKey, context.previousShows);
      }
      toast.error("Erro ao cancelar rewatch da série.");
    },
    onSuccess: () => {
      toast.success("Rewatch cancelado.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["media-episodes-to-watch"] });
      queryClient.invalidateQueries({ queryKey: ["media-weekly-calendar"] });
    },
  });

  const resetRewatchMutation = useMutation({
    mutationFn: ({ serieId }: { serieId: string }) =>
      radarApi.resetRewatch(serieId),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previousShows = queryClient.getQueryData<SerieWatchStatusDTO[]>(queryKey);
      queryClient.setQueryData<SerieWatchStatusDTO[]>(queryKey, (old) => {
        if (!Array.isArray(old)) return [];
        return old.map((show) =>
          show.tmdbId === variables.serieId
            ? { ...show, rewatching: false, rewatchCount: 0 }
            : show,
        );
      });
      return { previousShows };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousShows) {
        queryClient.setQueryData(queryKey, context.previousShows);
      }
      toast.error("Erro ao resetar contador de rewatch.");
    },
    onSuccess: () => {
      toast.success("Contador de rewatch resetado com sucesso.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["media-episodes-to-watch"] });
      queryClient.invalidateQueries({ queryKey: ["media-weekly-calendar"] });
    },
  });

  const isShowUnreleased = (s: SerieWatchStatusDTO) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const isFutureFirstAir = Boolean(s.firstAirDate && s.firstAirDate > todayStr);
    const inProd = s.status === "In Production" || s.status === "Planned";
    return (
      isFutureFirstAir ||
      inProd ||
      (s.totalAiredEpisodes === 0 && (!s.firstAirDate || s.firstAirDate > todayStr))
    );
  };

  const upcomingShows = shows.filter((s) => isShowUnreleased(s));
  const watchLaterShows = shows.filter((s) => s.watchLater && !isShowUnreleased(s));
  const toWatchShows = shows.filter(
    (s) => !s.watchLater && !isShowUnreleased(s) && s.unwatchedCount > 0,
  );
  const upToDateShows = shows.filter(
    (s) => !s.watchLater && !isShowUnreleased(s) && s.unwatchedCount === 0,
  );

  const currentShowsRaw =
    activeTab === "to-watch"
      ? toWatchShows
      : activeTab === "up-to-date"
        ? upToDateShows
        : activeTab === "upcoming"
          ? upcomingShows
          : watchLaterShows;

  const sortShows = (showsList: SerieWatchStatusDTO[]) => {
    const todayStr = new Date().toISOString().split("T")[0];

    return [...showsList].sort((a, b) => {
      const hasFutureA = Boolean(a.nextAirDate && a.nextAirDate >= todayStr);
      const hasFutureB = Boolean(b.nextAirDate && b.nextAirDate >= todayStr);

      if (hasFutureA && !hasFutureB) return -1;
      if (!hasFutureA && hasFutureB) return 1;

      if (hasFutureA && hasFutureB && a.nextAirDate && b.nextAirDate) {
        const dateCompare = a.nextAirDate.localeCompare(b.nextAirDate);
        if (dateCompare !== 0) return dateCompare;
      }

      const isFinishedA = a.status === "Ended" || a.status === "Canceled";
      const isFinishedB = b.status === "Ended" || b.status === "Canceled";

      if (!isFinishedA && isFinishedB) return -1;
      if (isFinishedA && !isFinishedB) return 1;

      return (a.title ?? "").localeCompare(b.title ?? "", "pt-BR");
    });
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const currentShows = sortShows(currentShowsRaw).filter((show) =>
    (show.title ?? "").toLowerCase().includes(normalizedQuery),
  );

  const formatDate = (dateStr?: string) => {
    if (!dateStr || dateStr === "null") return "Sem data";
    try {
      const date = new Date(dateStr + "T00:00:00");
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const tabItems: { id: WatchlistTab; label: string; count: number }[] = [
    { id: "to-watch", label: "Assistindo", count: toWatchShows.length },
    { id: "watch-later", label: "Quero Ver", count: watchLaterShows.length },
    { id: "up-to-date", label: "Assistidos", count: upToDateShows.length },
    { id: "upcoming", label: "Em Breve", count: upcomingShows.length },
  ];

  return (
    <SurfacePanel
      accent="purple"
      title="Continuar Assistindo"
      icon={<Tv className="w-4 h-4 text-purple-400" />}
      action={
        <div className="flex flex-wrap items-center gap-1.5">
          {tabItems.map((tab) => (
            <FilterPill
              key={tab.id}
              accent="purple"
              active={activeTab === tab.id}
              onClick={() => handleTabChange(tab.id)}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.2 text-[10px] rounded-full tabular-nums ${
                    activeTab === tab.id
                      ? "bg-white/20 text-white"
                      : "bg-white/[0.06] text-zinc-400"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </FilterPill>
          ))}
        </div>
      }
    >
      {/* Search Bar */}
      <div className="mb-5 max-w-md">
        <div className="relative">
          <input
            type="text"
            placeholder="Pesquisar série..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#161619] border border-white/[0.06] hover:border-white/[0.12] rounded-xl py-2 pl-9 pr-8 text-xs md:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-colors"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
              aria-label="Limpar busca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3 py-12 items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          <span className="text-xs text-zinc-500 font-medium">
            Carregando episódios...
          </span>
        </div>
      ) : currentShows.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="w-5 h-5" />}
          title={
            activeTab === "to-watch"
              ? "Nenhum episódio pendente"
              : activeTab === "up-to-date"
                ? "Nenhuma série em dia"
                : activeTab === "upcoming"
                  ? "Nenhuma série em breve"
                  : "Lista Quero Ver vazia"
          }
          description={
            activeTab === "to-watch"
              ? "Você assistiu a tudo. Adicione mais séries no catálogo do LMS Filmes."
              : activeTab === "up-to-date"
                ? "Marque episódios como assistidos para deixá-las em dia."
                : activeTab === "upcoming"
                  ? "Nenhuma série aguardando estreia no momento."
                  : "Clique em 'Quero Ver' em alguma série para arquivá-la aqui."
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          {currentShows.map((show) => {
            const isExpanded = expandedShowId === show.tmdbId;
            const nextEp = show.nextToWatch;
            const isUnreleased = isShowUnreleased(show);
            const showUrl = buildLmsMediaUrl("SERIES", show.tmdbId);
            const episodes = Array.isArray(show.episodes) ? show.episodes : [];
            const todayStr = new Date().toISOString().split("T")[0];

            const watchedCount = Math.max(
              0,
              (show.totalAiredEpisodes ?? 0) - (show.unwatchedCount ?? 0),
            );
            const progressPercent =
              show.totalAiredEpisodes > 0
                ? Math.min(
                    100,
                    Math.round((watchedCount / show.totalAiredEpisodes) * 100),
                  )
                : 0;

            return (
              <div
                key={show.tmdbId}
                ref={(el) => {
                  cardRefs.current[show.tmdbId] = el;
                }}
                className={`bg-[#161619] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-4 transition-colors relative card-container ${
                  isExpanded ? "z-40" : "z-10"
                }`}
              >
                <div className="flex gap-3.5">
                  {/* Poster */}
                  <div className="flex flex-col gap-1.5 shrink-0 w-[72px] md:w-[80px]">
                    {showUrl ? (
                      <a
                        href={showUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full h-[108px] md:h-[120px] rounded-xl overflow-hidden border border-white/[0.06] bg-[#111113] block hover:opacity-90 transition-opacity"
                      >
                        <MediaPoster
                          src={show.posterUrl}
                          alt={show.title}
                          type="SERIES"
                          iconClassName="w-6 h-6 text-zinc-700"
                        />
                      </a>
                    ) : (
                      <div className="w-full h-[108px] md:h-[120px] rounded-xl overflow-hidden border border-white/[0.06] bg-[#111113]">
                        <MediaPoster
                          src={show.posterUrl}
                          alt={show.title}
                          type="SERIES"
                          iconClassName="w-6 h-6 text-zinc-700"
                        />
                      </div>
                    )}

                    {show.rewatching && !isUnreleased && (
                      <span
                        className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider bg-white/[0.06] text-zinc-300 border border-white/[0.1] text-center"
                        title="Você está reassistindo a esta série"
                      >
                        Revendo
                      </span>
                    )}

                    {show.nextAirDate && show.nextAirDate >= todayStr && (
                      <span
                        className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center gap-1"
                        title={`Próximo episódio: ${show.nextAirDate
                          .split("-")
                          .reverse()
                          .join("/")}`}
                      >
                        <Calendar className="w-2.5 h-2.5 shrink-0" />
                        <span>
                          {(() => {
                            const parts = show.nextAirDate.split("-");
                            return parts.length === 3
                              ? `${parts[2]}/${parts[1]}`
                              : show.nextAirDate;
                          })()}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Info & Actions */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {show.status && (
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              show.status === "Canceled"
                                ? "bg-zinc-600"
                                : show.status === "Ended"
                                  ? "bg-zinc-400"
                                  : "bg-emerald-500"
                            }`}
                            title={
                              show.status === "Ended"
                                ? "Finalizada"
                                : show.status === "Canceled"
                                  ? "Cancelada"
                                  : "Em andamento"
                            }
                          />
                        )}
                        <h3 className="text-sm font-semibold text-white truncate flex items-center gap-1.5 min-w-0">
                          {showUrl ? (
                            <a
                              href={showUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate hover:text-zinc-300 transition-colors"
                            >
                              {show.title}
                            </a>
                          ) : (
                            <span className="truncate">{show.title}</span>
                          )}
                          {typeof show.rating === "number" && (
                            <span
                              className="inline-flex items-center text-[10px] font-medium text-zinc-300 bg-white/[0.06] px-1.5 py-0.5 rounded border border-white/[0.06] shrink-0 tabular-nums"
                              title={`Nota no LMSFilmes: ${show.rating.toFixed(1)}`}
                            >
                              ★ {show.rating.toFixed(1)}
                            </span>
                          )}
                        </h3>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {isUnreleased ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-white/[0.06] text-zinc-300 border border-white/[0.08]">
                            Em Breve
                          </span>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${
                              show.unwatchedCount > 0
                                ? "bg-white/[0.06] text-zinc-200 border-white/[0.1]"
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            }`}
                          >
                            {show.unwatchedCount > 0
                              ? show.unwatchedCount === 1
                                ? "1 pendente"
                                : `${show.unwatchedCount} pendentes`
                              : "Em dia"}
                          </span>
                        )}

                        {show.rewatching && !isUnreleased && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                            {(show.rewatchCount || 0) + 1}ª vez
                          </span>
                        )}

                        {!show.rewatching &&
                          typeof show.rewatchCount === "number" &&
                          show.rewatchCount > 0 &&
                          !isUnreleased && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                              Viu {show.rewatchCount + 1}x
                            </span>
                          )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {isUnreleased ? (
                      <div className="my-2">
                        <div className="flex justify-between items-center mb-1 text-[10px] text-zinc-500 font-mono">
                          <span>Aguardando Estreia</span>
                          <span>0 eps</span>
                        </div>
                        <div className="w-full bg-white/[0.05] h-1 rounded-full overflow-hidden">
                          <div className="h-full bg-zinc-500 rounded-full w-0" />
                        </div>
                      </div>
                    ) : (
                      <div className="my-2">
                        <div className="flex justify-between items-center mb-1 text-[10px] text-zinc-400 font-mono tabular-nums">
                          <span>Progresso</span>
                          <span>
                            {progressPercent}% ({watchedCount}/{show.totalAiredEpisodes})
                          </span>
                        </div>
                        <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500/80 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Next Episode + Bottom Actions */}
                    <div className="flex flex-col gap-2 mt-auto">
                      {isUnreleased ? (
                        <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-2.5 flex items-center gap-2 text-xs text-zinc-300">
                          <Sparkles className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span>Série ainda não lançada. Estreia em breve!</span>
                        </div>
                      ) : nextEp ? (
                        <div className="bg-[#111113] rounded-xl p-2.5 border border-white/[0.06] flex gap-2.5 min-w-0 items-center justify-between">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-sky-400 font-mono font-semibold shrink-0">
                                S{String(nextEp.seasonNumber).padStart(2, "0")}-E
                                {String(nextEp.episodeNumber).padStart(2, "0")}
                              </span>
                              <span className="text-xs font-semibold text-zinc-100 truncate">
                                {nextEp.name}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1">
                              {nextEp.overview || "Sem descrição disponível."}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              watchMutation.mutate({
                                serieId: show.tmdbId,
                                seasonNumber: nextEp.seasonNumber,
                                episodeNumber: nextEp.episodeNumber,
                              })
                            }
                            disabled={watchMutation.isPending}
                            className="p-2 bg-zinc-100 hover:bg-white text-zinc-950 rounded-lg transition-colors shrink-0 flex items-center justify-center"
                            title="Marcar como Assistido"
                          >
                            {watchMutation.isPending &&
                            watchMutation.variables?.serieId === show.tmdbId &&
                            watchMutation.variables?.seasonNumber ===
                              nextEp.seasonNumber &&
                            watchMutation.variables?.episodeNumber ===
                              nextEp.episodeNumber ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="text-zinc-400 text-xs flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          {show.status === "Ended" ? (
                            <span>Série finalizada!</span>
                          ) : show.status === "Canceled" ? (
                            <span>Série cancelada. Você está em dia!</span>
                          ) : (
                            <span>Todos os episódios disponíveis assistidos!</span>
                          )}
                        </div>
                      )}

                      {/* Bottom Actions */}
                      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
                        <div className="flex items-center gap-2.5 shrink-0">
                          {isUnreleased ? (
                            <span className="text-[11px] text-zinc-400 flex items-center gap-1 whitespace-nowrap">
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                              Aguardando lançamento
                            </span>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  toggleWatchLaterMutation.mutate({
                                    serieId: show.tmdbId,
                                    watchLater: !show.watchLater,
                                  })
                                }
                                disabled={toggleWatchLaterMutation.isPending}
                                className={`text-[11px] font-medium flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
                                  show.watchLater
                                    ? "text-emerald-400 hover:text-emerald-300"
                                    : "text-zinc-400 hover:text-zinc-200"
                                }`}
                                title={
                                  show.watchLater
                                    ? "Mover de volta para Assistindo"
                                    : "Mover para Quero Ver"
                                }
                              >
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                <span>{show.watchLater ? "Retomar" : "Quero Ver"}</span>
                              </button>

                              {show.unwatchedCount === 0 &&
                                !show.rewatching &&
                                !show.watchLater && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (
                                          window.confirm(
                                            "Deseja iniciar o rewatch desta série? Isso limpará o histórico local de episódios assistidos para que você possa marcá-los novamente conforme for assistindo.",
                                          )
                                        ) {
                                          startRewatchMutation.mutate({
                                            serieId: show.tmdbId,
                                          });
                                        }
                                      }}
                                      disabled={startRewatchMutation.isPending}
                                      className="text-[11px] font-medium flex items-center gap-1 text-zinc-400 hover:text-white transition-colors whitespace-nowrap shrink-0"
                                      title="Iniciar novo rewatch"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                                      <span>Rever</span>
                                    </button>

                                    {typeof show.rewatchCount === "number" &&
                                      show.rewatchCount > 0 && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (
                                              window.confirm(
                                                "Deseja zerar a contagem de rewatch desta série?",
                                              )
                                            ) {
                                              resetRewatchMutation.mutate({
                                                serieId: show.tmdbId,
                                              });
                                            }
                                          }}
                                          disabled={resetRewatchMutation.isPending}
                                          className="text-[11px] font-medium flex items-center gap-1 text-zinc-500 hover:text-zinc-200 transition-colors whitespace-nowrap shrink-0"
                                          title="Zerar contador de rewatch"
                                        >
                                          <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                                          <span>Zerar</span>
                                        </button>
                                      )}
                                  </>
                                )}

                              {show.rewatching && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        "Deseja cancelar o rewatch? Isso marcará todos os episódios como assistidos novamente.",
                                      )
                                    ) {
                                      cancelRewatchMutation.mutate({
                                        serieId: show.tmdbId,
                                      });
                                    }
                                  }}
                                  disabled={cancelRewatchMutation.isPending}
                                  className="text-[11px] font-medium flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors whitespace-nowrap shrink-0"
                                  title="Cancelar rewatch"
                                >
                                  <X className="w-3.5 h-3.5 shrink-0" />
                                  <span>Cancelar</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>

                        {!isUnreleased && show.totalAiredEpisodes > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleExpand(show.tmdbId)}
                            className="text-[11px] text-zinc-300 hover:text-white font-medium flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
                          >
                            {isExpanded ? (
                              <>
                                <span>Ocultar</span>
                                <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                              </>
                            ) : (
                              <>
                                <span>Ver todos</span>
                                <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Episodes List */}
                {isExpanded && (
                  <div
                    className={`absolute left-0 right-0 z-30 bg-[#111113] border border-white/[0.1] rounded-2xl p-4 shadow-2xl overflow-hidden ${
                      expandDirection === "up"
                        ? "bottom-[calc(100%+8px)]"
                        : "top-[calc(100%+8px)]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                        Histórico de Episódios
                      </span>
                      <button
                        type="button"
                        onClick={() => setExpandedShowId(null)}
                        className="text-zinc-500 hover:text-white transition-colors"
                        aria-label="Fechar lista"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                      {episodes.map((ep) => {
                        const epId = `${show.tmdbId}-${ep.seasonNumber}-${ep.episodeNumber}`;
                        const isPending =
                          (watchMutation.isPending &&
                            watchMutation.variables?.serieId === show.tmdbId &&
                            watchMutation.variables?.seasonNumber === ep.seasonNumber &&
                            watchMutation.variables?.episodeNumber === ep.episodeNumber) ||
                          (unwatchMutation.isPending &&
                            unwatchMutation.variables?.serieId === show.tmdbId &&
                            unwatchMutation.variables?.seasonNumber === ep.seasonNumber &&
                            unwatchMutation.variables?.episodeNumber === ep.episodeNumber) ||
                          (watchAllUpToMutation.isPending &&
                            watchAllUpToMutation.variables?.serieId === show.tmdbId);

                        return (
                          <div
                            key={epId}
                            className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-colors ${
                              ep.watched
                                ? "bg-emerald-500/[0.04] border-emerald-500/15 opacity-75"
                                : "bg-[#161619] border-white/[0.06]"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <button
                                type="button"
                                onClick={() => {
                                  const payload = {
                                    serieId: show.tmdbId,
                                    seasonNumber: ep.seasonNumber,
                                    episodeNumber: ep.episodeNumber,
                                  };
                                  if (ep.watched) {
                                    unwatchMutation.mutate(payload);
                                  } else {
                                    watchMutation.mutate(payload);
                                  }
                                }}
                                disabled={isPending}
                                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                                  ep.watched
                                    ? "bg-emerald-500 border-emerald-500 text-zinc-950"
                                    : "border-zinc-500 hover:border-zinc-300 bg-transparent"
                                }`}
                              >
                                {isPending ? (
                                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                ) : ep.watched ? (
                                  <Check className="w-3 h-3 stroke-[3]" />
                                ) : null}
                              </button>

                              <div className="min-w-0 flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono text-sky-400 font-semibold shrink-0">
                                    S{String(ep.seasonNumber).padStart(2, "0")}-E
                                    {String(ep.episodeNumber).padStart(2, "0")}
                                  </span>
                                  <span className="text-xs font-medium text-zinc-200 truncate">
                                    {ep.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mt-0.5">
                                  <Calendar className="w-2.5 h-2.5" />
                                  <span>{formatDate(ep.airDate)}</span>
                                </div>
                              </div>
                            </div>

                            {!ep.watched ? (
                              <button
                                type="button"
                                onClick={() =>
                                  watchAllUpToMutation.mutate({
                                    serieId: show.tmdbId,
                                    seasonNumber: ep.seasonNumber,
                                    episodeNumber: ep.episodeNumber,
                                  })
                                }
                                disabled={isPending}
                                className="text-[10px] font-medium text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] px-2 py-1 rounded-lg transition-colors shrink-0 border border-white/[0.06]"
                                title="Marcar todos os anteriores e este como assistidos"
                              >
                                Marcar até aqui
                              </button>
                            ) : typeof ep.rating === "number" ? (
                              <div
                                className="flex items-center gap-1 bg-white/[0.05] border border-white/[0.08] rounded-md px-2 py-0.5 text-zinc-200 shrink-0 tabular-nums"
                                title={`Nota atribuída no LMS Filmes: ${ep.rating.toFixed(1)}`}
                              >
                                <span className="text-[10px] text-amber-400">★</span>
                                <span className="text-[10px] font-semibold font-mono">
                                  {ep.rating.toFixed(1)}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </SurfacePanel>
  );
}
