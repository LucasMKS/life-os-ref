package com.lifeos.modules.f1.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifeos.modules.f1.dto.F1NewsDTO;
import com.lifeos.modules.f1.dto.PodiumResultDTO;
import com.lifeos.modules.f1.dto.WeatherDTO;
import com.lifeos.modules.f1.model.F1ConstructorStandings;
import com.lifeos.modules.f1.model.F1DriverStandings;
import com.lifeos.modules.f1.model.F1Session;
import com.lifeos.modules.f1.repository.F1ConstructorStandingsRepository;
import com.lifeos.modules.f1.repository.F1DriverStandingsRepository;
import com.lifeos.modules.f1.repository.F1SessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Service
@Slf4j
@RequiredArgsConstructor
public class F1Service {

    private final F1ConstructorStandingsRepository f1ConstructorStandingsRepository;
    private final F1SessionRepository f1SessionRepository;
    private final F1DriverStandingsRepository f1DriverStandingsRepository;
    private final ObjectMapper objectMapper;
    private final WebClient openF1WebClient;
    private final WebClient jolpiWebClient;
    private final WebClient rss2JsonWebClient;
    private final WebClient genericWebClient;

    @Cacheable(value = "f1_sessions", unless = "#result == null || #result.isEmpty()")
    public List<F1Session> getNextSessions() {
        log.info("Fetching next F1 sessions from OpenF1 API...");

        LocalDateTime nowUtc = LocalDateTime.now(ZoneOffset.UTC);
        String dateStartQuery = nowUtc.format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME);

