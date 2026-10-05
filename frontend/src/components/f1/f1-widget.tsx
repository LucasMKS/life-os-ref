"use client";

import { useQuery } from "@tanstack/react-query";
import { Trophy, Calendar, Loader2, Clock } from "lucide-react";
import { f1Api } from "@/lib/api";

interface F1Session {
  id: string;
  name: string;
  meetingName?: string;
  date: string;
  status: "agendado" | "ao vivo" | "finalizado" | string;
}

export function F1Widget() {
  const { data: sessions = [], isLoading } = useQuery<F1Session[]>({
    queryKey: ["f1-next-sessions"],
    queryFn: f1Api.getNextSessions,
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
    return session.name.includes(" - ")
      ? session.name.split(" - ")[0]
      : "Fórmula 1";
  };

  const getSessionName = (session: F1Session) => {
    return session.name.includes(" - ")
      ? session.name.split(" - ")[1]
      : session.name;
  };

  return (
    <div className="relative bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-red-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-full group hover:-translate-y-1 transition-transform duration-300">
      {/* Glow e Watermark do Circuito */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-red-600/10 rounded-full blur-[80px] pointer-events-none -ml-20 -mt-20 transition-opacity group-hover:opacity-100 opacity-60"></div>

      {circuitInfo?.circuitImage ? (
        <img
          src={circuitInfo.circuitImage}
          alt="F1 Track Watermark"
          className="absolute -right-10 top-1/2 -translate-y-1/2 w-80 h-80 opacity-[0.03] pointer-events-none object-contain invert -rotate-12"
        />
      ) : (
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/5/5c/Circuit_Interlagos.svg"
          alt="F1 Track Watermark"
          className="absolute -right-10 top-1/2 -translate-y-1/2 w-80 h-80 opacity-[0.03] pointer-events-none object-contain invert -rotate-12"
        />
      )}

      <div className="p-5 md:p-6 lg:p-8 flex flex-col flex-grow relative z-10">
        <div className="mb-6 md:mb-8">
          <h3 className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-3 md:mb-4 flex items-center gap-2 truncate">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            {isLoading || !nextSession
              ? "Próxima Sessão"
              : `Próxima Sessão • ${getMeetingName(nextSession)}`}
          </h3>

          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-red-500/50" />
            </div>
          ) : nextSession ? (
            <div className="space-y-3 md:space-y-4">
              <h4 className="text-2xl md:text-3xl font-bold text-white leading-tight drop-shadow-md">
                {getSessionName(nextSession)}
              </h4>
              <div className="flex flex-wrap items-center gap-2 md:gap-3 pt-1">
                <div className="inline-flex items-center gap-1.5 bg-black/40 text-zinc-300 border border-white/10 px-2.5 py-1 md:px-3 md:py-1.5 rounded-xl text-xs md:text-sm font-bold shadow-inner">
                  <Clock className="w-3.5 h-3.5 text-red-400" />
                  {new Date(nextSession.date + "Z").toLocaleString("pt-BR", {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div
                  className={`px-2.5 py-1 md:px-3 md:py-1.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                    nextSession.status === "ao vivo" ||
                    nextSession.status === "live"
                      ? "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                      : "bg-white/5 text-zinc-400 border-transparent"
                  }`}
                >
                  {nextSession.status === "live"
                    ? "Ao Vivo"
                    : nextSession.status}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-zinc-500 text-sm font-medium bg-black/20 p-4 rounded-xl border border-dashed border-white/10 text-center">
              Nenhuma corrida programada
            </div>
          )}
        </div>

        <hr className="border-white/5 mb-5 md:mb-6" />

        <div className="flex-grow flex flex-col">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 md:mb-4 flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5 opacity-70" /> Calendário da Etapa
          </h3>

          <div className="overflow-y-auto pr-2 md:pr-3 space-y-2 max-h-[220px] scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {upcomingSessions.map((session) => (
              <div
                key={session.id}
                className="group/session flex items-center justify-between p-3 md:p-3.5 bg-black/20 hover:bg-black/40 rounded-2xl transition-all cursor-default border border-white/5 hover:border-red-500/30 shadow-sm"
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover/session:bg-red-500 transition-colors shadow-[0_0_8px_rgba(239,68,68,0)] group-hover/session:shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                  <div>
                    <div className="font-bold text-zinc-300 text-xs md:text-sm group-hover/session:text-red-400 transition-colors leading-tight mb-1">
                      {getSessionName(session)}
                    </div>
                    <div className="text-[10px] md:text-xs font-semibold text-zinc-500">
                      {new Date(session.date + "Z").toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
