"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Calendar, Loader2, Clock } from "lucide-react";
import { f1Api } from "@/lib/api";
import { sanitizeUrl } from "@/lib/security";

interface F1Session {
  id: string;
  name: string;
  meetingName?: string;
  date: string;
  status: "agendado" | "ao vivo" | "finalizado" | string;
}

const DEFAULT_TRACK_IMAGE =
  "https://upload.wikimedia.org/wikipedia/commons/5/5c/Circuit_Interlagos.svg";

function formatSessionDate(dateStr?: string, withWeekday = false): string {
  if (!dateStr) return "TBA";
  const normalized = dateStr.endsWith("Z") ? dateStr : `${dateStr}Z`;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return "TBA";

  return parsed.toLocaleString("pt-BR", {
    ...(withWeekday ? { weekday: "short" } : {}),
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function F1Widget() {
  const [watermarkError, setWatermarkError] = useState(false);

  const { data: sessions = [], isLoading } = useQuery<F1Session[]>({
    queryKey: ["f1-next-sessions"],
    queryFn: async () => {
      const data = await f1Api.getNextSessions();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 1000 * 60 * 2,
  });

  const { data: circuitInfo } = useQuery({
    queryKey: ["f1-circuit-next"],
    queryFn: f1Api.getCircuitInfo,
    staleTime: 1000 * 60 * 30,
  });

  const nextSession = sessions[0];
  const upcomingSessions = sessions.slice(1);

  const getMeetingName = (session: F1Session) => {
    if (session.meetingName) return session.meetingName;
    const name = session.name || "";
    return name.includes(" - ") ? name.split(" - ")[0] : "Fórmula 1";
  };

  const getSessionName = (session: F1Session) => {
    const name = session.name || "Sessão";
    return name.includes(" - ") ? name.split(" - ")[1] : name;
  };

  const safeCircuitImage =
    sanitizeUrl(circuitInfo?.circuitImage) || DEFAULT_TRACK_IMAGE;

  const normalizedStatus = (nextSession?.status || "").toLowerCase();
  const isLive = normalizedStatus === "ao vivo" || normalizedStatus === "live";

  return (
    <section className="relative bg-[#111113] border border-white/[0.06] border-t-2 border-t-red-500/70 hover:border-white/[0.12] hover:border-t-red-500/80 transition-colors rounded-2xl overflow-hidden flex flex-col h-full">
      {!watermarkError && (
        <img
          src={safeCircuitImage}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          onError={() => setWatermarkError(true)}
          className="absolute -right-10 top-1/2 -translate-y-1/2 w-64 h-64 opacity-[0.03] pointer-events-none object-contain invert -rotate-12"
        />
      )}

      <div className="p-5 flex flex-col flex-grow relative z-10">
        <div className="mb-5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-[11px] font-semibold text-red-400 uppercase tracking-wider flex items-center gap-2 min-w-0">
              <Calendar className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span className="truncate">
                {isLoading || !nextSession
                  ? "Próxima Sessão"
                  : `Próxima Sessão · ${getMeetingName(nextSession)}`}
              </span>
            </h3>
            {nextSession && (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border shrink-0 ${
                  isLive
                    ? "bg-red-500/10 text-red-400 border-red-500/20"
                    : "bg-white/[0.04] text-zinc-400 border-white/[0.08]"
                }`}
              >
                {isLive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                )}
                {normalizedStatus === "live"
                  ? "Ao Vivo"
                  : nextSession.status || "Agendado"}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
            </div>
          ) : nextSession ? (
            <div className="space-y-2.5">
              <h4 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                {getSessionName(nextSession)}
              </h4>
              <div className="inline-flex items-center gap-1.5 bg-white/[0.04] text-zinc-300 border border-white/[0.08] px-2.5 py-1 rounded-xl text-xs font-medium tabular-nums">
                <Clock className="w-3.5 h-3.5 text-red-400 shrink-0" />
                {formatSessionDate(nextSession.date, true)}
              </div>
            </div>
          ) : (
            <div className="text-zinc-500 text-xs font-medium bg-white/[0.02] p-4 rounded-xl border border-dashed border-white/[0.08] text-center">
              Nenhuma corrida programada
            </div>
          )}
        </div>

        <hr className="border-white/[0.06] mb-4" />

        <div className="flex-grow flex flex-col min-h-0">
          <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5 text-zinc-500" />
            Calendário da Etapa
          </h3>

          {upcomingSessions.length > 0 ? (
            <div className="overflow-y-auto pr-1 space-y-2 max-h-[220px] scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              {upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="group/session flex items-center justify-between gap-3 p-3 bg-white/[0.02] hover:bg-white/[0.04] rounded-xl transition-colors border border-white/[0.06]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 group-hover/session:bg-red-400 transition-colors shrink-0" />
                    <div className="min-w-0">
                      <div className="font-semibold text-zinc-200 text-xs sm:text-sm truncate">
                        {getSessionName(session)}
                      </div>
                      <div className="text-[11px] text-zinc-500 tabular-nums">
                        {formatSessionDate(session.date)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-zinc-500 py-4 text-center">
              Sem outras sessões na etapa
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
