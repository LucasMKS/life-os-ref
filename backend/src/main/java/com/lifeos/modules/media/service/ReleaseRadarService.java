package com.lifeos.modules.media.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifeos.modules.media.model.WatchedEpisode;
import com.lifeos.modules.media.model.SeriePreference;
import com.lifeos.modules.media.model.UserTrackedMedia;
import com.lifeos.modules.media.repository.WatchedEpisodeRepository;
import com.lifeos.modules.media.repository.SeriePreferenceRepository;
import com.lifeos.modules.media.repository.UserTrackedMediaRepository;
import com.lifeos.modules.media.dto.EpisodeDTO;
import com.lifeos.modules.media.dto.SerieWatchStatusDTO;
import com.lifeos.modules.media.dto.RatingStatusDTO;
import com.lifeos.modules.media.dto.MediaOverviewDTO;
import com.lifeos.modules.media.dto.ReleaseRadarDTO;
import com.lifeos.modules.media.dto.WeeklyCalendarDayDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.context.ApplicationEventPublisher;
import com.lifeos.shared.event.NotificationEvent;
import com.lifeos.modules.media.event.SerieRewatchEvent;
import com.lifeos.modules.media.event.SerieProgressEvent;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Serviço do Release Radar — agrega lançamentos de filmes e séries da
 * watchlist do usuário no lms-favorite (sistema externo) e detalhes do TMDB.
 *
 * Tem três métodos públicos:
 * getUpcomingReleases retorna a lista bruta ordenada por data; é a chamada
 * "pesada" que toca lms-favorite + TMDB e fica em cache no Redis por 3h;
 * getWeeklyCalendar agrupa o que vem nos próximos 7 dias por dia;
 * getMediaOverview retorna apenas dois números (total da semana, total futuro)
 * para o card resumido do dashboard.
 *
 * Detalhe sobre fuso horário em séries: o TMDB armazena a data americana
 * (Pacific). Para redes que lançam à noite no horário PT (ex: Apple TV+),
 * o usuário em São Paulo só vê o episódio "no dia seguinte". O método
 * adjustReleaseDateForSaoPaulo cuida disso adicionando 1 dia para essas
 * networks específicas (a lista EVENING_PT_NETWORKS hoje só tem Apple TV+
 * mas pode crescer).
 *
 * O checkAndNotify é chamado dentro do parse de cada item — se a data de
 * lançamento for hoje (em SP), publica em notify.media com o link direto
 * para a página do filme/série em filmes.lucasmks.com.br. A chave Redis
 * radar_notified_today:* (TTL 48h) garante que só notifica uma vez por
 * usuário por release.
 */
@Service
@Slf4j
@RequiredArgsConstructor
@SuppressWarnings("null")
public class ReleaseRadarService {

    private final WebClient tmdbWebClient;
    private final WebClient lmsFavoriteWebClient;
    private final WebClient lmsRatingWebClient;
    private final ObjectMapper objectMapper;
    private final StringRedisTemplate redisTemplate;
    private final ApplicationEventPublisher eventPublisher;
    private final WatchedEpisodeRepository watchedEpisodeRepository;
    private final SeriePreferenceRepository seriePreferenceRepository;
    private final UserTrackedMediaRepository userTrackedMediaRepository;

    private static final String REDIS_RADAR_PREFIX = "gaming_release_radar:";
    private static final String REDIS_NOTIFIED_PREFIX = "radar_notified_today:";
    private static final ZoneId SAO_PAULO_ZONE = ZoneId.of("America/Sao_Paulo");
    private static final int TMDB_PARALLEL_CALLS = 4;

    // Redes que lançam episódios às ~21h PT (= 1h BRT do dia seguinte).
    // O TMDB armazena a data americana, que fica um dia antes da data real em SP.
    private static final Set<Integer> EVENING_PT_NETWORKS = Set.of(
            2552  // Apple TV+
    );

    public List<ReleaseRadarDTO> getUpcomingReleases(String userId, String authHeader) {
        String cacheKey = REDIS_RADAR_PREFIX + userId;

        try {
            String json = redisTemplate.opsForValue().get(cacheKey);
            if (json != null && !json.equals("[]")) {
                log.info("Radar de Lançamentos carregado do Redis.");
                return objectMapper.readValue(json, new TypeReference<List<ReleaseRadarDTO>>() {});
            }
        } catch (Exception e) {
            log.error("Erro ao ler Radar do Redis", e);
        }

        // Chamada interna (bot): sem JWT, não é possível consultar o lmsfavorite.
        // Retorna lista vazia — o cache será populado na próxima visita do usuário ao site.
        if (authHeader == null || authHeader.isBlank()) {
            log.info("Radar solicitado sem Authorization (chamada interna). Cache ausente para userId={}", userId);
            return List.of();
        }

        log.info("Buscando dados frescos do TMDB e lmsfavorite...");

        try {
            Mono<List<String>> movieIdsMono = fetchWatchlistIds("/watchlist/movies", "movieId", authHeader);
            Mono<List<String>> serieIdsMono = fetchWatchlistIds("/watchlist/series", "serieId", authHeader);

            List<String> fetchedMovieIds = new ArrayList<>();
            List<String> fetchedSerieIds = new ArrayList<>();

            List<ReleaseRadarDTO> releases = Mono.zip(movieIdsMono, serieIdsMono)
                    .flatMap(tuple -> {
                        fetchedMovieIds.addAll(tuple.getT1());
                        fetchedSerieIds.addAll(tuple.getT2());
                        Flux<ReleaseRadarDTO> movies = Flux.fromIterable(tuple.getT1())
                                .flatMap(id -> fetchTmdbMovieReactive(id, userId), TMDB_PARALLEL_CALLS);
                        Flux<ReleaseRadarDTO> series = Flux.fromIterable(tuple.getT2())
                                .flatMap(id -> fetchTmdbSeriesReleasesReactive(id, userId), TMDB_PARALLEL_CALLS);
                        return Flux.merge(movies, series).collectList();
                    })
                    .block();

            if (releases == null) releases = new ArrayList<>();

            // Sincroniza a watchlist com o banco de dados local para permitir notificações automáticas
            syncUserTrackedMedia(userId, fetchedMovieIds, fetchedSerieIds, releases);

            LocalDate today = LocalDate.now(SAO_PAULO_ZONE);
            List<ReleaseRadarDTO> upcoming = new ArrayList<>();
            List<ReleaseRadarDTO> pastMovies = new ArrayList<>();

            for (ReleaseRadarDTO dto : releases) {
                try {
                    LocalDate d = LocalDate.parse(dto.releaseDate());
                    if (!d.isBefore(today)) {
                        upcoming.add(dto);
                    } else if ("MOVIE".equals(dto.type())) {
                        pastMovies.add(dto);
                    }
                } catch (Exception ignored) {}
            }

            // Apenas filmes no "Já lançou" e no máximo 2 (os mais recentes)
            pastMovies.sort(Comparator.comparing(ReleaseRadarDTO::releaseDate).reversed());
            List<ReleaseRadarDTO> selectedPastMovies = pastMovies.stream().limit(2).toList();

            List<ReleaseRadarDTO> finalList = new ArrayList<>(selectedPastMovies);
            finalList.addAll(upcoming);
            finalList.sort(Comparator.comparing(ReleaseRadarDTO::releaseDate));

            processBatchNotifications(finalList, userId);

            if (!finalList.isEmpty()) {
                redisTemplate.opsForValue().set(cacheKey, objectMapper.writeValueAsString(finalList), Duration.ofHours(3));
            }

            return finalList;
        } catch (Exception e) {
            log.error("Erro ao sincronizar Radar de Lançamentos com o lmsfavorite", e);
            return new ArrayList<>();
        }
    }

    private Mono<List<String>> fetchWatchlistIds(String path, String idField, String authHeader) {
        Mono<List<String>> mono = lmsFavoriteWebClient.get()
                .uri(uriBuilder -> uriBuilder.path(path).build())
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .retrieve()
                .bodyToMono(String.class)
                .map(body -> {
                    try {
                        JsonNode list = objectMapper.readTree(body);
                        List<String> ids = new ArrayList<>();
                        for (JsonNode node : list) {
                            String id = node.path(idField).asText();
                            if (id != null && !id.isEmpty()) ids.add(id);
                        }
                        return ids;
                    } catch (Exception e) {
                        log.error("Erro ao parsear watchlist {}", path, e);
                        return List.<String>of();
                    }
                });

        return mono.onErrorResume(e -> { 
            log.warn("Aviso ao buscar watchlist ids ({}): {}", path, e.getMessage()); 
            return Mono.just(List.of()); 
        });
    }

    private Mono<Map<String, String>> fetchWatchlistSeriesWithStatus(String authHeader) {
        Mono<Map<String, String>> mono = lmsFavoriteWebClient.get()
                .uri(uriBuilder -> uriBuilder.path("/watchlist/series").build())
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .retrieve()
                .bodyToMono(String.class)
                .map(body -> {
                    try {
                        JsonNode list = objectMapper.readTree(body);
                        Map<String, String> result = new java.util.HashMap<>();
                        for (JsonNode node : list) {
                            String id = node.path("serieId").asText();
                            String status = node.path("status").asText();
                            if (id != null && !id.isEmpty()) {
                                result.put(id, status != null ? status : "PLAN_TO_WATCH");
                            }
                        }
                        return result;
                    } catch (Exception e) {
                        log.error("Erro ao parsear watchlist series", e);
                        return java.util.Map.<String, String>of();
                    }
                });

        return mono.onErrorResume(e -> { 
            log.warn("Aviso ao buscar watchlist series: {}", e.getMessage()); 
            return Mono.just(java.util.Map.of()); 
        });
    }

