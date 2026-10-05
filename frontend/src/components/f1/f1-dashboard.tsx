"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { F1Widget } from "@/components/f1/f1-widget";
import { f1Api } from "@/lib/api";
import { useF1Weather } from "@/lib/hooks/use-f1-weather";
import {
  Users,
  Flag,
  MapPin,
  Timer,
  Gauge,
  Loader2,
  ShieldHalf,
  Trophy,
  Medal,
  CloudRain,
  ThermometerSun,
  Wind,
  Droplets,
  Newspaper,
  ExternalLink,
} from "lucide-react";

interface F1CircuitInfo {
  name: string;
  location: string;
  laps?: number;
  lengthKm?: number;
  circuitImage?: string;
}
interface F1DriverStanding {
  id: string;
  position: number;
  driverName: string;
  constructorName: string;
  points: number;
  season: number;
  wins?: number;
  driverId?: string;
  code?: string;
  nationality?: string;
}
interface F1ConstructorStanding {
  id: string;
  position: number;
  constructorName: string;
  points: number;
  season: number;
  wins?: number;
  constructorId?: string;
  nationality?: string;
}

const teamColors: Record<string, string> = {
  "Red Bull": "bg-blue-700",
  "Red Bull Racing": "bg-blue-700",
  Ferrari: "bg-red-600",
  Mercedes: "bg-teal-500",
  McLaren: "bg-orange-500",
  "Aston Martin": "bg-emerald-700",
  "Alpine F1 Team": "bg-pink-500",
  Alpine: "bg-pink-500",
  Williams: "bg-blue-500",
  "RB F1 Team": "bg-blue-600",
  Sauber: "bg-green-500",
  "Kick Sauber": "bg-green-500",
  "Haas F1 Team": "bg-zinc-100",
  "Audi": "bg-neutral-600",
  "Cadillac": "bg-yellow-600",
  "Cadillac F1 Team": "bg-yellow-600",
};

const getInitials = (name: string) => {
  const parts = name.split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const formatFileName = (name: string) => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
};

const DriverAvatar = ({ name }: { name: string }) => {
  const [hasError, setHasError] = useState(false);
  const imageUrl = `/f1/drivers/${formatFileName(name)}.png`;

  if (hasError) {
    return (
      <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 mx-2 md:mx-3 shadow-inner backdrop-blur-md">
        <span className="text-sm md:text-xl font-black text-zinc-500 tracking-tighter">
          {getInitials(name)}
        </span>
      </div>
    );
  }

  return (
    <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl border border-white/10 overflow-hidden shrink-0 mx-2 md:mx-3 bg-black/40 shadow-lg group-hover:border-red-500/40 transition-all duration-300">
      <img
        src={imageUrl}
        alt={name}
        onError={() => setHasError(true)}
        className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500"
      />
    </div>
  );
};

const TeamLogo = ({ name, teamColor }: { name: string; teamColor: string }) => {
  const [hasError, setHasError] = useState(false);
  const imageUrl = `/f1/teams/${formatFileName(name)}.png`;

  if (hasError) {
    return (
      <div
        className={`w-5 h-5 rounded-sm ${teamColor} shadow-[0_0_8px_rgba(255,255,255,0.1)] shrink-0`}
      />
    );
  }

  return (
    <div className="w-6 h-6 md:w-7 md:h-7 flex items-center justify-center shrink-0 bg-white/5 rounded-md p-1 border border-white/5">
      <img
        src={imageUrl}
        alt={name}
        onError={() => setHasError(true)}
        className="max-w-full max-h-full object-contain filter drop-shadow-md"
      />
    </div>
  );
};

