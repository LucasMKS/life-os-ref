"use client";

import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Search,
  Star,
  Trophy,
  Check,
  Loader2,
  Trash2,
  Shield,
  X,
} from "lucide-react";
import { sportsApi } from "@/lib/api";
import {
  SportLeague,
  SportTeam,
  SportsUserPreferences,
  TrackTeamPayload,
  TrackLeaguePayload,
  TrackedTeam,
} from "@/lib/types";
import { toast } from "sonner";
import { translateLeagueName, translateTeamName } from "@/lib/sports-translations";

const DEFAULT_LEAGUES: SportLeague[] = [
  {
    id: "bra.1",
    slug: "bra.1",
    name: "Brasileirão Série A",
    displayName: "Brasileirão Série A",
    abbreviation: "Série A",
    sport: "soccer",
    logoUrl: "https://a.espncdn.com/i/leaguelogos/soccer/500/85.png",
  },
  {
    id: "bra.copa_do_brazil",
    slug: "bra.copa_do_brazil",
    name: "Copa do Brasil",
    displayName: "Copa do Brasil",
    abbreviation: "Copa BR",
    sport: "soccer",
    logoUrl: "https://a.espncdn.com/i/leaguelogos/soccer/500/528.png",
  },
  {
    id: "conmebol.libertadores",
    slug: "conmebol.libertadores",
    name: "Copa Libertadores",
    displayName: "Copa Libertadores da América",
    abbreviation: "Libertadores",
    sport: "soccer",
    logoUrl: "https://a.espncdn.com/i/leaguelogos/soccer/500/58.png",
  },
  {
    id: "uefa.champions",
    slug: "uefa.champions",
    name: "UEFA Champions League",
    displayName: "UEFA Champions League",
    abbreviation: "UCL",
    sport: "soccer",
    logoUrl: "https://a.espncdn.com/i/leaguelogos/soccer/500/2.png",
  },
  {
    id: "fifa.friendly",
    slug: "fifa.friendly",
    name: "Amistosos & Seleção Brasileira",
    displayName: "Amistosos Internacionais",
    abbreviation: "Amistosos",
    sport: "soccer",
    logoUrl: "https://a.espncdn.com/i/teamlogos/countries/500/bra.png",
  },
  {
    id: "fifa.world",
    slug: "fifa.world",
    name: "Copa do Mundo FIFA",
    displayName: "Copa do Mundo FIFA",
    abbreviation: "Copa do Mundo",
    sport: "soccer",
    logoUrl: "https://a.espncdn.com/i/leaguelogos/soccer/500/4.png",
  },
  {
    id: "fifa.wwc",
    slug: "fifa.wwc",
    name: "Copa do Mundo Feminina",
    displayName: "FIFA Women's World Cup",
    abbreviation: "WWC",
    sport: "soccer",
    logoUrl: "https://a.espncdn.com/i/leaguelogos/soccer/500/60.png",
  },
  {
    id: "nba",
    slug: "nba",
    name: "NBA",
    displayName: "National Basketball Association",
    abbreviation: "NBA",
    sport: "basketball",
    logoUrl: "https://a.espncdn.com/i/teamlogos/leagues/500/nba.png",
  },
  {
    id: "nfl",
    slug: "nfl",
    name: "NFL",
    displayName: "National Football League",
    abbreviation: "NFL",
    sport: "football",
    logoUrl: "https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png",
  },
];

type CategoryKey = "SOCCER" | "BASKETBALL" | "FOOTBALL" | "FAVORITES";

