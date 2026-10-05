"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Rss,
  Search,
} from "lucide-react";
import { gamingApi } from "@/lib/api";

const PAGE_SIZE = 15;

export function SteamLibraryGrid() {
  const queryClient = useQueryClient();
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryPage, setLibraryPage] = useState(0);

  const { data: profile } = useQuery({
    queryKey: ["steam-profile"],
    queryFn: gamingApi.getSteamProfile,
    retry: false,
  });

  const { data: library } = useQuery({
    queryKey: ["steam-library"],
    queryFn: gamingApi.getSteamLibrary,
    enabled: !!profile,
  });

  const { data: radarGames = [] } = useQuery({
    queryKey: ["gaming-preferences"],
    queryFn: gamingApi.getTrackedGames,
    enabled: !!profile,
  });

  const { data: journal = [] } = useQuery({
    queryKey: ["gaming-journal"],
    queryFn: gamingApi.getJournal,
    enabled: !!profile,
  });

  const updateJournalMutation = useMutation({
    mutationFn: gamingApi.updateJournal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gaming-journal"] });
      toast.success("Adicionado à fila!");
    },
  });

  const addRadarMutation = useMutation({
    mutationFn: (game: { game: string; steamAppId: number }) =>
      gamingApi.addTrackedGame(game),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gaming-preferences"] });
      toast.success("Jogo adicionado ao Radar Steam!");
    },
  });

  const removeRadarMutation = useMutation({
    mutationFn: (id: string) => gamingApi.deleteTrackedGame(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gaming-preferences"] });
      toast.success("Removido do Radar Steam.");
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
    const q = librarySearch.toLowerCase();
    return q
      ? allGames.filter((g: any) => g.name.toLowerCase().includes(q))
      : allGames;
  }, [allGames, librarySearch]);

  const totalPages = Math.ceil(filteredGames.length / PAGE_SIZE);
  const pagedGames = filteredGames.slice(
    libraryPage * PAGE_SIZE,
    (libraryPage + 1) * PAGE_SIZE
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={librarySearch}
            onChange={(e) => {
              setLibrarySearch(e.target.value);
              setLibraryPage(0);
            }}
            placeholder="Buscar jogo..."
            className="w-full bg-black/40 border border-white/10 focus:border-blue-500/50 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none transition-colors"
          />
        </div>
        <span className="text-xs text-zinc-500">
          {filteredGames.length} jogos
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {pagedGames.map((game: any) => {
          const isMonitored = radarAppIds.has(game.appid);
          const journalGame = (journal as any[]).find(
            (jg: any) => Number(jg.appId) === Number(game.appid)
          );
          
          const statusBadgeMap: Record<string, { label: string; style: string }> = {
            PLAYING: { label: "Jogando 🎮", style: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
            COMPLETED: { label: "Finalizado 🏆", style: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
            ON_HOLD: { label: "Pausado ⏳", style: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
            ABANDONED: { label: "Abandonado ❌", style: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
            PLANNING_TO_PLAY: { label: "Fila 📋", style: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
          };

          return (
            <div
              key={game.appid}
              className={`group bg-[#121214]/40 border rounded-2xl p-3 transition-all hover:-translate-y-1 ${
                isMonitored
                  ? "border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                  : "border-white/5 hover:border-blue-500/30"
              }`}
            >
              <div className="relative aspect-video mb-3 rounded-xl overflow-hidden shadow-lg">
                <img
                  src={`https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/header.jpg`}
                  alt={game.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 gap-1">
                  <button
                    onClick={() =>
                      updateJournalMutation.mutate({
                        appId: game.appid,
                        name: game.name,
                        status: "PLANNING_TO_PLAY",
                      })
                    }
                    className="flex-1 bg-blue-600 text-[10px] font-bold py-1.5 rounded-lg text-white"
                  >
                    + FILA
                  </button>
                  <button
                    onClick={() => toggleRadar(game)}
                    title={
                      isMonitored
                        ? "Remover do Radar"
                        : "Adicionar ao Radar Steam"
                    }
                    className={`p-1.5 rounded-lg transition-colors ${
                      isMonitored
                        ? "bg-blue-500/30 text-blue-400"
                        : "bg-black/60 text-zinc-400 hover:text-blue-400"
                    }`}
                  >
                    <Rss className="w-3.5 h-3.5" />
                  </button>
                </div>
                {isMonitored && (
                  <div className="absolute top-2 left-2 p-1 bg-blue-500/80 rounded-md backdrop-blur-sm">
                    <Rss className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
                {journalGame && (
                  <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border backdrop-blur-md ${statusBadgeMap[journalGame.status]?.style || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"}`}>
                    {statusBadgeMap[journalGame.status]?.label || journalGame.status}
                  </div>
                )}
              </div>
              <h5 className="text-xs font-bold text-zinc-200 line-clamp-1 mb-1 group-hover:text-blue-400 transition-colors">
                {game.name}
              </h5>
              {journalGame?.rating && (
                <div className="text-[9px] text-amber-400 mb-1.5 font-bold flex items-center gap-0.5">
                  {"★".repeat(journalGame.rating)}
                  {"☆".repeat(5 - journalGame.rating)}
                </div>
              )}
              <div className="flex items-center justify-between text-[10px] text-zinc-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {Math.round((game.playtime_forever ?? 0) / 60)}h
                </span>
                <span className="font-mono bg-white/5 px-1.5 rounded">
                  ID: {game.appid}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setLibraryPage((p) => Math.max(0, p - 1))}
            disabled={libraryPage === 0}
            className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-xl transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-zinc-300" />
          </button>
          <span className="text-xs text-zinc-400">
            {libraryPage + 1} / {totalPages}
          </span>
          <button
            onClick={() =>
              setLibraryPage((p) => Math.min(totalPages - 1, p + 1))
            }
            disabled={libraryPage === totalPages - 1}
            className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-xl transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-zinc-300" />
          </button>
        </div>
      )}
    </div>
  );
}
