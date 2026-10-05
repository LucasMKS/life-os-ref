package com.lifeos.modules.gaming.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifeos.modules.gaming.dto.CreateTrackedGameRequest;
import com.lifeos.modules.gaming.dto.SteamAppSearchResult;
import com.lifeos.modules.gaming.model.GameNews;
import com.lifeos.modules.gaming.model.UserTrackedGame;
import com.lifeos.modules.gaming.repository.GameNewsRepository;
import com.lifeos.modules.gaming.repository.UserTrackedGameRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.lifeos.modules.gaming.util.UserIdUtils;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

/**
 * Serviço do feed de notícias dos jogos rastreados. Pega a lista de jogos que
 * o usuário cadastrou no /preferences (UserTrackedGame) e busca, para cada um,
 * o endpoint de news da Steam ou faz scrape de patch notes da Riot (League/TFT).
 *
 * O syncRiotPatchNotes é um @Scheduled que roda a cada 6h fazendo o scrape
 * dos sites oficiais da Riot e atualizando o GameNews no banco — depois
 * o cache gaming_news é invalidado para que a próxima leitura do frontend
 * pegue os dados frescos. O @SchedulerLock impede execução duplicada com
 * múltiplas réplicas.
 *
 * O getLatestNews(userId) usa o cache Redis com prefixo gaming::gaming_news::
 * (default 12 minutos) — assim a sidebar do dashboard não martela o backend
 * a cada navegação. Se o usuário não tem nenhum jogo cadastrado, retorna lista
 * vazia sem nem chamar as APIs externas.
 */
@Service
@Slf4j
@RequiredArgsConstructor
@SuppressWarnings("null")
public class GamingNewsService {

    private final UserTrackedGameRepository trackedGameRepository;
    private final GameNewsRepository gameNewsRepository;
    private final WebClient steamWebClient;
    private final WebClient steamStoreWebClient;
    private final ObjectMapper objectMapper;
    private final AtomicBoolean runningNewsSync = new AtomicBoolean(false);

    @Value("${steam.api.key:}")
    private String steamApiKey;

    @Scheduled(
            fixedDelayString = "${app.schedulers.gaming-news-sync.fixed-delay-ms:21600000}",
            initialDelayString = "${app.schedulers.gaming-news-sync.initial-delay-ms:120000}"
    )
    @SchedulerLock(name = "gaming-syncRiotPatchNotes", lockAtMostFor = "PT30M", lockAtLeastFor = "PT5M")
    @CacheEvict(value = "gaming_news", allEntries = true)
    public void syncRiotPatchNotes() {
        if (!runningNewsSync.compareAndSet(false, true)) {
            log.warn("Scheduler de sync de noticias gaming ainda em execucao. Ciclo sera ignorado.");
            return;
        }

        try {
            log.info("Iniciando varredura por novas notas de atualização da Riot...");

            List<GameNews> allRiotNews = new ArrayList<>();
            allRiotNews.addAll(scrapeRiotPatchNotes("LoL", "https://www.leagueoflegends.com/pt-br/news/tags/patch-notes/"));
            allRiotNews.addAll(scrapeRiotPatchNotes("TFT", "https://teamfighttactics.leagueoflegends.com/pt-br/news/tags/patch-notes/"));

            if (!allRiotNews.isEmpty()) {
                gameNewsRepository.deleteAllInBatch();
                gameNewsRepository.saveAll(allRiotNews);
                log.info("Foram salvas/atualizadas {} notas de atualização da Riot.", allRiotNews.size());
            } else {
                log.warn("Nenhuma notícia da Riot foi obtida nesta rodada. Mantendo as notícias anteriores intactas.");
            }
        } finally {
            runningNewsSync.set(false);
        }
    }