function SafeImage({
  src,
  alt,
  className,
  fallbackText,
  fallbackBg,
}: {
  src?: string;
  alt?: string;
  className?: string;
  fallbackText?: string;
  fallbackBg?: string;
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    const initials = fallbackText || (alt ? alt.substring(0, 2).toUpperCase() : "?");
    return (
      <div
        className={`flex items-center justify-center font-bold text-[10px] text-zinc-300 shrink-0 select-none border border-white/[0.08] ${className}`}
        style={{ backgroundColor: fallbackBg || "#1f1f23" }}
        title={alt}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || ""}
      className={className}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
}

export function SportsFavoritesManager() {
  const queryClient = useQueryClient();

  const [activeCategory, setActiveCategory] = useState<CategoryKey>("SOCCER");
  const [selectedLeagueSlug, setSelectedLeagueSlug] = useState<string>("bra.1");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedGlobalQuery, setDebouncedGlobalQuery] = useState<string>("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedGlobalQuery(searchQuery.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch leagues
  const { data: serverLeagues } = useQuery<SportLeague[]>({
    queryKey: ["sports-leagues"],
    queryFn: sportsApi.getLeagues,
    staleTime: 1000 * 60 * 60,
  });

  const leagues = useMemo(() => {
    if (serverLeagues && serverLeagues.length > 0) {
      return serverLeagues.map((sl) => {
        const fallback = DEFAULT_LEAGUES.find((dl) => dl.slug === sl.slug);
        return {
          ...sl,
          logoUrl: fallback?.logoUrl || sl.logoUrl,
        };
      });
    }
    return DEFAULT_LEAGUES;
  }, [serverLeagues]);

  const soccerLeagues = useMemo(() => leagues.filter((l) => l.sport === "soccer"), [leagues]);
  const basketballLeagues = useMemo(() => leagues.filter((l) => l.sport === "basketball"), [leagues]);
  const footballLeagues = useMemo(() => leagues.filter((l) => l.sport === "football"), [leagues]);

  const currentCategoryLeagues = useMemo(() => {
    if (activeCategory === "BASKETBALL") return basketballLeagues;
    if (activeCategory === "FOOTBALL") return footballLeagues;
    if (activeCategory === "SOCCER") return soccerLeagues;
    return leagues;
  }, [activeCategory, basketballLeagues, footballLeagues, soccerLeagues, leagues]);

  const currentLeague = useMemo(() => {
    const found = leagues.find((l) => l.slug === selectedLeagueSlug);
    return found || soccerLeagues[0] || leagues[0];
  }, [leagues, selectedLeagueSlug, soccerLeagues]);

  // Fetch preferences
  const { data: preferences } = useQuery<SportsUserPreferences>({
    queryKey: ["sports-preferences"],
    queryFn: sportsApi.getPreferences,
  });

  const getTeamKey = (sport?: string, teamId?: string) =>
    `${(sport || "").toLowerCase()}::${teamId || ""}`;

  const trackedTeamKeys = useMemo(() => {
    return new Set(preferences?.trackedTeams?.map((t) => getTeamKey(t.sport, t.teamId)) || []);
  }, [preferences?.trackedTeams]);

  const trackedLeagueSlugs = useMemo(() => {
    return new Set(preferences?.trackedLeagues?.map((l) => l.league) || []);
  }, [preferences?.trackedLeagues]);

  const totalFavoritesCount =
    (preferences?.trackedTeams?.length || 0) + (preferences?.trackedLeagues?.length || 0);

  // Teams in current league
  const { data: teams = [], isLoading: isLoadingTeams } = useQuery<SportTeam[]>({
    queryKey: ["sports-teams", currentLeague.sport, currentLeague.slug],
    queryFn: () => sportsApi.getTeams(currentLeague.sport, currentLeague.slug),
    staleTime: 1000 * 60 * 60,
    enabled: activeCategory !== "FAVORITES",
  });

  // Global search if query is 2+ chars
  const isGlobalSearch = debouncedGlobalQuery.length >= 2 && activeCategory !== "FAVORITES";
  const { data: globalSearchResults = [], isLoading: isLoadingGlobalSearch } = useQuery<SportTeam[]>({
    queryKey: ["sports-global-search", debouncedGlobalQuery],
    queryFn: () => sportsApi.searchTeams(debouncedGlobalQuery),
    enabled: isGlobalSearch,
    staleTime: 1000 * 60 * 5,
  });

  const filteredTeams = useMemo(() => {
    let list = teams;
    if (searchQuery.trim() && !isGlobalSearch) {
      const q = searchQuery.toLowerCase().trim();
      list = teams.filter(
        (t) =>
          t.name?.toLowerCase().includes(q) ||
          t.displayName?.toLowerCase().includes(q) ||
          t.shortDisplayName?.toLowerCase().includes(q) ||
          t.abbreviation?.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      if (a.id === "205") return -1;
      if (b.id === "205") return 1;
      return (a.displayName || a.name || "").localeCompare(b.displayName || b.name || "");
    });
  }, [teams, searchQuery, isGlobalSearch]);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["sports-preferences"] });
    queryClient.invalidateQueries({ queryKey: ["sports-followed-matches"] });
    queryClient.invalidateQueries({ queryKey: ["sports-scoreboard"] });
    queryClient.invalidateQueries({ queryKey: ["sports-radar-matches"] });
    queryClient.invalidateQueries({ queryKey: ["sports-day-matches"] });
  };

  const trackTeamMutation = useMutation({
    mutationFn: (payload: TrackTeamPayload) => sportsApi.trackTeam(payload),
    onSuccess: (_, variables) => {
      toast.success(`${variables.teamDisplayName || variables.teamName} favoritado!`);
      invalidateAll();
    },
    onError: () => toast.error("Erro ao favoritar time."),
  });

  const untrackTeamMutation = useMutation({
    mutationFn: ({ teamId, sport }: { teamId: string; sport?: string }) =>
      sportsApi.untrackTeam(teamId, sport),
    onSuccess: () => {
      toast.info("Time removido dos favoritos.");
      invalidateAll();
    },
    onError: () => toast.error("Erro ao remover time."),
  });

  const trackLeagueMutation = useMutation({
    mutationFn: (payload: TrackLeaguePayload) => sportsApi.trackLeague(payload),
    onSuccess: (_, variables) => {
      toast.success(`Competição ${variables.leagueName} favoritada!`);
      invalidateAll();
    },
    onError: () => toast.error("Erro ao favoritar liga."),
  });

  const untrackLeagueMutation = useMutation({
    mutationFn: (leagueSlug: string) => sportsApi.untrackLeague(leagueSlug),
    onSuccess: () => {
      toast.info("Competição removida dos favoritos.");
      invalidateAll();
    },
    onError: () => toast.error("Erro ao remover competição."),
  });

  const handleToggleLeague = (leagueToToggle?: SportLeague) => {
    const target = leagueToToggle || currentLeague;
    const isTracked = trackedLeagueSlugs.has(target.slug);

    if (isTracked) {
      untrackLeagueMutation.mutate(target.slug);
    } else {
      trackLeagueMutation.mutate({
        sport: target.sport,
        league: target.slug,
        leagueName: target.displayName || target.name,
        leagueLogo: target.logoUrl,
        notifyMatches: true,
      });
    }
  };

  const handleToggleTeam = (team: SportTeam | TrackedTeam) => {
    const isTrackedTeamObj = "teamId" in team;
    const teamId = isTrackedTeamObj ? team.teamId : team.id;
    const sport = (team.sport || currentLeague.sport || "").toLowerCase();
    const isTracked = trackedTeamKeys.has(getTeamKey(sport, teamId));

    if (isTracked) {
      untrackTeamMutation.mutate({ teamId, sport });
    } else {
      const league = team.league || currentLeague.slug;
      const teamName = isTrackedTeamObj ? team.teamName : (team as SportTeam).name;
      const teamDisplayName = isTrackedTeamObj
        ? team.teamDisplayName || team.teamName
        : (team as SportTeam).displayName || (team as SportTeam).name;
      const teamAbbreviation = isTrackedTeamObj
        ? team.teamAbbreviation
        : (team as SportTeam).abbreviation;
      const color = isTrackedTeamObj ? team.primaryColor : (team as SportTeam).color;
      const altColor = isTrackedTeamObj
        ? team.secondaryColor
        : (team as SportTeam).alternateColor;

      trackTeamMutation.mutate({
        sport,
        league,
        teamId,
        teamName,
        teamDisplayName,
        teamAbbreviation,
        logoUrl: team.logoUrl,
        primaryColor: color,
        secondaryColor: altColor,
        notifyMatches: true,
      });
    }
  };

  const handleSelectCategory = (cat: CategoryKey) => {
    setActiveCategory(cat);
    setSearchQuery("");
    if (cat === "SOCCER") {
      setSelectedLeagueSlug("bra.1");
    } else if (cat === "BASKETBALL") {
      setSelectedLeagueSlug("nba");
    } else if (cat === "FOOTBALL") {
      setSelectedLeagueSlug("nfl");
    }
  };

  const isCurrentLeagueTracked = trackedLeagueSlugs.has(currentLeague.slug);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#111113] border border-white/[0.06] rounded-2xl">
        <div className="flex items-center gap-3.5">
          <Link
            to="/sports"
            className="h-9 w-9 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors flex items-center justify-center shrink-0"
            title="Voltar para Esportes"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">
                Gerenciar Favoritos
              </h1>
              {totalFavoritesCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/[0.06] text-zinc-300 border border-white/[0.08] tabular-nums">
                  {totalFavoritesCount} {totalFavoritesCount === 1 ? "selecionado" : "selecionados"}
                </span>
              )}
            </div>
            <p className="text-zinc-400 text-xs mt-0.5">
              Escolha os times e competições que você quer acompanhar com destaque no Radar e Placares.
            </p>
          </div>
        </div>

        <Link
          to="/sports"
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-950 hover:bg-white transition-colors self-start sm:self-auto shrink-0"
        >
          <span>Concluir e ver jogos</span>
        </Link>
      </div>

      {/* Main Tabs (Categorias) + Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none p-1 bg-[#111113] border border-white/[0.06] rounded-xl">
          <button
            onClick={() => handleSelectCategory("SOCCER")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
              activeCategory === "SOCCER"
                ? "bg-white/[0.1] text-white font-semibold"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <span>⚽ Futebol</span>
          </button>

          <button
            onClick={() => handleSelectCategory("BASKETBALL")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
              activeCategory === "BASKETBALL"
                ? "bg-white/[0.1] text-white font-semibold"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <span>🏀 NBA (Basquete)</span>
          </button>

          <button
            onClick={() => handleSelectCategory("FOOTBALL")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
              activeCategory === "FOOTBALL"
                ? "bg-white/[0.1] text-white font-semibold"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <span>🏈 NFL (Futebol Americano)</span>
          </button>

          <button
            onClick={() => handleSelectCategory("FAVORITES")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
              activeCategory === "FAVORITES"
                ? "bg-white/[0.1] text-white font-semibold"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Star
              className={`w-3.5 h-3.5 ${
                activeCategory === "FAVORITES" ? "fill-white text-white" : "text-zinc-400"
              }`}
            />
            <span>Meus Salvos</span>
            {totalFavoritesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-white/[0.12] text-zinc-200 tabular-nums">
                {totalFavoritesCount}
              </span>
            )}
          </button>
        </div>

        {/* Search Bar */}
        {activeCategory !== "FAVORITES" && (
          <div className="relative w-full md:w-80">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar qualquer time..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111113] border border-white/[0.08] focus:border-white/20 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-zinc-500 outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white p-0.5"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* VIEW 1: MEUS SALVOS */}
      {activeCategory === "FAVORITES" ? (
        <div className="space-y-6">
          {totalFavoritesCount === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center gap-3 bg-[#111113] rounded-2xl border border-dashed border-white/[0.08] p-6">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-400">
                <Star className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Nenhum favorito selecionado</h3>
              <p className="text-xs text-zinc-400 max-w-sm">
                Navegue pelas abas de Futebol, NBA ou NFL acima e selecione os times ou ligas que você quer acompanhar.
              </p>
              <button
                onClick={() => handleSelectCategory("SOCCER")}
                className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-950 hover:bg-white transition-colors"
              >
                Explorar Futebol
              </button>
            </div>
          ) : (
            <>
              {/* Followed Leagues */}
              {(preferences?.trackedLeagues?.length || 0) > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                      <Trophy className="w-3.5 h-3.5" />
                      Competições Seguidas ({preferences?.trackedLeagues?.length})
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {preferences?.trackedLeagues?.map((league) => (
                      <div
                        key={league.league}
                        className="flex items-center justify-between p-3 bg-[#111113] border border-white/[0.06] rounded-xl hover:border-white/[0.12] transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <SafeImage
                            src={league.leagueLogo}
                            alt={league.leagueName}
                            className="w-6 h-6 object-contain shrink-0"
                          />
                          <span className="text-xs font-medium text-zinc-200 truncate">
                            {league.leagueName}
                          </span>
                        </div>

                        <button
                          onClick={() => untrackLeagueMutation.mutate(league.league)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.08] transition-colors"
                          title="Remover competição dos favoritos"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Followed Teams */}
              {(preferences?.trackedTeams?.length || 0) > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5" />
                      Times Favoritos ({preferences?.trackedTeams?.length})
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {preferences?.trackedTeams?.map((team) => (
                      <div
                        key={`${team.sport}::${team.teamId}`}
                        className="flex items-center justify-between p-3 bg-[#111113] border border-white/[0.06] rounded-xl hover:border-white/[0.12] transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <SafeImage
                            src={team.logoUrl}
                            alt={team.teamDisplayName || team.teamName}
                            className="w-6 h-6 object-contain shrink-0"
                            fallbackBg={team.primaryColor}
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-medium text-zinc-200 block truncate">
                              {team.teamDisplayName || team.teamName}
                            </span>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                              {team.teamAbbreviation || team.sport}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            untrackTeamMutation.mutate({ teamId: team.teamId, sport: team.sport })
                          }
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.08] transition-colors"
                          title="Remover time dos favoritos"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : isGlobalSearch ? (
        /* VIEW 2: GLOBAL SEARCH RESULTS */
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-medium text-zinc-400">
              Resultados da busca por &quot;{debouncedGlobalQuery}&quot; ({globalSearchResults.length})
            </span>
          </div>

          {isLoadingGlobalSearch ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-zinc-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-xs">Buscando times...</span>
            </div>
          ) : globalSearchResults.length === 0 ? (
            <div className="py-12 text-center bg-[#111113] rounded-2xl border border-white/[0.06]">
              <p className="text-xs text-zinc-400">Nenhum time encontrado para esse termo.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {globalSearchResults.map((team) => {
                const isTracked = trackedTeamKeys.has(getTeamKey(team.sport, team.id));
                return (
                  <div
                    key={`${team.sport}::${team.id}`}
                    onClick={() => handleToggleTeam(team)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer ${
                      isTracked
                        ? "bg-white/[0.06] border-white/20"
                        : "bg-[#111113] border-white/[0.06] hover:border-white/[0.14] hover:bg-[#161619]"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <SafeImage
                        src={team.logoUrl}
                        alt={translateTeamName(team.displayName || team.name)}
                        className="w-6 h-6 object-contain shrink-0"
                        fallbackBg={team.color}
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-medium text-zinc-100 block truncate">
                          {translateTeamName(team.displayName || team.name)}
                        </span>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                          {team.abbreviation || team.sport}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`p-1.5 rounded-lg text-xs transition-colors shrink-0 ${
                        isTracked
                          ? "bg-zinc-100 text-zinc-950"
                          : "text-zinc-500 hover:text-white hover:bg-white/[0.08]"
                      }`}
                      title={isTracked ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          isTracked ? "fill-zinc-950 text-zinc-950" : ""
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* VIEW 3: LEAGUE & TEAMS BROWSER */
        <div className="space-y-5">
          {/* Sub-league selector pills */}
          {currentCategoryLeagues.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
              {currentCategoryLeagues.map((league) => {
                const isSelected = selectedLeagueSlug === league.slug;
                const isTracked = trackedLeagueSlugs.has(league.slug);
                return (
                  <button
                    key={league.slug}
                    onClick={() => {
                      setSelectedLeagueSlug(league.slug);
                      setSearchQuery("");
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors shrink-0 border ${
                      isSelected
                        ? "bg-white/[0.1] text-white border-white/20 font-semibold"
                        : "bg-[#111113] text-zinc-400 hover:text-white border-white/[0.06] hover:border-white/[0.12]"
                    }`}
                  >
                    <SafeImage
                      src={league.logoUrl}
                      alt={league.name}
                      className="w-4 h-4 object-contain shrink-0"
                    />
                    <span>{league.abbreviation || league.name}</span>
                    {isTracked && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5" title="Competição favoritada" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Current League Action Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#111113] border border-white/[0.08] rounded-2xl">
            <div className="flex items-center gap-3">
              <SafeImage
                src={currentLeague.logoUrl}
                alt={translateLeagueName(currentLeague.displayName || currentLeague.name, currentLeague.slug)}
                className="w-8 h-8 object-contain shrink-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white">
                    {translateLeagueName(currentLeague.displayName || currentLeague.name, currentLeague.slug)}
                  </h2>
                  {isCurrentLeagueTracked && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Liga Seguida
                    </span>
                  )}
                </div>
                <p className="text-zinc-500 text-xs mt-0.5">
                  Acompanhe todos os jogos desta competição no radar e placares.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleToggleLeague(currentLeague)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors self-start sm:self-auto shrink-0 border ${
                isCurrentLeagueTracked
                  ? "bg-white/[0.08] text-white border-white/20 hover:bg-white/[0.12]"
                  : "bg-white/[0.04] text-zinc-300 border-white/[0.08] hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              {isCurrentLeagueTracked ? (
                <>
                  <Check className="w-3.5 h-3.5 text-zinc-200" />
                  <span>Seguindo Liga</span>
                </>
              ) : (
                <>
                  <Star className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Seguir Toda a Liga</span>
                </>
              )}
            </button>
          </div>

          {/* Teams Grid */}
          <div>
            <div className="flex items-center justify-between px-1 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Times Disponíveis ({filteredTeams.length})
              </span>
              <span className="text-[11px] text-zinc-500">
                Clique no time para favoritar
              </span>
            </div>

            {isLoadingTeams ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 py-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div
                    key={i}
                    className="h-14 rounded-xl bg-white/[0.02] border border-white/[0.04] animate-pulse"
                  />
                ))}
              </div>
            ) : filteredTeams.length === 0 ? (
              <div className="py-12 text-center bg-[#111113] rounded-2xl border border-white/[0.06]">
                <p className="text-xs text-zinc-400">Nenhum time encontrado nesta liga.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredTeams.map((team) => {
                  const isTracked = trackedTeamKeys.has(getTeamKey(team.sport, team.id));
                  return (
                    <div
                      key={team.id}
                      onClick={() => handleToggleTeam(team)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer ${
                        isTracked
                          ? "bg-white/[0.06] border-white/20"
                          : "bg-[#111113] border-white/[0.06] hover:border-white/[0.12] hover:bg-[#161619]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <SafeImage
                          src={team.logoUrl}
                          alt={translateTeamName(team.displayName || team.name)}
                          className="w-6 h-6 object-contain shrink-0"
                          fallbackBg={team.color}
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-medium text-zinc-100 block truncate">
                            {translateTeamName(team.displayName || team.name)}
                          </span>
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                            {team.abbreviation || team.shortDisplayName}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`p-1.5 rounded-lg text-xs transition-colors shrink-0 ${
                          isTracked
                            ? "bg-zinc-100 text-zinc-950"
                            : "text-zinc-500 hover:text-white hover:bg-white/[0.08]"
                        }`}
                        title={isTracked ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            isTracked ? "fill-zinc-950 text-zinc-950" : ""
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
