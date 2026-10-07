"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Tv,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Calendar,
  Sparkles,
  CheckCircle2,
  Eye,
  Play,
  X,
  Clock,
  RotateCcw,
  Search,
} from "lucide-react";
import { radarApi } from "@/lib/api";
import { SerieWatchStatusDTO, EpisodeDTO } from "@/lib/types";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/authStore";

export function EpisodeWatchlist() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.userId);
  const [activeTab, setActiveTab] = useState<"to-watch" | "up-to-date" | "watch-later" | "upcoming">("to-watch");
  const [expandedShowId, setExpandedShowId] = useState<string | null>(null);
  const [expandDirection, setExpandDirection] = useState<"up" | "down">("down");
  const [searchQuery, setSearchQuery] = useState("");

  // Registry for card references to calculate expand direction dynamically
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Close expanded dropdown when clicking outside
  useEffect(() => {
    if (!expandedShowId) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".card-container")) {
        setExpandedShowId(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [expandedShowId]);

  const handleTabChange = (tab: "to-watch" | "up-to-date" | "watch-later" | "upcoming") => {
    setActiveTab(tab);
    setExpandedShowId(null);
  };

  const queryKey = ["media-episodes-to-watch", userId];

  const { data: shows = [], isLoading } = useQuery<SerieWatchStatusDTO[]>({
    queryKey,
    queryFn: radarApi.getEpisodesToWatch,
    staleTime: 0,
  });

  const toggleExpand = (tmdbId: string) => {
    if (expandedShowId !== tmdbId) {
      // Calculate expand direction (up or down) based on viewport space
      const cardEl = cardRefs.current[tmdbId];
      if (cardEl) {
        const rect = cardEl.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;

        // Dropdown menu is roughly 350px tall.
        // If space below is less than 350px, and there is more space above than below, grow upwards.
        if (spaceBelow < 350 && spaceAbove > spaceBelow) {
          setExpandDirection("up");
        } else {
          setExpandDirection("down");
        }
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
        if (!old) return [];
        return old.map((show) => {
          if (show.tmdbId !== variables.serieId) return show;
          const updatedEpisodes = show.episodes.map((ep) => {
            if (ep.seasonNumber === variables.seasonNumber && ep.episodeNumber === variables.episodeNumber) {
              return { ...ep, watched: true };
            }
            return ep;
          });
          const unwatchedCount = updatedEpisodes.filter((ep) => !ep.watched).length;
          const nextToWatch = updatedEpisodes.find((ep) => !ep.watched) || null;
          return { ...show, episodes: updatedEpisodes, unwatchedCount, nextToWatch };
        });
      });
      return { previousShows };
    },
    onError: (err, variables, context) => {
      if (context?.previousShows) {
        queryClient.setQueryData(queryKey, context.previousShows);
      }
      toast.error("Erro ao marcar episódio como assistido.");
    },
    onSuccess: (_, variables) => {
      toast.success(`S${String(variables.seasonNumber).padStart(2, "0")}-E${String(variables.episodeNumber).padStart(2, "0")} marcado como assistido!`);
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
        if (!old) return [];
        return old.map((show) => {
          if (show.tmdbId !== variables.serieId) return show;
          const updatedEpisodes = show.episodes.map((ep) => {
            if (ep.seasonNumber === variables.seasonNumber && ep.episodeNumber === variables.episodeNumber) {
              return { ...ep, watched: false };
            }
            return ep;
          });
          const unwatchedCount = updatedEpisodes.filter((ep) => !ep.watched).length;
          const nextToWatch = updatedEpisodes.find((ep) => !ep.watched) || null;
          return { ...show, episodes: updatedEpisodes, unwatchedCount, nextToWatch };
        });
      });
      return { previousShows };
    },
    onError: (err, variables, context) => {
      if (context?.previousShows) {
        queryClient.setQueryData(queryKey, context.previousShows);
      }
      toast.error("Erro ao desmarcar episódio.");
    },
    onSuccess: (_, variables) => {
      toast.info(`S${String(variables.seasonNumber).padStart(2, "0")}-E${String(variables.episodeNumber).padStart(2, "0")} marcado como não assistido.`);
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
        if (!old) return [];
        return old.map((show) => {
          if (show.tmdbId !== variables.serieId) return show;
          const updatedEpisodes = show.episodes.map((ep) => {
            const isBeforeOrEqual =
              ep.seasonNumber < variables.seasonNumber ||
              (ep.seasonNumber === variables.seasonNumber && ep.episodeNumber <= variables.episodeNumber);
            if (isBeforeOrEqual) {
              return { ...ep, watched: true };
            }
            return ep;
          });
          const unwatchedCount = updatedEpisodes.filter((ep) => !ep.watched).length;
          const nextToWatch = updatedEpisodes.find((ep) => !ep.watched) || null;
          return { ...show, episodes: updatedEpisodes, unwatchedCount, nextToWatch };
        });
      });
      return { previousShows };
    },
    onError: (err, variables, context) => {
      if (context?.previousShows) {
        queryClient.setQueryData(queryKey, context.previousShows);
      }
      toast.error("Erro ao marcar episódios.");
    },
    onSuccess: (_, variables) => {
      toast.success(`Todos os episódios até S${String(variables.seasonNumber).padStart(2, "0")}-E${String(variables.episodeNumber).padStart(2, "0")} marcados como assistidos!`);
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
        if (!old) return [];
        return old.map((show) => {
          if (show.tmdbId !== variables.serieId) return show;
          return { ...show, watchLater: variables.watchLater };
        });
      });
      return { previousShows };
    },
    onError: (err, variables, context) => {
      if (context?.previousShows) {
        queryClient.setQueryData(queryKey, context.previousShows);
      }
      toast.error("Erro ao alterar preferência da série.");
    },
    onSuccess: (_, variables) => {
      toast.success(
        variables.watchLater
          ? "Série adicionada ao Ver Depois!"
          : "Série removida do Ver Depois!"
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["media-episodes-to-watch"] });
    },
  });

  const startRewatchMutation = useMutation({
    mutationFn: ({ serieId }: { serieId: string }) => radarApi.startRewatch(serieId),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previousShows = queryClient.getQueryData<SerieWatchStatusDTO[]>(queryKey);
      queryClient.setQueryData<SerieWatchStatusDTO[]>(queryKey, (old) => {
        if (!old) return [];
        return old.map((show) => {
          if (show.tmdbId !== variables.serieId) return show;
          return {
            ...show,
            rewatching: true,
            rewatchCount: (show.rewatchCount || 0) + 1,
            unwatchedCount: show.totalAiredEpisodes,
            episodes: show.episodes.map((ep) => ({ ...ep, watched: false, rating: undefined, watchedAt: undefined })),
          };
        });
      });
      return { previousShows };
    },
    onError: (err, variables, context) => {
      if (context?.previousShows) {
        queryClient.setQueryData(queryKey, context.previousShows);
      }
      toast.error("Erro ao iniciar rewatch da série.");
    },
    onSuccess: (_, variables) => {
      toast.success("Rewatch iniciado! Divirta-se assistindo novamente.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["media-episodes-to-watch"] });
      queryClient.invalidateQueries({ queryKey: ["media-weekly-calendar"] });
    },
  });

  const cancelRewatchMutation = useMutation({
    mutationFn: ({ serieId }: { serieId: string }) => radarApi.cancelRewatch(serieId),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previousShows = queryClient.getQueryData<SerieWatchStatusDTO[]>(queryKey);
      queryClient.setQueryData<SerieWatchStatusDTO[]>(queryKey, (old) => {
        if (!old) return [];
        return old.map((show) => {
          if (show.tmdbId !== variables.serieId) return show;
          return {
            ...show,
            rewatching: false,
            rewatchCount: Math.max(0, (show.rewatchCount || 0) - 1),
            unwatchedCount: 0,
            episodes: show.episodes.map((ep) => ({ ...ep, watched: true })),
          };
        });
      });
      return { previousShows };
    },
    onError: (err, variables, context) => {
      if (context?.previousShows) {
        queryClient.setQueryData(queryKey, context.previousShows);
      }
      toast.error("Erro ao cancelar rewatch da série.");
    },
    onSuccess: (_, variables) => {
      toast.success("Rewatch cancelado.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["media-episodes-to-watch"] });
      queryClient.invalidateQueries({ queryKey: ["media-weekly-calendar"] });
    },
  });

  const resetRewatchMutation = useMutation({
    mutationFn: ({ serieId }: { serieId: string }) => radarApi.resetRewatch(serieId),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previousShows = queryClient.getQueryData<SerieWatchStatusDTO[]>(queryKey);
      queryClient.setQueryData<SerieWatchStatusDTO[]>(queryKey, (old) => {
        if (!old) return [];
        return old.map((show) => {
          if (show.tmdbId !== variables.serieId) return show;
          return {
            ...show,
            rewatching: false,
            rewatchCount: 0,
          };
        });
      });
      return { previousShows };
    },
    onError: (err, variables, context) => {
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

  // Helper to check if a show is not released yet (future release or 0 aired episodes)
  const isShowUnreleased = (s: SerieWatchStatusDTO) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const isFutureFirstAir = Boolean(s.firstAirDate && s.firstAirDate > todayStr);
    const inProd = s.status === "In Production" || s.status === "Planned";
    return isFutureFirstAir || inProd || (s.totalAiredEpisodes === 0 && (!s.firstAirDate || s.firstAirDate > todayStr));
  };

  // Filter shows based on tab
  const upcomingShows = shows.filter((s) => isShowUnreleased(s));
  const watchLaterShows = shows.filter((s) => s.watchLater && !isShowUnreleased(s));
  const toWatchShows = shows.filter((s) => !s.watchLater && !isShowUnreleased(s) && s.unwatchedCount > 0);
  const upToDateShows = shows.filter((s) => !s.watchLater && !isShowUnreleased(s) && s.unwatchedCount === 0);

  const currentShowsRaw =
    activeTab === "to-watch"
      ? toWatchShows
      : activeTab === "up-to-date"
      ? upToDateShows
      : activeTab === "upcoming"
      ? upcomingShows
      : watchLaterShows;

  // Sort function based on user rules:
  // 1. Show next release date closest (if future nextAirDate exists)
  // 2. "In progress" shows in alphabetical order
  // 3. "Ended/Canceled" shows in alphabetical order
  const sortShows = (showsList: SerieWatchStatusDTO[]) => {
    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    return [...showsList].sort((a, b) => {
      // Check if show has a confirmed future nextAirDate
      const hasFutureA = a.nextAirDate && a.nextAirDate >= todayStr;
      const hasFutureB = b.nextAirDate && b.nextAirDate >= todayStr;

      if (hasFutureA && !hasFutureB) return -1;
      if (!hasFutureA && hasFutureB) return 1;

      // If both have future nextAirDate, sort by closest release (ascending date order)
      if (hasFutureA && hasFutureB && a.nextAirDate && b.nextAirDate) {
        const dateCompare = a.nextAirDate.localeCompare(b.nextAirDate);
        if (dateCompare !== 0) return dateCompare;
      }

      // Check if series is finished (Ended or Canceled)
      const isFinishedA = a.status === "Ended" || a.status === "Canceled";
      const isFinishedB = b.status === "Ended" || b.status === "Canceled";

      if (!isFinishedA && isFinishedB) return -1;
      if (isFinishedA && !isFinishedB) return 1;

      // Alphabetical order for tie-breaker
      return a.title.localeCompare(b.title, "pt-BR");
    });
  };

  const currentShows = sortShows(currentShowsRaw).filter((show) =>
    show.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === "null") return "Sem data";
    try {
      const date = new Date(dateStr + "T00:00:00");
      return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-purple-500/50 rounded-3xl p-4 md:p-6 lg:p-8 shadow-2xl relative">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-2.5 md:gap-3">
          <div className="p-1.5 md:p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <Tv className="text-purple-400 w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-base md:text-xl font-bold text-white tracking-tight">
              Minha Lista de Séries (TV Time)
            </h2>
            <span className="text-[10px] md:text-[11px] text-zinc-500 font-medium">
              Controle de episódios assistidos e episódios pendentes
            </span>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap bg-black/40 border border-white/5 p-1 rounded-xl self-start sm:self-auto gap-1">
          <button
            onClick={() => handleTabChange("to-watch")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "to-watch"
                ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            A assistir
            {toWatchShows.length > 0 && (
              <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${
                activeTab === "to-watch" ? "bg-white text-purple-600" : "bg-white/10 text-zinc-300"
              }`}>
                {toWatchShows.length}
              </span>
            )}
          </button>
          <button
            onClick={() => handleTabChange("up-to-date")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "up-to-date"
                ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Em dia
            {upToDateShows.length > 0 && (
              <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${
                activeTab === "up-to-date" ? "bg-white text-purple-600" : "bg-white/10 text-zinc-300"
              }`}>
                {upToDateShows.length}
              </span>
            )}
          </button>
          <button
            onClick={() => handleTabChange("upcoming")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "upcoming"
                ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Em breve
            {upcomingShows.length > 0 && (
              <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${
                activeTab === "upcoming" ? "bg-white text-purple-600" : "bg-white/10 text-zinc-300"
              }`}>
                {upcomingShows.length}
              </span>
            )}
          </button>
          <button
            onClick={() => handleTabChange("watch-later")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "watch-later"
                ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Ver depois
            {watchLaterShows.length > 0 && (
              <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${
                activeTab === "watch-later" ? "bg-white text-purple-600" : "bg-white/10 text-zinc-300"
              }`}>
                {watchLaterShows.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative z-10 max-w-md">
        <div className="relative group">
          <input
            type="text"
            placeholder="Pesquisar série..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/5 group-hover:border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs md:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-hover:text-zinc-400 transition-colors" />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4 py-8 items-center justify-center relative z-10">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500/60" />
          <span className="text-xs text-zinc-500 font-medium">Carregando episódios...</span>
        </div>
      ) : currentShows.length === 0 ? (
        <div className="py-12 bg-black/20 rounded-2xl border border-white/5 border-dashed text-center text-zinc-500 text-xs md:text-sm font-medium relative z-10 flex flex-col items-center justify-center gap-3">
          <CheckCircle2 className="w-8 h-8 text-zinc-600" />
          {activeTab === "to-watch" ? (
            <div>
              <p className="text-zinc-300 font-semibold mb-1">Nenhum episódio pendente!</p>
              <p className="text-zinc-500 text-xs">Parabéns, você assistiu a tudo. Adicione mais séries no catálogo do LMS Filmes.</p>
            </div>
          ) : activeTab === "up-to-date" ? (
            <div>
              <p className="text-zinc-300 font-semibold mb-1">Nenhuma série em dia.</p>
              <p className="text-zinc-500 text-xs">Marque episódios como assistidos para deixá-las em dia.</p>
            </div>
          ) : (
            <div>
              <p className="text-zinc-300 font-semibold mb-1">Nenhuma série salva para ver depois.</p>
              <p className="text-zinc-500 text-xs">Clique no botão &quot;Ver depois&quot; em alguma série para arquivá-la aqui.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start relative z-10">
          {currentShows.map((show) => {
            const isExpanded = expandedShowId === show.tmdbId;
            const nextEp = show.nextToWatch;
            const isUnreleased = isShowUnreleased(show);

            return (
              <div
                key={show.tmdbId}
                ref={(el) => {
                  cardRefs.current[show.tmdbId] = el;
                }}
                className={`bg-[#18181b]/55 border border-white/5 rounded-2xl p-4 transition-all duration-300 hover:border-purple-500/20 relative card-container ${
                  isExpanded ? "z-40" : "z-10"
                }`}
              >
                {/* Main Card Layout */}
                <div className="flex gap-4">
                  {/* Poster Image & Next Episode Date */}
                  <div className="flex flex-col gap-1.5 shrink-0 w-[70px] md:w-[80px]">
                    <a
                      href={`https://filmes.lucasmks.com.br/series/${show.tmdbId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-[105px] md:h-[120px] rounded-xl overflow-hidden border border-white/5 relative bg-zinc-900 group block hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                    >
                      {show.posterUrl ? (
                        <img
                          src={show.posterUrl}
                          alt={show.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Tv className="w-6 h-6 text-zinc-700" />
                        </div>
                      )}
                    </a>

                    {show.rewatching && !isUnreleased && (
                      <span
                        className="px-1 py-0.5 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/35 animate-pulse text-center w-full block shrink-0"
                        title="Você está reassistindo a esta série"
                      >
                        Revendo
                      </span>
                    )}

                    {show.nextAirDate && show.nextAirDate >= new Date().toISOString().split("T")[0] && (
                      <span
                        className="px-1.5 py-0.5 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center gap-1 w-full text-center shrink-0"
                        title={`Próximo episódio: ${show.nextAirDate.split("-").reverse().join("/")}`}
                      >
                        <Calendar className="w-2.5 h-2.5 animate-pulse shrink-0" />
                        EP: {(() => {
                          const parts = show.nextAirDate.split("-");
                          return parts.length === 3 ? `${parts[2]}/${parts[1]}` : show.nextAirDate;
                        })()}
                      </span>
                    )}
                  </div>

                  {/* Info and Action Area */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    {/* Show title and counter */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {show.status && (
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              show.status === "Canceled"
                                ? "bg-red-800"
                                : show.status === "Ended"
                                ? "bg-red-500"
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
                        <h3 className="text-sm md:text-base font-bold text-white truncate hover:text-purple-400 transition-colors flex items-center gap-1.5 min-w-0">
                          <a
                            href={`https://filmes.lucasmks.com.br/series/${show.tmdbId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate"
                          >
                            {show.title}
                          </a>
                          {show.rating !== undefined && show.rating !== null && (
                            <span 
                              className="inline-flex items-center text-[10px] font-medium text-zinc-400 bg-zinc-800/50 px-1.5 py-0.5 rounded border border-white/5 shrink-0 select-none"
                              title={`Nota no LMSFilmes: ${show.rating.toFixed(1)}`}
                            >
                              ★ {show.rating.toFixed(1)}
                            </span>
                          )}
                        </h3>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {isUnreleased ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            Em Breve
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            {show.unwatchedCount > 0
                              ? show.unwatchedCount === 1
                                ? "1 pendente"
                                : `${show.unwatchedCount} pendentes`
                              : "Em dia"}
                          </span>
                        )}
                        {show.rewatching && !isUnreleased && (
                          <span
                            className="px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/35"
                            title={`Reassistindo pela ${(show.rewatchCount || 0) + 1}ª vez (${show.rewatchCount || 0}x concluída${(show.rewatchCount || 0) > 1 ? "s" : ""})`}
                          >
                            {(show.rewatchCount || 0) + 1}ª vez
                          </span>
                        )}
                        {!show.rewatching && show.rewatchCount !== undefined && show.rewatchCount > 0 && !isUnreleased && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/35" title={`Assistida ${show.rewatchCount + 1} vez${show.rewatchCount + 1 > 1 ? "es" : ""}`}>
                            Viu {show.rewatchCount + 1}x
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {(() => {
                      if (isUnreleased) {
                        return (
                          <div className="mt-2 mb-2 text-left">
                            <div className="flex justify-between items-center mb-1 text-[9px] md:text-[10px] text-zinc-500 font-semibold font-mono">
                              <span>Aguardando Estreia</span>
                              <span>0 episódios lançados</span>
                            </div>
                            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden relative border border-white/5">
                              <div className="h-full bg-purple-500/30 rounded-full w-0" />
                            </div>
                          </div>
                        );
                      }

                      const watchedCount = show.totalAiredEpisodes - show.unwatchedCount;
                      const progressPercent = show.totalAiredEpisodes > 0
                        ? Math.round((watchedCount / show.totalAiredEpisodes) * 100)
                        : 0;

                      return (
                        <div className="mt-2 mb-2 text-left">
                          <div className="flex justify-between items-center mb-1 text-[9px] md:text-[10px] text-zinc-500 font-semibold font-mono">
                            <span>Progresso</span>
                            <span>{progressPercent}% ({watchedCount}/{show.totalAiredEpisodes})</span>
                          </div>
                          <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden relative border border-white/5">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}

                    {/* Next episode info & Bottom actions container */}
                    <div className="flex flex-col gap-2 mt-auto">
                      {/* Next episode info */}
                      {isUnreleased ? (
                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-2.5 flex items-center gap-2 text-xs text-purple-300 font-medium">
                          <Sparkles className="w-4 h-4 text-purple-400 shrink-0 animate-pulse" />
                          <span>Série ainda não lançada. Estreia em breve!</span>
                        </div>
                      ) : nextEp ? (
                        <div className="bg-black/35 rounded-xl p-2.5 border border-white/5 flex gap-3 min-w-0 items-center justify-between">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] md:text-[11px] text-purple-400 font-mono font-bold shrink-0">
                                S{String(nextEp.seasonNumber).padStart(2, "0")}-E{String(nextEp.episodeNumber).padStart(2, "0")}
                              </span>
                              <span className="text-[11px] md:text-xs font-bold text-zinc-100 truncate">
                                {nextEp.name}
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-400 mt-1 line-clamp-1 max-w-full">
                              {nextEp.overview || "Sem descrição disponível."}
                            </p>
                          </div>

                          {/* Quick Watch Button */}
                          <button
                            onClick={() =>
                              watchMutation.mutate({
                                serieId: show.tmdbId,
                                seasonNumber: nextEp.seasonNumber,
                                episodeNumber: nextEp.episodeNumber,
                              })
                            }
                            disabled={watchMutation.isPending}
                            className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-all shrink-0 hover:scale-105 active:scale-95 shadow-md shadow-purple-500/20 flex items-center justify-center"
                            title="Marcar como Assistido"
                          >
                            {watchMutation.isPending &&
                            watchMutation.variables?.serieId === show.tmdbId &&
                            watchMutation.variables?.seasonNumber === nextEp.seasonNumber &&
                            watchMutation.variables?.episodeNumber === nextEp.episodeNumber ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="text-zinc-500 text-xs flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          {show.status === "Ended" ? (
                            <span>Parabéns! Série finalizada com sucesso! 🎉</span>
                          ) : show.status === "Canceled" ? (
                            <span>Série cancelada. Você está em dia!</span>
                          ) : (
                            <span>Você assistiu todos os episódios disponíveis!</span>
                          )}
                        </div>
                      )}

                      {/* Bottom Actions */}
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
                        <div className="flex items-center gap-2 md:gap-2.5 shrink-0">
                          {isUnreleased ? (
                            <span className="text-[10px] md:text-xs text-purple-400/80 font-medium flex items-center gap-1 whitespace-nowrap">
                              <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                              Aguardando lançamento
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() =>
                                  toggleWatchLaterMutation.mutate({
                                    serieId: show.tmdbId,
                                    watchLater: !show.watchLater,
                                  })
                                }
                                disabled={toggleWatchLaterMutation.isPending}
                                className={`text-[10px] md:text-xs font-semibold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
                                  show.watchLater
                                    ? "text-amber-400 hover:text-amber-300"
                                    : "text-zinc-500 hover:text-zinc-300"
                                }`}
                                title={show.watchLater ? "Mover de volta para a lista principal" : "Mover para Ver depois"}
                              >
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                <span>{show.watchLater ? "Retomar" : "Ver depois"}</span>
                              </button>

                              {/* Rewatch Actions */}
                              {show.unwatchedCount === 0 && !show.rewatching && !show.watchLater && (
                                <>
                                  <button
                                    onClick={() => {
                                      if (window.confirm("Deseja iniciar o rewatch desta série? Isso limpará o histórico local de episódios assistidos para que você possa marcá-los novamente conforme for assistindo.")) {
                                        startRewatchMutation.mutate({
                                          serieId: show.tmdbId,
                                        });
                                      }
                                    }}
                                    disabled={startRewatchMutation.isPending}
                                    className="text-[10px] md:text-xs font-semibold flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors whitespace-nowrap shrink-0"
                                    title="Iniciar novo rewatch (assistir novamente)"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                                    <span>Rever</span>
                                  </button>

                                  {show.rewatchCount !== undefined && show.rewatchCount > 0 && (
                                    <button
                                      onClick={() => {
                                        if (window.confirm("Deseja zerar a contagem de rewatch desta série (remover o 'Viu 2x' e retornar para o estado inicial)?")) {
                                          resetRewatchMutation.mutate({
                                            serieId: show.tmdbId,
                                          });
                                        }
                                      }}
                                      disabled={resetRewatchMutation.isPending}
                                      className="text-[10px] md:text-xs font-semibold flex items-center gap-1 text-zinc-400 hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
                                      title="Zerar contador de rewatch"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                                      <span>Zerar rewatch</span>
                                    </button>
                                  )}
                                </>
                              )}
                              {show.rewatching && (
                                <button
                                  onClick={() => {
                                    if (window.confirm("Deseja cancelar o rewatch? Isso marcará todos os episódios como assistidos novamente e restaurará o estado anterior.")) {
                                      cancelRewatchMutation.mutate({
                                        serieId: show.tmdbId,
                                      });
                                    }
                                  }}
                                  disabled={cancelRewatchMutation.isPending}
                                  className="text-[10px] md:text-xs font-semibold flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors whitespace-nowrap shrink-0"
                                  title="Cancelar rewatch e marcar tudo como assistido"
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
                            onClick={() => toggleExpand(show.tmdbId)}
                            className="text-[10px] md:text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
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
                    className={`absolute left-0 right-0 z-30 bg-[#161619]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden animate-in fade-in duration-200 ${
                      expandDirection === "up"
                        ? "bottom-[calc(100%+8px)] slide-in-from-bottom-2"
                        : "top-[calc(100%+8px)] slide-in-from-top-2"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        Histórico de Episódios
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                      {show.episodes.map((ep) => {
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
                            className={`flex items-center justify-between gap-3 p-2 rounded-xl border transition-all ${
                              ep.watched
                                ? "bg-purple-950/10 border-purple-500/10 opacity-70"
                                : "bg-black/25 border-white/5"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Checkbox trigger */}
                              <button
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
                                className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                  ep.watched
                                    ? "bg-purple-600 border-purple-500 text-white"
                                    : "border-zinc-500 hover:border-purple-400 bg-transparent"
                                }`}
                              >
                                {isPending ? (
                                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                ) : ep.watched ? (
                                  <Check className="w-3 h-3 stroke-[3]" />
                                ) : null}
                              </button>

                              {/* Episode identity */}
                              <div className="min-w-0 flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono text-purple-400 font-bold">
                                    S{String(ep.seasonNumber).padStart(2, "0")}-E{String(ep.episodeNumber).padStart(2, "0")}
                                  </span>
                                  <span className="text-[11px] font-bold text-zinc-200 truncate">
                                    {ep.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 mt-0.5">
                                  <Calendar className="w-2.5 h-2.5" />
                                  {formatDate(ep.airDate)}
                                </div>
                              </div>
                            </div>

                             {/* Options */}
                             {!ep.watched ? (
                               <button
                                 onClick={() =>
                                   watchAllUpToMutation.mutate({
                                     serieId: show.tmdbId,
                                     seasonNumber: ep.seasonNumber,
                                     episodeNumber: ep.episodeNumber,
                                   })
                                 }
                                 disabled={isPending}
                                 className="text-[9px] font-bold text-zinc-500 hover:text-purple-400 bg-white/5 hover:bg-purple-500/10 px-2 py-1 rounded-md transition-all shrink-0 border border-white/5"
                                 title="Marcar todos os anteriores e este como assistidos"
                               >
                                 Marcar até aqui
                               </button>
                             ) : ep.rating ? (
                                <div
                                  className="flex items-center gap-1 bg-purple-500/10 border border-purple-500/20 rounded-md px-2 py-0.5 text-purple-300 shrink-0"
                                  title={`Nota atribuída no LMS Filmes: ${ep.rating.toFixed(1)}`}
                                >
                                  <span className="text-[10px] text-amber-400">⭐</span>
                                  <span className="text-[10px] font-bold font-mono">
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
    </div>
  );
}
