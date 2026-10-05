import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { cookieUtils } from "./cookieUtils";
import {
  TmdbMovie,
  TmdbSerie,
  TmdbPage,
  WatchlistMovie,
  WatchlistSerie,
} from "./types";

const REMOTE_API_BASE_URL = "https://api-filmes.lucasmks.com.br";

const timeoutFromEnv = Number((import.meta as any).env?.VITE_API_TIMEOUT_MS);
const REQUEST_TIMEOUT =
  Number.isFinite(timeoutFromEnv) && timeoutFromEnv > 0
    ? timeoutFromEnv
    : 10000;

const apiLmsFilmes = axios.create({
  baseURL: `${REMOTE_API_BASE_URL}/lms-filmes`,
  headers: { "Content-Type": "application/json" },
  timeout: REQUEST_TIMEOUT,
  withCredentials: true,
});

const apiLmsFavorite = axios.create({
  baseURL: `${REMOTE_API_BASE_URL}/lms-favorite`,
  headers: { "Content-Type": "application/json" },
  timeout: REQUEST_TIMEOUT,
  withCredentials: true,
});

const attachAuthInterceptor = (apiInstance: any) => {
  apiInstance.interceptors.request.use((config: any) => {
    const token = Cookies.get("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  apiInstance.interceptors.response.use(
    (res: any) => res,
    (error: any) => {
      if (error.response?.status === 401 || error.response?.status === 403) {
        cookieUtils.clearAll();
        toast.error("Sessão expirada", { description: "Faça login novamente" });
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.includes("/login")
        ) {
          window.location.href = "/login";
        }
      }
      return Promise.reject(error);
    },
  );
};

[apiLmsFilmes, apiLmsFavorite].forEach(attachAuthInterceptor);

// ==========================================
// SERVIÇOS EXPORTADOS
// ==========================================

export const moviesApi = {
  // TODO: remover getPopularMovies se nenhum outro lugar usar após o redesign de /media
  getPopularMovies: (page: number = 1): Promise<TmdbPage<TmdbMovie>> =>
    apiLmsFilmes.get(`/movies/popular?page=${page}`).then((res) => res.data),

  getMovieDetails: (movieId: string | number): Promise<TmdbMovie> =>
    apiLmsFilmes.get(`/movies/${movieId}`).then((res) => res.data),
};

export const seriesApi = {
  // TODO: remover getPopularSeries se nenhum outro lugar usar após o redesign de /media
  getPopularSeries: (page: number = 1): Promise<TmdbPage<TmdbSerie>> =>
    apiLmsFilmes.get(`/series/popular?page=${page}`).then((res) => res.data),

  getSerieDetails: (serieId: string | number): Promise<TmdbSerie> =>
    apiLmsFilmes.get(`/series/${serieId}`).then((res) => res.data),
};

export const watchlistMoviesApi = {
  toggleWatchlist: (movieId: string) =>
    apiLmsFavorite
      .post("/watchlist/movies", null, { params: { movieId } })
      .then((res) => res.data),

  getWatchlistStatus: (movieId: string) =>
    apiLmsFavorite
      .get("/watchlist/movies/status", { params: { movieId } })
      .then((res) => res.data),

  getWatchlistMovies: (): Promise<WatchlistMovie[]> =>
    apiLmsFavorite.get("/watchlist/movies").then((res) => res.data),
};

export const watchlistSeriesApi = {
  toggleWatchlist: (serieId: string) =>
    apiLmsFavorite
      .post("/watchlist/series", null, { params: { serieId } })
      .then((res) => res.data),

  getWatchlistStatus: (serieId: string) =>
    apiLmsFavorite
      .get("/watchlist/series/status", { params: { serieId } })
      .then((res) => res.data),

  getWatchlistSeries: (): Promise<WatchlistSerie[]> =>
    apiLmsFavorite.get("/watchlist/series").then((res) => res.data),
};

export { apiLmsFilmes, apiLmsFavorite };