    private Mono<List<WatchedEpisode>> fetchRemoteWatchedEpisodesForSerie(String serieId, String userId, String authHeader) {
        if (authHeader == null || authHeader.isBlank()) {
            return Mono.just(List.of());
        }
        return lmsFavoriteWebClient.get()
                .uri("/watched/episodes/serie/" + serieId)
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
                .map(list -> {
                    List<WatchedEpisode> result = new ArrayList<>();
                    LocalDateTime now = LocalDateTime.now(SAO_PAULO_ZONE);
                    for (Map<String, Object> map : list) {
                        Integer season = map.get("seasonNumber") != null ? ((Number) map.get("seasonNumber")).intValue() : null;
                        Integer ep = map.get("episodeNumber") != null ? ((Number) map.get("episodeNumber")).intValue() : null;
                        if (season != null && ep != null) {
                            result.add(WatchedEpisode.builder()
                                    .userId(userId)
                                    .serieId(serieId)
                                    .seasonNumber(season)
                                    .episodeNumber(ep)
                                    .watchedAt(now)
                                    .build());
                        }
                    }
                    return result;
                })
                .onErrorResume(e -> {
                    log.debug("Aviso ao buscar episódios da série {} no LMS Filmes: {}", serieId, e.getMessage());
                    return Mono.just(List.of());
                });
    }

    public List<WeeklyCalendarDayDTO> getWeeklyCalendar(String userId, String authHeader) {
        List<ReleaseRadarDTO> all = getUpcomingReleases(userId, authHeader);
        LocalDate today = LocalDate.now(SAO_PAULO_ZONE);
        Locale ptBR = Locale.forLanguageTag("pt-BR");
        DateTimeFormatter dayFormatter = DateTimeFormatter.ofPattern("dd/MM", ptBR);

        List<WeeklyCalendarDayDTO> days = new ArrayList<>(7);
        for (int i = 0; i < 7; i++) {
            LocalDate target = today.plusDays(i);
            List<ReleaseRadarDTO> releases = new ArrayList<>();
            for (ReleaseRadarDTO dto : all) {
                try {
                    LocalDate d = LocalDate.parse(dto.releaseDate());
                    if (d.equals(target)) releases.add(dto);
                } catch (Exception ignored) {
                    // releaseDate inválida é ignorada
                }
            }

            String weekday = target.getDayOfWeek().getDisplayName(TextStyle.SHORT, ptBR);
            weekday = Character.toUpperCase(weekday.charAt(0)) + weekday.substring(1).replace(".", "");
            String label = weekday + " " + target.format(dayFormatter);
            days.add(new WeeklyCalendarDayDTO(target.toString(), label, releases));
        }

        return days;
    }

    public MediaOverviewDTO getMediaOverview(String userId, String authHeader) {
        List<ReleaseRadarDTO> all = getUpcomingReleases(userId, authHeader);
        LocalDate today = LocalDate.now(SAO_PAULO_ZONE);
        LocalDate weekEnd = today.plusDays(6);

        long thisWeek = all.stream().filter(dto -> {
            try {
                LocalDate d = LocalDate.parse(dto.releaseDate());
                return !d.isBefore(today) && !d.isAfter(weekEnd);
            } catch (Exception e) {
                return false;
            }
        }).count();

        long totalUpcoming = all.stream().filter(dto -> {
            try {
                LocalDate d = LocalDate.parse(dto.releaseDate());
                return !d.isBefore(today);
            } catch (Exception e) {
                return false;
            }
        }).count();

        return new MediaOverviewDTO(thisWeek, totalUpcoming);
    }

    private Mono<String> fetchTmdbShowDetailsReactive(String tmdbId) {
        String cacheKey = "gaming_radar_show_details:" + tmdbId;

        Mono<String> cacheMono = Mono.fromCallable(() -> {
            try {
                return redisTemplate.opsForValue().get(cacheKey);
            } catch (Exception e) {
                log.error("Erro ao ler detalhes da série do Redis", e);
            }
            return null;
        })
        .subscribeOn(Schedulers.boundedElastic())
        .flatMap(cached -> Mono.justOrEmpty(cached));

        Mono<String> tmdbMono = tmdbWebClient.get()
                .uri(uriBuilder -> uriBuilder.path("/tv/{id}")
                        .queryParam("language", "pt-BR")
                        .build(tmdbId))
                .retrieve()
                .bodyToMono(String.class)
                .flatMap(responseBody -> Mono.fromCallable(() -> {
                    try {
                        redisTemplate.opsForValue().set(cacheKey, responseBody, Duration.ofHours(3));
                    } catch (Exception e) {
                        log.error("Erro ao salvar detalhes da série no Redis", e);
                    }
                    return responseBody;
                }).subscribeOn(Schedulers.boundedElastic()));

        return cacheMono.switchIfEmpty(tmdbMono);
    }

    private Mono<String> fetchTmdbMovieDetailsReactive(String tmdbId) {
        String cacheKey = "gaming_radar_movie_details:" + tmdbId;

        Mono<String> cacheMono = Mono.fromCallable(() -> {
            try {
                return redisTemplate.opsForValue().get(cacheKey);
            } catch (Exception e) {
                log.error("Erro ao ler detalhes do filme do Redis", e);
            }
            return null;
        })
        .subscribeOn(Schedulers.boundedElastic())
        .flatMap(cached -> Mono.justOrEmpty(cached));

        Mono<String> tmdbMono = tmdbWebClient.get()
                .uri(uriBuilder -> uriBuilder.path("/movie/{id}")
                        .queryParam("language", "pt-BR")
                        .build(tmdbId))
                .retrieve()
                .bodyToMono(String.class)
                .flatMap(responseBody -> Mono.fromCallable(() -> {
                    try {
                        redisTemplate.opsForValue().set(cacheKey, responseBody, Duration.ofHours(3));
                    } catch (Exception e) {
                        log.error("Erro ao salvar detalhes do filme no Redis", e);
                    }
                    return responseBody;
                }).subscribeOn(Schedulers.boundedElastic()));

        return cacheMono.switchIfEmpty(tmdbMono);
    }

    private Mono<ReleaseRadarDTO> fetchTmdbMovieReactive(String tmdbId, String userId) {
        return fetchTmdbMovieDetailsReactive(tmdbId)
                .flatMap(responseBody -> Mono.fromCallable(() -> parseTmdbMovie(tmdbId, responseBody, userId))
                        .subscribeOn(Schedulers.boundedElastic()))
                .onErrorResume(e -> {
                    log.error("Erro ao buscar filme {} no TMDB: {}", tmdbId, e.getMessage());
                    return Mono.empty();
                })
                .filter(Objects::nonNull);
    }

    private ReleaseRadarDTO parseTmdbMovie(String tmdbId, String responseBody, String userId) throws Exception {
        JsonNode root = objectMapper.readTree(responseBody);

        String releaseDateStr = root.path("release_date").asText();
        if (releaseDateStr == null || releaseDateStr.isEmpty()) return null;

        LocalDate releaseDate = LocalDate.parse(releaseDateStr);
        LocalDate thirtyDaysAgo = LocalDate.now(SAO_PAULO_ZONE).minusDays(30);

        if (releaseDate.isBefore(thirtyDaysAgo)) {
            return null;
        }

        String title = root.path("title").asText();

        return new ReleaseRadarDTO(
                tmdbId, title, "MOVIE", releaseDateStr,
                "https://image.tmdb.org/t/p/w500" + root.path("poster_path").asText(),
                root.path("overview").asText(), null, null, false
        );
    }

