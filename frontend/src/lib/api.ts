import axios from "axios";
import { useAuthStore } from "./authStore";
import { toast } from "sonner";
import {
  AuthDTO,
  AuthResponse,
  AppNotification,
  UserNotificationSettings,
  SportLeague,
  SportTeam,
  SportMatch,
  SportsUserPreferences,
  TrackTeamPayload,
  TrackLeaguePayload,
  ScoreboardResponse,
  MatchSummary,
} from "./types";

const BASE_GATEWAY_URL = (import.meta as any).env?.VITE_API_URL || "";
const AUTH_API_URL = "https://api-filmes.lucasmks.com.br/lms-filmes";
const RATING_API_URL = "https://api-filmes.lucasmks.com.br";

export const api = axios.create({
  baseURL: BASE_GATEWAY_URL ? `${BASE_GATEWAY_URL}/api/v1` : "/api/v1",
  headers: { "Content-Type": "application/json" },
});

export const authApi = axios.create({
  baseURL: AUTH_API_URL,
});

export const ratingApi = axios.create({
  baseURL: RATING_API_URL,
});

const requestInterceptor = (config: any) => {
  const { token, userId } = useAuthStore.getState();

  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (userId) config.headers["X-User-Id"] = userId;

  return config;
};

api.interceptors.request.use(requestInterceptor);
authApi.interceptors.request.use(requestInterceptor);
ratingApi.interceptors.request.use(requestInterceptor);

