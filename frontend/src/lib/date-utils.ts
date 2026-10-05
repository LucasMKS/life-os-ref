export interface ReleaseRadarDTO {
  tmdbId: string;
  title: string;
  type: "MOVIE" | "SERIES";
  releaseDate: string;
  posterUrl: string;
  description: string;
  episodeNumber?: number;
  seasonNumber?: number;
  watched?: boolean;
  episodeTitle?: string;
}

export interface GroupedRadarRelease {
  id: string;
  tmdbId: string;
  title: string;
  type: "MOVIE" | "SERIES";
  posterUrl: string;
  description: string;
  nextReleaseDate: string;
  nextEpisodeNumber?: number;
  nextSeasonNumber?: number;
  nextEpisodeTitle?: string;
  upcomingEpisodes: ReleaseRadarDTO[];
}

export const getDaysUntil = (dateString: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = dateString.split("-").map(Number);
  const release = new Date(year, month - 1, day);
  release.setHours(0, 0, 0, 0);

  const diffTime = release.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "ESTREIA HOJE!";
  if (diffDays === 1) return "Amanhã";
  if (diffDays > 0) return `Em ${diffDays} dias`;
  return "Já Lançou";
};

export const isPastRelease = (dateString: string): boolean => {
  if (!dateString) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = dateString.split("-").map(Number);
  const release = new Date(year, month - 1, day);
  release.setHours(0, 0, 0, 0);

  return release.getTime() < today.getTime();
};

export const formatDateToDDMM = (dateString: string) => {
  if (!dateString) return "";
  const parts = dateString.split("-");
  if (parts.length !== 3) return "";
  return `${parts[2]}/${parts[1]}`;
};

/**
 * Agrupa lançamentos por título/tmdbId e aplica as regras do Radar de Lançamentos:
 * 1. Séries: Apenas episódios futuros ou de hoje (não acumula séries finalizadas no "Já lançou").
 * 2. Filmes: Exibe todos os lançamentos futuros/hoje + no máximo 2 filmes já lançados (os mais recentes).
 */
export function groupAndFilterRadarReleases(releases: ReleaseRadarDTO[]): GroupedRadarRelease[] {
  const upcomingReleases: ReleaseRadarDTO[] = [];
  const pastMovieReleases: ReleaseRadarDTO[] = [];

  for (const item of releases) {
    if (!item.releaseDate) continue;
    const isPast = isPastRelease(item.releaseDate);
    if (!isPast) {
      upcomingReleases.push(item);
    } else if (item.type === "MOVIE") {
      pastMovieReleases.push(item);
    }
  }

  // 1. Agrupar lançamentos futuros/hoje por tmdbId e tipo
  const sortedUpcoming = [...upcomingReleases].sort((a, b) =>
    a.releaseDate.localeCompare(b.releaseDate)
  );

  const upcomingMap = new Map<string, GroupedRadarRelease>();

  for (const item of sortedUpcoming) {
    const key = `${item.type}-${item.tmdbId}`;
    if (!upcomingMap.has(key)) {
      upcomingMap.set(key, {
        id: key,
        tmdbId: item.tmdbId,
        title: item.title,
        type: item.type,
        posterUrl: item.posterUrl,
        description: item.description,
        nextReleaseDate: item.releaseDate,
        nextEpisodeNumber: item.episodeNumber,
        nextSeasonNumber: item.seasonNumber,
        nextEpisodeTitle: item.episodeTitle,
        upcomingEpisodes: [item],
      });
    } else {
      const existing = upcomingMap.get(key)!;
      existing.upcomingEpisodes.push(item);
    }
  }

  const upcomingGrouped = Array.from(upcomingMap.values());

  // 2. Filmes passados: pegar no máximo 2 mais recentes
  const pastMovieMap = new Map<string, GroupedRadarRelease>();
  for (const item of pastMovieReleases) {
    const key = `${item.type}-${item.tmdbId}`;
    if (!pastMovieMap.has(key)) {
      pastMovieMap.set(key, {
        id: key,
        tmdbId: item.tmdbId,
        title: item.title,
        type: item.type,
        posterUrl: item.posterUrl,
        description: item.description,
        nextReleaseDate: item.releaseDate,
        nextEpisodeNumber: item.episodeNumber,
        nextSeasonNumber: item.seasonNumber,
        nextEpisodeTitle: item.episodeTitle,
        upcomingEpisodes: [item],
      });
    }
  }

  const sortedPastMovies = Array.from(pastMovieMap.values())
    .sort((a, b) => b.nextReleaseDate.localeCompare(a.nextReleaseDate))
    .slice(0, 2);

  // 3. Combinar filmes passados (no máximo 2) com os lançamentos futuros/hoje em ordem cronológica
  const combined = [...sortedPastMovies, ...upcomingGrouped];
  combined.sort((a, b) => a.nextReleaseDate.localeCompare(b.nextReleaseDate));

  return combined;
}

/**
 * Converte data de partida retornada pela ESPN/API em um objeto Date válido.
 * Como a ESPN e o banco armazenam os horários em UTC, caso a string venha
 * sem timezone explícito (ex: "2026-10-03T23:00:00"), adicionamos 'Z' para que
 * o navegador interprete corretamente como UTC e converta para o fuso local do usuário.
 */
export function parseMatchDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // Se já possui indicador de fuso ('Z' ou offset '+00:00' / '-03:00'), analisa direto
  const hasTimezone = trimmed.endsWith("Z") || /[+-]\d{2}(:?\d{2})?$/.test(trimmed);
  const normalized = hasTimezone ? trimmed : `${trimmed}Z`;
  const d = new Date(normalized);
  if (!isNaN(d.getTime())) {
    return d;
  }
  const fallback = new Date(trimmed);
  return isNaN(fallback.getTime()) ? null : fallback;
}

/**
 * Retorna a data no formato YYYY-MM-DD considerando o fuso local do usuário
 * (evita o bug de toISOString().split('T')[0] que avança um dia após as 21h no Brasil).
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Formata o horário da partida no fuso local do usuário:
 * "Hoje às HH:mm", "Amanhã às HH:mm", "Ontem às HH:mm" ou "dd/mmm às HH:mm".
 */
export function formatMatchTime(dateStr?: string | null): string {
  const date = parseMatchDate(dateStr);
  if (!date) return dateStr || "";

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const time = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) return `Hoje às ${time}`;

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow =
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear();

  if (isTomorrow) return `Amanhã às ${time}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return `Ontem às ${time}`;

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formata as informações de data para os cards do Radar de Próximos Jogos.
 */
export function formatRadarDate(dateStr?: string | null) {
  if (!dateStr) return { dayLabel: "", timeLabel: "", daysDiffText: "" };
  const date = parseMatchDate(dateStr);
  if (!date) return { dayLabel: dateStr, timeLabel: "", daysDiffText: "" };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const matchDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffTime = matchDay.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const timeLabel = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  let dayLabel = date.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
  dayLabel = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1).replace(".", "");

  let daysDiffText = "";
  if (diffDays === 0) {
    daysDiffText = "HOJE!";
  } else if (diffDays === 1) {
    daysDiffText = "AMANHÃ";
  } else if (diffDays > 1) {
    daysDiffText = `Em ${diffDays} dias`;
  }

  return { dayLabel, timeLabel, daysDiffText };
}

