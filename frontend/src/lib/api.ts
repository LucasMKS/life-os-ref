import axios from "axios";
import Cookies from "js-cookie";
import { useAuthStore } from "./authStore";
import { extractUserIdFromToken } from "./jwtUtils";
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
  let { token, userId } = useAuthStore.getState();

  if (!token && typeof window !== "undefined") {
    token = Cookies.get("auth_token") || null;
  }

  if (token && (!userId || userId === "user" || userId === "undefined")) {
    const extracted = extractUserIdFromToken(token);
    if (extracted) {
      userId = extracted;
      useAuthStore.getState().setAuth(token, userId);
    }
  }

  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (userId) config.headers["X-User-Id"] = userId;

  return config;
};

const externalRatingInterceptor = (config: any) => {
  let { token } = useAuthStore.getState();
  if (!token && typeof window !== "undefined") {
    token = Cookies.get("auth_token") || null;
  }
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
};

api.interceptors.request.use(requestInterceptor);
ratingApi.interceptors.request.use(externalRatingInterceptor);

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
  addTrackedTwitchChannel: async (payload: { channelName: string; recordVod?: boolean; recordQuality?: string }) => {
    const response = await api.post("/gaming/twitch/preferences", payload);
    return response.data;
  },
  deleteTrackedTwitchChannel: async (id: string) => {
    const response = await api.delete(`/gaming/twitch/preferences/${id}`);
    return response.data;
  },
  toggleTrackedTwitchRecord: async (payload: { id: string; recordVod: boolean; recordQuality?: string }) => {
    const response = await api.patch(`/gaming/twitch/preferences/${payload.id}/record`, {
      recordVod: payload.recordVod,
      recordQuality: payload.recordQuality || "720p60",
    });
    return response.data;
  },
  getTwitchDvrStatus: async () => {
    const response = await api.get("/gaming/twitch/dvr/status");
    return response.data;
  },
  getTwitchDvrChannels: async () => {
    const response = await api.get("/gaming/twitch/dvr/channels");
    return response.data;
  },
  getTwitchDvrVods: async () => {
    const response = await api.get("/gaming/twitch/dvr/vods");
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
  resetRewatch: async (serieId: string) => {
    const response = await api.post("/gaming/radar/series/reset-rewatch", null, {
      params: { serieId },
    });
    return response.data;
  },
};


export const statsApi = {
  getMediaBalance: async () => {
    try {
      const response = await ratingApi.get("/lms-rating/stats/balance/list");
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data && typeof response.data === "object") {
        return [
          {
            name: "Filmes",
            value: Number(response.data.totalMovies ?? response.data.movies ?? 0),
            color: "#eab308",
          },
          {
            name: "Séries",
            value: Number(response.data.totalSeries ?? response.data.series ?? 0),
            color: "#a855f7",
          },
        ];
      }
      return [];
    } catch {
      try {
        const fallbackRes = await ratingApi.get("/lms-rating/stats/balance");
        if (Array.isArray(fallbackRes.data)) {
          return fallbackRes.data;
        }
        if (fallbackRes.data && typeof fallbackRes.data === "object") {
          return [
            {
              name: "Filmes",
              value: Number(fallbackRes.data.totalMovies ?? fallbackRes.data.movies ?? 0),
              color: "#eab308",
            },
            {
              name: "Séries",
              value: Number(fallbackRes.data.totalSeries ?? fallbackRes.data.series ?? 0),
              color: "#a855f7",
            },
          ];
        }
      } catch {
        // Ignora erros de rede/serviço e retorna fallback seguro
      }
      return [
        { name: "Filmes", value: 0, color: "#eab308" },
        { name: "Séries", value: 0, color: "#a855f7" },
      ];
    }
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
      if (response.data) {
        // If it's already an application MatchSummary (has teamStats and not raw boxscore)
        if (response.data.teamStats && !response.data.boxscore) {
          return response.data;
        }
        // Otherwise it's raw ESPN JsonNode from backend -> normalize it
        return parseEspnMatchSummary(response.data, sport, league, eventId);
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
    return parseEspnMatchSummary(directRes.data, sport, league, eventId);
  },
};