    @Cacheable(value = "gaming_news", key = "#userId == null || #userId.isBlank() ? 'anonymous' : #userId")
    public List<GameNews> getLatestNews(String userId) {
        String resolvedUserId = UserIdUtils.resolve(userId);

        List<GameNews> allNews = new ArrayList<>();

        List<GameNews> riotNews = gameNewsRepository.findAllByOrderByPublishedAtDesc()
                .stream().limit(15).toList();
        allNews.addAll(riotNews);

        allNews.addAll(fetchSteamNewsForTrackedGames(resolvedUserId));

        return allNews.stream()
                .sorted(Comparator.comparing(GameNews::getPublishedAt).reversed())
                .toList();
    }

    private List<GameNews> scrapeRiotPatchNotes(String game, String url) {
        List<GameNews> scrapedNews = new ArrayList<>();
        try {
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0")
                    .timeout(10000)
                    .get();

            Elements articles = doc.select("a[href*=/news/game-updates/]");

            for (Element article : articles) {
                String articleUrl = article.attr("abs:href");
                if (articleUrl.isEmpty() || articleUrl.endsWith("game-updates/")) continue;

                if (scrapedNews.stream().anyMatch(n -> n.getUrl().equals(articleUrl))) continue;

                String dateStr = article.select("time").attr("datetime");
                LocalDateTime publishedAt = LocalDateTime.now(ZoneOffset.UTC);
                if (!dateStr.isEmpty()) {
                    try {
                        publishedAt = java.time.OffsetDateTime.parse(dateStr).toLocalDateTime();
                    } catch (Exception ignored) {}
                }

                String rawText = article.text();

                rawText = rawText.replaceAll("(?i)(Atualizações do jogo|Game Updates)\\s*", "");
                rawText = rawText.replaceAll("\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z\\s*", "");
                rawText = rawText.replaceAll("\\d{1,2} de [a-z]{3,4}\\.?\\s*", "");
                rawText = rawText.trim();

                String title = rawText;
                String summary = "Clique para ler as notas oficiais completas no site.";

                String splitKeyword = "TFT".equals(game) ? "Teamfight Tactics" : "do LoL";
                int splitIndex = rawText.indexOf(splitKeyword);

                if (splitIndex != -1) {
                    int endOfTitle = splitIndex + splitKeyword.length();
                    title = rawText.substring(0, endOfTitle).trim();

                    if (rawText.length() > endOfTitle) {
                        String extractedSummary = rawText.substring(endOfTitle).trim();
                        if (!extractedSummary.isEmpty()) {
                            summary = extractedSummary;
                        }
                    }
                }

                String uniqueId = game + "_" + Math.abs(articleUrl.hashCode());

                scrapedNews.add(GameNews.builder()
                        .id(uniqueId)
                        .game(game)
                        .title(title)
                        .summary(summary)
                        .type("PATCH_NOTE")
                        .url(articleUrl)
                        .publishedAt(publishedAt)
                        .build());

                if (scrapedNews.size() >= 3) break;
            }
        } catch (Exception e) {
            log.error("Erro ao raspar as notícias da Riot para {}: {}", game, e.getMessage());
        }
        return scrapedNews;
    }

    private List<GameNews> fetchSteamNewsForTrackedGames(String userId) {
        if (!isSteamApiConfigured() || userId == null || userId.isBlank()) {
            return List.of();
        }

        List<UserTrackedGame> trackedGames = trackedGameRepository.findAllByUserIdOrderByGameAsc(userId);
        if (trackedGames.isEmpty()) {
            return List.of();
        }

        return trackedGames.stream()
                .flatMap(trackedGame -> fetchSteamNewsByGame(trackedGame).stream())
                .collect(Collectors.toList());
    }