export function F1Dashboard() {
  const { data: circuitInfo, isLoading: isLoadingCircuit } =
    useQuery<F1CircuitInfo>({
      queryKey: ["f1-circuit-next"],
      queryFn: f1Api.getCircuitInfo,
      staleTime: 1000 * 60 * 30,
    });
  const { data: driverStandings = [], isLoading: isLoadingDrivers } = useQuery<
    F1DriverStanding[]
  >({
    queryKey: ["f1-driver-standings"],
    queryFn: async () => {
      const data = await f1Api.getStandings();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 1000 * 60 * 15,
  });
  const { data: constructorStandings = [], isLoading: isLoadingConstructors } =
    useQuery<F1ConstructorStanding[]>({
      queryKey: ["f1-constructor-standings"],
      queryFn: async () => {
        const data = await f1Api.getConstructorStandings();
        return Array.isArray(data) ? data : [];
      },
      staleTime: 1000 * 60 * 15,
    });
  const { data: podium = [], isLoading: isLoadingPodium } = useQuery({
    queryKey: ["f1-podium-last"],
    queryFn: async () => await f1Api.getLastPodium(),
    staleTime: 1000 * 60 * 10,
  });
  const { data: weather, isLoading: isLoadingWeather } = useF1Weather();
  const { data: news = [], isLoading: isLoadingNews } = useQuery({
    queryKey: ["f1-news"],
    queryFn: async () => await f1Api.getNews(),
    staleTime: 1000 * 60 * 30,
  });

  const season = new Date().getFullYear();
  const maxPoints = driverStandings[0]?.points || 1;

  return (
    <div className="w-full flex flex-col gap-4 md:gap-6">
      {/* LINHA 1: GRID PRINCIPAL */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-6 w-full items-start">
        {/* COLUNA 1: Agenda */}
        <div className="xl:col-span-4 flex flex-col gap-4 md:gap-6 h-auto md:h-[620px]">
          <div className="flex-1 overflow-hidden rounded-3xl flex flex-col min-h-[300px]">
            <F1Widget />
          </div>

          <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-red-500/50 rounded-3xl p-5 md:p-6 shadow-2xl relative overflow-hidden flex flex-col shrink-0 h-auto md:h-[220px] group hover:-translate-y-1 transition-transform duration-300">
            <div className="absolute top-0 left-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity"></div>

            <div className="flex items-center gap-2 mb-2 relative z-10">
              <MapPin className="text-red-500 w-4 h-4" />
              <h2 className="text-base font-bold text-white tracking-tight">
                Próxima Etapa
              </h2>
            </div>

            <div className="flex items-center justify-between relative z-10 mb-4 md:mb-0">
              <div className="flex-1 pr-2">
                {isLoadingCircuit ? (
                  <div className="h-8 w-32 bg-white/5 animate-pulse rounded mb-1"></div>
                ) : (
                  <>
                    <h3 className="text-lg md:text-xl font-bold text-white leading-tight mb-0.5 truncate drop-shadow-md">
                      {circuitInfo?.name || "Circuito TBA"}
                    </h3>
                    <p className="text-[10px] md:text-xs font-medium text-zinc-400 truncate">
                      {circuitInfo?.location || "-"}
                    </p>
                  </>
                )}
              </div>

              <div className="w-16 h-16 md:w-20 md:h-20 bg-black/40 border border-white/10 rounded-xl flex items-center justify-center p-2 shrink-0 shadow-inner group-hover:border-red-500/30 transition-colors">
                {isLoadingCircuit ? (
                  <Loader2 className="w-5 h-5 animate-spin text-zinc-700" />
                ) : circuitInfo?.circuitImage ? (
                  <img
                    src={circuitInfo.circuitImage}
                    alt="Traçado"
                    className="w-full h-full object-contain filter invert opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                ) : (
                  <Flag className="text-zinc-700 w-6 h-6" />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-auto relative z-10">
              <div className="bg-black/40 border border-white/5 rounded-xl p-3 shadow-sm">
                <p className="text-zinc-500 text-[9px] md:text-[10px] uppercase font-bold mb-1 flex items-center gap-1.5">
                  <Timer className="w-3 h-3 md:w-3.5 md:h-3.5" /> Voltas
                </p>
                <p className="font-mono text-xs md:text-sm font-bold text-zinc-100">
                  {circuitInfo?.laps ?? "TBA"}
                </p>
              </div>
              <div className="bg-black/40 border border-white/5 rounded-xl p-3 shadow-sm">
                <p className="text-zinc-500 text-[9px] md:text-[10px] uppercase font-bold mb-1 flex items-center gap-1.5">
                  <Gauge className="w-3 h-3 md:w-3.5 md:h-3.5" /> Extensão
                </p>
                <p className="font-mono text-xs md:text-sm font-bold text-zinc-100">
                  {circuitInfo?.lengthKm
                    ? `${circuitInfo.lengthKm.toFixed(3)}km`
                    : "TBA"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA 2: Classificação de Pilotos */}
        <div className="xl:col-span-4 bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-red-500/50 rounded-3xl p-4 md:p-7 shadow-2xl relative overflow-hidden flex flex-col max-h-[420px] md:max-h-none md:h-[620px] group hover:-translate-y-1 transition-transform duration-300">
          <div className="absolute -top-24 -right-16 w-64 h-64 bg-red-500/10 blur-[80px] rounded-full pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity" />
          <Users
            className="absolute -bottom-10 -right-10 w-48 h-48 text-white opacity-[0.015] pointer-events-none -rotate-12"
            strokeWidth={1}
          />

          <div className="flex items-center justify-between mb-5 relative z-10">
            <div className="flex items-center gap-2">
              <Users className="text-red-500 w-4 h-4 md:w-5 md:h-5" />
              <h2 className="text-base md:text-lg font-bold text-white tracking-tight">
                Pilotos
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] md:text-[10px] uppercase tracking-[0.16em] text-red-400 font-bold bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20 shadow-sm">
                {season}
              </span>
            </div>
          </div>

          <div className="relative z-10 flex-grow overflow-y-auto pr-1 md:pr-2 space-y-2 md:space-y-3 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {isLoadingDrivers ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-red-500/60" />
              </div>
            ) : driverStandings.length > 0 ? (
              driverStandings.map((driver) => {
                const teamColor =
                  teamColors[driver.constructorName] || "bg-zinc-600";
                return (
                  <div
                    key={driver.id}
                    className="group/driver relative flex items-center justify-between p-2 rounded-2xl border border-white/5 bg-black/40 hover:bg-white/[0.04] hover:border-white/10 transition-all overflow-hidden h-[70px] md:h-[80px] shadow-sm"
                  >
                    <div
                      className={`absolute left-0 top-0 bottom-0 ${teamColor} opacity-[0.05] transition-all group-hover/driver:opacity-[0.15]`}
                      style={{ width: `${(driver.points / maxPoints) * 100}%` }}
                    />
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1.5 ${teamColor} opacity-80 rounded-l-2xl shadow-[0_0_8px_currentColor]`}
                    />

                    <div className="flex items-center relative z-10 pl-2 md:pl-3">
                      <span className="font-mono text-zinc-500 text-xs md:text-sm w-5 md:w-6 font-bold text-center group-hover/driver:text-white transition-colors">
                        {driver.position}
                      </span>
                      <DriverAvatar name={driver.driverName} />
                      <div className="flex flex-col">
                        <span className="font-extrabold text-zinc-100 text-xs md:text-sm leading-tight group-hover/driver:text-white transition-colors">
                          {driver.driverName}
                        </span>
                        <span className="text-zinc-500 text-[9px] md:text-[10px] uppercase tracking-widest leading-tight mt-0.5 md:mt-1 font-semibold">
                          {driver.constructorName}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 relative z-10 mr-1">
                      {driver.wins !== undefined && driver.wins > 0 && (
                        <span className="flex items-center gap-0.5 text-[9px] md:text-[10px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded-lg shadow-sm">
                          <Trophy className="w-2.5 h-2.5 text-amber-400 shrink-0" /> {driver.wins}
                        </span>
                      )}
                      <span className="font-mono text-zinc-100 text-xs md:text-sm font-black bg-[#09090b]/80 px-2 md:px-3 py-1 md:py-1.5 rounded-xl border border-white/5 shadow-md drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">
                        {driver.points}{" "}
                        <span className="text-[9px] md:text-[10px] text-zinc-500 font-normal">
                          pts
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-zinc-500">
                Classificação indisponível
              </div>
            )}
          </div>
        </div>

        {/* COLUNA 3: Construtores */}
        <div className="xl:col-span-4 bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-red-500/50 rounded-3xl p-4 md:p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[400px] md:max-h-none md:h-[620px] group hover:-translate-y-1 transition-transform duration-300">
          <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/5 rounded-full blur-[80px] pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />
          <ShieldHalf
            className="absolute -bottom-10 -right-10 w-48 h-48 text-white opacity-[0.015] pointer-events-none -rotate-12"
            strokeWidth={1}
          />

          <div className="flex items-center justify-between mb-5 relative z-10">
            <div className="flex items-center gap-2">
              <ShieldHalf className="text-red-500 w-4 h-4 md:w-5 md:h-5" />
              <h2 className="text-base md:text-lg font-bold text-white tracking-tight">
                Equipes
              </h2>
            </div>
          </div>

          <div className="relative z-10 flex-grow overflow-y-auto pr-1 md:pr-2 space-y-2 md:space-y-3 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {isLoadingConstructors ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-red-500/60" />
              </div>
            ) : constructorStandings.length > 0 ? (
              constructorStandings.map((team) => {
                const teamColor =
                  teamColors[team.constructorName] || "bg-zinc-600";
                return (
                  <div
                    key={team.id}
                    className="group/team flex items-center justify-between bg-black/40 border border-white/5 rounded-2xl p-3 md:p-3.5 hover:bg-white/[0.04] hover:border-white/10 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-3 md:gap-4">
                      <span className="font-mono text-zinc-500 text-[10px] md:text-xs font-bold w-4 md:w-5 text-center group-hover/team:text-zinc-300">
                        {team.position}
                      </span>
                      <TeamLogo
                        name={team.constructorName}
                        teamColor={teamColor}
                      />
                      <span className="font-bold text-zinc-200 text-xs md:text-sm group-hover/team:text-white transition-colors">
                        {team.constructorName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 relative z-10">
                      {team.wins !== undefined && team.wins > 0 && (
                        <span className="flex items-center gap-0.5 text-[9px] md:text-[10px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded-lg shadow-sm">
                          <Trophy className="w-2.5 h-2.5 text-amber-400 shrink-0" /> {team.wins}
                        </span>
                      )}
                      <span className="font-mono text-zinc-200 text-[10px] md:text-xs font-bold bg-[#09090b]/80 px-2 py-1 rounded-lg border border-white/5 shadow-sm">
                        {team.points} pts
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-zinc-500">
                Dados indisponíveis
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LINHA 2: GRID SECUNDÁRIO (Pódio, Clima, Notícias) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-6 w-full">
        {/* Pódio da Última Corrida */}
        <div className="xl:col-span-4 bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-yellow-500/50 rounded-3xl p-5 md:p-6 shadow-2xl relative overflow-hidden flex flex-col h-auto min-h-[250px] group hover:-translate-y-1 transition-transform duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-[60px] pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />
          <Trophy
            className="absolute -bottom-6 -right-6 w-32 h-32 text-white opacity-[0.02] pointer-events-none -rotate-12"
            strokeWidth={1}
          />

          <div className="flex items-center gap-2 mb-4 md:mb-5 relative z-10">
            <Trophy className="text-yellow-500 w-4 h-4 md:w-5 md:h-5" />
            <h2 className="text-base md:text-lg font-bold text-white tracking-tight">
              Último Pódio
            </h2>
          </div>

          <div className="flex flex-col gap-2 md:gap-3 flex-grow justify-center relative z-10">
            {isLoadingPodium ? (
              <div className="flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-yellow-500/50" />
              </div>
            ) : podium.length > 0 ? (
              podium.map((driver: any, index: number) => {
                const teamColor =
                  teamColors[driver.constructorName] || "bg-zinc-600";
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-black/40 hover:bg-black/60 border border-white/5 p-2.5 md:p-3 rounded-xl relative overflow-hidden transition-colors shadow-sm"
                  >
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 ${teamColor} opacity-80 shadow-[0_0_8px_currentColor]`}
                    />
                    <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-3">
                      {index === 0 && (
                        <Trophy className="w-3.5 h-3.5 md:w-4 md:h-4 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                      )}
                      {index === 1 && (
                        <Medal className="w-3.5 h-3.5 md:w-4 md:h-4 text-zinc-300 drop-shadow-md" />
                      )}
                      {index === 2 && (
                        <Medal className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-600 drop-shadow-md" />
                      )}
                      <div>
                        <p className="font-bold text-xs md:text-sm text-zinc-100 leading-none mb-1 md:mb-1.5">
                          {driver.driverName}
                        </p>
                        <p className="text-[9px] md:text-[10px] text-zinc-500 font-semibold uppercase tracking-wider leading-none">
                          {driver.constructorName}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] md:text-xs font-bold text-zinc-400 bg-[#09090b]/80 border border-white/5 px-2 py-1 rounded-md shadow-inner">
                      {driver.time}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-xs text-zinc-500">
                Dados do pódio indisponíveis
              </p>
            )}
          </div>
        </div>

        {/* Clima do Circuito Ao Vivo */}
        <div className="xl:col-span-4 bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-red-500/50 rounded-3xl p-5 md:p-6 shadow-2xl relative overflow-hidden flex flex-col h-auto min-h-[250px] group hover:-translate-y-1 transition-transform duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-[60px] pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />
          <CloudRain
            className="absolute -bottom-6 -right-6 w-32 h-32 text-white opacity-[0.015] pointer-events-none -rotate-12"
            strokeWidth={1}
          />

          <div className="flex items-center justify-between mb-4 md:mb-5 relative z-10">
            <div className="flex items-center gap-2">
              <CloudRain className="text-sky-400 w-4 h-4 md:w-5 md:h-5" />
              <h2 className="text-base md:text-lg font-bold text-white tracking-tight">
                Clima da Pista
              </h2>
            </div>
            {weather?.airTemperature &&
              (weather.isLive ? (
                <div className="flex items-center gap-1.5 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,1)]"></div>
                  <span className="text-[8px] md:text-[9px] uppercase tracking-widest text-red-400 font-bold">
                    Ao Vivo
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-full border border-white/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-500"></div>
                  <span className="text-[8px] md:text-[9px] uppercase tracking-widest text-zinc-400 font-bold">
                    Último Registro
                  </span>
                </div>
              ))}
          </div>

          <div className="flex-grow flex items-center justify-center relative z-10">
            {isLoadingWeather ? (
              <Loader2 className="w-6 h-6 animate-spin text-sky-500/50" />
            ) : weather?.airTemperature ? (
              <div
                className={`grid grid-cols-3 gap-2 md:gap-3 w-full h-full transition-opacity ${!weather.isLive ? "opacity-70 grayscale-[20%]" : ""}`}
              >
                {/* Coluna 1: Ar e Pista */}
                <div className="bg-black/40 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-1.5 md:gap-2 p-2 md:p-3 shadow-inner hover:bg-white/[0.02] transition-colors">
                  <ThermometerSun
                    className={`w-5 h-5 md:w-7 md:h-7 ${weather.isLive ? "text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.4)]" : "text-zinc-500"}`}
                  />
                  <span className="text-[8px] md:text-[9px] text-zinc-500 uppercase font-bold tracking-wider text-center">
                    Ar / Pista
                  </span>
                  <div className="flex items-baseline gap-0.5 font-mono">
                    <span className="text-sm md:text-lg text-white font-black drop-shadow-md">
                      {weather.airTemperature}°
                    </span>
                    <span className="text-[8px] md:text-[10px] text-zinc-400 font-bold">
                      /{weather.trackTemperature}°
                    </span>
                  </div>
                </div>

                {/* Coluna 2: Chuva e Humidade */}
                <div className="bg-black/40 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-1.5 md:gap-2 p-2 md:p-3 shadow-inner hover:bg-white/[0.02] transition-colors">
                  <Droplets
                    className={`w-5 h-5 md:w-7 md:h-7 ${weather.isLive ? "text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]" : "text-zinc-500"}`}
                  />
                  <span className="text-[8px] md:text-[9px] text-zinc-500 uppercase font-bold tracking-wider text-center">
                    Chuva / Humid
                  </span>
                  <div className="flex items-baseline gap-0.5 font-mono">
                    <span className="text-sm md:text-lg text-white font-black drop-shadow-md">
                      {weather.rainfall > 0 ? "Sim" : "Não"}
                    </span>
                    <span className="text-[8px] md:text-[10px] text-zinc-400 font-bold">
                      /{weather.humidity}%
                    </span>
                  </div>
                </div>

                {/* Coluna 3: Vento */}
                <div className="bg-black/40 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-1.5 md:gap-2 p-2 md:p-3 shadow-inner hover:bg-white/[0.02] transition-colors">
                  <Wind
                    className={`w-5 h-5 md:w-7 md:h-7 ${weather.isLive ? "text-teal-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.4)]" : "text-zinc-500"}`}
                  />
                  <span className="text-[8px] md:text-[9px] text-zinc-500 uppercase font-bold tracking-wider text-center">
                    Vento
                  </span>
                  <div className="flex items-baseline gap-0.5 font-mono">
                    <span className="text-sm md:text-lg text-white font-black drop-shadow-md">
                      {weather.windSpeed}
                    </span>
                    <span className="text-[8px] md:text-[10px] text-zinc-400 font-bold">
                      m/s
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-xs text-zinc-500">
                Telemetria climática offline
              </p>
            )}
          </div>
        </div>

        {/* Radar de Notícias F1 */}
        <div className="xl:col-span-4 bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-red-500/50 rounded-3xl p-4 md:p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[360px] md:max-h-none md:h-[280px] group hover:-translate-y-1 transition-transform duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-[60px] pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />
          <Newspaper
            className="absolute -bottom-6 -right-6 w-32 h-32 text-white opacity-[0.015] pointer-events-none -rotate-12"
            strokeWidth={1}
          />

          <div className="flex items-center gap-2 mb-4 relative z-10">
            <Newspaper className="text-red-400 w-4 h-4 md:w-5 md:h-5" />
            <h2 className="text-base md:text-lg font-bold text-white tracking-tight">
              Radar F1
            </h2>
          </div>

          <div className="relative z-10 flex-grow overflow-y-auto pr-1 md:pr-2 space-y-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {isLoadingNews ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-red-500/50" />
              </div>
            ) : news.length > 0 ? (
              news.map((item: any, i: number) => (
                <a
                  key={i}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/news flex flex-col py-2.5 px-3 md:py-3 md:px-4 bg-black/20 hover:bg-black/40 rounded-xl transition-all border border-white/5 hover:border-red-500/30 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-[11px] md:text-xs font-bold text-zinc-300 leading-snug line-clamp-2 group-hover/news:text-red-400 transition-colors">
                      {item.title}
                    </h4>
                    <ExternalLink className="w-3 h-3 md:w-3.5 md:h-3.5 text-zinc-600 group-hover/news:text-red-400 shrink-0 transition-colors mt-0.5 opacity-0 group-hover/news:opacity-100 md:-translate-x-2 md:group-hover/news:translate-x-0" />
                  </div>
                  <span className="text-[8px] md:text-[9px] text-zinc-500 font-bold mt-1.5 md:mt-2 uppercase tracking-wider">
                    {new Date(item.pubDate).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                    })}
                  </span>
                </a>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-zinc-500">
                Sem notícias recentes
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
