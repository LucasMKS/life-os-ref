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

interface SteamLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PAGE_SIZE = 20;

export function SteamLibraryModal({ isOpen, onClose }: SteamLibraryModalProps) {
  const queryClient = useQueryClient();
  const [librarySearch, setLibrarySearch] = useState("");
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

  const { data: radarGames = [] } = useQuery({
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
    () => new Set((radarGames as any[]).map((g) => g.steamAppId)),
    [radarGames]
  );

  const toggleRadar = (game: any) => {
    const existing = (radarGames as any[]).find(
      (g) => g.steamAppId === game.appid
    );
    if (existing) {
      removeRadarMutation.mutate(existing.id);
    } else {
      addRadarMutation.mutate({ game: game.name, steamAppId: game.appid });
    }
  };

  const allGames = useMemo(
    () =>
      (library?.response?.games ?? [])
        .slice()
        .sort(
          (a: any, b: any) =>
            (b.playtime_forever ?? 0) - (a.playtime_forever ?? 0)
        ),
    [library]
  );

  const filteredGames = useMemo(() => {
    const q = librarySearch.toLowerCase().trim();
    return q
      ? allGames.filter((g: any) => g.name.toLowerCase().includes(q))
      : allGames;
  }, [allGames, librarySearch]);

  const totalPages = Math.ceil(filteredGames.length / PAGE_SIZE);
  const pagedGames = filteredGames.slice(
    libraryPage * PAGE_SIZE,
    (libraryPage + 1) * PAGE_SIZE
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 md:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-5xl bg-[#0e0e11] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 z-10">
        {/* Glow Superior Suave */}
        <div className="absolute top-0 right-1/4 w-96 h-40 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Header do Modal */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/5 relative z-10 bg-black/40 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Biblioteca Steam
                <span className="text-xs font-normal text-zinc-400">
                  ({library?.response?.game_count || 0} jogos)
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Pesquise seus títulos e selecione os jogos para acompanhar atualizações.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Busca e Filtros */}
        <div className="p-4 sm:p-6 pb-2 border-b border-white/5 bg-black/20 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={librarySearch}
              onChange={(e) => {
                setLibrarySearch(e.target.value);
                setLibraryPage(0);
              }}
              placeholder="Buscar jogo na biblioteca..."
              className="w-full bg-black/50 border border-white/10 focus:border-blue-500/50 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-zinc-600 focus:outline-none transition-colors"
              autoFocus
            />
          </div>

          <div className="text-xs text-zinc-400 flex items-center gap-2">
            <span>
              Mostrando <strong className="text-white">{filteredGames.length}</strong> de {allGames.length}
            </span>
          </div>
        </div>

        {/* Grid de Jogos com Scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {Array.from({ length: 10 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-[#121214]/40 border border-white/5 rounded-2xl p-2.5 animate-pulse"
                >
                  <div className="aspect-video bg-white/5 rounded-xl mb-2" />
                  <div className="h-4 bg-white/5 rounded w-3/4 mb-1" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : pagedGames.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {pagedGames.map((game: any) => {
                const isMonitored = radarAppIds.has(game.appid);
                const hoursPlayed = Math.round((game.playtime_forever ?? 0) / 60);

                return (
                  <div
                    key={game.appid}
                    className={`group bg-[#121214]/60 border rounded-2xl p-2.5 transition-all hover:bg-white/[0.03] ${
                      isMonitored
                        ? "border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.12)]"
                        : "border-white/5 hover:border-white/15"
                    }`}
                  >
                    <div className="relative aspect-video mb-2.5 rounded-xl overflow-hidden bg-black/60 shadow-md">
                      <img
                        src={`https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/header.jpg`}
                        alt={game.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                        onError={(e: any) => {
                          e.target.style.display = "none";
                        }}
                      />

                      {/* Overlay com Ações */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                        <button
                          onClick={() => toggleRadar(game)}
                          title={
                            isMonitored
                              ? "Remover do Radar de Notícias"
                              : "Acompanhar notícias deste jogo"
                          }
                          className={`p-2 rounded-xl transition-all ${
                            isMonitored
                              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                              : "bg-white/10 hover:bg-white/20 text-white"
                          }`}
                        >
                          <Rss className="w-4 h-4" />
                        </button>
                        <a
                          href={`https://store.steampowered.com/app/${game.appid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Abrir na Steam"
                          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>

                      {/* Badge se já está no Radar */}
                      {isMonitored && (
                        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-blue-600/90 rounded text-[9px] font-bold text-white flex items-center gap-1 shadow-md">
                          <Rss className="w-2.5 h-2.5" />
                          <span>Radar</span>
                        </div>
                      )}
                    </div>

                    <h5 className="text-xs font-semibold text-zinc-200 line-clamp-1 mb-1 group-hover:text-white transition-colors">
                      {game.name}
                    </h5>

                    <div className="flex items-center justify-between text-[10px] text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-600" />
                        {hoursPlayed > 0 ? `${hoursPlayed}h jogadas` : "Não jogado"}
                      </span>
                      <span className="font-mono text-[9px] text-zinc-600">
                        {game.appid}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center">
              <Gamepad2 className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm font-medium text-zinc-400">
                Nenhum jogo encontrado com esse termo.
              </p>
            </div>
          )}
        </div>

        {/* Footer com Paginação */}
        {totalPages > 1 && (
          <div className="p-3 sm:p-4 border-t border-white/5 bg-black/40 flex items-center justify-between relative z-10">
            <span className="text-xs text-zinc-500">
              Página {libraryPage + 1} de {totalPages}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setLibraryPage((p) => Math.max(0, p - 1))}
                disabled={libraryPage === 0}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-xl text-xs font-semibold text-zinc-300 transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Anterior
              </button>
              <button
                onClick={() => setLibraryPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={libraryPage === totalPages - 1}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-xl text-xs font-semibold text-zinc-300 transition-colors flex items-center gap-1"
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