    private Flux<ReleaseRadarDTO> fetchTmdbSeriesReleasesReactive(String tmdbId, String userId) {
        return fetchTmdbShowDetailsReactive(tmdbId)
                .flatMapMany(responseBody -> {
                    try {
                        JsonNode root = objectMapper.readTree(responseBody);
                        String title = root.path("name").asText();
                        String posterPath = root.path("poster_path").asText();
                        String posterUrl = (posterPath != null && !posterPath.isEmpty() && !posterPath.equals("null"))
                                ? "https://image.tmdb.org/t/p/w500" + posterPath
                                : null;
                        String showOverview = root.path("overview").asText();

                        JsonNode seasonsNode = root.path("seasons");
                        List<Integer> seasonNumbers = new ArrayList<>();
                        if (seasonsNode.isArray()) {
                            for (JsonNode sNode : seasonsNode) {
                                int seasonNumber = sNode.path("season_number").asInt();
                                if (seasonNumber > 0) {
                                    seasonNumbers.add(seasonNumber);
                                }
                            }
                        }

                        if (seasonNumbers.isEmpty()) {
                            List<ReleaseRadarDTO> fallback = parseTmdbSeriesReleasesFallback(tmdbId, root, userId);
                            return Flux.fromIterable(fallback);
                        }

                        int minSeasonToInspect = 1;
                        JsonNode lastEpNode = root.path("last_episode_to_air");
                        JsonNode nextEpNode = root.path("next_episode_to_air");

                        if (lastEpNode != null && !lastEpNode.isMissingNode() && !lastEpNode.isNull()) {
                            int lastSeason = lastEpNode.path("season_number").asInt();
                            if (lastSeason > 0) minSeasonToInspect = lastSeason;
                        }
                        if (nextEpNode != null && !nextEpNode.isMissingNode() && !nextEpNode.isNull()) {
                            int nextSeason = nextEpNode.path("season_number").asInt();
                            if (nextSeason > 0) {
                                minSeasonToInspect = Math.min(minSeasonToInspect, nextSeason);
                            }
                        }

                        final int targetMinSeason = minSeasonToInspect;
                        List<Integer> targetSeasons = seasonNumbers.stream()
                                .filter(s -> s >= targetMinSeason)
                                .toList();

                        if (targetSeasons.isEmpty()) {
                            targetSeasons = List.of(seasonNumbers.get(seasonNumbers.size() - 1));
                        }

                        return Flux.fromIterable(targetSeasons)
                                .flatMap(sNum -> fetchSeasonEpisodesReactive(tmdbId, sNum), TMDB_PARALLEL_CALLS)
                                .collectList()
                                .flatMapMany(allSeasonEpisodes -> {
                                    List<ReleaseRadarDTO> releases = new ArrayList<>();
                                    LocalDate today = LocalDate.now(SAO_PAULO_ZONE);
                                    LocalDate thirtyDaysAgo = today.minusDays(30);

                                    List<EpisodeDTO> allEpisodes = new ArrayList<>();
                                    for (List<EpisodeDTO> sEpisodes : allSeasonEpisodes) {
                                        allEpisodes.addAll(sEpisodes);
                                    }

                                    allEpisodes.sort(Comparator.comparing(EpisodeDTO::seasonNumber)
                                            .thenComparing(EpisodeDTO::episodeNumber));

                                    EpisodeDTO latestPastEpisode = null;
                                    LocalDate latestPastDate = null;

                                    for (EpisodeDTO ep : allEpisodes) {
                                        if (ep.airDate() != null && !ep.airDate().isEmpty() && !ep.airDate().equals("null")) {
                                            try {
                                                LocalDate rawAirDate = LocalDate.parse(ep.airDate());
                                                LocalDate adjustedAirDate = adjustReleaseDateForSaoPaulo(rawAirDate, root);

                                                if (!adjustedAirDate.isBefore(today)) {
                                                    // Episódio de hoje ou futuro!
                                                    boolean watched = false;
                                                    if (userId != null && !userId.isBlank() && !userId.equals("default")) {
                                                        watched = watchedEpisodeRepository.existsByUserIdAndSerieIdAndSeasonNumberAndEpisodeNumber(
                                                                userId, tmdbId, ep.seasonNumber(), ep.episodeNumber()
                                                        );
                                                    }

                                                    String epOverview = (ep.overview() != null && !ep.overview().isBlank())
                                                            ? ep.overview()
                                                            : showOverview;

                                                    releases.add(new ReleaseRadarDTO(
                                                            tmdbId,
                                                            title,
                                                            "SERIES",
                                                            adjustedAirDate.toString(),
                                                            posterUrl,
                                                            epOverview,
                                                            ep.episodeNumber(),
                                                            ep.seasonNumber(),
                                                            watched,
                                                            ep.name()
                                                    ));
                                                }
                                            } catch (Exception ignored) {}
                                        }
                                    }

                                    // Se ainda estiver vazio, tenta o fallback simples (apenas futuros/hoje)
                                    if (releases.isEmpty()) {
                                        try {
                                            releases.addAll(parseTmdbSeriesReleasesFallback(tmdbId, root, userId));
                                        } catch (Exception ignored) {}
                                    }

                                    return Flux.fromIterable(releases);
                                });
                    } catch (Exception e) {
                        log.error("Erro ao processar lançamentos da série {} no TMDB: {}", tmdbId, e.getMessage());
                        return Flux.empty();
                    }
                })
                .onErrorResume(e -> {
                    log.error("Erro ao buscar série {} no TMDB: {}", tmdbId, e.getMessage());
                    return Flux.empty();
                });
    }

    private List<ReleaseRadarDTO> parseTmdbSeriesReleasesFallback(String tmdbId, JsonNode root, String userId) {
        List<ReleaseRadarDTO> releases = new ArrayList<>();
        LocalDate today = LocalDate.now(SAO_PAULO_ZONE);
        LocalDate thirtyDaysAgo = today.minusDays(30);

        JsonNode lastEpNode = root.path("last_episode_to_air");
        JsonNode nextEpNode = root.path("next_episode_to_air");

        ReleaseRadarDTO lastDto = null;
        LocalDate lastReleaseDate = null;
        Integer lastSeason = null;
        Integer lastEpisode = null;

        if (lastEpNode != null && !lastEpNode.isMissingNode() && !lastEpNode.isNull()) {
            String lastDateStr = lastEpNode.path("air_date").asText();
            if (lastDateStr != null && !lastDateStr.isEmpty() && !lastDateStr.equals("null")) {
                try {
                    LocalDate rawLastDate = LocalDate.parse(lastDateStr);
                    lastReleaseDate = adjustReleaseDateForSaoPaulo(rawLastDate, root);
                    lastSeason = lastEpNode.path("season_number").asInt();
                    lastEpisode = lastEpNode.path("episode_number").asInt();

                    boolean watched = false;
                    if (userId != null && !userId.isBlank() && !userId.equals("default")) {
                        watched = watchedEpisodeRepository.existsByUserIdAndSerieIdAndSeasonNumberAndEpisodeNumber(
                                userId, tmdbId, lastSeason, lastEpisode
                        );
                    }

                    String overview = lastEpNode.path("overview").asText();
                    if (overview == null || overview.isBlank()) {
                        overview = root.path("overview").asText();
                    }

                    String epName = lastEpNode.path("name").asText(null);

                    lastDto = new ReleaseRadarDTO(
                            tmdbId,
                            root.path("name").asText(),
                            "SERIES",
                            lastReleaseDate.toString(),
                            "https://image.tmdb.org/t/p/w500" + root.path("poster_path").asText(),
                            overview,
                            lastEpisode,
                            lastSeason,
                            watched,
                            epName
                    );
                } catch (Exception e) {
                    log.warn("Erro ao parsear fallback last_episode_to_air da série {}", tmdbId, e);
                }
            }
        }

        ReleaseRadarDTO nextDto = null;
        LocalDate nextReleaseDate = null;
        Integer nextSeason = null;
        Integer nextEpisode = null;

        if (nextEpNode != null && !nextEpNode.isMissingNode() && !nextEpNode.isNull()) {
            String nextDateStr = nextEpNode.path("air_date").asText();
            if (nextDateStr != null && !nextDateStr.isEmpty() && !nextDateStr.equals("null")) {
                try {
                    LocalDate rawNextDate = LocalDate.parse(nextDateStr);
                    nextReleaseDate = adjustReleaseDateForSaoPaulo(rawNextDate, root);
                    nextSeason = nextEpNode.path("season_number").asInt();
                    nextEpisode = nextEpNode.path("episode_number").asInt();

                    boolean watched = false;
                    if (userId != null && !userId.isBlank() && !userId.equals("default")) {
                        watched = watchedEpisodeRepository.existsByUserIdAndSerieIdAndSeasonNumberAndEpisodeNumber(
                                userId, tmdbId, nextSeason, nextEpisode
                        );
                    }

                    String overview = nextEpNode.path("overview").asText();
                    if (overview == null || overview.isBlank()) {
                        overview = root.path("overview").asText();
                    }

                    String epName = nextEpNode.path("name").asText(null);

                    nextDto = new ReleaseRadarDTO(
                            tmdbId,
                            root.path("name").asText(),
                            "SERIES",
                            nextReleaseDate.toString(),
                            "https://image.tmdb.org/t/p/w500" + root.path("poster_path").asText(),
                            overview,
                            nextEpisode,
                            nextSeason,
                            watched,
                            epName
                    );
                } catch (Exception e) {
                    log.warn("Erro ao parsear fallback next_episode_to_air da série {}", tmdbId, e);
                }
            }
        }

        if (lastDto != null && lastReleaseDate != null) {
            boolean isTodayOrFuture = !lastReleaseDate.isBefore(today);
            if (isTodayOrFuture) {
                releases.add(lastDto);
            }
        }

        if (nextDto != null && nextReleaseDate != null) {
            boolean isTodayOrFuture = !nextReleaseDate.isBefore(today);
            if (isTodayOrFuture) {
                boolean isSameEpisode = (lastSeason != null && lastSeason.equals(nextSeason)
                        && lastEpisode != null && lastEpisode.equals(nextEpisode));
                if (!isSameEpisode || releases.isEmpty()) {
                    releases.add(nextDto);
                }
            }
        }

        return releases;
    }

    private LocalDate adjustReleaseDateForSaoPaulo(LocalDate rawDate, JsonNode showRoot) {
        JsonNode networks = showRoot.path("networks");
        for (JsonNode network : networks) {
            if (EVENING_PT_NETWORKS.contains(network.path("id").asInt())) {
                log.debug("Rede com lançamento noturno PT detectada (id={}), ajustando data +1 dia para SP",
                        network.path("id").asInt());
                return rawDate.plusDays(1);
            }
        }
        return rawDate;
    }

