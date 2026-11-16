"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Gamepad2, Loader2 } from "lucide-react";
import { gamingApi } from "@/lib/api";
import { SurfacePanel } from "@/components/ui/page-shell";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = steamId.trim();
    if (!trimmed) return;
    linkSteamMutation.mutate(trimmed);
  };

  return (
    <SurfacePanel className="text-center py-8 px-4 sm:px-6">
      <div className="w-11 h-11 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-400 mx-auto mb-4">
        <Gamepad2 className="w-5 h-5" />
      </div>
      <h3 className="text-lg font-bold text-white mb-1.5">Conecte sua Steam</h3>
      <p className="text-xs sm:text-sm text-zinc-400 mb-6 max-w-md mx-auto leading-relaxed">
        Vincule sua conta para gerenciar sua biblioteca, acompanhar horas
        jogadas e manter um diário de progresso.
      </p>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto"
      >
        <input
          type="text"
          value={steamId}
          onChange={(e) => setSteamId(e.target.value)}
          placeholder="Steam ID (ex: 76561198...)"
          className="flex-1 bg-[#09090b] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-white/25 transition-colors"
        />
        <button
          type="submit"
          disabled={linkSteamMutation.isPending || !steamId.trim()}
          className="bg-zinc-100 text-zinc-950 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 shrink-0"
        >
          {linkSteamMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Vincular"
          )}
        </button>
      </form>
    </SurfacePanel>
  );
}
