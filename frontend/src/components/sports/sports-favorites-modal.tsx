"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Search,
  Star,
  Trophy,
  Bell,
  Check,
  Loader2,
  Sparkles,
  Shield,
  Layers,
  Heart,
  Globe,
  Trash2,
  Compass,
  ArrowRight,
  Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { sportsApi } from "@/lib/api";
import {
  SportLeague,
  SportTeam,
  SportsUserPreferences,
  TrackTeamPayload,
  TrackLeaguePayload,
  TrackedTeam,
  TrackedLeague,
} from "@/lib/types";
import { toast } from "sonner";

interface SportsFavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalCategory = "SOCCER" | "BASKETBALL" | "FOOTBALL" | "FAVORITES" | "GLOBAL_SEARCH";

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
    id: "fifa.wwc",
    slug: "fifa.wwc",
    name: "Copa do Mundo Feminina",
    displayName: "FIFA Women's World Cup",
    abbreviation: "WWC",
    sport: "soccer",
    logoUrl: "https://a.espncdn.com/i/leaguelogos/soccer/500/60.png",
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

const LEAGUE_NAMES_MAP: Record<string, string> = {
  "bra.1": "Brasileirão Série A",
  "bra.copa_do_brazil": "Copa do Brasil",
  "conmebol.libertadores": "Libertadores",
  "uefa.champions": "UEFA Champions",
  "fifa.wwc": "Copa Feminina",
  "fifa.friendly": "Amistosos & Seleção",
  "fifa.world": "Copa do Mundo",
  "nba": "NBA",
  "nfl": "NFL",
};

/**
 * Image wrapper with automatic fallback on load error or broken URL.
 */
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
        className={`flex items-center justify-center font-bold text-[10px] text-white shrink-0 select-none border border-white/10 ${className}`}
        style={{ backgroundColor: fallbackBg || "#27272a" }}
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