    private void processBatchNotifications(List<ReleaseRadarDTO> releases, String userId) {
        LocalDate today = LocalDate.now(SAO_PAULO_ZONE);
        List<String> messages = new ArrayList<>();

        for (ReleaseRadarDTO dto : releases) {
            try {
                LocalDate releaseDate = LocalDate.parse(dto.releaseDate());
                if (today.equals(releaseDate)) {
                    String episodeSuffix = "SERIES".equals(dto.type())
                            ? (":S" + dto.seasonNumber() + "E" + dto.episodeNumber())
                            : "";
                    String notifiedKey = REDIS_NOTIFIED_PREFIX + dto.tmdbId() + episodeSuffix + ":" + releaseDate.toString() + ":" + userId;
                    Boolean acquired = redisTemplate.opsForValue().setIfAbsent(notifiedKey, "true", Duration.ofHours(48));

                    if (Boolean.TRUE.equals(acquired)) {
                        if ("SERIES".equals(dto.type())) {
                            messages.add(String.format("📺 <b>%s</b> (S%02dE%02d)", dto.title(), dto.seasonNumber(), dto.episodeNumber()));
                        } else {
                            messages.add(String.format("🎬 <b>%s</b>", dto.title()));
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Erro ao processar data para notificação em lote: {}", dto.releaseDate());
            }
        }

        if (!messages.isEmpty()) {
            StringBuilder messageText = new StringBuilder();
            if (messages.size() == 1) {
                messageText.append("🍿 <b>Lançamento de Hoje!</b>\n\n");
            } else {
                messageText.append("🍿 <b>Lançamentos de Hoje!</b>\n\n");
            }

            for (String msg : messages) {
                messageText.append("• ").append(msg).append("\n");
            }

            String buttonLabel = "Ver Radar de Lançamentos";
            String buttonUrl = "https://filmes.lucasmks.com.br/series/radar";

            eventPublisher.publishEvent(NotificationEvent.builder()
                    .userId(userId)
                    .type("MEDIA")
                    .message(messageText.toString())
                    .buttonLabel(buttonLabel)
                    .buttonPath(buttonUrl)
                    .build());
            log.info("Notificação de Radar agregada enviada com {} lançamentos.", messages.size());
        }
    }

    private Mono<Map<String, RatingStatusDTO>> fetchSeriesRatings(List<String> serieIds, String authHeader) {
        if (serieIds == null || serieIds.isEmpty() || authHeader == null || authHeader.isBlank()) {
            return Mono.just(Map.of());
        }

        Mono<Map<String, RatingStatusDTO>> mono = lmsRatingWebClient.get()
                .uri(uriBuilder -> uriBuilder.path("/rate/series/status/batch")
                        .queryParam("serieIds", serieIds)
                        .build())
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, RatingStatusDTO>>() {});

        return mono.onErrorResume(e -> { log.error("Fallback para fetchSeriesRatings: {}", e.getMessage()); return Mono.just(Map.of()); });
    }

    public List<SerieWatchStatusDTO> getEpisodesToWatch(String userId, String authHeader) {
        if (authHeader == null || authHeader.isBlank()) {
            return List.of();
        }

        try {
            Map<String, String> fetchedSeriesStatus = fetchWatchlistSeriesWithStatus(authHeader).block();
            Map<String, String> seriesWithStatus = new HashMap<>(fetchedSeriesStatus != null ? fetchedSeriesStatus : Map.of());

            // Merge com mídias rastreadas no banco local (UserTrackedMedia) para garantir que séries concluídas e salvas no banco sejam consideradas
            List<UserTrackedMedia> localTracked = userTrackedMediaRepository.findByUserId(userId);
            for (UserTrackedMedia m : localTracked) {
                if ("SERIES".equalsIgnoreCase(m.getMediaType()) && m.getTmdbId() != null) {
                    String existing = seriesWithStatus.get(m.getTmdbId());
                    if (existing == null) {
                        seriesWithStatus.put(m.getTmdbId(), m.getStatus() != null ? m.getStatus() : "PLAN_TO_WATCH");
                    } else if ("COMPLETED".equalsIgnoreCase(m.getStatus()) && !"COMPLETED".equalsIgnoreCase(existing)) {
                        seriesWithStatus.put(m.getTmdbId(), "COMPLETED");
                    }
                }
            }

            if (seriesWithStatus.isEmpty()) {
                return List.of();
            }

            // Atualiza status no banco local com base no status do LMS Filmes
            for (UserTrackedMedia m : localTracked) {
                if ("SERIES".equalsIgnoreCase(m.getMediaType()) && seriesWithStatus.containsKey(m.getTmdbId())) {
                    String currentRemoteStatus = seriesWithStatus.get(m.getTmdbId());
                    if (currentRemoteStatus != null && !currentRemoteStatus.equals(m.getStatus())) {
                        m.setStatus(currentRemoteStatus);
                        userTrackedMediaRepository.save(m);
                    }
                }
            }

            // Batch fetch watched episodes, preferences, and ratings
            List<WatchedEpisode> localWatched = watchedEpisodeRepository.findByUserIdAndSerieIdIn(userId, seriesWithStatus.keySet());
            List<WatchedEpisode> allWatched = new ArrayList<>(localWatched);

            // Se alguma série não possui episódios assistidos localmente e não está marcada como COMPLETED,
            // tenta recuperar os episódios assistidos já salvos no LMS Filmes via /watched/episodes/serie/{serieId}
            Set<String> seriesWithLocalEpisodes = localWatched.stream()
                    .map(WatchedEpisode::getSerieId)
                    .collect(Collectors.toSet());

            List<String> needRemoteSync = seriesWithStatus.entrySet().stream()
                    .filter(e -> !seriesWithLocalEpisodes.contains(e.getKey()) && !"COMPLETED".equalsIgnoreCase(e.getValue()))
                    .map(Map.Entry::getKey)
                    .toList();

            if (!needRemoteSync.isEmpty() && authHeader != null && !authHeader.isBlank()) {
                try {
                    List<WatchedEpisode> recoveredEpisodes = Flux.fromIterable(needRemoteSync)
                            .flatMap(sId -> fetchRemoteWatchedEpisodesForSerie(sId, userId, authHeader), TMDB_PARALLEL_CALLS)
                            .flatMapIterable(list -> list)
                            .collectList()
                            .block();

                    if (recoveredEpisodes != null && !recoveredEpisodes.isEmpty()) {
                        watchedEpisodeRepository.saveAll(recoveredEpisodes);
                        allWatched.addAll(recoveredEpisodes);
                        log.info("Recuperados {} episódios assistidos do LMS Filmes para o usuário {}", recoveredEpisodes.size(), userId);
                    }
                } catch (Exception e) {
                    log.warn("Aviso ao buscar episódios assistidos do LMS Filmes: {}", e.getMessage());
                }
            }

            List<SeriePreference> allPreferences = seriePreferenceRepository.findByUserIdAndSerieIdIn(userId, seriesWithStatus.keySet());

            Map<String, RatingStatusDTO> ratingsMap = new java.util.HashMap<>();
            try {
                Map<String, RatingStatusDTO> fetchedRatings = fetchSeriesRatings(new ArrayList<>(seriesWithStatus.keySet()), authHeader).block();
                if (fetchedRatings != null) {
                    ratingsMap.putAll(fetchedRatings);
                }
            } catch (Exception e) {
                log.error("Erro ao buscar notas em lote: {}", e.getMessage());
            }

            // Group by serieId for O(1) lookup
            Map<String, List<WatchedEpisode>> watchedBySerie = allWatched.stream()
                    .collect(java.util.stream.Collectors.groupingBy(WatchedEpisode::getSerieId));
            Map<String, SeriePreference> prefBySerie = allPreferences.stream()
                    .collect(java.util.stream.Collectors.toMap(SeriePreference::getSerieId, p -> p, (a, b) -> a));

            // Fetch status for all series in parallel using batch-loaded data
            final Map<String, RatingStatusDTO> finalRatingsMap = ratingsMap;
            List<SerieWatchStatusDTO> result = Flux.fromIterable(seriesWithStatus.keySet())
                    .flatMap(id -> {
                        List<WatchedEpisode> watchedList = watchedBySerie.getOrDefault(id, List.of());
                        Optional<SeriePreference> prefOpt = Optional.ofNullable(prefBySerie.get(id));

                        RatingStatusDTO ratingDto = finalRatingsMap.get(id);
                        Double rating = null;
                        if (ratingDto != null && ratingDto.rating() != null) {
                            try {
                                rating = Double.parseDouble(ratingDto.rating());
                            } catch (Exception ignored) {}
                        }

                        return getSerieWatchStatusReactive(id, userId, seriesWithStatus.get(id), watchedList, prefOpt, rating);
                    }, TMDB_PARALLEL_CALLS)
                    .collectList()
                    .block();

            if (result == null) return List.of();

            // Sort series: first shows with unwatched episodes, then alphabetically or by title
            result.sort((a, b) -> {
                if (a.unwatchedCount() > 0 && b.unwatchedCount() == 0) return -1;
                if (a.unwatchedCount() == 0 && b.unwatchedCount() > 0) return 1;
                return a.title().compareToIgnoreCase(b.title());
            });

            return result;
        } catch (Exception e) {
            log.error("Erro ao buscar episódios a assistir para usuário {}", userId, e);
            return List.of();
        }
    }

    public Mono<SerieWatchStatusDTO> getSerieWatchStatusReactive(String tmdbId, String userId, String lmsStatus) {
        return getSerieWatchStatusReactive(tmdbId, userId, lmsStatus, (Double) null);
    }

    public Mono<SerieWatchStatusDTO> getSerieWatchStatusReactive(String tmdbId, String userId, String lmsStatus, Double rating) {
        return Mono.zip(
                Mono.fromCallable(() -> watchedEpisodeRepository.findByUserIdAndSerieId(userId, tmdbId))
                        .subscribeOn(Schedulers.boundedElastic()),
                Mono.fromCallable(() -> {
                    try {
                        return seriePreferenceRepository.findByUserIdAndSerieId(userId, tmdbId);
                    } catch (Exception e) {
                        log.error("Erro ao buscar preferências da série", e);
                        return Optional.<SeriePreference>empty();
                    }
                }).subscribeOn(Schedulers.boundedElastic())
        )
        .flatMap(tuple -> getSerieWatchStatusReactive(tmdbId, userId, lmsStatus, tuple.getT1(), tuple.getT2(), rating));
    }

    public Mono<SerieWatchStatusDTO> getSerieWatchStatusReactive(
            String tmdbId, String userId, String lmsStatus,
            List<WatchedEpisode> watchedList, Optional<SeriePreference> prefOpt) {
        return getSerieWatchStatusReactive(tmdbId, userId, lmsStatus, watchedList, prefOpt, null);
    }

    public Mono<SerieWatchStatusDTO> getSerieWatchStatusReactive(
            String tmdbId, String userId, String lmsStatus,
            List<WatchedEpisode> watchedList, Optional<SeriePreference> prefOpt,
            Double rating) {
        return fetchTmdbShowDetailsReactive(tmdbId)
                .flatMap(responseBody -> {
                    try {
                        JsonNode root = objectMapper.readTree(responseBody);
                        String title = root.path("name").asText();
                        String posterPath = root.path("poster_path").asText();
                        String posterUrl = (posterPath != null && !posterPath.isEmpty() && !posterPath.equals("null"))
                                ? "https://image.tmdb.org/t/p/w500" + posterPath
                                : null;
                        final boolean inProduction = root.path("in_production").asBoolean(true);
                        final String status = root.path("status").asText("Unknown");

                        JsonNode nextEpisodeNode = root.path("next_episode_to_air");
                        String nextAirDateVal = null;
                        if (nextEpisodeNode != null && !nextEpisodeNode.isMissingNode() && !nextEpisodeNode.isNull()) {
                            nextAirDateVal = nextEpisodeNode.path("air_date").asText(null);
                            if (nextAirDateVal != null && (nextAirDateVal.isEmpty() || nextAirDateVal.equals("null"))) {
                                nextAirDateVal = null;
                            } else if (nextAirDateVal != null) {
                                try {
                                    LocalDate rawDate = LocalDate.parse(nextAirDateVal);
                                    nextAirDateVal = adjustReleaseDateForSaoPaulo(rawDate, root).toString();
                                } catch (Exception ignored) {}
                            }
                        }
                        final String nextAirDate = nextAirDateVal;

                        final List<String> genres = new ArrayList<>();
                        JsonNode genresNode = root.path("genres");
                        if (genresNode.isArray()) {
                            for (JsonNode gNode : genresNode) {
                                genres.add(gNode.path("name").asText());
                            }
                        }

                        final List<String> networks = new ArrayList<>();
                        JsonNode networksNode = root.path("networks");
                        if (networksNode.isArray()) {
                            for (JsonNode nNode : networksNode) {
                                networks.add(nNode.path("name").asText());
                            }
                        }

                        JsonNode seasonsNode = root.path("seasons");
                        List<Integer> seasonNumbers = new ArrayList<>();
                        if (seasonsNode.isArray()) {
                            for (JsonNode sNode : seasonsNode) {
                                int seasonNumber = sNode.path("season_number").asInt();
                                if (seasonNumber > 0) { // Exclude specials
                                    seasonNumbers.add(seasonNumber);
                                }
                            }
                        }

                        // Fetch episodes for all seasons in parallel
                        return Flux.fromIterable(seasonNumbers)
                                .flatMap(seasonNum -> fetchSeasonEpisodesReactive(tmdbId, seasonNum))
                                .collectList()
                                .map(allSeasonEpisodes -> {
                                    // Flatten the list of episodes
                                    List<EpisodeDTO> allEpisodes = new ArrayList<>();
                                    for (List<EpisodeDTO> seasonEpisodes : allSeasonEpisodes) {
                                        allEpisodes.addAll(seasonEpisodes);
                                    }

                                    // Sort episodes by season and episode number
                                    allEpisodes.sort(Comparator.comparing(EpisodeDTO::seasonNumber)
                                            .thenComparing(EpisodeDTO::episodeNumber));

                                    // Filter to only aired episodes
                                    LocalDate today = LocalDate.now(SAO_PAULO_ZONE);
                                    List<EpisodeDTO> airedEpisodes = new ArrayList<>();
                                    for (EpisodeDTO ep : allEpisodes) {
                                        if (ep.airDate() != null && !ep.airDate().isEmpty() && !ep.airDate().equals("null")) {
                                            try {
                                                LocalDate rawAirDate = LocalDate.parse(ep.airDate());
                                                LocalDate adjustedAirDate = adjustReleaseDateForSaoPaulo(rawAirDate, root);
                                                if (!adjustedAirDate.isAfter(today)) {
                                                    EpisodeDTO adjustedEp = new EpisodeDTO(
                                                            ep.seasonNumber(), ep.episodeNumber(), ep.name(),
                                                            adjustedAirDate.toString(), ep.overview(), ep.stillPath(),
                                                            ep.watched(), ep.rating(), ep.watchedAt()
                                                    );
                                                    airedEpisodes.add(adjustedEp);
                                                }
                                            } catch (Exception ignored) {}
                                        }
                                    }

                                    boolean rewatching = prefOpt.isPresent() && prefOpt.get().isRewatching();
                                    boolean watchLater = prefOpt.isPresent() && prefOpt.get().isWatchLater();
                                    int rewatchCount = prefOpt.isPresent() ? prefOpt.get().getRewatchCount() : 0;
                                    boolean isCompleted = "COMPLETED".equalsIgnoreCase(lmsStatus) || "WATCHED".equalsIgnoreCase(lmsStatus);

                                    java.util.Map<String, WatchedEpisode> watchedMap = new java.util.HashMap<>(
                                            watchedList.stream()
                                                    .collect(java.util.stream.Collectors.toMap(
                                                            we -> we.getSeasonNumber() + "-" + we.getEpisodeNumber(),
                                                            we -> we,
                                                            (a, b) -> a
                                                    ))
                                    );

                                    // Se a série está concluída e não está em rewatch, garante que todos os episódios lançados
                                    // fiquem marcados como assistidos tanto em memória quanto persistidos no banco local.
                                    if (isCompleted && !rewatching && !airedEpisodes.isEmpty()) {
                                        List<WatchedEpisode> toBackfill = new ArrayList<>();
                                        LocalDateTime now = LocalDateTime.now(SAO_PAULO_ZONE);
                                        for (EpisodeDTO ep : airedEpisodes) {
                                            String key = ep.seasonNumber() + "-" + ep.episodeNumber();
                                            if (!watchedMap.containsKey(key)) {
                                                WatchedEpisode we = WatchedEpisode.builder()
                                                        .userId(userId)
                                                        .serieId(tmdbId)
                                                        .seasonNumber(ep.seasonNumber())
                                                        .episodeNumber(ep.episodeNumber())
                                                        .watchedAt(now)
                                                        .build();
                                                watchedMap.put(key, we);
                                                toBackfill.add(we);
                                            }
                                        }
                                        if (!toBackfill.isEmpty()) {
                                            try {
                                                watchedEpisodeRepository.saveAll(toBackfill);
                                                log.info("Série concluída {} ({}): {} episódios marcados no banco local.",
                                                        tmdbId, title, toBackfill.size());
                                            } catch (Exception e) {
                                                log.error("Erro ao persistir episódios da série concluída {}", tmdbId, e);
                                            }
                                        }
                                    }

                                    // Map episodes to set watched status
                                    List<EpisodeDTO> enrichedEpisodes = new ArrayList<>();
                                    EpisodeDTO nextToWatch = null;
                                    long unwatchedCount = 0;

                                    for (EpisodeDTO ep : airedEpisodes) {
                                        String key = ep.seasonNumber() + "-" + ep.episodeNumber();
                                        WatchedEpisode we = watchedMap.get(key);
                                        boolean watched = we != null;
                                        Double epRating = (we != null) ? we.getRating() : null;

                                        EpisodeDTO enriched = new EpisodeDTO(
                                                ep.seasonNumber(), ep.episodeNumber(), ep.name(),
                                                ep.airDate(), ep.overview(), ep.stillPath(), watched, epRating,
                                                we != null && we.getWatchedAt() != null ? we.getWatchedAt().toString() : null
                                        );
                                        enrichedEpisodes.add(enriched);

                                        if (!watched) {
                                            unwatchedCount++;
                                            if (nextToWatch == null) {
                                                nextToWatch = enriched;
                                            }
                                        }
                                    }

                                    if (unwatchedCount == 0 && rewatching) {
                                        rewatching = false;
                                        if (prefOpt.isPresent()) {
                                            SeriePreference pref = prefOpt.get();
                                            pref.setRewatching(false);
                                            try {
                                                seriePreferenceRepository.save(pref);
                                                log.info("Rewatch concluído automaticamente para série {} (unwatchedCount=0)", tmdbId);
                                            } catch (Exception e) {
                                                log.error("Erro ao salvar término de rewatch para série {}", tmdbId, e);
                                            }
                                        }
                                    }

                                    return new SerieWatchStatusDTO(
                                            tmdbId, title, posterUrl, nextToWatch,
                                            unwatchedCount, enrichedEpisodes.size(), enrichedEpisodes, watchLater,
                                            rewatching, rewatchCount,
                                            inProduction, status, genres, networks, nextAirDate, rating
                                    );
                                });
                    } catch (Exception e) {
                        log.error("Erro ao parsear detalhes da série {}", tmdbId, e);
                        return Mono.empty();
                    }
                })
                .onErrorResume(e -> {
                    log.error("Erro ao obter status de exibição para série {}: {}", tmdbId, e.getMessage());
                    return Mono.empty();
                });
    }

    private Mono<List<EpisodeDTO>> fetchSeasonEpisodesReactive(String tmdbId, int seasonNumber) {
        String cacheKey = "gaming_radar_season_episodes:" + tmdbId + ":" + seasonNumber;

        Mono<List<EpisodeDTO>> cacheMono = Mono.fromCallable(() -> {
            try {
                String json = redisTemplate.opsForValue().get(cacheKey);
                if (json != null) {
                    return objectMapper.readValue(json, new TypeReference<List<EpisodeDTO>>() {});
                }
            } catch (Exception e) {
                log.error("Erro ao ler episódios da temporada do Redis", e);
            }
            return null;
        })
        .subscribeOn(Schedulers.boundedElastic())
        .flatMap(cachedEpisodes -> {
            // Se o callable retornar null, Mono.fromCallable completa vazio.
            // Se houver valor no cache, passamos adiante.
            return Mono.just(cachedEpisodes);
        });

        // Se o cache estiver vazio (retornou null e completou vazio), busca do TMDB
        Mono<List<EpisodeDTO>> tmdbMono = tmdbWebClient.get()
                .uri(uriBuilder -> uriBuilder.path("/tv/{id}/season/{seasonNumber}")
                        .queryParam("language", "pt-BR")
                        .build(tmdbId, seasonNumber))
                .retrieve()
                .bodyToMono(String.class)
                .flatMap(responseBody -> Mono.fromCallable(() -> {
                    List<EpisodeDTO> episodes = parseTmdbSeasonEpisodes(responseBody, seasonNumber);
                    
                    // Salva o resultado no Redis
                    try {
                        boolean isFinished = isSeasonFinished(episodes);
                        Duration ttl = isFinished ? Duration.ofDays(30) : Duration.ofDays(1);
                        redisTemplate.opsForValue().set(cacheKey, objectMapper.writeValueAsString(episodes), ttl);
                    } catch (Exception e) {
                        log.error("Erro ao salvar episódios da temporada no Redis", e);
                    }
                    
                    return episodes;
                }).subscribeOn(Schedulers.boundedElastic()));

        return cacheMono.switchIfEmpty(tmdbMono)
                .onErrorResume(e -> {
                    log.error("Erro ao buscar episódios da temporada {} da série {} no TMDB: {}", seasonNumber, tmdbId, e.getMessage());
                    return Mono.just(List.of());
                });
    }

    private List<EpisodeDTO> parseTmdbSeasonEpisodes(String responseBody, int seasonNumber) throws Exception {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode episodesNode = root.path("episodes");
        List<EpisodeDTO> episodes = new ArrayList<>();

        if (episodesNode.isArray()) {
            for (JsonNode epNode : episodesNode) {
                Integer epNum = epNode.path("episode_number").asInt();
                String name = epNode.path("name").asText();
                String airDate = epNode.path("air_date").asText();
                String overview = epNode.path("overview").asText();
                String stillPath = epNode.path("still_path").asText();
                
                String stillUrl = (stillPath != null && !stillPath.isEmpty() && !stillPath.equals("null"))
                        ? "https://image.tmdb.org/t/p/w500" + stillPath
                        : null;

                episodes.add(new EpisodeDTO(
                    seasonNumber,
                    epNum,
                    name,
                    airDate,
                    overview,
                    stillUrl,
                    false,
                    null,
                    null
                ));
            }
        }
        return episodes;
    }

    private boolean isSeasonFinished(List<EpisodeDTO> episodes) {
        if (episodes.isEmpty()) return true;
        LocalDate today = LocalDate.now(SAO_PAULO_ZONE);
        for (EpisodeDTO ep : episodes) {
            if (ep.airDate() == null || ep.airDate().isEmpty() || ep.airDate().equals("null")) {
                return false;
            }
            try {
                LocalDate airDate = LocalDate.parse(ep.airDate());
                if (airDate.isAfter(today)) {
                    return false;
                }
            } catch (Exception e) {
                return false;
            }
        }
        return true;
    }

    @Transactional
    public void markEpisodeAsWatched(String userId, String serieId, Integer seasonNumber, Integer episodeNumber, String authHeader) {
        boolean exists = watchedEpisodeRepository.existsByUserIdAndSerieIdAndSeasonNumberAndEpisodeNumber(
                userId, serieId, seasonNumber, episodeNumber);
        if (!exists) {
            WatchedEpisode we = WatchedEpisode.builder()
                    .userId(userId)
                    .serieId(serieId)
                    .seasonNumber(seasonNumber)
                    .episodeNumber(episodeNumber)
                    .watchedAt(LocalDateTime.now(SAO_PAULO_ZONE))
                    .build();
            watchedEpisodeRepository.save(we);
            log.info("Episódio marcado como assistido: usuário={}, série={}, S{}E{}", userId, serieId, seasonNumber, episodeNumber);
            
            // Sync to LMS-Filmes via lms-favorite
            if (authHeader != null && !authHeader.isBlank()) {
                lmsFavoriteWebClient.post()
                        .uri("/watched/episodes")
                        .header(HttpHeaders.AUTHORIZATION, authHeader)
                        .bodyValue(Map.of(
                                "serieId", serieId,
                                "seasonNumber", seasonNumber,
                                "episodeNumber", episodeNumber
                        ))
                        .retrieve()
                        .bodyToMono(Void.class)
                        .subscribeOn(Schedulers.boundedElastic())
                        .subscribe(
                                s -> log.info("Episódio S{}E{} da série {} sincronizado com LMS-Filmes", seasonNumber, episodeNumber, serieId),
                                err -> log.error("Erro ao sincronizar episódio assistido com LMS-Filmes: {}", err.getMessage())
                        );
            }

            // Check if series is now completed during a rewatch
            updateProgressAndCheckRewatch(userId, serieId);
        }
    }

    @Transactional
    public void markEpisodeAsUnwatched(String userId, String serieId, Integer seasonNumber, Integer episodeNumber, String authHeader) {
        watchedEpisodeRepository.deleteByUserIdAndSerieIdAndSeasonNumberAndEpisodeNumber(
                userId, serieId, seasonNumber, episodeNumber);
        log.info("Episódio desmarcado como assistido: usuário={}, série={}, S{}E{}", userId, serieId, seasonNumber, episodeNumber);
        
        // Sync unwatch to LMS-Filmes via lms-favorite
        if (authHeader != null && !authHeader.isBlank()) {
            lmsFavoriteWebClient.method(HttpMethod.DELETE)
                    .uri("/watched/episodes")
                    .header(HttpHeaders.AUTHORIZATION, authHeader)
                    .bodyValue(Map.of(
                            "serieId", serieId,
                            "seasonNumber", seasonNumber,
                            "episodeNumber", episodeNumber
                    ))
                    .retrieve()
                    .bodyToMono(Void.class)
                    .subscribeOn(Schedulers.boundedElastic())
                    .subscribe(
                            s -> log.info("Episódio S{}E{} da série {} desmarcado sincronizado com LMS-Filmes", seasonNumber, episodeNumber, serieId),
                            err -> log.error("Erro ao sincronizar desmarcação de episódio com LMS-Filmes: {}", err.getMessage())
                    );
        }

        // Update progress in LMS-Filmes
        updateProgressAndCheckRewatch(userId, serieId);
    }

    @Transactional
    public void markAllEpisodesAsWatchedUpTo(String userId, String serieId, Integer seasonNumber, Integer episodeNumber, String authHeader) {
        // Retrieve all episodes for this series
        SerieWatchStatusDTO status = getSerieWatchStatusReactive(serieId, userId, "WATCHING").block();
        if (status == null) return;

        List<WatchedEpisode> toSave = new ArrayList<>();
        List<WatchedEpisode> existing = watchedEpisodeRepository.findByUserIdAndSerieId(userId, serieId);
        Set<String> watchedKeys = existing.stream()
                .map(we -> we.getSeasonNumber() + "-" + we.getEpisodeNumber())
                .collect(java.util.stream.Collectors.toSet());

        LocalDateTime now = LocalDateTime.now(SAO_PAULO_ZONE);

        for (EpisodeDTO ep : status.episodes()) {
            if (ep.seasonNumber() < seasonNumber || (ep.seasonNumber().equals(seasonNumber) && ep.episodeNumber() <= episodeNumber)) {
                String key = ep.seasonNumber() + "-" + ep.episodeNumber();
                if (!watchedKeys.contains(key)) {
                    toSave.add(WatchedEpisode.builder()
                            .userId(userId)
                            .serieId(serieId)
                            .seasonNumber(ep.seasonNumber())
                            .episodeNumber(ep.episodeNumber())
                            .watchedAt(now)
                            .build());
                }
            }
        }

        if (!toSave.isEmpty()) {
            watchedEpisodeRepository.saveAll(toSave);
            log.info("Marcados {} episódios como assistidos até S{}E{} para série {}", toSave.size(), seasonNumber, episodeNumber, serieId);

            // Sync to LMS-Filmes via lms-favorite
            if (authHeader != null && !authHeader.isBlank()) {
                Flux.fromIterable(toSave)
                        .flatMap(we -> lmsFavoriteWebClient.post()
                                .uri("/watched/episodes")
                                .header(HttpHeaders.AUTHORIZATION, authHeader)
                                .bodyValue(Map.of(
                                        "serieId", we.getSerieId(),
                                        "seasonNumber", we.getSeasonNumber(),
                                        "episodeNumber", we.getEpisodeNumber()
                                ))
                                .retrieve()
                                .bodyToMono(Void.class)
                                .onErrorResume(e -> Mono.empty())
                        )
                        .subscribeOn(Schedulers.boundedElastic())
                        .subscribe(
                                s -> {},
                                err -> log.error("Erro ao sincronizar episódios com LMS-Filmes: {}", err.getMessage())
                        );
            }
        }
        // Check if series is now completed during a rewatch
        updateProgressAndCheckRewatch(userId, serieId);
    }

    @Transactional
    public void rateEpisode(String userId, String serieId, Integer seasonNumber, Integer episodeNumber, Double rating, String authHeader) {
        WatchedEpisode we = watchedEpisodeRepository.findByUserIdAndSerieIdAndSeasonNumberAndEpisodeNumber(
                userId, serieId, seasonNumber, episodeNumber
        ).orElseGet(() -> WatchedEpisode.builder()
                .userId(userId)
                .serieId(serieId)
                .seasonNumber(seasonNumber)
                .episodeNumber(episodeNumber)
                .watchedAt(LocalDateTime.now(SAO_PAULO_ZONE))
                .build());

        we.setRating(rating);
        watchedEpisodeRepository.save(we);
        log.info("Episódio avaliado: usuário={}, série={}, S{}E{} com nota {}", userId, serieId, seasonNumber, episodeNumber, rating);

        // Sync rating to LMS-Rating if authHeader is present
        if (authHeader != null && !authHeader.isBlank() && rating != null) {
            lmsRatingWebClient.post()
                    .uri("/rate/episodes")
                    .header(HttpHeaders.AUTHORIZATION, authHeader)
                    .bodyValue(Map.of(
                            "serieId", serieId,
                            "seasonNumber", seasonNumber,
                            "episodeNumber", episodeNumber,
                            "rating", rating
                    ))
                    .retrieve()
                    .bodyToMono(Void.class)
                    .subscribeOn(Schedulers.boundedElastic())
                    .subscribe(
                            s -> log.info("Avaliação de episódio S{}E{} da série {} sincronizada com LMS-Rating", seasonNumber, episodeNumber, serieId),
                            err -> log.error("Erro ao sincronizar avaliação de episódio com LMS-Rating: {}", err.getMessage())
                    );
        }
    }

    @Transactional
    public void toggleWatchLater(String userId, String serieId, boolean watchLater, String authHeader) {
        SeriePreference pref = seriePreferenceRepository.findByUserIdAndSerieId(userId, serieId)
                .orElse(SeriePreference.builder()
                        .userId(userId)
                        .serieId(serieId)
                        .build());
        pref.setWatchLater(watchLater);
        seriePreferenceRepository.save(pref);

        // Sync to LMSFilmes asynchronously
        if (authHeader != null && !authHeader.isBlank()) {
            String lmsStatus = watchLater ? "PLAN_TO_WATCH" : "WATCHING";
            lmsFavoriteWebClient.patch()
                    .uri(uriBuilder -> uriBuilder.path("/watchlist/series/status")
                            .queryParam("serieId", serieId)
                            .queryParam("status", lmsStatus)
                            .build())
                    .header(HttpHeaders.AUTHORIZATION, authHeader)
                    .retrieve()
                    .bodyToMono(Void.class)
                    .subscribeOn(Schedulers.boundedElastic())
                    .subscribe(
                            success -> log.info("Status da série {} atualizado no LMSFilmes para {}", serieId, lmsStatus),
                            error -> log.error("Erro ao atualizar status da série no LMSFilmes: {}", error.getMessage())
                    );
        }
        log.info("Série {} marcada como watchLater={} para usuário {}", serieId, watchLater, userId);
    }

    @Transactional
    public void startRewatch(String userId, String serieId, String authHeader) {
        SeriePreference pref = seriePreferenceRepository.findByUserIdAndSerieId(userId, serieId)
                .orElse(SeriePreference.builder()
                        .userId(userId)
                        .serieId(serieId)
                        .build());
        
        if (!pref.isRewatching()) {
            pref.setRewatching(true);
            pref.setRewatchCount(pref.getRewatchCount() + 1);
            seriePreferenceRepository.save(pref);
            
            // Send rewatch event to LMS-Filmes via RabbitMQ
            // Using email for userId since the token sub is the email
            SerieRewatchEvent event = new SerieRewatchEvent(userId, serieId); eventPublisher.publishEvent(event);
            log.info("Evento de rewatch disparado para série {} via RabbitMQ", serieId);
            
            // Delete all watched episodes for this user and series so they can mark them as watched again
            watchedEpisodeRepository.deleteByUserIdAndSerieId(userId, serieId);

            // Delete all watched episodes in LMS-Filmes via lms-favorite
            if (authHeader != null && !authHeader.isBlank()) {
                lmsFavoriteWebClient.delete()
                        .uri("/watched/episodes/serie/" + serieId + "/rewatch")
                        .header(HttpHeaders.AUTHORIZATION, authHeader)
                        .retrieve()
                        .bodyToMono(Void.class)
                        .subscribeOn(Schedulers.boundedElastic())
                        .subscribe(
                                s -> log.info("Histórico de episódios da série {} limpo no LMS-Filmes para rewatch", serieId),
                                err -> log.error("Erro ao limpar histórico no LMS-Filmes para rewatch: {}", err.getMessage())
                        );
            }

            log.info("Iniciado rewatch para série {}. rewatchCount={}, rewatching=true. Histórico de episódios limpo.", 
                    serieId, pref.getRewatchCount());
        }
    }

    @Transactional
    public void cancelRewatch(String userId, String serieId, String authHeader) {
        SeriePreference pref = seriePreferenceRepository.findByUserIdAndSerieId(userId, serieId)
                .orElse(null);
        if (pref != null && pref.isRewatching()) {
            pref.setRewatching(false);
            pref.setRewatchCount(Math.max(0, pref.getRewatchCount() - 1));
            seriePreferenceRepository.save(pref);
            
            // Mark all episodes as watched again to restore completion state
            markAllEpisodesAsWatchedUpTo(userId, serieId, 999, 999, authHeader);
            log.info("Cancelado rewatch para série {}. rewatchCount={}, rewatching=false. Todos episódios remarcados como assistidos.", 
                    serieId, pref.getRewatchCount());
        }
    }

    private void updateProgressAndCheckRewatch(String userId, String serieId) {
        try {
            String responseBody = fetchTmdbShowDetailsReactive(serieId).block();
            if (responseBody != null) {
                JsonNode root = objectMapper.readTree(responseBody);
                JsonNode seasonsNode = root.path("seasons");
                List<Integer> seasonNumbers = new ArrayList<>();
                if (seasonsNode.isArray()) {
                    for (JsonNode sNode : seasonsNode) {
                        int seasonNumber = sNode.path("season_number").asInt();
                        if (seasonNumber > 0) { // Exclude specials
                            seasonNumbers.add(seasonNumber);
                        }
                    }
                }

                List<List<EpisodeDTO>> allSeasonEpisodes = Flux.fromIterable(seasonNumbers)
                        .flatMap(seasonNum -> fetchSeasonEpisodesReactive(serieId, seasonNum))
                        .collectList()
                        .block();

                if (allSeasonEpisodes != null) {
                    int totalAiredEpisodes = 0;
                    LocalDate today = LocalDate.now(SAO_PAULO_ZONE);
                    for (List<EpisodeDTO> seasonEpisodes : allSeasonEpisodes) {
                        for (EpisodeDTO ep : seasonEpisodes) {
                            if (ep.airDate() != null && !ep.airDate().isEmpty() && !ep.airDate().equals("null")) {
                                try {
                                    LocalDate rawAirDate = LocalDate.parse(ep.airDate());
                                    LocalDate adjustedAirDate = adjustReleaseDateForSaoPaulo(rawAirDate, root);
                                    if (!adjustedAirDate.isAfter(today)) {
                                        totalAiredEpisodes++;
                                    }
                                } catch (Exception ignored) {}
                            }
                        }
                    }

                    List<WatchedEpisode> watchedList = watchedEpisodeRepository.findByUserIdAndSerieId(userId, serieId);
                    int watchedCount = watchedList.size();

                    // Publish Progress Event to RabbitMQ
                    SerieProgressEvent progressEvent = new SerieProgressEvent(userId, serieId, watchedCount, totalAiredEpisodes); eventPublisher.publishEvent(progressEvent);
                    log.info("Evento de progresso disparado via RabbitMQ para a série {}: {}/{}", serieId, watchedCount, totalAiredEpisodes);

                    // Check Rewatch Completion
                    final int finalTotal = totalAiredEpisodes;
                    seriePreferenceRepository.findByUserIdAndSerieId(userId, serieId).ifPresent(pref -> {
                        if (pref.isRewatching() && watchedCount >= finalTotal) {
                            pref.setRewatching(false);
                            seriePreferenceRepository.save(pref);
                            log.info("Rewatch concluído para série {}. rewatching definido como false. (watched={}/{})", 
                                    serieId, watchedCount, finalTotal);
                        }
                    });
                }
            }
        } catch (Exception e) {
            log.error("Erro ao verificar progresso/rewatch para série {}", serieId, e);
        }
    }

    /**
     * Verifica os lançamentos do dia atual (horário de São Paulo) para o usuário
     * consultando a watchlist salva localmente no Postgres (UserTrackedMedia) e
     * os detalhes atualizados no TMDB sem depender de JWT.
     */
    public void checkDailyReleasesForUser(String userId) {
        if (userId == null || userId.isBlank() || "default".equals(userId)) {
            return;
        }

        List<UserTrackedMedia> tracked = userTrackedMediaRepository.findByUserId(userId);
        if (tracked == null || tracked.isEmpty()) {
            log.debug("Nenhuma mídia rastreada no banco local para o usuário {}", userId);
            return;
        }

        log.info("Verificando lançamentos diários para usuário {} com {} mídias rastreadas", userId, tracked.size());

        List<String> movieIds = tracked.stream()
                .filter(m -> "MOVIE".equalsIgnoreCase(m.getMediaType()))
                .map(UserTrackedMedia::getTmdbId)
                .toList();

        List<String> serieIds = tracked.stream()
                .filter(m -> "SERIES".equalsIgnoreCase(m.getMediaType()))
                .map(UserTrackedMedia::getTmdbId)
                .toList();

        try {
            Flux<ReleaseRadarDTO> moviesFlux = Flux.fromIterable(movieIds)
                    .flatMap(id -> fetchTmdbMovieReactive(id, userId), TMDB_PARALLEL_CALLS);
            Flux<ReleaseRadarDTO> seriesFlux = Flux.fromIterable(serieIds)
                    .flatMap(id -> fetchTmdbSeriesReleasesReactive(id, userId), TMDB_PARALLEL_CALLS);

            List<ReleaseRadarDTO> releases = Flux.merge(moviesFlux, seriesFlux)
                    .collectList()
                    .block();

            if (releases == null || releases.isEmpty()) {
                log.info("Nenhum lançamento encontrado no TMDB para o usuário {}", userId);
                return;
            }

            LocalDate today = LocalDate.now(SAO_PAULO_ZONE);
            List<ReleaseRadarDTO> todayReleases = releases.stream()
                    .filter(dto -> {
                        try {
                            return today.equals(LocalDate.parse(dto.releaseDate()));
                        } catch (Exception e) {
                            return false;
                        }
                    })
                    .toList();

            if (!todayReleases.isEmpty()) {
                log.info("Encontrados {} lançamentos hoje para o usuário {}", todayReleases.size(), userId);
                processBatchNotifications(todayReleases, userId);
            } else {
                log.info("Nenhum lançamento hoje para o usuário {}", userId);
            }
        } catch (Exception e) {
            log.error("Erro ao verificar lançamentos diários do TMDB para userId={}: {}", userId, e.getMessage(), e);
        }
    }

    /**
     * Dispara a verificação diária de lançamentos para todos os usuários que possuem mídias acompanhadas.
     */
    public void checkAndNotifyDailyReleases() {
        List<String> userIds = userTrackedMediaRepository.findDistinctUserIds();
        log.info("Iniciando checkAndNotifyDailyReleases para {} usuários distintos", userIds.size());
        for (String userId : userIds) {
            try {
                checkDailyReleasesForUser(userId);
            } catch (Exception e) {
                log.error("Erro ao verificar releases diários para usuário {}: {}", userId, e.getMessage(), e);
            }
        }
    }

    /**
     * Sincroniza a lista de mídias acompanhadas no banco local do LifeOS a partir da watchlist retornada pelo lmsfavorite.
     */
    public void syncUserTrackedMedia(String userId, List<String> movieIds, List<String> serieIds, List<ReleaseRadarDTO> releases) {
        if (userId == null || userId.isBlank() || "default".equals(userId)) {
            return;
        }

        try {
            Set<String> activeTmdbIds = new HashSet<>();
            if (movieIds != null) activeTmdbIds.addAll(movieIds);
            if (serieIds != null) activeTmdbIds.addAll(serieIds);

            List<UserTrackedMedia> existingMedia = userTrackedMediaRepository.findByUserId(userId);
            Map<String, UserTrackedMedia> existingMap = new HashMap<>();
            for (UserTrackedMedia m : existingMedia) {
                existingMap.put(m.getTmdbId(), m);
            }

            Map<String, ReleaseRadarDTO> releaseMap = new HashMap<>();
            if (releases != null) {
                for (ReleaseRadarDTO r : releases) {
                    if (r.tmdbId() != null) {
                        releaseMap.putIfAbsent(r.tmdbId(), r);
                    }
                }
            }

            List<UserTrackedMedia> toSave = new ArrayList<>();

            if (movieIds != null) {
                for (String mId : movieIds) {
                    UserTrackedMedia media = existingMap.get(mId);
                    ReleaseRadarDTO dto = releaseMap.get(mId);
                    if (media == null) {
                        media = UserTrackedMedia.builder()
                                .userId(userId)
                                .tmdbId(mId)
                                .mediaType("MOVIE")
                                .status("PLAN_TO_WATCH")
                                .title(dto != null ? dto.title() : null)
                                .posterPath(dto != null ? dto.posterUrl() : null)
                                .updatedAt(LocalDateTime.now(SAO_PAULO_ZONE))
                                .build();
                    } else {
                        media.setMediaType("MOVIE");
                        if (dto != null) {
                            if (dto.title() != null && !dto.title().isBlank()) media.setTitle(dto.title());
                            if (dto.posterUrl() != null && !dto.posterUrl().isBlank()) media.setPosterPath(dto.posterUrl());
                        }
                        media.setUpdatedAt(LocalDateTime.now(SAO_PAULO_ZONE));
                    }
                    toSave.add(media);
                }
            }

            if (serieIds != null) {
                for (String sId : serieIds) {
                    UserTrackedMedia media = existingMap.get(sId);
                    ReleaseRadarDTO dto = releaseMap.get(sId);
                    if (media == null) {
                        media = UserTrackedMedia.builder()
                                .userId(userId)
                                .tmdbId(sId)
                                .mediaType("SERIES")
                                .status("WATCHING")
                                .title(dto != null ? dto.title() : null)
                                .posterPath(dto != null ? dto.posterUrl() : null)
                                .updatedAt(LocalDateTime.now(SAO_PAULO_ZONE))
                                .build();
                    } else {
                        media.setMediaType("SERIES");
                        if (dto != null) {
                            if (dto.title() != null && !dto.title().isBlank()) media.setTitle(dto.title());
                            if (dto.posterUrl() != null && !dto.posterUrl().isBlank()) media.setPosterPath(dto.posterUrl());
                        }
                        media.setUpdatedAt(LocalDateTime.now(SAO_PAULO_ZONE));
                    }
                    toSave.add(media);
                }
            }

            if (!toSave.isEmpty()) {
                userTrackedMediaRepository.saveAll(toSave);
                log.info("Watchlist local sincronizada: {} mídias salvas para o usuário {}", toSave.size(), userId);
            }

            // Remove itens que foram desmarcados na watchlist do lmsfavorite
            List<UserTrackedMedia> toDelete = existingMedia.stream()
                    .filter(m -> !activeTmdbIds.contains(m.getTmdbId()))
                    .toList();

            if (!toDelete.isEmpty()) {
                userTrackedMediaRepository.deleteAll(toDelete);
                log.info("Watchlist local: removidas {} mídias não mais presentes na watchlist do lmsfavorite para o usuário {}",
                        toDelete.size(), userId);
            }
        } catch (Exception e) {
            log.error("Erro ao sincronizar watchlist local para usuário {}: {}", userId, e.getMessage(), e);
        }
    }
}

