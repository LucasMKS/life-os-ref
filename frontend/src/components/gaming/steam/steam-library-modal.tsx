"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Gamepad2,
  Rss,
  Search,
  X,
} from "lucide-react";
import { gamingApi } from "@/lib/api";
import { sanitizeUrl } from "@/lib/security";
import { EmptyState, FilterPill } from "@/components/ui/page-shell";

interface SteamLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SteamGame {
  appid: number;
  name: string;
  playtime_forever?: number;
}

interface TrackedGame {
  id: string;
  steamAppId: number;
}

type LibraryFilter = "all" | "radar" | "unplayed";

const PAGE_SIZE = 20;

function LibraryGameCover({ appid, name }: { appid: number; name: string }) {
  const [failed, setFailed] = useState(false);
  const src = sanitizeUrl(
    `https://cdn.akamai.steamstatic.com/steam/apps/${encodeURIComponent(
      String(appid)
    )}/header.jpg`
  );

  if (!src || failed) {
    return (
      <div className="w-full h-full flex items-center justify-center text-zinc-700 bg-[#09090b]">
        <Gamepad2 className="w-6 h-6" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
    />
  );
}

export function SteamLibraryModal({ isOpen, onClose }: SteamLibraryModalProps) {
  const queryClient = useQueryClient();
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryFilter, setLibraryFilter] = useState<LibraryFilter>("all");
  const [libraryPage, setLibraryPage] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const { data: profile } = useQuery({
    queryKey: ["steam-profile"],
    queryFn: gamingApi.getSteamProfile,
    enabled: isOpen,
    retry: false,
  });

  const { data: library, isLoading } = useQuery({
    queryKey: ["steam-library"],
    queryFn: gamingApi.getSteamLibrary,
    enabled: isOpen && !!profile,
  });

  const { data: radarGames = [] } = useQuery<TrackedGame[]>({
    queryKey: ["gaming-preferences"],
    queryFn: gamingApi.getTrackedGames,
    enabled: isOpen && !!profile,
  });

  const addRadarMutation = useMutation({
    mutationFn: (game: { game: string; steamAppId: number }) =>
      gamingApi.addTrackedGame(game),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gaming-preferences"] });
      queryClient.invalidateQueries({ queryKey: ["gaming-news"] });
      toast.success("Jogo adicionado ao Radar de Notícias!");
    },
  });

  const removeRadarMutation = useMutation({
    mutationFn: (id: string) => gamingApi.deleteTrackedGame(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gaming-preferences"] });
      queryClient.invalidateQueries({ queryKey: ["gaming-news"] });
      toast.success("Removido do Radar.");
    },
  });

  const radarAppIds = useMemo(
    () => new Set((radarGames || []).map((g) => g.steamAppId)),
    [radarGames]
  );

  const toggleRadar = (game: SteamGame) => {
    const existing = (radarGames || []).find((g) => g.steamAppId === game.appid);
    if (existing) {
      removeRadarMutation.mutate(existing.id);
    } else {
      addRadarMutation.mutate({ game: game.name, steamAppId: game.appid });
    }
  };

  const allGames: SteamGame[] = useMemo(() => {
    const games = Array.isArray(library?.response?.games)
      ? (library.response.games as SteamGame[])
      : [];
    return games
      .slice()
      .sort((a, b) => (b.playtime_forever ?? 0) - (a.playtime_forever ?? 0));
  }, [library]);

  const filteredGames = useMemo(() => {
    const q = librarySearch.toLowerCase().trim();
    return allGames.filter((g) => {
      if (libraryFilter === "radar" && !radarAppIds.has(g.appid)) return false;
      if (libraryFilter === "unplayed" && (g.playtime_forever ?? 0) > 0)
        return false;
      if (q && !(g.name || "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allGames, librarySearch, libraryFilter, radarAppIds]);

  const totalPages = Math.ceil(filteredGames.length / PAGE_SIZE);
  const pagedGames = filteredGames.slice(
    libraryPage * PAGE_SIZE,
    (libraryPage + 1) * PAGE_SIZE
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Biblioteca Steam"
        className="relative w-full max-w-5xl bg-[#111113] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-300 shrink-0">
              <Gamepad2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 truncate">
                <span>Biblioteca Steam</span>
                <span className="text-xs font-normal text-zinc-500 tabular-nums">
                  ({library?.response?.game_count || 0})
                </span>
              </h3>
              <p className="text-xs text-zinc-400 truncate">
                Pesquise títulos e ative o radar para acompanhar atualizações.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors shrink-0"
            title="Fechar (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 sm:px-5 sm:py-3.5 border-b border-white/[0.06] bg-[#09090b]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={librarySearch}
              onChange={(e) => {
                setLibrarySearch(e.target.value);
                setLibraryPage(0);
              }}
              placeholder="Buscar jogo..."
              className="w-full bg-[#111113] border border-white/[0.08] focus:border-white/25 rounded-xl pl-9 pr-3.5 py-2 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-colors"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <FilterPill
                active={libraryFilter === "all"}
                onClick={() => {
                  setLibraryFilter("all");
                  setLibraryPage(0);
                }}
                accent="blue"
              >
                Todos
              </FilterPill>
              <FilterPill
                active={libraryFilter === "radar"}
                onClick={() => {
                  setLibraryFilter("radar");
                  setLibraryPage(0);
                }}
                accent="blue"
              >
                No Radar ({radarAppIds.size})
              </FilterPill>
              <FilterPill
                active={libraryFilter === "unplayed"}
                onClick={() => {
                  setLibraryFilter("unplayed");
                  setLibraryPage(0);
                }}
                accent="blue"
              >
                Não jogados
              </FilterPill>
            </div>
            <span className="text-xs text-zinc-500 tabular-nums hidden md:inline">
              {filteredGames.length} de {allGames.length}
            </span>
          </div>
        </div>

        {/* Games Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-[#09090b] border border-white/[0.06] rounded-2xl p-2.5 animate-pulse"
                >
                  <div className="aspect-video bg-white/[0.05] rounded-xl mb-2" />
                  <div className="h-3.5 bg-white/[0.05] rounded w-3/4 mb-1.5" />
                  <div className="h-3 bg-white/[0.04] rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : pagedGames.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {pagedGames.map((game) => {
                const isMonitored = radarAppIds.has(game.appid);
                const hoursPlayed = Math.round((game.playtime_forever ?? 0) / 60);
                const steamUrl = sanitizeUrl(
                  `https://store.steampowered.com/app/${encodeURIComponent(
                    String(game.appid)
                  )}`
                );

                return (
                  <div
                    key={game.appid}
                    className={`group bg-[#09090b] border rounded-2xl p-2.5 transition-colors flex flex-col ${
                      isMonitored
                        ? "border-emerald-500/30"
                        : "border-white/[0.06] hover:border-white/[0.12]"
                    }`}
                  >
                    <div className="relative aspect-video mb-2 rounded-xl overflow-hidden bg-[#111113]">
                      <LibraryGameCover
                        appid={game.appid}
                        name={game.name || "Jogo Steam"}
                      />

                      {isMonitored && (
                        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-emerald-500/15 border border-emerald-500/30 rounded text-[9px] font-semibold text-emerald-400 flex items-center gap-1">
                          <Rss className="w-2.5 h-2.5" />
                          <span>Radar</span>
                        </div>
                      )}
                    </div>

                    <h5 className="text-xs font-semibold text-zinc-200 line-clamp-1 mb-1 group-hover:text-white transition-colors">
                      {game.name || `App ${game.appid}`}
                    </h5>

                    <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-auto pt-1">
                      <span className="flex items-center gap-1 tabular-nums">
                        <Clock className="w-3 h-3 text-zinc-600" />
                        {hoursPlayed > 0 ? `${hoursPlayed}h` : "0h"}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => toggleRadar(game)}
                          title={
                            isMonitored
                              ? "Remover do Radar de Notícias"
                              : "Acompanhar notícias deste jogo"
                          }
                          className={`p-1.5 rounded-lg transition-colors ${
                            isMonitored
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                              : "bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          <Rss className="w-3 h-3" />
                        </button>
                        {steamUrl && (
                          <a
                            href={steamUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Abrir na Steam"
                            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<Gamepad2 className="w-5 h-5" />}
              title="Nenhum jogo encontrado"
              description="Tente ajustar o termo de busca ou o filtro selecionado."
            />
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3 sm:px-5 border-t border-white/[0.06] bg-[#09090b]/60 flex items-center justify-between">
            <span className="text-xs text-zinc-500 tabular-nums">
              Página {libraryPage + 1} de {totalPages}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLibraryPage((p) => Math.max(0, p - 1))}
                disabled={libraryPage === 0}
                className="px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] disabled:opacity-30 rounded-xl text-xs font-medium text-zinc-200 transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Anterior
              </button>
              <button
                type="button"
                onClick={() =>
                  setLibraryPage((p) => Math.min(totalPages - 1, p + 1))
                }
                disabled={libraryPage === totalPages - 1}
                className="px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] disabled:opacity-30 rounded-xl text-xs font-medium text-zinc-200 transition-colors flex items-center gap-1"
              >
                Próxima <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