    private List<GameNews> fetchSteamNewsByGame(UserTrackedGame trackedGame) {
        try {
            String responseBody = steamWebClient.get()
                    .uri(uriBuilder -> uriBuilder.path("/ISteamNews/GetNewsForApp/v2/")
                            .queryParam("appid", trackedGame.getSteamAppId())
                            .queryParam("count", 10)
                            .queryParam("maxlength", 200)
                            .queryParam("feeds", "steam_community_announcements")
                            .queryParam("format", "json")
                            .queryParam("key", steamApiKey)
                            .build())
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (responseBody == null) return List.of();

            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode items = root.path("appnews").path("newsitems");
            if (!items.isArray() || items.isEmpty()) {
                return List.of();
            }

            return StreamSupport.stream(items.spliterator(), false)
                    .map(item -> {
                        String title = item.path("title").asText("Update - " + trackedGame.getGame());
                        String articleUrl = item.path("url").asText("https://store.steampowered.com/app/" + trackedGame.getSteamAppId());

                        String rawSummary = item.path("contents").asText("Atualização publicada na Steam.");
                        String cleanSummary = rawSummary.replaceAll("<[^>]*>", "").replaceAll("\\[/?\\w+]", "");
                        if (cleanSummary.length() > 150) cleanSummary = cleanSummary.substring(0, 147) + "...";

                        long unixTime = item.path("date").asLong(0L);
                        LocalDateTime publishedAt = unixTime > 0
                                ? LocalDateTime.ofEpochSecond(unixTime, 0, ZoneOffset.UTC)
                                : LocalDateTime.now(ZoneOffset.UTC);

                        return GameNews.builder()
                                .id("steam_" + item.path("gid").asText())
                                .game(trackedGame.getGame())
                                .title(title)
                                .summary(cleanSummary)
                                .type("STEAM_NEWS")
                                .url(articleUrl)
                                .publishedAt(publishedAt)
                                .build();
                    })
                    .toList();
        } catch (Exception ex) {
            log.warn("Failed to fetch Steam news for game {}: {}", trackedGame.getGame(), ex.getMessage());
            return List.of();
        }
    }

    public List<UserTrackedGame> getTrackedGames(String userId) {
        return trackedGameRepository.findAllByUserIdOrderByGameAsc(UserIdUtils.resolve(userId));
    }

    @CacheEvict(value = "gaming_news", allEntries = true)
    public UserTrackedGame createTrackedGame(String userId, CreateTrackedGameRequest request) {
        String resolvedUserId = UserIdUtils.require(userId);

        if (trackedGameRepository.existsByUserIdAndSteamAppId(resolvedUserId, request.steamAppId())) {
            throw new IllegalArgumentException("This Steam game is already being tracked.");
        }

        return trackedGameRepository.save(
                UserTrackedGame.builder()
                        .userId(resolvedUserId)
                        .game(request.game().trim())
                        .steamAppId(request.steamAppId())
                        .build());
    }

    @CacheEvict(value = "gaming_news", allEntries = true)
    public void deleteTrackedGame(String userId, String trackedGameId) {
        UserTrackedGame trackedGame = trackedGameRepository
                .findByIdAndUserId(trackedGameId, UserIdUtils.require(userId))
                .orElseThrow(() -> new NoSuchElementException("Tracked game not found: " + trackedGameId));
        trackedGameRepository.delete(trackedGame);
    }

    public List<SteamAppSearchResult> searchSteamApps(String query) {
        if (query == null || query.isBlank()) return List.of();
        try {
            String responseBody = steamStoreWebClient.get()
                    .uri(uriBuilder -> uriBuilder.path("/api/storesearch/")
                            .queryParam("term", query.trim())
                            .queryParam("l", "english")
                            .queryParam("cc", "us")
                            .build())
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (responseBody == null) return List.of();

            JsonNode items = objectMapper.readTree(responseBody).path("items");
            if (!items.isArray() || items.isEmpty()) return List.of();

            return StreamSupport.stream(items.spliterator(), false)
                    .limit(5)
                    .map(item -> new SteamAppSearchResult(item.path("id").asLong(0L), item.path("name").asText("Unknown")))
                    .filter(item -> item.steamAppId() != null && item.steamAppId() > 0)
                    .toList();
        } catch (Exception ex) {
            log.warn("Erro ao buscar apps na Steam Store para query '{}': {}", query, ex.getMessage());
            return List.of();
        }
    }

    private boolean isSteamApiConfigured() { return steamApiKey != null && !steamApiKey.isBlank(); }
}