const responseErrorInterceptor = (error: any) => {
  if (error.response?.status === 401 || error.response?.status === 403) {
    useAuthStore.getState().logout();

    if (
      typeof window !== "undefined" &&
      !window.location.pathname.includes("/login")
    ) {
      toast.error("Sessão expirada", { description: "Faça login novamente" });
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }

  if (error.response?.status === 503) {
    const fallbackMessage =
      error.response?.data?.message ||
      "Serviço temporariamente indisponível. Tente novamente em instantes.";

    // Debounce or show only once per a few seconds could be better, but the critical fix is to reject.
    toast.error("Instabilidade Detectada", {
      id: "instability-error",
      description: fallbackMessage,
      duration: 6000,
    });

    return Promise.reject(error);
  }

  return Promise.reject(error);
};

api.interceptors.response.use((res) => res, responseErrorInterceptor);
authApi.interceptors.response.use((res) => res, responseErrorInterceptor);
ratingApi.interceptors.response.use((res) => res, responseErrorInterceptor);

// ==========================================
// SERVIÇOS DE AUTENTICAÇÃO
// ==========================================
export const authService = {
  login: (payload: AuthDTO): Promise<AuthResponse> =>
    authApi.post("/auth/login", payload).then((res) => res.data),

  register: (payload: AuthDTO): Promise<AuthResponse> =>
    authApi.post("/auth/register", payload).then((res) => res.data),
};

// ==========================================
// SERVIÇOS DE FÓRMULA 1
// ==========================================
export const f1Api = {
  getNextSessions: async () => {
    const response = await api.get("/f1/sessions/next");
    return response.data;
  },
  getStandings: async () => {
    const response = await api.get("/f1/standings");
    return response.data;
  },
  getConstructorStandings: async () => {
    const response = await api.get("/f1/standings/constructors");
    return response.data;
  },
  getCircuitInfo: async () => {
    const response = await api.get("/f1/circuits/next");
    return response.data;
  },
  getLastPodium: async () => {
    const response = await api.get("/f1/podium/last");
    return response.data;
  },
  getLiveWeather: async () => {
    const response = await api.get("/f1/weather/latest");
    return response.data;
  },
  getNews: async () => {
    const response = await api.get("/f1/news");
    return response.data;
  },
};

// ==========================================
// SERVIÇO DE LEITURA (READING)
// ==========================================
export const readingApi = {
  getLibrary: async () => {
    const response = await api.get("/reading/library");
    return response.data;
  },
  searchBooks: async (query: string) => {
    const response = await api.get(
      `/reading/search?query=${encodeURIComponent(query)}`,
    );
    return response.data;
  },
  addBook: async (book: any) => {
    const response = await api.post("/reading/library", book);
    return response.data;
  },
  updateProgress: async (payload: {
    id: string;
    pagesRead: number;
    totalPages: number;
  }) => {
    const response = await api.patch(`/reading/${payload.id}/progress`, {
      pagesRead: payload.pagesRead,
      totalPages: payload.totalPages,
    });
    return response.data;
  },
  updateDailyPages: async (payload: {
    bookId: string;
    date: string;
    pagesRead: number;
  }) => {
    const response = await api.patch(
      `/reading/${payload.bookId}/sessions/by-date`,
      { date: payload.date, pagesRead: payload.pagesRead },
    );
    return response.data;
  },
  deleteBook: async (id: string) => {
    const response = await api.delete(`/reading/${id}`);
    return response.data;
  },
  rateBook: async (payload: {
    bookId: string;
    rating: number;
    review: string;
  }) => {
    const response = await api.post(`/reading/books/${payload.bookId}/rate`, {
      rating: payload.rating,
      review: payload.review,
    });
    return response.data;
  },
  getBookDetails: async (id: string) => {
    const response = await api.get(`/reading/books/${id}`);
    return response.data;
  },
  addBookNote: async (payload: { bookId: string; note: string }) => {
    const response = await api.post(`/reading/books/${payload.bookId}/notes`, {
      note: payload.note,
    });
    return response.data;
  },
  editBookNote: async (payload: {
    bookId: string;
    noteId: string;
    note: string;
  }) => {
    const response = await api.put(
      `/reading/books/${payload.bookId}/notes/${payload.noteId}`,
      {
        note: payload.note,
      },
    );
    return response.data;
  },
  deleteBookNote: async (payload: { bookId: string; noteId: string }) => {
    const response = await api.delete(
      `/reading/books/${payload.bookId}/notes/${payload.noteId}`,
    );
    return response.data;
  },
  updateCover: async (payload: { bookId: string; coverUrl: string }) => {
    const response = await api.patch(
      `/reading/books/${payload.bookId}/cover`,
      { coverUrl: payload.coverUrl },
    );
    return response.data;
  },
  updateAuthor: async (payload: { bookId: string; author: string }) => {
    const response = await api.patch(
      `/reading/books/${payload.bookId}/author`,
      { author: payload.author },
    );
    return response.data;
  },
  getReadingPulse: async () => {
    const response = await api.get("/reading/stats/pulse");
    return response.data;
  },
  getReadingSummary: async () => {
    const response = await api.get("/reading/stats/summary");
    return response.data;
  },
  getRecentNotes: async (limit = 5) => {
    const response = await api.get(`/reading/stats/recent-notes?limit=${limit}`);
    return response.data;
  },
};

export const notesApi = {
  getNotes: async () => {
    const response = await api.get("/notes");
    return response.data;
  },
  createNote: async (data: FormData) => {
    const response = await api.post("/notes", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
  updateNote: async (data: { id: string } & any) => {
    const { id, ...rest } = data;
    const response = await api.put(`/notes/${id}`, rest);
    return response.data;
  },
  deleteNote: async (id: string) => {
    const response = await api.delete(`/notes/${id}`);
    return response.data;
  },
};

// ==========================================
// SERVIÇOS FINANCEIROS
// ==========================================
export const financeApi = {
  getSubscriptions: async () => {
    const response = await api.get("/finance/subscriptions");
    return response.data;
  },
  addSubscription: async (subscription: any) => {
    const response = await api.post("/finance/subscriptions", subscription);
    return response.data;
  },
  markAsPaid: async (id: string) => {
    const response = await api.post(`/finance/subscriptions/${id}/pay`);
    return response.data;
  },
  deleteSubscription: async (id: string) => {
    const response = await api.delete(`/finance/subscriptions/${id}`);
    return response.data;
  },
  editSubscription: async (payload: any) => {
    const response = await api.put(
      `/finance/subscriptions/${payload.id}`,
      payload,
    );
    return response.data;
  },
};

// ==========================================
// SERVIÇOS DE NOTIFICAÇÃO
// ==========================================
export const notificationApi = {
  getAll: async (): Promise<AppNotification[]> => {
    const response = await api.get("/notifications");
    return response.data;
  },
  getRecent: async (): Promise<AppNotification[]> => {
    const response = await api.get("/notifications/recent");
    return response.data;
  },
  markAsRead: async (id: string) => {
    await api.patch(`/notifications/${id}/read`);
  },
  markAllAsRead: async () => {
    await api.post("/notifications/read-all");
  },
  getStreamUrl: () => `${BASE_GATEWAY_URL}/api/v1/notifications/stream`,
  testBot: async () => {
    const response = await api.get("/notifications/test");
    return response.data;
  },
};

export const notificationSettingsApi = {
  getSettings: async (): Promise<UserNotificationSettings> => {
    const response = await api.get("/notifications/settings");
    return response.data;
  },
  updateSettings: async (
    settings: Partial<UserNotificationSettings>
  ): Promise<UserNotificationSettings> => {
    const response = await api.put("/notifications/settings", settings);
    return response.data;
  },
  testTelegram: async (
    chatId?: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.post("/notifications/settings/test-telegram", {
      chatId,
    });
    return response.data;
  },
};

export const gamingApi = {
  // --- STEAM / RIOT NEWS ---
  getNews: async () => {
    const response = await api.get("/gaming/news");
    return response.data;
  },
  getTrackedGames: async () => {
    const response = await api.get("/gaming/preferences");
    return response.data;
  },
  searchSteamGames: async (query: string) => {
    const response = await api.get("/gaming/steam/search", {
      params: { query },
    });
    return response.data;
  },
  addTrackedGame: async (payload: { game: string; steamAppId: number }) => {
    const response = await api.post("/gaming/preferences", payload);
    return response.data;
  },
  deleteTrackedGame: async (id: string) => {
    const response = await api.delete(`/gaming/preferences/${id}`);
    return response.data;
  },

  // --- TWITCH ---
  getLiveStreams: async () => {
    const response = await api.get("/gaming/twitch/live");
    return response.data;
  },
  getTrackedTwitchChannels: async () => {
    const response = await api.get("/gaming/twitch/preferences");
    return response.data;
  },
  addTrackedTwitchChannel: async (payload: { channelName: string }) => {
    const response = await api.post("/gaming/twitch/preferences", payload);
    return response.data;
  },
  deleteTrackedTwitchChannel: async (id: string) => {
    const response = await api.delete(`/gaming/twitch/preferences/${id}`);
    return response.data;
  },

  // --- ROTINA DE CLIMA ---
  getRoutineWeather: async () => {
    const response = await api.get("/gaming/weather/current");
    return response.data;
  },

  // --- NEW STEAM INTEGRATION ---
  linkSteamAccount: async (steamId: string) => {
    const response = await api.post("/gaming/steam/link", null, {
      params: { steamId },
    });
    return response.data;
  },
  getSteamProfile: async () => {
    const response = await api.get("/gaming/steam/profile");
    return response.data;
  },
  getSteamStatus: async () => {
    const response = await api.get("/gaming/steam/status");
    return response.data;
  },
  getSteamLibrary: async () => {
    const response = await api.get("/gaming/steam/library");
    return response.data;
  },
  getRecommendations: async () => {
    const response = await api.get("/gaming/steam/recommendations");
    return response.data;
  },
  updateJournal: async (payload: {
    appId: number;
    name: string;
    status?: string;
    rating?: number;
    generalComments?: string;
  }) => {
    const response = await api.post("/gaming/journal", payload);
    return response.data;
  },
  getJournal: async () => {
    const response = await api.get("/gaming/journal");
    return response.data;
  },
  addJournalNote: async (trackedGameId: string, content: string) => {
    const response = await api.post(
      `/gaming/journal/${trackedGameId}/notes`,
      content,
    );
    return response.data;
  },
  getJournalNotes: async (trackedGameId: string) => {
    const response = await api.get(`/gaming/journal/${trackedGameId}/notes`);
    return response.data;
  },
  deleteFromJournal: async (appId: number) => {
    await api.delete(`/gaming/journal/${appId}`);
  },
  updateQueue: async (appId: number, priority: number) => {
    const response = await api.put(`/gaming/queue/${appId}`, null, {
      params: { priority },
    });
    return response.data;
  },
  getQueue: async () => {
    const response = await api.get("/gaming/queue");
    return response.data;
  },
};

export const radarApi = {
  getUpcomingReleases: async () => {
    const response = await api.get("/gaming/radar/upcoming");
    return response.data;
  },
  getWeeklyCalendar: async () => {
    const response = await api.get("/gaming/radar/weekly");
    return response.data;
  },
  getMediaOverview: async () => {
    const response = await api.get("/gaming/radar/overview");
    return response.data;
  },
  getEpisodesToWatch: async () => {
    const response = await api.get("/gaming/radar/episodes/to-watch");
    return response.data;
  },
  watchEpisode: async (serieId: string, seasonNumber: number, episodeNumber: number) => {
    const response = await api.post("/gaming/radar/episodes/watch", null, {
      params: { serieId, seasonNumber, episodeNumber },
    });
    return response.data;
  },
  unwatchEpisode: async (serieId: string, seasonNumber: number, episodeNumber: number) => {
    const response = await api.post("/gaming/radar/episodes/unwatch", null, {
      params: { serieId, seasonNumber, episodeNumber },
    });
    return response.data;
  },
  watchAllUpTo: async (
    serieId: string,
    seasonNumber: number,
    episodeNumber: number,
  ) => {
    const response = await api.post(
      "/gaming/radar/episodes/watch-all-up-to",
      null,
      {
        params: { serieId, seasonNumber, episodeNumber },
      },
    );
    return response.data;
  },
  rateEpisode: async (
    serieId: string,
    seasonNumber: number,
    episodeNumber: number,
    rating: number,
  ) => {
    const response = await api.post("/gaming/radar/episodes/rate", null, {
      params: { serieId, seasonNumber, episodeNumber, rating },
    });
    return response.data;
  },
  toggleWatchLater: async (serieId: string, watchLater: boolean) => {
    const response = await api.post("/gaming/radar/series/watch-later", null, {
      params: { serieId, watchLater },
    });
    return response.data;
  },
  startRewatch: async (serieId: string) => {
    const response = await api.post("/gaming/radar/series/rewatch", null, {
      params: { serieId },
    });
    return response.data;
  },
  cancelRewatch: async (serieId: string) => {
    const response = await api.post("/gaming/radar/series/cancel-rewatch", null, {
      params: { serieId },
    });
    return response.data;
  },
};


export const statsApi = {
  getMediaBalance: async () => {
    const response = await ratingApi.get("/lms-rating/stats/balance");
    return response.data;
  },
  getDailyPlaytime: async (startDate?: string, endDate?: string) => {
    const response = await api.get("/gaming/stats/playtime", {
      params: { startDate, endDate },
    });
    return response.data;
  },
};

// ==========================================
// SERVIÇOS DE VIAGEM (TRAVEL)
// ==========================================
export const travelApi = {
  getTrips: async () => {
    const response = await api.get("/travel/trips");
    return response.data;
  },
  getTrip: async (id: number) => {
    const response = await api.get(`/travel/trips/${id}`);
    return response.data;
  },
  createTrip: async (payload: {
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
  }) => {
    const response = await api.post("/travel/trips", payload);
    return response.data;
  },
  updateTrip: async (
    id: number,
    payload: {
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
    }
  ) => {
    const response = await api.put(`/travel/trips/${id}`, payload);
    return response.data;
  },
  updatePlaces: async (id: number, placesJson: string) => {
    const response = await api.patch(`/travel/trips/${id}/places`, {
      placesJson,
      places_json: placesJson,
    });
    return response.data;
  },
  updateShopping: async (id: number, shoppingJson: string) => {
    const response = await api.patch(`/travel/trips/${id}/shopping`, {
      shoppingJson,
      shopping_json: shoppingJson,
    });
    return response.data;
  },
  updateTasks: async (id: number, tasksJson: string) => {
    const response = await api.patch(`/travel/trips/${id}/tasks`, {
      tasksJson,
      tasks_json: tasksJson,
    });
    return response.data;
  },
  updateChecklist: async (id: number, checklistJson: string) => {
    const response = await api.patch(`/travel/trips/${id}/checklist`, {
      checklistJson,
      checklist_json: checklistJson,
    });
    return response.data;
  },
  updateNotes: async (id: number, notes: string) => {
    const response = await api.patch(`/travel/trips/${id}/notes`, {
      notes,
    });
    return response.data;
  },
  deleteTrip: async (id: number) => {
    const response = await api.delete(`/travel/trips/${id}`);
    return response.data;
  },
  addItineraryItem: async (
    tripId: number,
    payload: {
      title: string;
      dateTime: string;
      locationName?: string;
      address?: string;
      latitude?: number;
      longitude?: number;
      notes?: string;
      category?: string;
      completed?: boolean;
    }
  ) => {
    const response = await api.post(`/travel/trips/${tripId}/itinerary`, payload);
    return response.data;
  },
  updateItineraryItem: async (
    tripId: number,
    itemId: number,
    payload: {
      title: string;
      dateTime: string;
      locationName?: string;
      address?: string;
      latitude?: number;
      longitude?: number;
      notes?: string;
      category?: string;
      completed?: boolean;
    }
  ) => {
    const response = await api.put(`/travel/trips/${tripId}/itinerary/${itemId}`, payload);
    return response.data;
  },
  toggleItineraryItem: async (tripId: number, itemId: number) => {
    const response = await api.patch(`/travel/trips/${tripId}/itinerary/${itemId}/toggle`);
    return response.data;
  },
  deleteItineraryItem: async (tripId: number, itemId: number) => {
    const response = await api.delete(`/travel/trips/${tripId}/itinerary/${itemId}`);
    return response.data;
  },
};

// ==========================================
// SERVIÇOS DE ESPORTES
// ==========================================
export const sportsApi = {
  getLeagues: async (): Promise<SportLeague[]> => {
    const response = await api.get("/sports/leagues");
    return response.data;
  },
  getTeams: async (sport: string, league: string): Promise<SportTeam[]> => {
    const response = await api.get("/sports/teams", {
      params: { sport, league },
    });
    return response.data;
  },
  searchTeams: async (
    query: string,
    sport?: string,
    league?: string
  ): Promise<SportTeam[]> => {
    const response = await api.get("/sports/teams/search", {
      params: { q: query, sport, league },
    });
    return response.data;
  },
  getScoreboard: async (
    sport: string,
    league: string,
    date?: string
  ): Promise<ScoreboardResponse> => {
    const response = await api.get("/sports/scoreboard", {
      params: { sport, league, date },
    });
    return response.data;
  },
  getTeamSchedule: async (
    sport: string,
    league: string,
    teamId: string
  ): Promise<SportMatch[]> => {
    const response = await api.get(`/sports/teams/${teamId}/schedule`, {
      params: { sport, league },
    });
    return response.data;
  },
  getFollowedMatches: async (date?: string): Promise<SportMatch[]> => {
    const response = await api.get("/sports/matches/followed", {
      params: { date },
    });
    return response.data;
  },
  getDayMatches: async (
    date?: string,
    league?: string
  ): Promise<SportMatch[]> => {
    const response = await api.get("/sports/matches/day", {
      params: { date, league },
    });
    return response.data;
  },
  getRadarMatches: async (days: number = 14): Promise<SportMatch[]> => {
    const response = await api.get("/sports/matches/radar", {
      params: { days },
    });
    return response.data;
  },
  getPreferences: async (): Promise<SportsUserPreferences> => {
    const response = await api.get("/sports/preferences");
    return response.data;
  },
  trackTeam: async (payload: TrackTeamPayload): Promise<any> => {
    const response = await api.post("/sports/track/team", payload);
    return response.data;
  },
  untrackTeam: async (teamId: string, sport?: string): Promise<void> => {
    await api.delete(`/sports/track/team/${teamId}`, {
      params: sport ? { sport } : undefined,
    });
  },
  trackLeague: async (payload: TrackLeaguePayload): Promise<any> => {
    const response = await api.post("/sports/track/league", payload);
    return response.data;
  },
  untrackLeague: async (league: string): Promise<void> => {
    await api.delete(`/sports/track/league/${league}`);
  },
  getMatchSummary: async (
    sport: string,
    league: string,
    eventId: string
  ): Promise<MatchSummary> => {
    // 1. Try internal backend API via gateway
    try {
      const response = await api.get(`/sports/matches/${eventId}/summary`, {
        params: { sport, league },
        timeout: 4000,
      });
      if (response.data && (response.data.teamStats || response.data.boxscore || response.data.header)) {
        return response.data;
      }
    } catch {
      // Backend route not yet deployed or temporary failure -> seamless ESPN fallback
    }

    // 2. Direct fallback to ESPN public summary endpoint
    const cleanLeague =
      league === "copa_do_brasil" || league === "bra.copa_do_brasil"
        ? "bra.copa_do_brazil"
        : league;
    const url = `https://site.api.espn.com/apis/site/v2/sports/${(sport || "soccer").toLowerCase()}/${cleanLeague}/summary?event=${eventId}`;
    const directRes = await axios.get(url, { timeout: 8000 });
    const data = directRes.data;

    // Parse into structured MatchSummary
    const comp = data.header?.competitions?.[0] || {};
    const competitors = comp.competitors || [];
    const homeComp = competitors.find((c: any) => c.homeAway === "home") || competitors[0];
    const awayComp = competitors.find((c: any) => c.homeAway === "away") || competitors[1];

    const boxTeams = data.boxscore?.teams || [];
    const homeBox = boxTeams.find((bt: any) => bt.team?.id === homeComp?.team?.id || bt.team?.id === homeComp?.id) || boxTeams[0];
    const awayBox = boxTeams.find((bt: any) => bt.team?.id === awayComp?.team?.id || bt.team?.id === awayComp?.id) || boxTeams[1];

    const gamecastLink = comp.links?.find((l: any) => l.rel?.includes("summary") || l.text === "Gamecast")?.href;

    const rawLeaders = data.leaders || [];
    const leaders = rawLeaders.map((teamLead: any) => ({
      teamId: teamLead.team?.id,
      displayName: teamLead.team?.displayName,
      leaders: (teamLead.leaders || []).map((cat: any) => ({
        name: cat.name,
        displayName: cat.displayName,
        leaders: (cat.leaders || []).map((l: any) => ({
          displayValue: l.displayValue,
          value: l.value,
          athlete: {
            id: l.athlete?.id,
            displayName: l.athlete?.displayName,
            shortName: l.athlete?.shortName,
            jersey: l.athlete?.jersey,
            position: l.athlete?.position?.abbreviation || l.athlete?.position?.displayName,
            headshot: l.athlete?.headshot?.href || l.athlete?.headshot,
          },
        })),
      })),
    }));

    const keyEvents = (data.keyEvents || []).map((ke: any) => ({
      id: ke.id,
      type: ke.type?.type || ke.type?.id,
      typeText: ke.type?.text,
      text: ke.text,
      shortText: ke.shortText,
      clock: ke.clock?.displayValue,
      teamId: ke.team?.id,
      teamName: ke.team?.displayName,
      scoringPlay: ke.scoringPlay,
      athleteName: ke.participants?.[0]?.athlete?.displayName,
    }));

    return {
      id: eventId,
      sport,
      league,
      gamecastUrl: gamecastLink,
      attendance: data.gameInfo?.attendance,
      officials: (data.gameInfo?.officials || []).map((o: any) => ({
        fullName: o.fullName,
        displayName: o.displayName,
        position: o.position?.displayName || o.position?.name || "Árbitro",
      })),
      venue: data.gameInfo?.venue
        ? {
            name: data.gameInfo.venue.fullName || data.gameInfo.venue.displayName || "",
            city: data.gameInfo.venue.address?.city,
            country: data.gameInfo.venue.address?.country,
          }
        : undefined,
      broadcasts: (data.broadcasts || comp.broadcasts || [])
        .map((b: any) => b.names?.[0] || b.market)
        .filter(Boolean),
      homeLineScores: homeComp?.linescores || [],
      awayLineScores: awayComp?.linescores || [],
      teamStats: {
        home: (homeBox?.statistics || []).map((s: any) => ({
          name: s.name,
          label: s.label,
          displayValue: s.displayValue,
        })),
        away: (awayBox?.statistics || []).map((s: any) => ({
          name: s.name,
          label: s.label,
          displayValue: s.displayValue,
        })),
      },
      keyEvents,
      leaders,
    };
  },
};

export default api;
