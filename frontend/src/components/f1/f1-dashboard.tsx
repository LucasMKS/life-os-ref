"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Search,
  Calendar,
  LayoutGrid,
} from "lucide-react";
import { F1Widget } from "@/components/f1/f1-widget";
import { FilterPill, SurfacePanel } from "@/components/ui/page-shell";
import { f1Api } from "@/lib/api";
import { useF1Weather } from "@/lib/hooks/use-f1-weather";
import { sanitizeUrl } from "@/lib/security";

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

interface F1PodiumEntry {
  driverName?: string;
  constructorName?: string;
  time?: string;
}

interface F1NewsItem {
  title?: string;
  link?: string;
  pubDate?: string;
}

type F1Tab = "overview" | "drivers" | "constructors" | "calendar" | "results";

const teamColors: Record<string, string> = {
  "Red Bull": "bg-blue-600",
  "Red Bull Racing": "bg-blue-600",
  Ferrari: "bg-red-600",
  Mercedes: "bg-teal-500",
  McLaren: "bg-orange-500",
  "Aston Martin": "bg-emerald-600",
  "Alpine F1 Team": "bg-pink-500",
  Alpine: "bg-pink-500",
  Williams: "bg-blue-500",
  "RB F1 Team": "bg-indigo-500",
  Sauber: "bg-emerald-500",
  "Kick Sauber": "bg-emerald-500",
  "Haas F1 Team": "bg-zinc-300",
  Audi: "bg-neutral-500",
  Cadillac: "bg-amber-600",
  "Cadillac F1 Team": "bg-amber-600",
};

const getInitials = (name?: string) => {
  const safe = (name || "").trim();
  if (!safe) return "F1";
  const parts = safe.split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return safe.substring(0, 2).toUpperCase();
};

const formatFileName = (name?: string) => {
  return (name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
};

const formatNewsDate = (dateStr?: string) => {
  if (!dateStr) return "";
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
};

const DriverAvatar = ({
  name,
  size = "md",
}: {
  name?: string;
  size?: "sm" | "md";
}) => {
  const [hasError, setHasError] = useState(false);
  const safeName = name || "Piloto";
  const imageUrl = `/f1/drivers/${formatFileName(safeName)}.png`;
  const dims =
    size === "sm"
      ? "w-9 h-9 md:w-10 md:h-10"
      : "w-10 h-10 md:w-12 md:h-12";

  if (hasError || !name) {
    return (
      <div
        className={`${dims} rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center overflow-hidden shrink-0`}
      >
        <span className="text-xs font-bold text-zinc-400 tracking-tight">
          {getInitials(safeName)}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`${dims} rounded-xl border border-white/[0.08] overflow-hidden shrink-0 bg-white/[0.03]`}
    >
      <img
        src={imageUrl}
        alt={safeName}
        loading="lazy"
        decoding="async"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover object-top"
      />
    </div>
  );
};

const TeamLogo = ({
  name,
  teamColor,
}: {
  name?: string;
  teamColor: string;
}) => {
  const [hasError, setHasError] = useState(false);
  const safeName = name || "Equipe";
  const imageUrl = `/f1/teams/${formatFileName(safeName)}.png`;

  if (hasError || !name) {
    return (
      <div
        className={`w-5 h-5 rounded-md ${teamColor} opacity-80 shrink-0`}
      />
    );
  }

  return (
    <div className="w-7 h-7 flex items-center justify-center shrink-0 bg-white/[0.04] rounded-lg p-1 border border-white/[0.06]">
      <img
        src={imageUrl}
        alt={safeName}
        loading="lazy"
        decoding="async"
        onError={() => setHasError(true)}
        className="max-w-full max-h-full object-contain"
      />
    </div>
  );
};

const CircuitPreview = ({
  circuitInfo,
  isLoading,
}: {
  circuitInfo?: F1CircuitInfo;
  isLoading: boolean;
}) => {
  const [imgError, setImgError] = useState(false);
  const safeImageUrl = sanitizeUrl(circuitInfo?.circuitImage);

  return (
    <SurfacePanel
      accent="red"
      title="Próxima Etapa"
      icon={<MapPin className="w-4 h-4 text-red-400" />}
    >
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="min-w-0 flex-1">
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-5 w-40 bg-white/[0.05] animate-pulse rounded-md" />
              <div className="h-3.5 w-24 bg-white/[0.04] animate-pulse rounded-md" />
            </div>
          ) : (
            <>
              <h3 className="text-base sm:text-lg font-bold text-white leading-snug truncate">
                {circuitInfo?.name || "Circuito TBA"}
              </h3>
              <p className="text-xs text-zinc-400 truncate mt-0.5">
                {circuitInfo?.location || "Localização indefinida"}
              </p>
            </>
          )}
        </div>

        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/[0.03] border border-white/[0.06] rounded-xl flex items-center justify-center p-2 shrink-0">
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
          ) : safeImageUrl && !imgError ? (
            <img
              src={safeImageUrl}
              alt={circuitInfo?.name || "Traçado do circuito"}
              loading="lazy"
              decoding="async"
              onError={() => setImgError(true)}
              className="w-full h-full object-contain invert opacity-80"
            />
          ) : (
            <Flag className="text-zinc-600 w-6 h-6" />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
          <p className="text-zinc-500 text-[10px] uppercase font-semibold tracking-wider mb-1 flex items-center gap-1.5">
            <Timer className="w-3 h-3" /> Voltas
          </p>
          <p className="font-mono text-sm font-bold text-zinc-100 tabular-nums">
            {circuitInfo?.laps ?? "TBA"}
          </p>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
          <p className="text-zinc-500 text-[10px] uppercase font-semibold tracking-wider mb-1 flex items-center gap-1.5">
            <Gauge className="w-3 h-3" /> Extensão
          </p>
          <p className="font-mono text-sm font-bold text-zinc-100 tabular-nums">
            {typeof circuitInfo?.lengthKm === "number"
              ? `${circuitInfo.lengthKm.toFixed(3)} km`
              : "TBA"}
          </p>
        </div>
      </div>
    </SurfacePanel>
  );
};

