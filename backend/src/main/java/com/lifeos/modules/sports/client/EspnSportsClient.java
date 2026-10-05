package com.lifeos.modules.sports.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifeos.modules.sports.dto.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
@Slf4j
public class EspnSportsClient {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public EspnSportsClient(@Qualifier("espnSportsWebClient") WebClient webClient, ObjectMapper objectMapper) {
        this.webClient = webClient;
        this.objectMapper = objectMapper;
    }

    /**
     * Normalizes league slug.
     * Crucial: ESPN spells Copa do Brasil as 'bra.copa_do_brazil' (with 'z').
     */
    public String normalizeLeague(String league) {
        if (league == null) {
            return "";
        }
        String clean = league.trim().toLowerCase();
        if (clean.equals("bra.copa_do_brasil") || clean.equals("copa_do_brasil")) {
            return "bra.copa_do_brazil";
        }
        return clean;
    }

    /**
     * Fetches all teams in a league from ESPN.
     */
    public List<SportTeamDTO> getTeams(String sport, String league) {
        String normalizedLeague = normalizeLeague(league);
        String path = String.format("/%s/%s/teams", sport, normalizedLeague);

        try {
            log.info("Fetching teams from ESPN: {}", path);
            String responseBody = webClient.get()
                    .uri(path)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (responseBody == null || responseBody.isBlank()) {
                return Collections.emptyList();
            }

            JsonNode root = objectMapper.readTree(responseBody);
            List<SportTeamDTO> teams = new ArrayList<>();

            JsonNode sportsNode = root.path("sports");
            if (sportsNode.isArray()) {
                for (JsonNode sNode : sportsNode) {
                    JsonNode leaguesNode = sNode.path("leagues");
                    if (leaguesNode.isArray()) {
                        for (JsonNode lNode : leaguesNode) {
                            JsonNode teamsNode = lNode.path("teams");
                            if (teamsNode.isArray()) {
                                for (JsonNode item : teamsNode) {
                                    JsonNode teamNode = item.has("team") ? item.path("team") : item;
                                    SportTeamDTO teamDTO = parseTeamNode(teamNode, sport, normalizedLeague);
                                    if (teamDTO != null) {
                                        teams.add(teamDTO);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            log.info("Successfully fetched {} teams for {}/{}", teams.size(), sport, normalizedLeague);
            return teams;
        } catch (Exception e) {
            log.error("Failed to fetch teams from ESPN ({}/{}): {}", sport, normalizedLeague, e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Fetches scoreboard / fixtures for a league and date.
     */
    public ScoreboardResponseDTO getScoreboard(String sport, String league, String date) {
        String normalizedLeague = normalizeLeague(league);
        String formattedDate = sanitizeDate(date);

        String path = String.format("/%s/%s/scoreboard", sport, normalizedLeague);
        if (formattedDate != null) {
            path += "?dates=" + formattedDate;
        }

        try {
            log.info("Fetching scoreboard from ESPN: {}", path);
            String responseBody = webClient.get()
                    .uri(path)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (responseBody == null || responseBody.isBlank()) {
                return ScoreboardResponseDTO.builder()
                        .sport(sport)
                        .league(normalizedLeague)
                        .queryDate(formattedDate)
                        .matches(Collections.emptyList())
                        .build();
            }

            JsonNode root = objectMapper.readTree(responseBody);
            String leagueName = "";
            JsonNode leaguesNode = root.path("leagues");
            if (leaguesNode.isArray() && !leaguesNode.isEmpty()) {
                leagueName = leaguesNode.path(0).path("name").asText(normalizedLeague);
            }
            leagueName = SportsTranslationHelper.translateLeagueName(leagueName);

            List<SportMatchDTO> matches = new ArrayList<>();
            JsonNode eventsNode = root.path("events");
            if (eventsNode.isArray()) {
                for (JsonNode eventNode : eventsNode) {
                    SportMatchDTO match = parseEventNode(eventNode, sport, normalizedLeague, leagueName);
                    if (match != null) {
                        matches.add(match);
                    }
                }
            }

            return ScoreboardResponseDTO.builder()
                    .sport(sport)
                    .league(normalizedLeague)
                    .leagueName(leagueName)
                    .queryDate(formattedDate)
                    .matches(matches)
                    .build();
        } catch (Exception e) {
            log.error("Failed to fetch scoreboard from ESPN ({}/{}): {}", sport, normalizedLeague, e.getMessage());
            return ScoreboardResponseDTO.builder()
                    .sport(sport)
                    .league(normalizedLeague)
                    .queryDate(formattedDate)
                    .matches(Collections.emptyList())
                    .build();
        }
    }

    /**
     * Fetches team schedule for a season, including past results and upcoming fixtures.
     */
    public List<SportMatchDTO> getTeamSchedule(String sport, String league, String teamId) {
        String normalizedLeague = normalizeLeague(league);
        Map<String, SportMatchDTO> matchMap = new LinkedHashMap<>();

        // 1. Fetch regular schedule (for soccer, this returns season results up to current date)
        String basePath = String.format("/%s/%s/teams/%s/schedule", sport, normalizedLeague, teamId);
        fetchScheduleFromPath(basePath, sport, normalizedLeague, matchMap);

        // 2. Fetch upcoming fixtures (for soccer and sports where ESPN separates past results from upcoming fixtures)
        String fixturePath = basePath + "?fixture=true";
        fetchScheduleFromPath(fixturePath, sport, normalizedLeague, matchMap);

        log.info("Fetched {} total schedule events for team {} ({}/{})", matchMap.size(), teamId, sport, normalizedLeague);
        return new ArrayList<>(matchMap.values());
    }

    private void fetchScheduleFromPath(String path, String sport, String league, Map<String, SportMatchDTO> matchMap) {
        try {
            log.info("Fetching team schedule from ESPN: {}", path);
            String responseBody = webClient.get()
                    .uri(path)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (responseBody == null || responseBody.isBlank()) {
                return;
            }

            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode eventsNode = root.path("events");
            if (eventsNode.isArray()) {
                for (JsonNode eventNode : eventsNode) {
                    SportMatchDTO match = parseEventNode(eventNode, sport, league, league);
                    if (match != null && match.getId() != null) {
                        matchMap.put(match.getId(), match);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to fetch schedule from ESPN path {}: {}", path, e.getMessage());
        }
    }

    private SportTeamDTO parseTeamNode(JsonNode teamNode, String sport, String league) {
        if (teamNode == null || teamNode.isMissingNode()) {
            return null;
        }

        String id = teamNode.path("id").asText();
        String uid = teamNode.path("uid").asText();
        String slug = teamNode.path("slug").asText();
        String name = SportsTranslationHelper.translateTeamName(teamNode.path("name").asText());
        String displayName = SportsTranslationHelper.translateTeamName(teamNode.path("displayName").asText(name));
        String shortDisplayName = SportsTranslationHelper.translateTeamName(teamNode.path("shortDisplayName").asText(displayName));
        String abbreviation = teamNode.path("abbreviation").asText();
        String color = teamNode.path("color").asText(null);
        String alternateColor = teamNode.path("alternateColor").asText(null);

        String logoUrl = null;
        String darkLogoUrl = null;

        if (teamNode.has("logos") && teamNode.path("logos").isArray()) {
            for (JsonNode logoNode : teamNode.path("logos")) {
                String href = logoNode.path("href").asText(null);
                if (href != null) {
                    boolean isDark = false;
                    if (logoNode.has("rel") && logoNode.path("rel").isArray()) {
                        for (JsonNode rel : logoNode.path("rel")) {
                            if ("dark".equalsIgnoreCase(rel.asText())) {
                                isDark = true;
                                break;
                            }
                        }
                    }
                    if (isDark) {
                        darkLogoUrl = href;
                    } else if (logoUrl == null) {
                        logoUrl = href;
                    }
                }
            }
        }

        if (logoUrl == null && teamNode.has("logo")) {
            logoUrl = teamNode.path("logo").asText(null);
        }

        return SportTeamDTO.builder()
                .id(id)
                .uid(uid)
                .slug(slug)
                .name(name)
                .displayName(displayName)
                .shortDisplayName(shortDisplayName)
                .abbreviation(abbreviation)
                .color(color)
                .alternateColor(alternateColor)
                .logoUrl(logoUrl)
                .darkLogoUrl(darkLogoUrl)
                .sport(sport)
                .league(league)
                .isFollowed(false)
                .build();
    }

    private SportMatchDTO parseEventNode(JsonNode eventNode, String sport, String league, String leagueName) {
        if (eventNode == null || eventNode.isMissingNode()) {
            return null;
        }

        String id = eventNode.path("id").asText();
        String name = eventNode.path("name").asText();
        String shortName = eventNode.path("shortName").asText();
        Integer season = eventNode.path("season").path("year").asInt(0);
        String dateStr = eventNode.path("date").asText();
        LocalDateTime matchDate = parseUtcDate(dateStr);

        JsonNode compNode = eventNode.path("competitions").path(0);

        // Status parsing
        JsonNode statusNode = compNode.path("status");
        Double clock = statusNode.path("clock").asDouble(0.0);
        String displayClock = statusNode.path("displayClock").asText("");
        Integer period = statusNode.path("period").asInt(0);

        JsonNode typeNode = statusNode.path("type");
        String state = typeNode.path("state").asText("");
        String typeDesc = typeNode.path("description").asText("");
        String statusDetail = typeNode.path("shortDetail").asText(typeNode.path("detail").asText(typeDesc));

        String status = mapStatus(state, typeDesc, typeNode.path("completed").asBoolean(false));

        // Venue parsing
        JsonNode venueNode = compNode.path("venue");
        String venueName = venueNode.path("fullName").asText(venueNode.path("displayName").asText(""));
        String venueCity = venueNode.path("address").path("city").asText("");
        String venueCountry = venueNode.path("address").path("country").asText("");
        VenueDTO venueDTO = VenueDTO.builder()
                .name(venueName)
                .city(venueCity)
                .country(venueCountry)
                .build();

        // Broadcast parsing
        String broadcast = null;
        JsonNode broadcastsNode = compNode.path("broadcasts");
        if (broadcastsNode.isArray() && !broadcastsNode.isEmpty()) {
            JsonNode b0 = broadcastsNode.path(0);
            if (b0.has("names") && b0.path("names").isArray() && !b0.path("names").isEmpty()) {
                broadcast = b0.path("names").path(0).asText();
            } else if (b0.has("market")) {
                broadcast = b0.path("market").asText();
            }
        }

        // Competitors parsing
        TeamCompetitorDTO homeTeam = null;
        TeamCompetitorDTO awayTeam = null;

        JsonNode competitorsNode = compNode.path("competitors");
        if (competitorsNode.isArray()) {
            for (JsonNode cNode : competitorsNode) {
                TeamCompetitorDTO competitor = parseCompetitorNode(cNode);
                if (competitor != null) {
                    if ("home".equalsIgnoreCase(competitor.getHomeAway())) {
                        homeTeam = competitor;
                    } else {
                        awayTeam = competitor;
                    }
                }
            }
        }

        String rawLeagueName = eventNode.has("league") && eventNode.path("league").has("name")
                ? eventNode.path("league").path("name").asText(leagueName)
                : leagueName;
        String resolvedLeagueName = SportsTranslationHelper.translateLeagueName(rawLeagueName);
        String translatedName = SportsTranslationHelper.translateMatchName(name);
        String translatedStatusDetail = SportsTranslationHelper.translateStatusDetail(statusDetail);

        SportMatchDTO matchDTO = SportMatchDTO.builder()
                .id(id)
                .sport(sport)
                .league(league)
                .leagueName(resolvedLeagueName)
                .season(season)
                .name(translatedName)
                .shortName(shortName)
                .status(status)
                .statusDetail(translatedStatusDetail)
                .period(period)
                .displayClock(displayClock)
                .homeTeam(homeTeam)
                .awayTeam(awayTeam)
                .venue(venueDTO)
                .broadcast(broadcast)
                .isUserTrackedMatch(false)
                .build();

        matchDTO.setDate(matchDate);
        return matchDTO;
    }

    private TeamCompetitorDTO parseCompetitorNode(JsonNode cNode) {
        if (cNode == null || cNode.isMissingNode()) {
            return null;
        }

        String id = cNode.path("id").asText();
        String homeAway = cNode.path("homeAway").asText("home");
        boolean winner = cNode.path("winner").asBoolean(false);

        Integer score = null;
        if (cNode.has("score")) {
            JsonNode scoreNode = cNode.path("score");
            if (scoreNode.isTextual() || scoreNode.isNumber()) {
                try {
                    score = Integer.parseInt(scoreNode.asText().trim());
                } catch (NumberFormatException ignored) {}
            } else if (scoreNode.has("displayValue")) {
                try {
                    score = Integer.parseInt(scoreNode.path("displayValue").asText().trim());
                } catch (NumberFormatException ignored) {}
            } else if (scoreNode.has("value")) {
                score = scoreNode.path("value").asInt();
            }
        }

        JsonNode teamNode = cNode.path("team");
        String rawName = teamNode.path("name").asText();
        String rawDisplayName = teamNode.path("displayName").asText(rawName);
        String name = SportsTranslationHelper.translateTeamName(rawName);
        String displayName = SportsTranslationHelper.translateTeamName(rawDisplayName);
        String abbreviation = teamNode.path("abbreviation").asText();
        String color = teamNode.path("color").asText(null);

        String logoUrl = null;
        if (teamNode.has("logo")) {
            logoUrl = teamNode.path("logo").asText(null);
        } else if (teamNode.has("logos") && teamNode.path("logos").isArray() && !teamNode.path("logos").isEmpty()) {
            logoUrl = teamNode.path("logos").path(0).path("href").asText(null);
        }

        String record = null;
        if (cNode.has("records") && cNode.path("records").isArray() && !cNode.path("records").isEmpty()) {
            record = cNode.path("records").path(0).path("summary").asText(null);
        }

        return TeamCompetitorDTO.builder()
                .id(id)
                .name(name)
                .displayName(displayName)
                .abbreviation(abbreviation)
                .logoUrl(logoUrl)
                .color(color)
                .score(score)
                .winner(winner)
                .record(record)
                .homeAway(homeAway)
                .build();
    }

    private String mapStatus(String state, String description, boolean completed) {
        if (completed || "post".equalsIgnoreCase(state) || description.toLowerCase().contains("final") || description.toLowerCase().contains("full time")) {
            return "FINISHED";
        }
        if ("in".equalsIgnoreCase(state)) {
            if (description.toLowerCase().contains("halftime") || description.toLowerCase().contains("half time")) {
                return "HALFTIME";
            }
            return "IN_PROGRESS";
        }
        if (description.toLowerCase().contains("postponed")) {
            return "POSTPONED";
        }
        if (description.toLowerCase().contains("canceled") || description.toLowerCase().contains("cancelled")) {
            return "CANCELED";
        }
        return "SCHEDULED";
    }

    private LocalDateTime parseUtcDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) {
            return null;
        }
        try {
            return Instant.parse(dateStr).atOffset(ZoneOffset.UTC).toLocalDateTime();
        } catch (Exception e) {
            try {
                return ZonedDateTime.parse(dateStr).withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();
            } catch (Exception ex) {
                try {
                    return LocalDateTime.parse(dateStr, DateTimeFormatter.ISO_DATE_TIME);
                } catch (Exception exc) {
                    return null;
                }
            }
        }
    }

    private String sanitizeDate(String date) {
        if (date == null || date.isBlank()) {
            return null;
        }
        return date.replace("-", "").trim();
    }

    /**
     * Fetches detailed match summary (boxscore, linescores, key events, leaders, game info)
     */
    public JsonNode getMatchSummary(String sport, String league, String eventId) {
        String normalizedLeague = normalizeLeague(league);
        String path = String.format("/%s/%s/summary?event=%s", sport, normalizedLeague, eventId);

        try {
            log.info("Fetching match summary from ESPN: {}", path);
            String responseBody = webClient.get()
                    .uri(path)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (responseBody == null || responseBody.isBlank()) {
                return null;
            }

            return objectMapper.readTree(responseBody);
        } catch (Exception e) {
            log.error("Failed to fetch match summary from ESPN ({}/{}/{}): {}", sport, normalizedLeague, eventId, e.getMessage());
            return null;
        }
    }
}
