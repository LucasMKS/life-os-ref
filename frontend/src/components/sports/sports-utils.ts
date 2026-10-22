import { SportLeague, SportMatch } from "@/lib/types";
import { parseMatchDate } from "@/lib/date-utils";

/** Ligas exibidas na Central de Esportes (ordem = ordem de exibição dos grupos). */
export const SUPPORTED_LEAGUES: SportLeague[] = [
  {
    id: "bra.1",
    slug: "bra.1",
    name: "Brasileirão Série A",
    displayName: "Brasileirão Série A",
    abbreviation: "Brasileirão",
    sport: "soccer",
    logoUrl: "https://a.espncdn.com/i/leaguelogos/soccer/500/85.png",
  },
  {
    id: "bra.copa_do_brazil",
    slug: "bra.copa_do_brazil",
    name: "Copa do Brasil",
    displayName: "Copa do Brasil",
    abbreviation: "Copa do Brasil",
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
    abbreviation: "Champions",
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
    id: "fifa.wwc",
    slug: "fifa.wwc",
    name: "Copa do Mundo Feminina",
    displayName: "Copa do Mundo Feminina",
    abbreviation: "Copa Feminina",
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

const LEAGUE_ALIASES: Record<string, string> = {
  "bra.copa_do_brasil": "bra.copa_do_brazil",
  copa_do_brasil: "bra.copa_do_brazil",
};

export function normalizeLeagueSlug(slug?: string): string {
  if (!slug) return "";
  return LEAGUE_ALIASES[slug] || slug;
}

export function findLeague(slug?: string): SportLeague | undefined {
  const norm = normalizeLeagueSlug(slug);
  return SUPPORTED_LEAGUES.find((l) => l.slug === norm || l.id === norm);
}

export function isLiveStatus(status?: string): boolean {
  const s = (status || "").toUpperCase();
  return (
    s.includes("IN_PROGRESS") ||
    s.includes("FIRST_HALF") ||
    s.includes("SECOND_HALF") ||
    s.includes("HALFTIME") ||
    s.includes("LIVE")
  );
}

export function isFinishedStatus(status?: string): boolean {
  const s = (status || "").toUpperCase();
  return (
    s.includes("FINISHED") ||
    s.includes("FINAL") ||
    s === "FT" ||
    s.includes("POST") ||
    s.includes("COMPLETED")
  );
}

export function isCanceledStatus(status?: string): boolean {
  const s = (status || "").toUpperCase();
  return s.includes("CANCEL") || s.includes("POSTPONED");
}

export function matchTimestamp(m: SportMatch): number {
  return parseMatchDate(m.matchDate || m.date)?.getTime() || 0;
}

/** Hora local (HH:mm) de uma partida. */
export function formatKickoff(m: SportMatch): string {
  const d = parseMatchDate(m.matchDate || m.date);
  if (!d) return "--:--";
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export interface FavoriteLookup {
  teamKeys: Set<string>;
  leagueSlugs: Set<string>;
}

export function isFavoriteMatch(m: SportMatch, fav: FavoriteLookup): boolean {
  if (m.isUserTrackedMatch) return true;
  const sport = (m.sport || "").toLowerCase();
  return (
    (!!m.homeTeam?.id && fav.teamKeys.has(`${sport}::${m.homeTeam.id}`)) ||
    (!!m.awayTeam?.id && fav.teamKeys.has(`${sport}::${m.awayTeam.id}`)) ||
    fav.leagueSlugs.has(normalizeLeagueSlug(m.league))
  );
}