        try {
            String responseBody = openF1WebClient.get()
                    .uri(uriBuilder -> uriBuilder.path("/sessions")
                            .query("date_start>=" + dateStartQuery)
                            .build())
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (responseBody == null) {
                log.warn("OpenF1 returned null body. Using last snapshot fallback.");
                return fallbackToLastSnapshot(nowUtc);
            }

            JsonNode sessions = objectMapper.readTree(responseBody);
            if (!sessions.isArray() || sessions.isEmpty()) {
                log.warn("OpenF1 returned empty sessions array. Using last snapshot fallback.");
                return fallbackToLastSnapshot(nowUtc);
            }

            List<F1Session> mappedSessions = StreamSupport.stream(sessions.spliterator(), false)
                    .map(session -> toF1Session(session, nowUtc))
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            List<F1Session> sortedSessions = mappedSessions.stream()
                    .sorted(Comparator.comparing(F1Session::getDate))
                    .toList();

            if (sortedSessions.isEmpty()) {
                return fallbackToLastSnapshot(nowUtc);
            }

            String targetMeeting = sortedSessions.get(0).getMeetingName();

            List<F1Session> currentWeekendSessions = sortedSessions.stream()
                    .filter(s -> s.getMeetingName() != null && s.getMeetingName().equals(targetMeeting))
                    .toList();

            refreshSnapshot(currentWeekendSessions);
            return currentWeekendSessions;
        } catch (Exception ex) {
            log.error("Failed to fetch sessions from OpenF1: {}", ex.getMessage());
            return fallbackToLastSnapshot(nowUtc);
        }
    }

    @Cacheable(value = "f1_standings", unless = "#result == null || #result.isEmpty()")
    public List<F1DriverStandings> getCurrentSeasonStandings() {
        int season = LocalDateTime.now(ZoneOffset.UTC).getYear();
        log.info("Fetching F1 driver standings from Jolpi API for season {}...", season);

        try {
            String responseBody = jolpiWebClient.get()
                    .uri("/current/driverStandings.json")
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (responseBody == null) {
                log.warn("Jolpi driver standings returned null. Falling back to snapshot.");
                return fallbackToStandingsSnapshot(season);
            }

            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode standingsList = root.path("MRData").path("StandingsTable").path("StandingsLists");

            if (standingsList.isEmpty()) {
                return fallbackToStandingsSnapshot(season);
            }

            JsonNode driversArray = standingsList.get(0).path("DriverStandings");
            List<F1DriverStandings> standings = StreamSupport.stream(driversArray.spliterator(), false)
                    .map(node -> toDriverStandings(node, season))
                    .collect(Collectors.toList());

            if (standings.isEmpty())
                return fallbackToStandingsSnapshot(season);

            refreshStandingsSnapshot(standings);
            return standings.stream().limit(22).toList();
        } catch (Exception ex) {
            log.error("Failed to fetch driver standings from Jolpi API: {}", ex.getMessage());
            return fallbackToStandingsSnapshot(season).stream().limit(10).toList();
        }
    }

    @Cacheable(value = "f1_constructors", unless = "#result == null || #result.isEmpty()")
    public List<F1ConstructorStandings> getCurrentConstructorStandings() {
        int season = LocalDateTime.now(ZoneOffset.UTC).getYear();
        log.info("Fetching F1 constructor standings from Jolpi API for season {}...", season);

        try {
            String responseBody = jolpiWebClient.get()
                    .uri("/current/constructorStandings.json")
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (responseBody == null) {
                return fallbackToConstructorSnapshot(season);
            }

            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode standingsList = root.path("MRData").path("StandingsTable").path("StandingsLists");

            if (standingsList.isEmpty())
                return fallbackToConstructorSnapshot(season);

            JsonNode constructorsArray = standingsList.get(0).path("ConstructorStandings");
            List<F1ConstructorStandings> standings = StreamSupport.stream(constructorsArray.spliterator(), false)
                    .map(node -> toConstructorStandings(node, season))
                    .collect(Collectors.toList());

            if (standings.isEmpty())
                return fallbackToConstructorSnapshot(season);

            refreshConstructorSnapshot(standings);
            return standings.stream().limit(11).toList();
        } catch (Exception ex) {
            log.error("Failed to fetch constructor standings from Jolpi API: {}", ex.getMessage());
            return fallbackToConstructorSnapshot(season).stream().limit(5).toList();
        }
    }

    @Cacheable(value = "f1_circuit", unless = "#result == null || #result.isEmpty()")
    public Map<String, Object> getNextCircuitInfo() {
        int year = LocalDateTime.now(ZoneOffset.UTC).getYear();
        log.info("Fetching next circuit info from OpenF1 API for year {}...", year);

        try {
            String responseBody = openF1WebClient.get()
                    .uri(uriBuilder -> uriBuilder.path("/meetings")
                            .queryParam("year", year)
                            .build())
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (responseBody == null) {
                log.warn("OpenF1 /meetings returned null body.");
                return Collections.emptyMap();
            }

            JsonNode meetings = objectMapper.readTree(responseBody);
            if (!meetings.isArray() || meetings.isEmpty()) {
                log.warn("OpenF1 /meetings returned empty array.");
                return Collections.emptyMap();
            }

            LocalDateTime nowUtc = LocalDateTime.now(ZoneOffset.UTC);

            JsonNode nextMeeting = null;
            LocalDateTime nextStart = null;

            for (JsonNode meeting : meetings) {
                LocalDateTime dateStart = parseOpenF1Date(meeting.path("date_start").asText(null));
                LocalDateTime dateEnd = parseOpenF1Date(meeting.path("date_end").asText(null));
                if (dateStart == null)
                    continue;

                boolean notYetFinished = dateEnd == null || !nowUtc.isAfter(dateEnd);
                if (notYetFinished && (nextStart == null || dateStart.isBefore(nextStart))) {
                    nextStart = dateStart;
                    nextMeeting = meeting;
                }
            }

            if (nextMeeting == null) {
                log.warn("No upcoming meeting found for year {}.", year);
                return Collections.emptyMap();
            }

            String circuitName = nextMeeting.path("circuit_short_name").asText("").trim();
            String location = nextMeeting.path("location").asText("").trim();
            String countryName = nextMeeting.path("country_name").asText("").trim();
            String circuitType = nextMeeting.path("circuit_type").asText("").trim();
            String circuitImg = nextMeeting.path("circuit_image").asText("").trim();
            String gmtOffset = nextMeeting.path("gmt_offset").asText("").trim();
            String meetingName = nextMeeting.path("meeting_name").asText("").trim();

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("name", circuitName.isBlank() ? meetingName : circuitName);
            result.put("location", location.isBlank() ? countryName : location + ", " + countryName);
            result.put("type", circuitType);
            result.put("circuitImage", circuitImg);
            result.put("gmtOffset", gmtOffset);
            result.put("meetingName", meetingName);
            result.put("dateStart", nextStart != null ? nextStart.toString() : "");

            applyFallbackCircuitDetails(circuitName, result);

            if (!result.containsKey("laps") || !result.containsKey("lengthKm")) {
                String circuitInfoUrl = nextMeeting.path("circuit_info_url").asText("").trim();
                if (!circuitInfoUrl.isBlank()) {
                    enrichWithCircuitDetails(circuitInfoUrl, result);
                }
            }

            return result;

        } catch (Exception ex) {
            log.error("Failed to fetch circuit info from OpenF1: {}", ex.getMessage());
            return Collections.emptyMap();
        }
    }

    private void enrichWithCircuitDetails(String circuitInfoUrl, Map<String, Object> result) {
        try {
            log.info("Fetching circuit details from: {}", circuitInfoUrl);
            String responseBody = genericWebClient.get()
                    .uri(circuitInfoUrl)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (responseBody == null) {
                log.warn("Circuit info URL returned null body.");
                return;
            }

            JsonNode circuitInfo = objectMapper.readTree(responseBody);

            if (circuitInfo.has("laps") && !circuitInfo.path("laps").isNull()) {
                result.put("laps", circuitInfo.path("laps").asInt());
            }
            if (circuitInfo.has("length") && !circuitInfo.path("length").isNull()) {
                result.put("lengthKm", circuitInfo.path("length").asDouble());
            }
            if (circuitInfo.has("corners") && !circuitInfo.path("corners").isNull()) {
                result.put("corners", circuitInfo.path("corners").asInt());
            }

        } catch (Exception ex) {
            log.warn("Could not enrich circuit details from {}: {}", circuitInfoUrl, ex.getMessage());
        }
    }

    @Cacheable(value = "f1_podium", unless = "#result == null || #result.isEmpty()")
    public List<PodiumResultDTO> getLastRacePodium() {
        log.info("Fetching last race podium from Jolpi API...");
        try {
            String responseBody = jolpiWebClient.get()
                    .uri("/current/last/results.json")
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (responseBody == null) return List.of();

            JsonNode races = objectMapper.readTree(responseBody)
                    .path("MRData").path("RaceTable").path("Races");

            if (races.isEmpty()) return List.of();

            JsonNode results = races.get(0).path("Results");
            List<PodiumResultDTO> podium = new ArrayList<>();
            for (int i = 0; i < Math.min(3, results.size()); i++) {
                podium.add(toPodiumResult(results.get(i)));
            }
            return podium;
        } catch (Exception e) {
            log.error("Failed to fetch podium: {}", e.getMessage());
            return List.of();
        }
    }

    @Cacheable(value = "f1_weather")
    public WeatherDTO getLiveWeather() {
        log.info("Fetching live weather from OpenF1...");
        try {
            String responseBody = openF1WebClient.get()
                    .uri(uriBuilder -> uriBuilder.path("/weather")
                            .queryParam("session_key", "latest")
                            .build())
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (responseBody == null) return null;

            JsonNode array = objectMapper.readTree(responseBody);

            if (array.isArray() && !array.isEmpty()) {
                JsonNode latest = array.get(array.size() - 1);
                LocalDateTime weatherDate = parseOpenF1Date(latest.path("date").asText(null));
                boolean isLive = weatherDate != null &&
                        Math.abs(ChronoUnit.MINUTES.between(weatherDate, LocalDateTime.now(ZoneOffset.UTC))) <= 30;

                return new WeatherDTO(
                        latest.path("air_temperature").asDouble(),
                        latest.path("track_temperature").asDouble(),
                        latest.path("humidity").asDouble(),
                        latest.path("rainfall").asInt(),
                        latest.path("wind_speed").asDouble(),
                        isLive
                );
            }
            return null;
        } catch (Exception e) {
            log.error("Failed to fetch weather: {}", e.getMessage());
            return null;
        }
    }

    @Cacheable(value = "f1_news", unless = "#result == null || #result.isEmpty()")
    public List<F1NewsDTO> getF1News() {
        log.info("Fetching F1 News from multiple sources in parallel...");

        try {
            Mono<List<F1NewsDTO>> motorsport = fetchFromRssReactive("https://br.motorsport.com/rss/f1/news/", 2);
            Mono<List<F1NewsDTO>> grandePremio = fetchFromRssReactive("https://www.grandepremio.com.br/f1/feed/", 2);

            return Mono.zip(motorsport, grandePremio)
                    .map(tuple -> {
                        List<F1NewsDTO> combined = new ArrayList<>(tuple.getT1());
                        combined.addAll(tuple.getT2());
                        return combined;
                    })
                    .blockOptional(Duration.ofSeconds(8))
                    .orElseGet(ArrayList::new);
        } catch (Exception e) {
            log.error("Failed to fetch F1 news: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    private Mono<List<F1NewsDTO>> fetchFromRssReactive(String rssUrl, int limit) {
        return rss2JsonWebClient.get()
                .uri(uriBuilder -> uriBuilder.queryParam("rss_url", rssUrl).build())
                .retrieve()
                .bodyToMono(String.class)
                .map(body -> parseRssItems(body, limit))
                .onErrorResume(e -> {
                    log.warn("Erro ao processar feed RSS {}: {}", rssUrl, e.getMessage());
                    return Mono.just(List.of());
                });
    }

    private List<F1NewsDTO> parseRssItems(String responseBody, int limit) {
        try {
            JsonNode items = objectMapper.readTree(responseBody).path("items");
            List<F1NewsDTO> result = new ArrayList<>();
            for (int i = 0; i < Math.min(limit, items.size()); i++) {
                JsonNode item = items.get(i);
                result.add(new F1NewsDTO(
                        item.path("title").asText(),
                        item.path("link").asText(),
                        item.path("pubDate").asText()));
            }
            return result;
        } catch (Exception e) {
            log.warn("Erro ao parsear RSS: {}", e.getMessage());
            return List.of();
        }
    }

    private F1Session toF1Session(JsonNode session, LocalDateTime nowUtc) {
        LocalDateTime startDate = parseOpenF1Date(session.path("date_start").asText(null));
        if (startDate == null) return null;
        LocalDateTime endDate = parseOpenF1Date(session.path("date_end").asText(null));
        String countryName = session.path("country_name").asText("").trim();
        String sessionNamePt = translateSessionName(session.path("session_name").asText("Sessão").trim());
        String fullName = countryName.isBlank() ? sessionNamePt : countryName + " - " + sessionNamePt;
        return F1Session.builder()
                .id(session.path("session_key").asText())
                .meetingName(countryName)
                .name(fullName)
                .date(startDate)
                .status(resolveStatus(nowUtc, startDate, endDate))
                .build();
    }

    private F1DriverStandings toDriverStandings(JsonNode node, int season) {
        JsonNode driverInfo = node.path("Driver");
        String driverName = (driverInfo.path("givenName").asText("") + " " + driverInfo.path("familyName").asText("")).trim();
        JsonNode constructors = node.path("Constructors");
        String constructorName = constructors.isEmpty() ? "Unknown" : constructors.get(0).path("name").asText("Unknown");
        return F1DriverStandings.builder()
                .position(node.path("position").asInt(0))
                .driverName(driverName)
                .driverId(driverInfo.path("driverId").asText(""))
                .code(driverInfo.path("code").asText(""))
                .nationality(driverInfo.path("nationality").asText(""))
                .constructorName(constructorName)
                .points((int) node.path("points").asDouble(0))
                .wins(node.path("wins").asInt(0))
                .season(season)
                .build();
    }

    private F1ConstructorStandings toConstructorStandings(JsonNode node, int season) {
        JsonNode constructorInfo = node.path("Constructor");
        return F1ConstructorStandings.builder()
                .position(node.path("position").asInt(0))
                .constructorName(constructorInfo.path("name").asText("Unknown"))
                .constructorId(constructorInfo.path("constructorId").asText(""))
                .nationality(constructorInfo.path("nationality").asText(""))
                .points((int) node.path("points").asDouble(0))
                .wins(node.path("wins").asInt(0))
                .season(season)
                .build();
    }

    private PodiumResultDTO toPodiumResult(JsonNode res) {
        String driverName = normalizeName(
                res.path("Driver").path("givenName").asText() + " " + res.path("Driver").path("familyName").asText());
        return new PodiumResultDTO(
                res.path("position").asInt(),
                driverName,
                res.path("Constructor").path("name").asText(),
                res.path("Time").path("time").asText("N/A"));
    }

    private String normalizeName(String fullName) {
        if (fullName == null || fullName.isBlank())
            return "";
        return Arrays.stream(fullName.split("\\s+"))
                .map(word -> word.isEmpty()
                        ? word
                        : Character.toUpperCase(word.charAt(0)) + word.substring(1).toLowerCase())
                .collect(Collectors.joining(" "));
    }

    @Transactional
    public void refreshSnapshot(List<F1Session> sessions) {
        if (sessions == null || sessions.isEmpty()) {
            log.warn("Tentativa de atualizar snapshot com lista vazia ignorada.");
            return;
        }

        for (F1Session incoming : sessions) {
            f1SessionRepository.findById(incoming.getId()).ifPresentOrElse(
                    existing -> {
                        existing.setName(incoming.getName());
                        existing.setDate(incoming.getDate());
                        existing.setStatus(incoming.getStatus());
                        existing.setMeetingName(incoming.getMeetingName());
                        f1SessionRepository.save(existing);
                    },
                    () -> {
                        f1SessionRepository.save(incoming);
                    }
            );
        }

        List<String> incomingIds = sessions.stream().map(F1Session::getId).toList();
        List<F1Session> allStored = f1SessionRepository.findAll();
        List<F1Session> toDelete = allStored.stream()
                .filter(s -> !incomingIds.contains(s.getId()))
                .toList();
        if (!toDelete.isEmpty()) {
            f1SessionRepository.deleteAllInBatch(toDelete);
        }
    }

    private List<F1Session> fallbackToLastSnapshot(LocalDateTime now) {
        log.info("API indisponível ou vazia, usando último snapshot do banco.");
        List<F1Session> snapshot = f1SessionRepository.findAllByOrderByDateAsc();
        if (snapshot.isEmpty())
            return List.of();
        return snapshot.stream()
                .map(item -> F1Session.builder()
                        .id(item.getId())
                        .name(item.getName())
                        .date(item.getDate())
                        .meetingName(item.getMeetingName())
                        .status(resolveStatus(now, item.getDate(), null))
                        .build())
                .sorted(Comparator.comparing(F1Session::getDate))
                .limit(8)
                .toList();
    }

    private LocalDateTime parseOpenF1Date(String raw) {
        if (raw == null || raw.isBlank())
            return null;
        try {
            return OffsetDateTime.parse(raw).toLocalDateTime();
        } catch (Exception ignored) {
            try {
                return LocalDateTime.parse(raw);
            } catch (Exception ex) {
                return null;
            }
        }
    }

    private String resolveStatus(LocalDateTime now, LocalDateTime start, LocalDateTime end) {
        if (start == null || now.isBefore(start))
            return "agendado";
        if (end != null && now.isAfter(end))
            return "finalizado";
        return "ao vivo";
    }

    private String translateSessionName(String name) {
        if (name == null)
            return "Sessão";
        String lower = name.toLowerCase();
        if (lower.contains("practice 1"))
            return "Treino Livre 1";
        if (lower.contains("practice 2"))
            return "Treino Livre 2";
        if (lower.contains("practice 3"))
            return "Treino Livre 3";
        if (lower.contains("sprint shootout"))
            return "Classificação Sprint";
        if (lower.contains("qualifying"))
            return "Classificação";
        if (lower.contains("sprint"))
            return "Corrida Sprint";
        if (lower.contains("race"))
            return "Corrida";
        return name;
    }

    private void applyFallbackCircuitDetails(String circuitShortName, Map<String, Object> result) {
        if (result.containsKey("laps") && result.containsKey("lengthKm")) {
            return;
        }

        log.info("API falhou em trazer detalhes do circuito. Aplicando fallback para: {}", circuitShortName);

        int laps = 0;
        double lengthKm = 0.0;

        switch (circuitShortName) {
            case "Sakhir": laps = 57; lengthKm = 5.412; break;
            case "Jeddah": laps = 50; lengthKm = 6.174; break;
            case "Melbourne": laps = 58; lengthKm = 5.278; break;
            case "Suzuka": laps = 53; lengthKm = 5.807; break;
            case "Shanghai": laps = 56; lengthKm = 5.451; break;
            case "Miami": laps = 57; lengthKm = 5.412; break;
            case "Imola": laps = 63; lengthKm = 4.909; break;
            case "Monaco": laps = 78; lengthKm = 3.337; break;
            case "Montréal": laps = 70; lengthKm = 4.361; break;
            case "Barcelona": laps = 66; lengthKm = 4.657; break;
            case "Spielberg": laps = 71; lengthKm = 4.318; break;
            case "Silverstone": laps = 52; lengthKm = 5.891; break;
            case "Budapest": laps = 70; lengthKm = 4.381; break;
            case "Spa-Francorchamps": laps = 44; lengthKm = 7.004; break;
            case "Zandvoort": laps = 72; lengthKm = 4.259; break;
            case "Monza": laps = 53; lengthKm = 5.793; break;
            case "Baku": laps = 51; lengthKm = 6.003; break;
            case "Marina Bay": case "Singapore": laps = 62; lengthKm = 4.940; break;
            case "Austin": laps = 56; lengthKm = 5.513; break;
            case "Mexico City": laps = 71; lengthKm = 4.304; break;
            case "Interlagos": case "São Paulo": laps = 71; lengthKm = 4.309; break;
            case "Las Vegas": laps = 50; lengthKm = 6.201; break;
            case "Lusail": case "Qatar": laps = 57; lengthKm = 5.419; break;
            case "Yas Marina": case "Abu Dhabi": laps = 58; lengthKm = 5.281; break;
            case "Madrid": laps = 60; lengthKm = 5.474; break;
        }

        if (laps > 0) {
            result.putIfAbsent("laps", laps);
            result.putIfAbsent("lengthKm", lengthKm);
        }
    }

    @Transactional
    void refreshStandingsSnapshot(List<F1DriverStandings> standings) {
        if (standings.isEmpty())
            return;
        int season = standings.get(0).getSeason();
        f1DriverStandingsRepository.deleteBySeasonInBatch(season);
        f1DriverStandingsRepository.saveAll(standings);
    }

    @Transactional
    void refreshConstructorSnapshot(List<F1ConstructorStandings> standings) {
        if (standings.isEmpty())
            return;
        int season = standings.get(0).getSeason();
        f1ConstructorStandingsRepository.deleteBySeasonInBatch(season);
        f1ConstructorStandingsRepository.saveAll(standings);
    }

    private List<F1DriverStandings> fallbackToStandingsSnapshot(int season) {
        log.info("Falling back to driver standings snapshot...");
        return f1DriverStandingsRepository.findBySeasonOrderByPositionAsc(season);
    }

    private List<F1ConstructorStandings> fallbackToConstructorSnapshot(int season) {
        log.info("Falling back to constructor standings snapshot...");
        return f1ConstructorStandingsRepository.findBySeasonOrderByPositionAsc(season);
    }
}
