"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Gamepad2, Loader2 } from "lucide-react";
import { gamingApi } from "@/lib/api";

export function SteamLinkPrompt() {
  const queryClient = useQueryClient();
  const [steamId, setSteamId] = useState("");

  const linkSteamMutation = useMutation({
    mutationFn: (id: string) => gamingApi.linkSteamAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["steam-profile"] });
      toast.success("Conta Steam vinculada com sucesso!");
      setSteamId("");
    },
    onError: () => {
      toast.error("Não foi possível vincular a conta Steam.");
    },
  });

  const handleSubmit = () => {
    const trimmed = steamId.trim();
    if (trimmed) linkSteamMutation.mutate(trimmed);
  };

  return (
    <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-blue-500/50 rounded-3xl p-8 text-center">
      <Gamepad2 className="w-12 h-12 text-blue-500 mx-auto mb-4 opacity-50" />
      <h3 className="text-xl font-bold text-white mb-2">Conecte sua Steam</h3>
      <p className="text-zinc-400 mb-6 max-w-md mx-auto">
        Vincule sua conta para gerenciar sua biblioteca, acompanhar horas
        jogadas e manter um diário de progresso.
      </p>
      <div className="flex gap-2 max-w-sm mx-auto">
        <input
          type="text"
          value={steamId}
          onChange={(e) => setSteamId(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          placeholder="Steam ID (ex: 76561198...)"
          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
        />
        <button
          onClick={handleSubmit}
          disabled={linkSteamMutation.isPending || !steamId.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 rounded-xl font-medium transition-colors flex items-center gap-2"
        >
          {linkSteamMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Vincular"
          )}
        </button>
      </div>
    </div>
  );
}
