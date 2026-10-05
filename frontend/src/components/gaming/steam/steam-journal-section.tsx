"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Play, Star } from "lucide-react";
import { gamingApi } from "@/lib/api";
import { JournalCard } from "./journal-card";

export function SteamJournalSection() {
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["steam-profile"],
    queryFn: gamingApi.getSteamProfile,
    retry: false,
  });

  const { data: journal } = useQuery({
    queryKey: ["gaming-journal"],
    queryFn: gamingApi.getJournal,
    enabled: !!profile,
  });

  const updateJournalMutation = useMutation({
    mutationFn: gamingApi.updateJournal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gaming-journal"] });
      toast.success("Progresso salvo!");
    },
  });

  const deleteJournalMutation = useMutation({
    mutationFn: gamingApi.deleteFromJournal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gaming-journal"] });
      toast.success("Jogo removido do diário.");
    },
  });

  const queue = (journal ?? []).filter(
    (g: any) => g.status === "PLANNING_TO_PLAY"
  );
  const tracked = (journal ?? []).filter(
    (g: any) => g.status !== "PLANNING_TO_PLAY"
  );

  return (
    <div className="space-y-6 max-h-[680px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
      <div className="bg-[#121214]/60 border border-white/5 rounded-3xl p-6">
        <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> Próximos
          na Fila
        </h4>
        {queue.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {queue.map((game: any) => (
              <div
                key={game.id}
                className="flex items-center gap-4 bg-black/40 p-3 rounded-2xl border border-white/5"
              >
                <img
                  src={`https://cdn.akamai.steamstatic.com/steam/apps/${game.appId}/header.jpg`}
                  className="w-20 h-10 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {game.name}
                  </p>
                </div>
                <button
                  onClick={() =>
                    updateJournalMutation.mutate({
                      appId: game.appId,
                      name: game.name,
                      status: "PLAYING",
                    })
                  }
                  className="p-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                >
                  <Play className="w-4 h-4 fill-green-400" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-500">
            Nenhum jogo na fila. Adicione na biblioteca usando &quot;+ FILA&quot;.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tracked.map((game: any) => (
          <JournalCard
            key={game.id}
            game={game}
            onUpdate={(patch) =>
              updateJournalMutation.mutate({
                appId: game.appId,
                name: game.name,
                ...patch,
              })
            }
            onDelete={() => deleteJournalMutation.mutate(game.appId)}
          />
        ))}
      </div>
    </div>
  );
}
