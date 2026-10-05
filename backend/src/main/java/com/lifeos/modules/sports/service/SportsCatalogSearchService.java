package com.lifeos.modules.sports.service;

import com.lifeos.modules.sports.client.EspnSportsClient;
import com.lifeos.modules.sports.dto.SportTeamDTO;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class SportsCatalogSearchService {

    private final EspnSportsClient espnSportsClient;
    private final List<SportTeamDTO> inMemoryTeams = new CopyOnWriteArrayList<>();
    private static final Pattern DIACRITICS = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");

    private static final List<String[]> SUPPORTED_LEAGUES = List.of(
            new String[]{"soccer", "bra.1"},
            new String[]{"soccer", "bra.copa_do_brazil"},
            new String[]{"soccer", "conmebol.libertadores"},
            new String[]{"soccer", "uefa.champions"},
            new String[]{"soccer", "fifa.wwc"},
            new String[]{"soccer", "fifa.friendly"},
            new String[]{"soccer", "fifa.world"},
            new String[]{"basketball", "nba"},
            new String[]{"football", "nfl"}
    );

    @PostConstruct
    public void init() {
        // Run pre-warming asynchronously so application startup is fast and resilient
        CompletableFuture.runAsync(this::refreshCatalog);
    }

    @Scheduled(cron = "0 0 4 * * *") // Daily refresh at 4:00 AM
    public void scheduledRefresh() {
        log.info("Refreshing in-memory sports catalog index...");
        refreshCatalog();
    }

    public synchronized void refreshCatalog() {
        try {
            log.info("Starting sports catalog pre-warming for {} leagues...", SUPPORTED_LEAGUES.size());
            List<SportTeamDTO> allTeams = new ArrayList<>();

            for (String[] target : SUPPORTED_LEAGUES) {
                String sport = target[0];
                String league = target[1];
                try {
                    List<SportTeamDTO> teams = espnSportsClient.getTeams(sport, league);
                    allTeams.addAll(teams);
                } catch (Exception ex) {
                    log.warn("Could not load catalog teams for {}/{}: {}", sport, league, ex.getMessage());
                }
            }

            // Deduplicate by sport + "::" + teamId
            Map<String, SportTeamDTO> uniqueMap = new LinkedHashMap<>();
            for (SportTeamDTO team : allTeams) {
                if (team.getId() != null && !team.getId().isBlank()) {
                    if ("205".equals(team.getId())) {
                        team.setDisplayName("Seleção Brasileira (Brasil)");
                        team.setShortDisplayName("Brasil");
                        team.setName("Brasil");
                    }
                    String key = team.getSport() + "::" + team.getId();
                    uniqueMap.putIfAbsent(key, team);
                }
            }

            inMemoryTeams.clear();
            inMemoryTeams.addAll(uniqueMap.values());
            log.info("In-memory sports catalog initialized with {} unique teams.", inMemoryTeams.size());
        } catch (Exception ex) {
            log.error("Failed to refresh in-memory sports catalog: {}", ex.getMessage());
        }
    }

    /**
     * Search teams in RAM in < 1ms with zero external HTTP calls.
     */
    public List<SportTeamDTO> searchTeams(String query, String sportFilter, String leagueFilter) {
        if (query == null || query.isBlank()) {
            return Collections.emptyList();
        }

        String normalizedQuery = normalize(query.trim());

        return inMemoryTeams.stream()
                .filter(team -> sportFilter == null || sportFilter.isBlank() || team.getSport().equalsIgnoreCase(sportFilter.trim()))
                .filter(team -> leagueFilter == null || leagueFilter.isBlank() || team.getLeague().equalsIgnoreCase(leagueFilter.trim()))
                .filter(team -> {
                    String normName = normalize(team.getName());
                    String normDisplay = normalize(team.getDisplayName());
                    String normShort = normalize(team.getShortDisplayName());
                    String normAbbr = normalize(team.getAbbreviation());

                    boolean matchesAlias = false;
                    if ("205".equals(team.getId())) {
                        matchesAlias = "brasil".contains(normalizedQuery) ||
                                       "selecao".contains(normalizedQuery) ||
                                       "brazil".contains(normalizedQuery);
                    }

                    return matchesAlias ||
                           normName.contains(normalizedQuery) ||
                           normDisplay.contains(normalizedQuery) ||
                           normShort.contains(normalizedQuery) ||
                           normAbbr.equalsIgnoreCase(normalizedQuery);
                })
                .limit(25)
                .collect(Collectors.toList());
    }

    public List<SportTeamDTO> getAllCatalogTeams() {
        return Collections.unmodifiableList(inMemoryTeams);
    }

    public static String normalize(String input) {
        if (input == null) return "";
        String nfd = Normalizer.normalize(input.toLowerCase(Locale.ROOT), Normalizer.Form.NFD);
        return DIACRITICS.matcher(nfd).replaceAll("").replace("-", " ").trim();
    }
}
