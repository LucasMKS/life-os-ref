export interface AuthDTO {
  email: string;
  password: string;
  name?: string;
  nickname?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface User {
  id: string;
  name: string;
  email: string;
  nickname: string;
  role: string;
}

export interface Movie {
  id: string;
  title: string;
  movieId: string;
  rating: number;
  comment?: string;
  email: string;
  poster_path: string;
  createdAt: string;
  modifiedAt?: string;
}
export interface Serie {
  id: string;
  title: string;
  serieId: string;
  rating: number;
  comment?: string;
  email: string;
  poster_path: string;
  createdAt: string;
  modifiedAt?: string;
}

export interface FavoriteMovie {
  id: string;
  movieId: string;
  email: string;
  favorite: boolean;
}

export interface FavoriteSerie {
  id: string;
  serieId: string;
  email: string;
  favorite: boolean;
}

export interface FavoriteStatusResponse {
  movieId: string;
  isFavorite: boolean;
}

export interface FavoriteSerieStatusResponse {
  serieId: string;
  isFavorite: boolean;
}

export interface TmdbProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface TmdbWatchProviders {
  results: {
    BR?: {
      link: string;
      flatrate?: TmdbProvider[];
      rent?: TmdbProvider[];
      buy?: TmdbProvider[];
    };
  };
}

export interface TmdbCast {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface TmdbVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

export interface TmdbMovie {
  id: number;
  title: string;
  original_title: string;
  overview?: string;
  homepage?: string;
  poster_path?: string;
  backdrop_path?: string;
  release_date?: string;
  vote_average?: number;
  vote_count?: number;
  genre_ids?: number[];
  genres?: Array<{
    id: number;
    name: string;
  }>;
  adult?: boolean;
  original_language?: string;
  popularity?: number;
  runtime?: number;
  budget?: number;
  revenue?: number;
  production_companies?: Array<{
    id: number;
    name: string;
    logo_path?: string;
  }>;
  credits?: { cast: TmdbCast[] };
  videos?: { results: TmdbVideo[] };
  "watch/providers"?: TmdbWatchProviders;
  recommendations?: { results: TmdbMovie[] };
  tagline?: string;
}

export interface TmdbSerie {
  id: number;
  name: string;
  original_name: string;
  overview?: string;
  homepage?: string;
  poster_path?: string;
  backdrop_path?: string;
  first_air_date?: string;
  last_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  genre_ids?: number[];
  genres?: Array<{
    id: number;
    name: string;
  }>;
  adult?: boolean;
  original_language?: string;
  popularity?: number;
  number_of_episodes?: number;
  number_of_seasons?: number;
  episode_run_time?: number[];
  status?: string;
  type?: string;
  networks?: Array<{
    id: number;
    name: string;
    logo_path?: string;
  }>;
  production_companies?: Array<{
    id: number;
    name: string;
    logo_path?: string;
  }>;
  created_by?: Array<{
    id: number;
    name: string;
    profile_path?: string;
  }>;
  last_episode_to_air?: {
    name: string;
    air_date: string;
    episode_number: number;
    season_number: number;
  };
  next_episode_to_air?: {
    name: string;
    air_date: string;
    episode_number: number;
    season_number: number;
  };
  seasons?: Array<{
    id: number;
    name: string;
    overview: string;
    poster_path?: string;
    season_number: number;
    episode_count: number;
    air_date?: string;
  }>;
  credits?: { cast: TmdbCast[] };
  videos?: { results: TmdbVideo[] };
  "watch/providers"?: TmdbWatchProviders;
  recommendations?: { results: TmdbSerie[] };
  tagline?: string;
}

export interface FavoriteMovieEnriched extends FavoriteMovie {
  tmdbData?: TmdbMovie;
}

export interface FavoriteSerieEnriched extends FavoriteSerie {
  tmdbData?: TmdbSerie;
}

export interface AppApiResponse<T> {
  data: T;
  message: string;
}

export interface SimpleApiResponse {
  message: string;
}

export interface TmdbPage<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
  timestamp?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  nickname: string;
  password: string;
  confirmPassword: string;
}

export interface WatchlistMovie {
  id: string;
  email: string;
  movieId: string;
  addedAt: string;
}

export interface WatchlistSerie {
  id: string;
  email: string;
  serieId: string;
  addedAt: string;
}

export interface EnrichedWatchlistMovie {
  type: "movie";
  id: string;
  internalId: string;
  title: string;
  poster: string;
  backdrop: string | null;
  overview: string;
  genres: string[];
  year: string;
  tmdbData: TmdbMovie;
  addedAt: string;
}

export interface EnrichedWatchlistSerie {
  type: "serie";
  id: string;
  internalId: string;
  title: string;
  poster: string;
  backdrop: string | null;
  overview: string;
  genres: string[];
  year: string;
  tmdbData: TmdbSerie;
  addedAt: string;
}

export interface AppNotification {
  id: string;
  userId?: string;
  message: string;
  type: "F1" | "FINANCE" | "GAMING" | "READING" | "SYSTEM" | "SPORTS";
  isRead: boolean;
  createdAt: string;
}

export interface UserNotificationSettings {
  userId: string;
  telegramChatId?: string | null;
  telegramEnabled: boolean;
  mediaEnabled: boolean;
  gamingEnabled: boolean;
  twitchEnabled: boolean;
  f1Enabled: boolean;
  sportsEnabled: boolean;
  financeEnabled: boolean;
  readingEnabled: boolean;
  weatherEnabled: boolean;
  mediaTime: string;
  sportsMorningTime: string;
  f1BriefingTime: string;
  financeTime: string;
  readingTime: string;
  weatherTime: string;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export type ItineraryCategory =
  | "ATTRACTION"
  | "FOOD"
  | "TRANSPORT"
  | "LODGING"
  | "SHOPPING"
  | "LEISURE"
  | "OTHER";

export interface ItineraryItem {
  id: number;
  title: string;
  dateTime: string;
  locationName?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  category?: ItineraryCategory | string;
  completed?: boolean;
}

export type PlacePriority = "MUST_VISIT" | "HIGH" | "MEDIUM" | "LOW";

export type PlaceCategory =
  | "ATTRACTION"
  | "RESTAURANT"
  | "CAFE"
  | "MUSEUM"
  | "VIEWPOINT"
  | "PARK"
  | "SHOPPING"
  | "NIGHTLIFE"
  | "OTHER";

export interface PlaceToVisit {
  id: string;
  name: string;
  category: PlaceCategory;
  neighborhood?: string;
  address?: string;
  priority: PlacePriority;
  notes?: string;
  estimatedCost?: string;
  visited: boolean;
  mapUrl?: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  category?: string;
  storeOrLocation?: string;
  estimatedPrice?: number;
  currency?: string; // e.g. "BRL", "USD", "EUR", "GBP", "JPY"
  priority?: "HIGH" | "MEDIUM" | "LOW";
  notes?: string;
  purchased: boolean;
}

export type TripTaskCategory =
  | "DOCUMENTS"
  | "TRANSPORT"
  | "FINANCES"
  | "HEALTH_INSURANCE"
  | "BOOKINGS"
  | "SHOPPING"
  | "GENERAL";

export interface TripTask {
  id: string;
  title: string;
  category: TripTaskCategory;
  dueDate?: string;
  notes?: string;
  completed: boolean;
}

export interface PackingItem {
  id: string;
  text: string;
  category?: "CLOTHES" | "HYGIENE" | "ELECTRONICS" | "DOCUMENTS" | "ACCESSORIES" | "MEDICINE" | "OTHER";
  done: boolean;
}

export interface Trip {
  id: number;
  destination: string;
  startDate: string;
  endDate: string;
  flightInfo?: string;
  hotelInfo?: string;
  notes?: string;
  checklistJson?: string;
  placesJson?: string;
  shoppingJson?: string;
  tasksJson?: string;
  userId: string;
  itinerary: ItineraryItem[];
}

export interface EpisodeDTO {
  seasonNumber: number;
  episodeNumber: number;
  name: string;
  airDate: string;
  overview: string;
  stillPath: string | null;
  watched: boolean;
  rating?: number;
  watchedAt?: string;
}

export interface SerieWatchStatusDTO {
  tmdbId: string;
  title: string;
  posterUrl: string | null;
  nextToWatch: EpisodeDTO | null;
  unwatchedCount: number;
  totalAiredEpisodes: number;
  episodes: EpisodeDTO[];
  watchLater?: boolean;
  rewatching?: boolean;
  rewatchCount?: number;
  inProduction?: boolean;
  status?: string;
  genres?: string[];
  networks?: string[];
  nextAirDate?: string | null;
  firstAirDate?: string | null;
  rating?: number;
}

// ======================== SPORTS ========================

export interface SportLeague {
  id: string;
  slug: string;
  name: string;
  displayName: string;
  abbreviation: string;
  sport: string;
  logoUrl: string;
  seasonYear?: number;
  calendarDates?: string[];
  isFollowed?: boolean;
}

export interface SportTeam {
  id: string;
  uid?: string;
  slug?: string;
  name: string;
  displayName: string;
  shortDisplayName?: string;
  abbreviation?: string;
  color?: string;
  alternateColor?: string;
  logoUrl: string;
  darkLogoUrl?: string;
  sport: string;
  league: string;
  isFollowed?: boolean;
}

export interface TeamCompetitor {
  id: string;
  name: string;
  displayName: string;
  shortDisplayName?: string;
  abbreviation?: string;
  logoUrl: string;
  color?: string;
  score?: number;
  winner?: boolean;
  record?: string;
  homeAway?: "home" | "away" | string;
}

export interface Venue {
  name: string;
  city?: string;
  country?: string;
}

export interface SportMatch {
  id: string;
  sport: string;
  league: string;
  leagueName?: string;
  season?: number;
  date: string;
  matchDate?: string;
  name: string;
  shortName?: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "HALFTIME" | "FINISHED" | "POSTPONED" | "CANCELED" | string;
  statusDetail?: string;
  period?: number;
  displayClock?: string;
  homeTeam: TeamCompetitor;
  awayTeam: TeamCompetitor;
  venue?: Venue;
  broadcast?: string;
  isUserTrackedMatch?: boolean;
}

export interface TrackedTeam {
  id?: string;
  userId?: string;
  sport: string;
  league: string;
  teamId: string;
  teamName: string;
  teamDisplayName?: string;
  teamAbbreviation?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  notifyMatches?: boolean;
  createdAt?: string;
}

export interface TrackedLeague {
  id?: string;
  userId?: string;
  sport: string;
  league: string;
  leagueName: string;
  leagueLogo?: string;
  notifyMatches?: boolean;
  createdAt?: string;
}

export interface SportsUserPreferences {
  trackedTeams: TrackedTeam[];
  trackedLeagues: TrackedLeague[];
}

export interface TrackTeamPayload {
  sport: string;
  league: string;
  teamId: string;
  teamName: string;
  teamDisplayName?: string;
  teamAbbreviation?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  notifyMatches?: boolean;
}

export interface TrackLeaguePayload {
  sport: string;
  league: string;
  leagueName: string;
  leagueLogo?: string;
  notifyMatches?: boolean;
}

export interface ScoreboardResponse {
  sport: string;
  league: string;
  leagueName: string;
  queryDate: string;
  matches: SportMatch[];
}

export interface MatchLineScore {
  displayValue: string;
  value?: number;
  period?: number;
}

export interface MatchStatItem {
  name: string;
  label: string;
  displayValue: string;
}

export interface MatchTeamStats {
  teamId: string;
  displayName: string;
  abbreviation?: string;
  logo?: string;
  statistics: MatchStatItem[];
}

export interface MatchKeyEvent {
  id: string;
  type?: string;
  typeText?: string;
  text: string;
  shortText?: string;
  clock?: string;
  teamId?: string;
  teamName?: string;
  scoringPlay?: boolean;
  athleteName?: string;
}

export interface MatchLeaderAthlete {
  id: string;
  displayName: string;
  shortName?: string;
  jersey?: string;
  position?: string;
  headshot?: string;
}

export interface MatchLeaderCategory {
  name: string;
  displayName: string;
  leaders: Array<{
    displayValue: string;
    value?: number;
    athlete: MatchLeaderAthlete;
  }>;
}

export interface MatchTeamLeaders {
  teamId: string;
  displayName: string;
  leaders: MatchLeaderCategory[];
}

export interface MatchOfficial {
  fullName: string;
  displayName: string;
  position: string;
}

export interface MatchSummary {
  id: string;
  sport: string;
  league: string;
  gamecastUrl?: string;
  attendance?: number;
  officials?: MatchOfficial[];
  venue?: Venue;
  broadcasts?: string[];
  homeLineScores?: MatchLineScore[];
  awayLineScores?: MatchLineScore[];
  teamStats?: {
    home: MatchStatItem[];
    away: MatchStatItem[];
  };
  keyEvents?: MatchKeyEvent[];
  leaders?: MatchTeamLeaders[];
}