export function SportsFavoritesModal({ isOpen, onClose }: SportsFavoritesModalProps) {
  const queryClient = useQueryClient();

  // Category navigation: SOCCER | BASKETBALL | FOOTBALL | FAVORITES | GLOBAL_SEARCH
  const [activeCategory, setActiveCategory] = useState<ModalCategory>("SOCCER");
  const [selectedLeagueSlug, setSelectedLeagueSlug] = useState<string>("bra.1");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedGlobalQuery, setDebouncedGlobalQuery] = useState<string>("");

  // Lock scroll and handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Debounce global search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedGlobalQuery(searchQuery.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch leagues from backend (with default fallback)
  const { data: serverLeagues } = useQuery<SportLeague[]>({
    queryKey: ["sports-leagues"],
    queryFn: sportsApi.getLeagues,
    staleTime: 1000 * 60 * 60,
  });

  const leagues = useMemo(() => {
    if (serverLeagues && serverLeagues.length > 0) {
      // Merge with DEFAULT_LEAGUES to guarantee latest URLs if backend was previously cached
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

  // Map category to leagues
  const soccerLeagues = useMemo(
    () => leagues.filter((l) => l.sport === "soccer"),
    [leagues]
  );
  const basketballLeagues = useMemo(
    () => leagues.filter((l) => l.sport === "basketball"),
    [leagues]
  );
  const footballLeagues = useMemo(
    () => leagues.filter((l) => l.sport === "football"),
    [leagues]
  );

  const currentCategoryLeagues = useMemo(() => {
    if (activeCategory === "BASKETBALL") return basketballLeagues;
    if (activeCategory === "FOOTBALL") return footballLeagues;
    if (activeCategory === "SOCCER") return soccerLeagues;
    return leagues;
  }, [activeCategory, basketballLeagues, footballLeagues, soccerLeagues, leagues]);

  // Current active league
  const currentLeague = useMemo(() => {
    const found = leagues.find((l) => l.slug === selectedLeagueSlug);
    return found || soccerLeagues[0] || leagues[0];
  }, [leagues, selectedLeagueSlug, soccerLeagues]);

  // Fetch preferences (tracked teams & leagues)
  const { data: preferences } = useQuery<SportsUserPreferences>({
    queryKey: ["sports-preferences"],
    queryFn: sportsApi.getPreferences,
  });

  const getTeamKey = (sport?: string, teamId?: string) =>
    `${(sport || "").toLowerCase()}::${teamId || ""}`;

  const trackedTeamKeys = useMemo(() => {
    return new Set(
      preferences?.trackedTeams?.map((t) => getTeamKey(t.sport, t.teamId)) || []
    );
  }, [preferences?.trackedTeams]);

  const trackedLeagueSlugs = useMemo(() => {
    return new Set(preferences?.trackedLeagues?.map((l) => l.league) || []);
  }, [preferences?.trackedLeagues]);

  // Total favorites count for header & badge
  const totalFavoritesCount = (preferences?.trackedTeams?.length || 0) + (preferences?.trackedLeagues?.length || 0);

  // Teams in current selected league
  const { data: teams = [], isLoading: isLoadingTeams } = useQuery<SportTeam[]>({
    queryKey: ["sports-teams", currentLeague.sport, currentLeague.slug],
    queryFn: () => sportsApi.getTeams(currentLeague.sport, currentLeague.slug),
    staleTime: 1000 * 60 * 60,
    enabled: isOpen && activeCategory !== "FAVORITES" && activeCategory !== "GLOBAL_SEARCH",
  });

  // Global search across all sports/leagues via backend catalog
  const isGlobalSearchActive = activeCategory === "GLOBAL_SEARCH" || (searchQuery.trim().length >= 2 && activeCategory !== "FAVORITES");
  const { data: globalSearchResults = [], isLoading: isLoadingGlobalSearch } = useQuery<SportTeam[]>({
    queryKey: ["sports-global-search", debouncedGlobalQuery],
    queryFn: () => sportsApi.searchTeams(debouncedGlobalQuery),
    enabled: isOpen && debouncedGlobalQuery.length >= 2,
    staleTime: 1000 * 60 * 5,
  });

  // Filtered teams for current league
  const filteredTeams = useMemo(() => {
    let list = teams;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = teams.filter(
        (t) =>
          t.name?.toLowerCase().includes(q) ||
          t.displayName?.toLowerCase().includes(q) ||
          t.shortDisplayName?.toLowerCase().includes(q) ||
          t.abbreviation?.toLowerCase().includes(q) ||
          (t.id === "205" && ("brasil".includes(q) || "selecao".includes(q) || "brazil".includes(q)))
      );
    }
    // Sort Brazil to top if present, then alphabetical
    return [...list].sort((a, b) => {
      if (a.id === "205") return -1;
      if (b.id === "205") return 1;
      return (a.displayName || a.name || "").localeCompare(b.displayName || b.name || "");
    });
  }, [teams, searchQuery]);

  // Invalidate queries helper
  const invalidateAllSports = () => {
    queryClient.invalidateQueries({ queryKey: ["sports-preferences"] });
    queryClient.invalidateQueries({ queryKey: ["sports-followed-matches"] });
    queryClient.invalidateQueries({ queryKey: ["sports-scoreboard"] });
    queryClient.invalidateQueries({ queryKey: ["sports-radar-matches"] });
    queryClient.invalidateQueries({ queryKey: ["sports-day-matches"] });
  };

  // Mutations
  const trackTeamMutation = useMutation({
    mutationFn: (payload: TrackTeamPayload) => sportsApi.trackTeam(payload),
    onSuccess: (_, variables) => {
      toast.success(`${variables.teamDisplayName || variables.teamName} favoritado!`, {
        description: "Você receberá notificações e alertas das partidas deste time.",
      });
      invalidateAllSports();
    },
    onError: () => {
      toast.error("Erro ao favoritar time. Tente novamente.");
    },
  });

  const untrackTeamMutation = useMutation({
    mutationFn: ({ teamId, sport }: { teamId: string; sport?: string }) =>
      sportsApi.untrackTeam(teamId, sport),
    onSuccess: () => {
      toast.info("Time removido dos favoritos.");
      invalidateAllSports();
    },
    onError: () => {
      toast.error("Erro ao remover time. Tente novamente.");
    },
  });

  const trackLeagueMutation = useMutation({
    mutationFn: (payload: TrackLeaguePayload) => sportsApi.trackLeague(payload),
    onSuccess: (_, variables) => {
      toast.success(`Liga ${variables.leagueName} favoritada!`, {
        description: "Você acompanhará todas as partidas desta liga no seu radar e dashboard.",
      });
      invalidateAllSports();
    },
    onError: () => {
      toast.error("Erro ao favoritar liga. Tente novamente.");
    },
  });

  const untrackLeagueMutation = useMutation({
    mutationFn: (leagueSlug: string) => sportsApi.untrackLeague(leagueSlug),
    onSuccess: () => {
      toast.info("Acompanhamento geral da liga desativado.");
      invalidateAllSports();
    },
    onError: () => {
      toast.error("Erro ao desativar acompanhamento da liga.");
    },
  });

  const isCurrentLeagueTracked = trackedLeagueSlugs.has(currentLeague.slug);

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
        ? (team.teamDisplayName || team.teamName)
        : ((team as SportTeam).displayName || (team as SportTeam).name);
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

  // Helper to count tracked teams in a given league
  const getTrackedTeamsCountInLeague = (leagueSlug: string) => {
    return preferences?.trackedTeams?.filter((t) => t.league === leagueSlug).length || 0;
  };

  // Switch category and adjust selected league
  const handleSelectCategory = (cat: ModalCategory) => {
    setActiveCategory(cat);
    setSearchQuery("");
    if (cat === "SOCCER") {
      if (!soccerLeagues.some((l) => l.slug === selectedLeagueSlug)) {
        setSelectedLeagueSlug("bra.1");
      }
    } else if (cat === "BASKETBALL") {
      setSelectedLeagueSlug("nba");
    } else if (cat === "FOOTBALL") {
      setSelectedLeagueSlug("nfl");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="relative w-full max-w-4xl max-h-[92vh] bg-[#0c0c0e] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10"
        >
          {/* Top Modal Header */}
          <div className="px-5 py-4 md:px-6 md:py-5 border-b border-white/10 flex items-center justify-between bg-zinc-950/80 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                  Gerenciar Favoritos
                  {totalFavoritesCount > 0 && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold">
                      {totalFavoritesCount} {totalFavoritesCount === 1 ? "favorito" : "favoritos"}
                    </span>
                  )}
                </h3>
                <p className="text-xs md:text-sm text-zinc-400">
                  Acompanhe seus clubes e competições favoritas com alertas em tempo real.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
              aria-label="Fechar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Navigation: Sport Category & Favorites View Tabs */}
          <div className="px-5 pt-3.5 pb-2.5 border-b border-white/5 bg-[#101014]/90 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1.5 md:gap-2">
              {/* Futebol */}
              <button
                onClick={() => handleSelectCategory("SOCCER")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition-all ${
                  activeCategory === "SOCCER"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                    : "bg-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/10 border border-transparent"
                }`}
              >
                <span>⚽</span>
                <span>Futebol</span>
              </button>

              {/* Basquete */}
              <button
                onClick={() => handleSelectCategory("BASKETBALL")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition-all ${
                  activeCategory === "BASKETBALL"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                    : "bg-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/10 border border-transparent"
                }`}
              >
                <span>🏀</span>
                <span>Basquete</span>
              </button>

              {/* Futebol Americano */}
              <button
                onClick={() => handleSelectCategory("FOOTBALL")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition-all ${
                  activeCategory === "FOOTBALL"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                    : "bg-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/10 border border-transparent"
                }`}
              >
                <span>🏈</span>
                <span>NFL</span>
              </button>

              {/* Busca Global */}
              <button
                onClick={() => handleSelectCategory("GLOBAL_SEARCH")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition-all ${
                  activeCategory === "GLOBAL_SEARCH"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                    : "bg-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/10 border border-transparent"
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Busca Global</span>
              </button>
            </div>

            {/* Meus Favoritos Pill */}
            <button
              onClick={() => handleSelectCategory("FAVORITES")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-semibold shrink-0 transition-all ${
                activeCategory === "FAVORITES"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold shadow-[0_0_18px_rgba(245,158,11,0.4)]"
                  : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20"
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${activeCategory === "FAVORITES" ? "fill-black" : "fill-amber-400"}`} />
              <span>Meus Favoritos</span>
              {totalFavoritesCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    activeCategory === "FAVORITES" ? "bg-black/20 text-black" : "bg-amber-500/30 text-amber-300"
                  }`}
                >
                  {totalFavoritesCount}
                </span>
              )}
            </button>
          </div>

          {/* Sub-Navigation: League Selector Pills (Only for SOCCER, BASKETBALL, FOOTBALL) */}
          {activeCategory !== "FAVORITES" && activeCategory !== "GLOBAL_SEARCH" && (
            <div className="px-5 py-2.5 border-b border-white/5 bg-[#141418]/60 overflow-x-auto scrollbar-none flex items-center gap-2">
              {currentCategoryLeagues.map((league) => {
                const active = league.slug === currentLeague.slug;
                const trackedCount = getTrackedTeamsCountInLeague(league.slug);
                const isLeagueFollowed = trackedLeagueSlugs.has(league.slug);

                return (
                  <button
                    key={league.slug}
                    onClick={() => {
                      setSelectedLeagueSlug(league.slug);
                      setSearchQuery("");
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                      active
                        ? "bg-white/15 text-white border border-white/20 shadow-sm"
                        : "bg-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/10 border border-transparent"
                    }`}
                  >
                    <SafeImage
                      src={league.logoUrl}
                      alt={league.name}
                      fallbackText={league.abbreviation || league.name?.substring(0, 2)}
                      className="w-4 h-4 object-contain rounded-sm"
                    />
                    <span>{league.name}</span>

                    {/* Indicator badge if league is followed or has tracked teams */}
                    {isLeagueFollowed ? (
                      <span
                        className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        title="Liga inteira favoritada"
                      >
                        Toda
                      </span>
                    ) : trackedCount > 0 ? (
                      <span
                        className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        title={`${trackedCount} time(s) favoritado(s)`}
                      >
                        {trackedCount}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}

          {/* MAIN MODAL BODY */}
          <div className="flex-1 overflow-y-auto max-h-[580px] scrollbar-thin scrollbar-thumb-zinc-800">
            {/* ---------------------------------------------------- */}
            {/* VIEW A: DEDICATED "MEUS FAVORITOS" TAB */}
            {/* ---------------------------------------------------- */}
            {activeCategory === "FAVORITES" ? (
              <div className="p-5 md:p-6 space-y-6">
                {/* Stats / Overview bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-zinc-950/60 border border-white/5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Star className="w-5 h-5 fill-amber-400" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-white">
                        {preferences?.trackedTeams?.length || 0}
                      </div>
                      <div className="text-xs text-zinc-400">Times favoritados</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-950/60 border border-white/5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-white">
                        {preferences?.trackedLeagues?.length || 0}
                      </div>
                      <div className="text-xs text-zinc-400">Ligas inteiras acompanhadas</div>
                    </div>
                  </div>
                </div>

                {/* Section: Ligas Acompanhadas */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    Ligas Acompanhadas ({preferences?.trackedLeagues?.length || 0})
                  </h4>

                  {(!preferences?.trackedLeagues || preferences.trackedLeagues.length === 0) ? (
                    <div className="p-5 rounded-2xl bg-zinc-950/40 border border-dashed border-white/10 text-center space-y-2">
                      <p className="text-xs text-zinc-400">
                        Nenhuma liga inteira está sendo acompanhada.
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        Ao favoritar uma liga completa, todas as partidas do campeonato aparecem no seu radar e dashboard.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {preferences.trackedLeagues.map((trackedLeague) => {
                        const fallbackLeague = leagues.find((l) => l.slug === trackedLeague.league);
                        const logoUrl = fallbackLeague?.logoUrl || trackedLeague.leagueLogo;

                        return (
                          <div
                            key={trackedLeague.league}
                            className="p-3.5 rounded-2xl bg-[#141418] border border-amber-500/30 flex items-center justify-between gap-3 group hover:border-amber-500/50 transition-all shadow-[0_0_15px_rgba(245,158,11,0.04)]"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <SafeImage
                                src={logoUrl}
                                alt={trackedLeague.leagueName}
                                fallbackText={trackedLeague.leagueName?.substring(0, 2)}
                                className="w-9 h-9 object-contain shrink-0"
                              />
                              <div className="min-w-0">
                                <h5 className="text-sm font-bold text-white truncate">
                                  {trackedLeague.leagueName}
                                </h5>
                                <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                                  <span className="capitalize">{trackedLeague.sport || fallbackLeague?.sport}</span>
                                  <span>•</span>
                                  <span className="text-amber-300 font-semibold flex items-center gap-1">
                                    <Bell className="w-2.5 h-2.5" /> Alertas ativos
                                  </span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => untrackLeagueMutation.mutate(trackedLeague.league)}
                              disabled={untrackLeagueMutation.isPending}
                              className="p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                              title="Deixar de acompanhar liga"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Section: Times Favoritos */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    Times Favoritos ({preferences?.trackedTeams?.length || 0})
                  </h4>

                  {(!preferences?.trackedTeams || preferences.trackedTeams.length === 0) ? (
                    <div className="p-8 rounded-2xl bg-zinc-950/40 border border-dashed border-white/10 text-center space-y-3">
                      <Shield className="w-10 h-10 mx-auto text-zinc-600" />
                      <p className="text-sm font-medium text-zinc-300">
                        Nenhum time favoritado ainda
                      </p>
                      <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                        Navegue pelas abas de Futebol, Basquete ou use a Busca Global para adicionar seus times do coração.
                      </p>
                      <button
                        onClick={() => handleSelectCategory("SOCCER")}
                        className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-colors inline-flex items-center gap-1.5"
                      >
                        Explorar Brasileirão <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {preferences.trackedTeams.map((team) => {
                        const leagueName = LEAGUE_NAMES_MAP[team.league] || team.league;

                        return (
                          <div
                            key={team.teamId}
                            className="p-3 rounded-2xl bg-[#141418] border border-amber-500/30 flex items-center justify-between gap-2.5 group hover:border-amber-500/50 transition-all shadow-[0_0_15px_rgba(245,158,11,0.05)]"
                          >
                            <div className="flex items-center gap-3 min-w-0 pr-1">
                              <SafeImage
                                src={team.logoUrl}
                                alt={team.teamDisplayName || team.teamName}
                                fallbackText={team.teamAbbreviation || team.teamName?.substring(0, 2)}
                                fallbackBg={team.primaryColor ? `#${team.primaryColor.replace("#", "")}` : undefined}
                                className="w-8 h-8 object-contain shrink-0 drop-shadow-sm"
                              />
                              <div className="min-w-0">
                                <h5 className="text-sm font-bold text-amber-200 truncate" title={team.teamDisplayName || team.teamName}>
                                  {team.teamDisplayName || team.teamName}
                                </h5>
                                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                                  {team.teamAbbreviation && (
                                    <span className="font-mono text-zinc-500 font-bold">
                                      {team.teamAbbreviation}
                                    </span>
                                  )}
                                  <span className="truncate text-zinc-400 font-medium">
                                    {leagueName}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => untrackTeamMutation.mutate({ teamId: team.teamId, sport: team.sport })}
                              disabled={untrackTeamMutation.isPending}
                              className="p-2 rounded-xl text-amber-400 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                              title="Remover dos favoritos"
                            >
                              <Star className="w-4 h-4 fill-amber-400" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : activeCategory === "GLOBAL_SEARCH" ? (
              /* ---------------------------------------------------- */
              /* VIEW B: GLOBAL SEARCH ACROSS ALL LEAGUES & SPORTS    */
              /* ---------------------------------------------------- */
              <div className="p-5 md:p-6 space-y-5">
                {/* Global Search Header & Input */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                    <input
                      type="text"
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar qualquer time em todas as ligas (ex: Flamengo, Lakers, Chiefs, Real Madrid)..."
                      className="w-full bg-[#141418] border border-amber-500/30 rounded-2xl pl-10 pr-10 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 transition-all"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Pesquise times do Brasileirão, Champions League, Libertadores, Copa do Brasil, Seleções, NBA ou NFL.
                  </p>
                </div>

                {/* Global Search Results */}
                {debouncedGlobalQuery.length < 2 ? (
                  <div className="text-center py-16 text-zinc-500 space-y-2">
                    <Compass className="w-10 h-10 mx-auto text-zinc-600" />
                    <p className="text-sm font-medium">Digite ao menos 2 letras para pesquisar</p>
                    <p className="text-xs text-zinc-600">
                      O catálogo busca instantaneamente em todas as modalidades e competições.
                    </p>
                  </div>
                ) : isLoadingGlobalSearch ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-500">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                    <span className="text-sm">Buscando times no catálogo...</span>
                  </div>
                ) : globalSearchResults.length === 0 ? (
                  <div className="text-center py-16 text-zinc-500 space-y-2">
                    <Shield className="w-10 h-10 mx-auto text-zinc-600" />
                    <p className="text-sm font-medium">Nenhum time encontrado para &quot;{debouncedGlobalQuery}&quot;</p>
                    <p className="text-xs text-zinc-600">
                      Tente buscar pelo nome da cidade, apelido ou sigla (ex: &quot;FLA&quot;, &quot;LAL&quot;, &quot;RMA&quot;).
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-zinc-400">
                      {globalSearchResults.length} {globalSearchResults.length === 1 ? "resultado encontrado" : "resultados encontrados"}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {globalSearchResults.map((team) => {
                        const teamSport = (team.sport || "").toLowerCase();
                        const isTracked = trackedTeamKeys.has(getTeamKey(teamSport, team.id));
                        const isPending =
                          (trackTeamMutation.isPending &&
                            trackTeamMutation.variables?.teamId === team.id &&
                            trackTeamMutation.variables?.sport?.toLowerCase() === teamSport) ||
                          (untrackTeamMutation.isPending &&
                            untrackTeamMutation.variables?.teamId === team.id &&
                            (!untrackTeamMutation.variables?.sport ||
                              untrackTeamMutation.variables?.sport?.toLowerCase() === teamSport));
                        const leagueName = LEAGUE_NAMES_MAP[team.league] || team.league;

                        return (
                          <div
                            key={team.id}
                            className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 group ${
                              isTracked
                                ? "bg-amber-500/10 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.06)]"
                                : "bg-[#141418] hover:bg-[#18181d] border-white/5 hover:border-white/15"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 pr-2">
                              <SafeImage
                                src={team.logoUrl}
                                alt={team.displayName || team.name}
                                fallbackText={team.abbreviation || team.name?.substring(0, 2)}
                                fallbackBg={team.color ? `#${team.color.replace("#", "")}` : undefined}
                                className="w-8 h-8 object-contain shrink-0 drop-shadow-sm group-hover:scale-105 transition-transform"
                              />
                              <div className="min-w-0">
                                <h5
                                  className={`text-sm font-semibold truncate ${
                                    isTracked ? "text-amber-200 font-bold" : "text-zinc-200"
                                  }`}
                                  title={team.displayName || team.name}
                                >
                                  {team.displayName || team.name}
                                </h5>
                                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                                  {team.abbreviation && (
                                    <span className="font-mono text-zinc-500 font-bold">
                                      {team.abbreviation}
                                    </span>
                                  )}
                                  <span className="px-1.5 py-0.2 rounded bg-white/5 text-zinc-400 font-medium truncate">
                                    {leagueName}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => handleToggleTeam(team)}
                              disabled={isPending}
                              className={`p-2 rounded-xl transition-all shrink-0 ${
                                isTracked
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30"
                                  : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-transparent"
                              }`}
                              title={isTracked ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                            >
                              {isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                              ) : (
                                <Star
                                  className={`w-4 h-4 ${
                                    isTracked ? "fill-amber-400 text-amber-400" : ""
                                  }`}
                                />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ---------------------------------------------------- */
              /* VIEW C: REGULAR LEAGUE BROWSING (SOCCER, NBA, NFL)  */
              /* ---------------------------------------------------- */
              <div className="p-5 md:p-6 space-y-4">
                {/* Highlighted Banner to Follow Entire Selected League */}
                <div className="relative p-4 md:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-zinc-900/60 to-transparent border border-amber-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <SafeImage
                      src={currentLeague.logoUrl}
                      alt={currentLeague.name}
                      fallbackText={currentLeague.abbreviation || currentLeague.name?.substring(0, 2)}
                      className="w-11 h-11 object-contain drop-shadow"
                    />
                    <div>
                      <h4 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
                        Acompanhar toda a {currentLeague.name}
                        {isCurrentLeagueTracked && (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Ativo
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-zinc-400 max-w-lg leading-relaxed">
                        Você receberá alertas e verá automaticamente todas as partidas desta competição
                        no seu radar de jogos e dashboard.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleLeague()}
                    disabled={trackLeagueMutation.isPending || untrackLeagueMutation.isPending}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all shrink-0 ${
                      isCurrentLeagueTracked
                        ? "bg-amber-500 text-black hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.35)]"
                        : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                    }`}
                  >
                    {trackLeagueMutation.isPending || untrackLeagueMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isCurrentLeagueTracked ? (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        Acompanhando Toda a Liga
                      </>
                    ) : (
                      <>
                        <Bell className="w-4 h-4" />
                        Acompanhar Toda a Liga
                      </>
                    )}
                  </button>
                </div>

                {/* Instant Search Bar for Current League */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Buscar times em ${currentLeague.name}...`}
                    className="w-full bg-[#141418] border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Teams Grid for current league */}
                {isLoadingTeams ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-500">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500/70" />
                    <span className="text-sm">Carregando catálogo de times...</span>
                  </div>
                ) : filteredTeams.length === 0 ? (
                  <div className="text-center py-14 text-zinc-500 space-y-3 bg-zinc-950/30 rounded-2xl border border-dashed border-white/10 p-6">
                    <Shield className="w-10 h-10 mx-auto text-zinc-600" />
                    <p className="text-sm font-medium">Nenhum time encontrado para &quot;{searchQuery}&quot; nesta liga</p>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                      Deseja buscar este time em todas as ligas (Brasileirão, Champions, Libertadores, NBA, NFL)?
                    </p>
                    <button
                      onClick={() => setActiveCategory("GLOBAL_SEARCH")}
                      className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 text-xs font-semibold inline-flex items-center gap-2 transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Buscar em Todo o Catálogo
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {filteredTeams.map((team) => {
                      const teamSport = (team.sport || currentLeague.sport || "").toLowerCase();
                      const isTracked = trackedTeamKeys.has(getTeamKey(teamSport, team.id));
                      const isPending =
                        (trackTeamMutation.isPending &&
                          trackTeamMutation.variables?.teamId === team.id &&
                          trackTeamMutation.variables?.sport?.toLowerCase() === teamSport) ||
                        (untrackTeamMutation.isPending &&
                          untrackTeamMutation.variables?.teamId === team.id &&
                          (!untrackTeamMutation.variables?.sport ||
                            untrackTeamMutation.variables?.sport?.toLowerCase() === teamSport));

                      return (
                        <div
                          key={team.id}
                          className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 group ${
                            isTracked
                              ? "bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.05)]"
                              : "bg-[#141418]/80 hover:bg-[#18181c] border-white/5 hover:border-white/15"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <SafeImage
                              src={team.logoUrl}
                              alt={team.name}
                              fallbackText={team.abbreviation || team.name?.substring(0, 2)}
                              fallbackBg={team.color ? `#${team.color.replace("#", "")}` : undefined}
                              className="w-8 h-8 object-contain shrink-0 drop-shadow-sm group-hover:scale-105 transition-transform"
                            />
                            <div className="min-w-0">
                              <h5
                                className={`text-sm font-semibold truncate ${
                                  isTracked ? "text-amber-200 font-bold" : "text-zinc-200"
                                }`}
                                title={team.displayName || team.name}
                              >
                                {team.displayName || team.name}
                              </h5>
                              {team.abbreviation && (
                                <span className="text-[10px] text-zinc-500 font-mono">
                                  {team.abbreviation}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleToggleTeam(team)}
                            disabled={isPending}
                            className={`p-2 rounded-xl transition-all shrink-0 ${
                              isTracked
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30"
                                : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-transparent"
                            }`}
                            title={isTracked ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                          >
                            {isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                            ) : (
                              <Star
                                className={`w-4 h-4 ${
                                  isTracked ? "fill-amber-400 text-amber-400" : ""
                                }`}
                              />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 md:p-5 border-t border-white/10 bg-zinc-950/90 flex items-center justify-between text-xs text-zinc-400">
            <div>
              {activeCategory === "FAVORITES" ? (
                <span>
                  Total de <strong className="text-white">{preferences?.trackedTeams?.length || 0}</strong> times e{" "}
                  <strong className="text-white">{preferences?.trackedLeagues?.length || 0}</strong> ligas favoritas
                </span>
              ) : activeCategory === "GLOBAL_SEARCH" ? (
                <span>Busca em tempo real em todas as ligas e esportes</span>
              ) : (
                <span>
                  Mostrando <strong className="text-white">{filteredTeams.length}</strong> times de{" "}
                  <strong className="text-white">{currentLeague.name}</strong>
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
            >
              Concluído
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