export function F1Dashboard() {
  const [activeTab, setActiveTab] = useState<F1Tab>("overview");
  const [driverQuery, setDriverQuery] = useState("");

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

  const { data: podium = [], isLoading: isLoadingPodium } = useQuery<
    F1PodiumEntry[]
  >({
    queryKey: ["f1-podium-last"],
    queryFn: async () => {
      const data = await f1Api.getLastPodium();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: weather, isLoading: isLoadingWeather } = useF1Weather();

  const { data: news = [], isLoading: isLoadingNews } = useQuery<F1NewsItem[]>(
    {
      queryKey: ["f1-news"],
      queryFn: async () => {
        const data = await f1Api.getNews();
        return Array.isArray(data) ? data : [];
      },
      staleTime: 1000 * 60 * 30,
    }
  );

  const season = new Date().getFullYear();
  const maxDriverPoints = Math.max(driverStandings[0]?.points ?? 1, 1);
  const maxConstructorPoints = Math.max(
    constructorStandings[0]?.points ?? 1,
    1
  );

  const filteredDrivers = useMemo(() => {
    const q = driverQuery.trim().toLowerCase();
    if (!q) return driverStandings;
    return driverStandings.filter(
      (d) =>
        (d.driverName || "").toLowerCase().includes(q) ||
        (d.constructorName || "").toLowerCase().includes(q)
    );
  }, [driverStandings, driverQuery]);

  const renderDriversPanel = (compact: boolean) => {
    const list = compact ? driverStandings.slice(0, 8) : filteredDrivers;

    return (
      <SurfacePanel
        accent="red"
        title="Classificação de Pilotos"
        icon={<Users className="w-4 h-4 text-red-400" />}
        action={
          compact && driverStandings.length > 8 ? (
            <button
              type="button"
              onClick={() => setActiveTab("drivers")}
              className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
            >
              Ver todos ({driverStandings.length})
            </button>
          ) : (
            <span className="text-[11px] font-medium text-red-300 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md tabular-nums">
              {season}
            </span>
          )
        }
        className={compact ? "h-full flex flex-col" : ""}
      >
        {!compact && (
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={driverQuery}
                onChange={(e) => setDriverQuery(e.target.value)}
                placeholder="Filtrar por piloto ou equipe..."
                className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-red-500/40 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors"
              />
            </div>
          </div>
        )}

        <div
          className={`space-y-2 ${
            compact
              ? "max-h-[460px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent"
              : ""
          }`}
        >
          {isLoadingDrivers ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
            </div>
          ) : list.length > 0 ? (
            list.map((driver, idx) => {
              const teamColor =
                teamColors[driver.constructorName] || "bg-zinc-600";
              const points = typeof driver.points === "number" ? driver.points : 0;
              const pct = Math.min(100, Math.round((points / maxDriverPoints) * 100));
              const gapToLeader = Math.max(0, maxDriverPoints - points);

              return (
                <div
                  key={driver.id || `${driver.driverName}-${idx}`}
                  className="relative flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors overflow-hidden"
                >
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 ${teamColor} opacity-85`}
                  />

                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pl-2">
                    <span className="font-mono text-zinc-500 text-xs font-semibold w-5 text-center shrink-0 tabular-nums">
                      {driver.position ?? idx + 1}
                    </span>
                    <DriverAvatar
                      name={driver.driverName}
                      size={compact ? "sm" : "md"}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-100 text-xs sm:text-sm truncate">
                        {driver.driverName || "Piloto"}
                      </p>
                      <p className="text-[11px] text-zinc-500 truncate">
                        {driver.constructorName || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    {!compact && idx > 0 && (
                      <span className="hidden sm:inline-block font-mono text-[11px] text-zinc-500 tabular-nums">
                        -{gapToLeader}
                      </span>
                    )}
                    {typeof driver.wins === "number" && driver.wins > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-300 bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded-lg tabular-nums">
                        <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
                        {driver.wins}
                      </span>
                    )}
                    <div className="text-right min-w-[60px]">
                      <span className="font-mono text-xs sm:text-sm font-bold text-white tabular-nums">
                        {points}{" "}
                        <span className="text-[10px] text-zinc-500 font-normal">
                          pts
                        </span>
                      </span>
                      {!compact && (
                        <div className="w-16 h-1 bg-white/[0.06] rounded-full mt-1 overflow-hidden ml-auto">
                          <div
                            className={`h-full ${teamColor} opacity-80`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-10 text-center text-xs text-zinc-500">
              Classificação indisponível
            </div>
          )}
        </div>
      </SurfacePanel>
    );
  };

  const renderConstructorsPanel = (compact: boolean) => {
    const list = compact
      ? constructorStandings.slice(0, 10)
      : constructorStandings;

    return (
      <SurfacePanel
        accent="red"
        title="Construtores"
        icon={<ShieldHalf className="w-4 h-4 text-red-400" />}
        action={
          compact && constructorStandings.length > 0 ? (
            <button
              type="button"
              onClick={() => setActiveTab("constructors")}
              className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
            >
              Detalhes
            </button>
          ) : (
            <span className="text-[11px] font-medium text-red-300 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md tabular-nums">
              {season}
            </span>
          )
        }
        className={compact ? "h-full flex flex-col" : ""}
      >
        <div
          className={`space-y-2 ${
            compact
              ? "max-h-[460px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent"
              : ""
          }`}
        >
          {isLoadingConstructors ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
            </div>
          ) : list.length > 0 ? (
            list.map((team, idx) => {
              const teamColor =
                teamColors[team.constructorName] || "bg-zinc-600";
              const points = typeof team.points === "number" ? team.points : 0;
              const pct = Math.min(
                100,
                Math.round((points / maxConstructorPoints) * 100)
              );

              return (
                <div
                  key={team.id || `${team.constructorName}-${idx}`}
                  className="relative flex items-center justify-between gap-3 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] rounded-xl p-3 transition-colors overflow-hidden"
                >
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 ${teamColor} opacity-85`}
                  />

                  <div className="flex items-center gap-3 min-w-0 pl-2">
                    <span className="font-mono text-zinc-500 text-xs font-semibold w-4 text-center shrink-0 tabular-nums">
                      {team.position ?? idx + 1}
                    </span>
                    <TeamLogo
                      name={team.constructorName}
                      teamColor={teamColor}
                    />
                    <span className="font-semibold text-zinc-100 text-xs sm:text-sm truncate">
                      {team.constructorName || "Equipe"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {typeof team.wins === "number" && team.wins > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-300 bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded-lg tabular-nums">
                        <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
                        {team.wins}
                      </span>
                    )}
                    <div className="text-right min-w-[60px]">
                      <span className="font-mono text-xs sm:text-sm font-bold text-white tabular-nums">
                        {points}{" "}
                        <span className="text-[10px] text-zinc-500 font-normal">
                          pts
                        </span>
                      </span>
                      {!compact && (
                        <div className="w-16 h-1 bg-white/[0.06] rounded-full mt-1 overflow-hidden ml-auto">
                          <div
                            className={`h-full ${teamColor} opacity-80`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-10 text-center text-xs text-zinc-500">
              Dados indisponíveis
            </div>
          )}
        </div>
      </SurfacePanel>
    );
  };

  const renderPodiumPanel = () => (
    <SurfacePanel
      title="Último Pódio"
      icon={<Trophy className="w-4 h-4 text-zinc-400" />}
    >
      <div className="flex flex-col gap-2.5">
        {isLoadingPodium ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
          </div>
        ) : podium.length > 0 ? (
          podium.map((driver, index) => {
            const teamColor =
              teamColors[driver.constructorName || ""] || "bg-zinc-600";
            return (
              <div
                key={`${driver.driverName || "podium"}-${index}`}
                className="flex items-center justify-between gap-3 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] p-3 rounded-xl relative overflow-hidden transition-colors"
              >
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 ${teamColor} opacity-85`}
                />
                <div className="flex items-center gap-3 pl-2 min-w-0">
                  {index === 0 ? (
                    <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : index === 1 ? (
                    <Medal className="w-4 h-4 text-zinc-300 shrink-0" />
                  ) : (
                    <Medal className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-xs sm:text-sm text-zinc-100 truncate">
                      {driver.driverName || "Piloto"}
                    </p>
                    <p className="text-[11px] text-zinc-500 truncate">
                      {driver.constructorName || "-"}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs font-semibold text-zinc-300 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-lg shrink-0 tabular-nums">
                  {driver.time || "-"}
                </span>
              </div>
            );
          })
        ) : (
          <p className="text-center text-xs text-zinc-500 py-8">
            Dados do pódio indisponíveis
          </p>
        )}
      </div>
    </SurfacePanel>
  );

  const renderWeatherPanel = () => (
    <SurfacePanel
      title="Clima da Pista"
      icon={<CloudRain className="w-4 h-4 text-sky-400" />}
      action={
        weather?.airTemperature != null ? (
          weather.isLive ? (
            <span className="inline-flex items-center gap-1.5 bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20 text-[10px] font-semibold uppercase tracking-wider text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Ao Vivo
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-white/[0.04] px-2.5 py-0.5 rounded-full border border-white/[0.08] text-[10px] font-medium text-zinc-400">
              Último Registro
            </span>
          )
        ) : null
      }
    >
      {isLoadingWeather ? (
        <div className="py-8 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
        </div>
      ) : weather?.airTemperature != null ? (
        <div
          className={`grid grid-cols-3 gap-2.5 ${
            !weather.isLive ? "opacity-80" : ""
          }`}
        >
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl flex flex-col items-center justify-center gap-1.5 p-3">
            <ThermometerSun
              className={`w-5 h-5 ${
                weather.isLive ? "text-amber-400" : "text-zinc-500"
              }`}
            />
            <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider text-center">
              Ar / Pista
            </span>
            <div className="flex items-baseline gap-0.5 font-mono tabular-nums">
              <span className="text-base sm:text-lg text-white font-bold">
                {weather.airTemperature}°
              </span>
              <span className="text-xs text-zinc-400">
                /{weather.trackTemperature ?? "--"}°
              </span>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl flex flex-col items-center justify-center gap-1.5 p-3">
            <Droplets
              className={`w-5 h-5 ${
                weather.isLive ? "text-sky-400" : "text-zinc-500"
              }`}
            />
            <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider text-center">
              Chuva / Umid
            </span>
            <div className="flex items-baseline gap-0.5 font-mono tabular-nums">
              <span className="text-base sm:text-lg text-white font-bold">
                {(weather.rainfall ?? 0) > 0 ? "Sim" : "Não"}
              </span>
              <span className="text-xs text-zinc-400">
                /{weather.humidity ?? "--"}%
              </span>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl flex flex-col items-center justify-center gap-1.5 p-3">
            <Wind
              className={`w-5 h-5 ${
                weather.isLive ? "text-teal-400" : "text-zinc-500"
              }`}
            />
            <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider text-center">
              Vento
            </span>
            <div className="flex items-baseline gap-0.5 font-mono tabular-nums">
              <span className="text-base sm:text-lg text-white font-bold">
                {weather.windSpeed ?? "--"}
              </span>
              <span className="text-xs text-zinc-400">m/s</span>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-center text-xs text-zinc-500 py-8">
          Telemetria climática offline
        </p>
      )}
    </SurfacePanel>
  );

  const renderNewsPanel = (compact: boolean) => {
    const items = compact ? news.slice(0, 5) : news;

    return (
      <SurfacePanel
        accent="red"
        title="Radar F1"
        icon={<Newspaper className="w-4 h-4 text-red-400" />}
        action={
          compact && news.length > 5 ? (
            <button
              type="button"
              onClick={() => setActiveTab("results")}
              className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
            >
              Ver mais
            </button>
          ) : null
        }
      >
        <div
          className={`space-y-2 ${
            compact
              ? "max-h-[240px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent"
              : ""
          }`}
        >
          {isLoadingNews ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
            </div>
          ) : items.length > 0 ? (
            items.map((item, i) => {
              const safeHref = sanitizeUrl(item?.link);
              const dateLabel = formatNewsDate(item?.pubDate);
              const cardContent = (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-xs font-semibold text-zinc-200 leading-snug line-clamp-2 group-hover/news:text-white transition-colors">
                      {item?.title || "Notícia F1"}
                    </h4>
                    {safeHref && (
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-600 group-hover/news:text-zinc-300 shrink-0 transition-colors mt-0.5" />
                    )}
                  </div>
                  {dateLabel && (
                    <span className="text-[10px] text-zinc-500 font-medium mt-1.5 uppercase tracking-wider">
                      {dateLabel}
                    </span>
                  )}
                </>
              );

              if (!safeHref) {
                return (
                  <div
                    key={i}
                    className="flex flex-col p-3 bg-white/[0.02] rounded-xl border border-white/[0.06]"
                  >
                    {cardContent}
                  </div>
                );
              }

              return (
                <a
                  key={i}
                  href={safeHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/news flex flex-col p-3 bg-white/[0.02] hover:bg-white/[0.05] rounded-xl transition-colors border border-white/[0.06] hover:border-red-500/25"
                >
                  {cardContent}
                </a>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-zinc-500">
              Sem notícias recentes
            </div>
          )}
        </div>
      </SurfacePanel>
    );
  };

  return (
    <div className="w-full flex flex-col gap-5">
      {/* Navigation Filter Pills */}
      <nav
        aria-label="Seções de Fórmula 1"
        className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar"
      >
        <FilterPill
          accent="red"
          active={activeTab === "overview"}
          onClick={() => setActiveTab("overview")}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          Visão Geral
        </FilterPill>
        <FilterPill
          accent="red"
          active={activeTab === "drivers"}
          onClick={() => setActiveTab("drivers")}
        >
          <Users className="w-3.5 h-3.5" />
          Pilotos
        </FilterPill>
        <FilterPill
          accent="red"
          active={activeTab === "constructors"}
          onClick={() => setActiveTab("constructors")}
        >
          <ShieldHalf className="w-3.5 h-3.5" />
          Equipes
        </FilterPill>
        <FilterPill
          accent="red"
          active={activeTab === "calendar"}
          onClick={() => setActiveTab("calendar")}
        >
          <Calendar className="w-3.5 h-3.5" />
          Calendário
        </FilterPill>
        <FilterPill
          accent="red"
          active={activeTab === "results"}
          onClick={() => setActiveTab("results")}
        >
          <Trophy className="w-3.5 h-3.5" />
          Resultados & Radar
        </FilterPill>
      </nav>

      {activeTab === "overview" && (
        <div className="flex flex-col gap-5">
          {/* Row 1: Schedule + Circuit | Drivers | Constructors */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
            <div className="xl:col-span-4 flex flex-col gap-5">
              <div className="flex-1 min-h-[280px]">
                <F1Widget />
              </div>
              <CircuitPreview
                circuitInfo={circuitInfo}
                isLoading={isLoadingCircuit}
              />
            </div>

            <div className="xl:col-span-4">{renderDriversPanel(true)}</div>

            <div className="xl:col-span-4">{renderConstructorsPanel(true)}</div>
          </div>

          {/* Row 2: Podium | Weather | News */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-5 items-start">
            <div className="xl:col-span-4">{renderPodiumPanel()}</div>
            <div className="xl:col-span-4">{renderWeatherPanel()}</div>
            <div className="md:col-span-2 xl:col-span-4">
              {renderNewsPanel(true)}
            </div>
          </div>
        </div>
      )}

      {activeTab === "drivers" && renderDriversPanel(false)}

      {activeTab === "constructors" && renderConstructorsPanel(false)}

      {activeTab === "calendar" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-7">
            <F1Widget />
          </div>
          <div className="lg:col-span-5 flex flex-col gap-5">
            <CircuitPreview
              circuitInfo={circuitInfo}
              isLoading={isLoadingCircuit}
            />
            {renderWeatherPanel()}
          </div>
        </div>
      )}

      {activeTab === "results" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-5 flex flex-col gap-5">
            {renderPodiumPanel()}
            {renderWeatherPanel()}
          </div>
          <div className="lg:col-span-7">{renderNewsPanel(false)}</div>
        </div>
      )}
    </div>
  );
}