/**
 * Normaliza a resposta JSON bruta da API da ESPN (ou do proxy do backend)
 * em um objeto MatchSummary tipado e seguro para renderização no frontend.
 */
export function parseEspnMatchSummary(
  data: any,
  sport: string,
  league: string,
  eventId: string
): MatchSummary {
  if (!data) {
    return {
      id: eventId,
      sport,
      league,
      broadcasts: [],
      officials: [],
      homeLineScores: [],
      awayLineScores: [],
      teamStats: { home: [], away: [] },
      keyEvents: [],
      leaders: [],
    };
  }

  const comp = data.header?.competitions?.[0] || {};
  const competitors = comp.competitors || [];
  const homeComp =
    competitors.find((c: any) => c.homeAway === "home") || competitors[0];
  const awayComp =
    competitors.find((c: any) => c.homeAway === "away") || competitors[1];

  const boxTeams = data.boxscore?.teams || [];
  const homeBox =
    boxTeams.find(
      (bt: any) =>
        bt.homeAway === "home" ||
        bt.team?.id === homeComp?.team?.id ||
        bt.team?.id === homeComp?.id
    ) || boxTeams[0];
  const awayBox =
    boxTeams.find(
      (bt: any) =>
        bt.homeAway === "away" ||
        bt.team?.id === awayComp?.team?.id ||
        bt.team?.id === awayComp?.id
    ) || boxTeams[1];

  const gamecastLink =
    comp.links?.find(
      (l: any) => l.rel?.includes("summary") || l.text === "Gamecast"
    )?.href ||
    data.header?.links?.find((l: any) => l.rel?.includes("summary"))?.href;

  const rawLeaders = Array.isArray(data.leaders) ? data.leaders : [];
  const leaders = rawLeaders.map((teamLead: any) => ({
    teamId: String(teamLead.team?.id || ""),
    displayName: String(teamLead.team?.displayName || teamLead.team?.name || ""),
    leaders: (Array.isArray(teamLead.leaders) ? teamLead.leaders : []).map(
      (cat: any) => ({
        name: String(cat.name || ""),
        displayName: String(cat.displayName || cat.name || ""),
        leaders: (Array.isArray(cat.leaders) ? cat.leaders : []).map((l: any) => {
          let headshotUrl: string | undefined = undefined;
          if (typeof l.athlete?.headshot === "string") {
            headshotUrl = l.athlete.headshot;
          } else if (
            l.athlete?.headshot &&
            typeof l.athlete.headshot.href === "string"
          ) {
            headshotUrl = l.athlete.headshot.href;
          }

          return {
            displayValue: String(l.displayValue ?? l.value ?? ""),
            value: typeof l.value === "number" ? l.value : undefined,
            athlete: {
              id: String(l.athlete?.id || ""),
              displayName: String(
                l.athlete?.displayName || l.athlete?.fullName || ""
              ),
              shortName:
                typeof l.athlete?.shortName === "string"
                  ? l.athlete.shortName
                  : undefined,
              jersey:
                typeof l.athlete?.jersey === "string" ||
                typeof l.athlete?.jersey === "number"
                  ? String(l.athlete.jersey)
                  : undefined,
              position:
                typeof l.athlete?.position?.abbreviation === "string"
                  ? l.athlete.position.abbreviation
                  : typeof l.athlete?.position?.displayName === "string"
                  ? l.athlete.position.displayName
                  : undefined,
              headshot: headshotUrl,
            },
          };
        }),
      })
    ),
  }));

  const rawKeyEvents = Array.isArray(data.keyEvents) ? data.keyEvents : [];
  const keyEvents = rawKeyEvents.map((ke: any) => {
    const rawType =
      typeof ke.type === "string"
        ? ke.type
        : ke.type?.type ||
          ke.type?.text ||
          (ke.type?.id ? String(ke.type.id) : "");
    const rawTypeText =
      typeof ke.typeText === "string"
        ? ke.typeText
        : ke.type?.text || "";
    const rawText =
      typeof ke.text === "string"
        ? ke.text
        : typeof ke.shortText === "string"
        ? ke.shortText
        : "";
    const rawShortText =
      typeof ke.shortText === "string" ? ke.shortText : undefined;

    return {
      id: String(ke.id || Math.random().toString(36).slice(2)),
      type: String(rawType || ""),
      typeText: String(rawTypeText || ""),
      text: String(rawText || ""),
      shortText: rawShortText,
      clock:
        ke.clock?.displayValue ||
        (ke.clock?.value != null ? `${ke.clock.value}'` : undefined),
      teamId: ke.team?.id ? String(ke.team.id) : undefined,
      teamName: ke.team?.displayName || ke.team?.name,
      scoringPlay: Boolean(ke.scoringPlay),
      athleteName:
        ke.participants?.[0]?.athlete?.displayName ||
        ke.athlete?.displayName,
    };
  });

  const rawBroadcasts = Array.isArray(data.broadcasts)
    ? data.broadcasts
    : Array.isArray(comp.broadcasts)
    ? comp.broadcasts
    : [];

  const broadcasts: string[] = rawBroadcasts
    .map((b: any) => {
      if (!b) return "";
      if (typeof b === "string") return b.trim();
      if (typeof b.media?.name === "string") return b.media.name.trim();
      if (typeof b.media?.shortName === "string") return b.media.shortName.trim();
      if (Array.isArray(b.names) && b.names.length > 0) {
        return b.names.filter((n: any) => typeof n === "string").join("/");
      }
      if (typeof b.name === "string") return b.name.trim();
      if (typeof b.shortName === "string") return b.shortName.trim();
      if (typeof b.market === "string") return b.market.trim();
      return "";
    })
    .filter((b: string) => Boolean(b && b.length > 0));

  const homeStats = Array.isArray(homeBox?.statistics)
    ? homeBox.statistics.map((s: any) => ({
        name: String(s.name || s.label || ""),
        label: String(s.label || s.displayName || s.name || ""),
        displayValue: String(s.displayValue ?? s.value ?? ""),
      }))
    : [];

  const awayStats = Array.isArray(awayBox?.statistics)
    ? awayBox.statistics.map((s: any) => ({
        name: String(s.name || s.label || ""),
        label: String(s.label || s.displayName || s.name || ""),
        displayValue: String(s.displayValue ?? s.value ?? ""),
      }))
    : [];

  return {
    id: eventId,
    sport,
    league,
    gamecastUrl: gamecastLink,
    attendance:
      typeof data.gameInfo?.attendance === "number"
        ? data.gameInfo.attendance
        : undefined,
    officials: (Array.isArray(data.gameInfo?.officials)
      ? data.gameInfo.officials
      : []
    ).map((o: any) => ({
      fullName: String(o.fullName || o.displayName || ""),
      displayName: String(o.displayName || o.fullName || ""),
      position: String(
        o.position?.displayName || o.position?.name || "Árbitro"
      ),
    })),
    venue: data.gameInfo?.venue
      ? {
          name: String(
            data.gameInfo.venue.fullName ||
              data.gameInfo.venue.displayName ||
              ""
          ),
          city: data.gameInfo.venue.address?.city,
          country: data.gameInfo.venue.address?.country,
        }
      : undefined,
    broadcasts,
    homeLineScores: Array.isArray(homeComp?.linescores)
      ? homeComp.linescores
      : [],
    awayLineScores: Array.isArray(awayComp?.linescores)
      ? awayComp.linescores
      : [],
    teamStats: {
      home: homeStats,
      away: awayStats,
    },
    keyEvents,
    leaders,
  };
}

export default api;
