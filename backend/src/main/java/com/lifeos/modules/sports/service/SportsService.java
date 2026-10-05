package com.lifeos.modules.sports.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.lifeos.modules.sports.client.EspnSportsClient;
import com.lifeos.modules.sports.client.SportsTranslationHelper;
import com.lifeos.modules.sports.dto.*;
import com.lifeos.modules.sports.model.SportMatch;
import com.lifeos.modules.sports.model.UserTrackedSportsLeague;
import com.lifeos.modules.sports.model.UserTrackedSportsTeam;
import com.lifeos.modules.sports.repository.SportMatchRepository;
import com.lifeos.modules.sports.repository.UserTrackedSportsLeagueRepository;
import com.lifeos.modules.sports.repository.UserTrackedSportsTeamRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class SportsService {

    public static final ZoneId SAO_PAULO_ZONE = ZoneId.of("America/Sao_Paulo");

    private final EspnSportsClient espnSportsClient;
    private final SportsCatalogSearchService catalogSearchService;
    private final SportMatchRepository sportMatchRepository;
    private final UserTrackedSportsTeamRepository trackedTeamRepository;
    private final UserTrackedSportsLeagueRepository trackedLeagueRepository;

    private static final List<SportLeagueDTO> SUPPORTED_LEAGUES = List.of(
            SportLeagueDTO.builder()
                    .id("bra.1")
                    .slug("bra.1")
                    .name("Brasileirão Série A")
                    .displayName("Brasileirão Série A")
                    .abbreviation("Série A")
                    .sport("soccer")
                    .logoUrl("https://a.espncdn.com/i/leaguelogos/soccer/500/85.png")
                    .seasonYear(2026)
                    .build(),
            SportLeagueDTO.builder()
                    .id("bra.copa_do_brazil")
                    .slug("bra.copa_do_brazil")
                    .name("Copa do Brasil")
                    .displayName("Copa do Brasil")
                    .abbreviation("Copa BR")
                    .sport("soccer")
                    .logoUrl("https://a.espncdn.com/i/leaguelogos/soccer/500/528.png")
                    .seasonYear(2026)
                    .build(),
            SportLeagueDTO.builder()
                    .id("conmebol.libertadores")
                    .slug("conmebol.libertadores")
                    .name("Copa Libertadores")
                    .displayName("Copa Libertadores da América")
                    .abbreviation("Libertadores")
                    .sport("soccer")
                    .logoUrl("https://a.espncdn.com/i/leaguelogos/soccer/500/58.png")
                    .seasonYear(2026)
                    .build(),
            SportLeagueDTO.builder()
                    .id("uefa.champions")
                    .slug("uefa.champions")
                    .name("UEFA Champions League")
                    .displayName("UEFA Champions League")
                    .abbreviation("UCL")
                    .sport("soccer")
                    .logoUrl("https://a.espncdn.com/i/leaguelogos/soccer/500/2.png")
                    .seasonYear(2026)
                    .build(),
            SportLeagueDTO.builder()
                    .id("fifa.wwc")
                    .slug("fifa.wwc")
                    .name("Copa do Mundo Feminina")
                    .displayName("FIFA Women's World Cup")
                    .abbreviation("WWC")
                    .sport("soccer")
                    .logoUrl("https://a.espncdn.com/i/leaguelogos/soccer/500/60.png")
                    .seasonYear(2026)
                    .build(),
            SportLeagueDTO.builder()
                    .id("fifa.friendly")
                    .slug("fifa.friendly")
                    .name("Amistosos & Seleção Brasileira")
                    .displayName("Amistosos Internacionais")
                    .abbreviation("Amistosos")
                    .sport("soccer")
                    .logoUrl("https://a.espncdn.com/i/teamlogos/countries/500/bra.png")
                    .seasonYear(2026)
                    .build(),
            SportLeagueDTO.builder()
                    .id("fifa.world")
                    .slug("fifa.world")
                    .name("Copa do Mundo FIFA")
                    .displayName("Copa do Mundo FIFA Masculina")
                    .abbreviation("Copa do Mundo")
                    .sport("soccer")
                    .logoUrl("https://a.espncdn.com/i/leaguelogos/soccer/500/4.png")
                    .seasonYear(2026)
                    .build(),
            SportLeagueDTO.builder()
                    .id("nba")
                    .slug("nba")
                    .name("NBA")
                    .displayName("National Basketball Association")
                    .abbreviation("NBA")
                    .sport("basketball")
                    .logoUrl("https://a.espncdn.com/i/teamlogos/leagues/500/nba.png")
                    .seasonYear(2026)
                    .build(),
            SportLeagueDTO.builder()
                    .id("nfl")
                    .slug("nfl")
                    .name("NFL")
                    .displayName("National Football League")
                    .abbreviation("NFL")
                    .sport("football")
                    .logoUrl("https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png")
                    .seasonYear(2026)
                    .build()
    );

    /**
     * Returns the supported sports leagues metadata.
     */
    public List<SportLeagueDTO> getLeagues() {
        return SUPPORTED_LEAGUES;
    }

    /**
     * Fetches all teams in a competition with 24h Redis caching and fallback.
     */
    @Cacheable(value = "sports_teams", key = "#sport + '::' + #league")
    public List<SportTeamDTO> getTeams(String sport, String league) {
        try {
            List<SportTeamDTO> teams = espnSportsClient.getTeams(sport, league);
            if (!teams.isEmpty()) {
                return teams;
            }
        } catch (Exception e) {
            log.warn("Failed to fetch teams from ESPN for {}/{}: {}", sport, league, e.getMessage());
        }

        // L1 fallback: In-Memory catalog
        List<SportTeamDTO> catalogTeams = catalogSearchService.getAllCatalogTeams().stream()
                .filter(t -> t.getSport().equalsIgnoreCase(sport) && t.getLeague().equalsIgnoreCase(league))
                .toList();
        if (!catalogTeams.isEmpty()) {
            return catalogTeams;
        }

        return Collections.emptyList();
    }

    /**
     * In-memory fast autocomplete / search with accent-folding.
     */
    public List<SportTeamDTO> searchTeams(String query, String sport, String league) {
        return catalogSearchService.searchTeams(query, sport, league);
    }

    /**
     * Scoreboard / Fixtures with 2-minute caching and DB snapshot sync & fallback.
     */
    @Cacheable(value = "sports_scoreboard", key = "#sport + '::' + #league + '::' + (#date != null ? #date : 'today')")
    public ScoreboardResponseDTO getScoreboard(String sport, String league, String date) {
        String normalizedLeague = espnSportsClient.normalizeLeague(league);
        try {
            ScoreboardResponseDTO response = espnSportsClient.getScoreboard(sport, normalizedLeague, date);
            if (response != null && response.getMatches() != null && !response.getMatches().isEmpty()) {
                syncMatchesToDatabase(response.getMatches());
                return response;
            }
        } catch (Exception e) {
            log.warn("Scoreboard call failed for {}/{}: {}. Falling back to DB snapshot.", sport, normalizedLeague, e.getMessage());
        }

        // Fallback to database snapshot
        return fallbackScoreboardFromDb(sport, normalizedLeague, date);
    }

    /**
     * Team schedule with 1-hour caching and DB sync & fallback.
     */
    @Cacheable(value = "sports_team_schedule", key = "#sport + '::' + #league + '::' + #teamId + '::v2'")
    public List<SportMatchDTO> getTeamSchedule(String sport, String league, String teamId) {
        String normalizedLeague = espnSportsClient.normalizeLeague(league);
        try {
            List<SportMatchDTO> schedule = espnSportsClient.getTeamSchedule(sport, normalizedLeague, teamId);
            if (schedule != null && !schedule.isEmpty()) {
                syncMatchesToDatabase(schedule);
                return schedule;
            }
        } catch (Exception e) {
            log.warn("Team schedule call failed for {}/{}/{}: {}. Falling back to DB.", sport, normalizedLeague, teamId, e.getMessage());
        }

        // Fallback to DB
        List<SportMatch> dbMatches = sportMatchRepository.findByHomeTeamIdOrAwayTeamIdOrderByMatchDateAsc(teamId, teamId);
        return dbMatches.stream().map(this::mapEntityToDto).collect(Collectors.toList());
    }

    /**
     * Fetches matches for user's tracked teams and leagues.
     */
    public List<SportMatchDTO> getFollowedMatches(String userId, String date) {
        List<UserTrackedSportsTeam> trackedTeams = trackedTeamRepository.findByUserId(userId);
        List<UserTrackedSportsLeague> trackedLeagues = trackedLeagueRepository.findByUserId(userId);

        if (trackedTeams.isEmpty() && trackedLeagues.isEmpty()) {
            return Collections.emptyList();
        }

        Set<String> trackedSportTeamKeys = trackedTeams.stream()
                .map(t -> (t.getSport() != null ? t.getSport().toLowerCase() : "") + "::" + t.getTeamId())
                .collect(Collectors.toSet());

        Set<String> trackedLeagueSlugs = trackedLeagues.stream()
                .map(UserTrackedSportsLeague::getLeague)
                .collect(Collectors.toSet());

        // Collect all distinct (sport, league) pairs we need to check
        Map<String, String> leagueSportMap = new HashMap<>();
        for (UserTrackedSportsLeague l : trackedLeagues) {
            leagueSportMap.put(l.getLeague(), l.getSport());
        }
        for (UserTrackedSportsTeam t : trackedTeams) {
            leagueSportMap.putIfAbsent(t.getLeague(), t.getSport());
        }

        LocalDate targetLocalDate = parseLocalDate(date, SAO_PAULO_ZONE);
        String targetDateStr = targetLocalDate.format(DateTimeFormatter.BASIC_ISO_DATE);

        Map<String, SportMatchDTO> matchMap = new LinkedHashMap<>();

        for (Map.Entry<String, String> entry : leagueSportMap.entrySet()) {
            String league = entry.getKey();
            String sport = entry.getValue();
            try {
                ScoreboardResponseDTO scoreboard = getScoreboard(sport, league, targetDateStr);
                if (scoreboard != null && scoreboard.getMatches() != null) {
                    for (SportMatchDTO match : scoreboard.getMatches()) {
                        // Strict date check in user timezone
                        if (match.getDate() != null) {
                            LocalDate matchLocalDate = match.getDate().atOffset(ZoneOffset.UTC)
                                    .atZoneSameInstant(SAO_PAULO_ZONE).toLocalDate();
                            if (!matchLocalDate.equals(targetLocalDate)) {
                                continue;
                            }
                        }

                        String matchSport = (match.getSport() != null && !match.getSport().isBlank())
                                ? match.getSport().toLowerCase() : (sport != null ? sport.toLowerCase() : "");
                        boolean isLeagueTracked = trackedLeagueSlugs.contains(match.getLeague());
                        boolean isHomeTracked = match.getHomeTeam() != null &&
                                trackedSportTeamKeys.contains(matchSport + "::" + match.getHomeTeam().getId());
                        boolean isAwayTracked = match.getAwayTeam() != null &&
                                trackedSportTeamKeys.contains(matchSport + "::" + match.getAwayTeam().getId());

                        if (isLeagueTracked || isHomeTracked || isAwayTracked) {
                            match.setUserTrackedMatch(true);
                            matchMap.put(match.getId(), match);
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Error getting followed matches scoreboard for {}/{}: {}", sport, league, e.getMessage());
            }
        }

        // If external calls yielded nothing, fallback to DB query
        if (matchMap.isEmpty()) {
            LocalDateTime start = targetLocalDate.atStartOfDay(SAO_PAULO_ZONE).withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();
            LocalDateTime end = targetLocalDate.atTime(LocalTime.MAX).atZone(SAO_PAULO_ZONE).withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();

            Set<String> trackedTeamIds = trackedTeams.stream()
                    .map(UserTrackedSportsTeam::getTeamId)
                    .collect(Collectors.toSet());

            List<SportMatch> dbFollowed = sportMatchRepository.findFollowedMatches(
                    trackedLeagueSlugs.isEmpty() ? null : trackedLeagueSlugs,
                    trackedTeamIds.isEmpty() ? null : trackedTeamIds,
                    start,
                    end
            );

            for (SportMatch m : dbFollowed) {
                String mSport = m.getSport() != null ? m.getSport().toLowerCase() : "";
                boolean isLeagueTracked = trackedLeagueSlugs.contains(m.getLeague());
                boolean isHomeTracked = m.getHomeTeamId() != null &&
                        trackedSportTeamKeys.contains(mSport + "::" + m.getHomeTeamId());
                boolean isAwayTracked = m.getAwayTeamId() != null &&
                        trackedSportTeamKeys.contains(mSport + "::" + m.getAwayTeamId());

                if (isLeagueTracked || isHomeTracked || isAwayTracked) {
                    SportMatchDTO dto = mapEntityToDto(m);
                    dto.setUserTrackedMatch(true);
                    matchMap.put(dto.getId(), dto);
                }
            }
        }

        List<SportMatchDTO> result = new ArrayList<>(matchMap.values());
        result.sort(Comparator.comparing(SportMatchDTO::getDate, Comparator.nullsLast(Comparator.naturalOrder())));
        return result;
    }

    /**
     * Aggregated day scoreboard: fetches matches for all active leagues on a date (or a filtered league).
     */
    @Cacheable(value = "sports_scoreboard", key = "'day::' + (#date != null ? #date : 'today') + '::' + (#leagueFilter != null ? #leagueFilter : 'all')")
    public List<SportMatchDTO> getDayMatches(String date, String leagueFilter) {
        String targetDate = (date != null && !date.isBlank()) ? date.replace("-", "") : LocalDate.now(SAO_PAULO_ZONE).format(DateTimeFormatter.BASIC_ISO_DATE);

        List<SportLeagueDTO> targetLeagues;
        if (leagueFilter != null && !leagueFilter.isBlank() && !leagueFilter.equalsIgnoreCase("ALL")) {
            String norm = espnSportsClient.normalizeLeague(leagueFilter);
            targetLeagues = SUPPORTED_LEAGUES.stream()
                    .filter(l -> l.getSlug().equalsIgnoreCase(norm) || l.getId().equalsIgnoreCase(norm))
                    .toList();
            if (targetLeagues.isEmpty()) {
                targetLeagues = SUPPORTED_LEAGUES;
            }
        } else {
            targetLeagues = SUPPORTED_LEAGUES;
        }

        Map<String, SportMatchDTO> matchMap = new LinkedHashMap<>();

        // Fetch scoreboards for each target league
        for (SportLeagueDTO league : targetLeagues) {
            try {
                ScoreboardResponseDTO scoreboard = getScoreboard(league.getSport(), league.getSlug(), targetDate);
                if (scoreboard != null && scoreboard.getMatches() != null) {
                    for (SportMatchDTO match : scoreboard.getMatches()) {
                        matchMap.putIfAbsent(match.getId(), match);
                    }
                }
            } catch (Exception ex) {
                log.warn("Could not fetch day scoreboard for league {}: {}", league.getSlug(), ex.getMessage());
            }
        }

        List<SportMatchDTO> matches = new ArrayList<>(matchMap.values());
        matches.sort((a, b) -> {
            boolean aLive = isLive(a.getStatus());
            boolean bLive = isLive(b.getStatus());
            if (aLive && !bLive) return -1;
            if (!aLive && bLive) return 1;
            if (a.getDate() == null) return 1;
            if (b.getDate() == null) return -1;
            return a.getDate().compareTo(b.getDate());
        });

        return matches;
    }

    private boolean isFinished(String status) {
        if (status == null) return false;
        String s = status.toUpperCase();
        return s.contains("FINISHED") || s.contains("FINAL") || s.contains("POST") || s.contains("COMPLETED");
    }

    private boolean isLive(String status) {
        if (status == null) return false;
        String s = status.toUpperCase();
        return s.contains("IN_PROGRESS") || s.contains("FIRST_HALF") || s.contains("SECOND_HALF") || s.contains("HALFTIME") || s.contains("LIVE");
    }

    private boolean shouldIncludeInRadar(SportMatchDTO match, LocalDateTime nowUtc, LocalDateTime limit) {
        if (match == null || match.getDate() == null) {
            return false;
        }

        // Radar is strictly for upcoming and live matches: exclude finished or canceled matches
        if (isFinished(match.getStatus()) || "CANCELED".equalsIgnoreCase(match.getStatus())) {
            return false;
        }

        if (match.getDate().isAfter(limit)) {
            return false;
        }

        // Live matches are allowed if started in the last 4 hours
        if (isLive(match.getStatus())) {
            return !match.getDate().isBefore(nowUtc.minusHours(4));
        }

        // Scheduled / upcoming matches must not be in the past
        return !match.getDate().isBefore(nowUtc.minusMinutes(5));
    }

    /**
     * Radar / Timeline of upcoming matches for user's tracked teams and leagues.
     * Looks ahead N days (default 14) from now. Excludes matches that have already finished.
     */
    public List<SportMatchDTO> getRadarMatches(String userId, Integer daysAhead) {
        int days = (daysAhead != null && daysAhead > 0) ? Math.min(daysAhead, 30) : 14;
        LocalDateTime nowUtc = LocalDateTime.now(ZoneOffset.UTC);
        LocalDateTime limit = nowUtc.plusDays(days);

        List<UserTrackedSportsTeam> trackedTeams = trackedTeamRepository.findByUserId(userId);
        List<UserTrackedSportsLeague> trackedLeagues = trackedLeagueRepository.findByUserId(userId);

        if (trackedTeams.isEmpty() && trackedLeagues.isEmpty()) {
            return Collections.emptyList();
        }

        Map<String, SportMatchDTO> radarMap = new LinkedHashMap<>();

        // 1. For each tracked team: their schedule has their upcoming games
        for (UserTrackedSportsTeam team : trackedTeams) {
            try {
                List<SportMatchDTO> schedule = getTeamSchedule(team.getSport(), team.getLeague(), team.getTeamId());
                if (schedule != null) {
                    for (SportMatchDTO match : schedule) {
                        if (shouldIncludeInRadar(match, nowUtc, limit)) {
                            match.setUserTrackedMatch(true);
                            radarMap.put(match.getId(), match);
                        }
                    }
                }
            } catch (Exception ex) {
                log.warn("Error fetching schedule for tracked team {}: {}", team.getTeamName(), ex.getMessage());
            }
        }

        // 2. For each tracked league: get matches from upcoming days or DB
        LocalDate startDate = LocalDate.now(SAO_PAULO_ZONE);
        for (int i = 0; i < Math.min(days, 7); i++) {
            LocalDate d = startDate.plusDays(i);
            String dateStr = d.format(DateTimeFormatter.BASIC_ISO_DATE);

            for (UserTrackedSportsLeague league : trackedLeagues) {
                try {
                    ScoreboardResponseDTO sb = getScoreboard(league.getSport(), league.getLeague(), dateStr);
                    if (sb != null && sb.getMatches() != null) {
                        for (SportMatchDTO m : sb.getMatches()) {
                            if (shouldIncludeInRadar(m, nowUtc, limit)) {
                                m.setUserTrackedMatch(true);
                                radarMap.put(m.getId(), m);
                            }
                        }
                    }
                } catch (Exception ex) {
                    log.warn("Error fetching scoreboard for tracked league {}: {}", league.getLeague(), ex.getMessage());
                }
            }
        }

        // 3. Fallback / supplement: check database for any synced matches for user's tracked teams & leagues
        Set<String> trackedSportTeamKeys = trackedTeams.stream()
                .map(t -> (t.getSport() != null ? t.getSport().toLowerCase() : "") + "::" + t.getTeamId())
                .collect(Collectors.toSet());
        Set<String> trackedTeamIds = trackedTeams.stream().map(UserTrackedSportsTeam::getTeamId).collect(Collectors.toSet());
        Set<String> trackedLeagueSlugs = trackedLeagues.stream().map(UserTrackedSportsLeague::getLeague).collect(Collectors.toSet());
        try {
            List<SportMatch> dbMatches = sportMatchRepository.findFollowedMatches(
                    trackedLeagueSlugs.isEmpty() ? null : trackedLeagueSlugs,
                    trackedTeamIds.isEmpty() ? null : trackedTeamIds,
                    nowUtc.minusHours(4),
                    limit
            );
            for (SportMatch dbm : dbMatches) {
                String mSport = dbm.getSport() != null ? dbm.getSport().toLowerCase() : "";
                boolean isLeagueTracked = trackedLeagueSlugs.contains(dbm.getLeague());
                boolean isHomeTracked = dbm.getHomeTeamId() != null &&
                        trackedSportTeamKeys.contains(mSport + "::" + dbm.getHomeTeamId());
                boolean isAwayTracked = dbm.getAwayTeamId() != null &&
                        trackedSportTeamKeys.contains(mSport + "::" + dbm.getAwayTeamId());

                if (isLeagueTracked || isHomeTracked || isAwayTracked) {
                    SportMatchDTO dto = mapEntityToDto(dbm);
                    if (shouldIncludeInRadar(dto, nowUtc, limit)) {
                        dto.setUserTrackedMatch(true);
                        radarMap.putIfAbsent(dto.getId(), dto);
                    }
                }
            }
        } catch (Exception ex) {
            log.warn("Error checking DB for radar matches: {}", ex.getMessage());
        }

        List<SportMatchDTO> result = new ArrayList<>(radarMap.values());
        result.sort(Comparator.comparing(SportMatchDTO::getDate, Comparator.nullsLast(Comparator.naturalOrder())));
        return result;
    }

    // -------------------------------------------------------------
    // User Tracking Management
    // -------------------------------------------------------------

    @Transactional
    public UserTrackedSportsTeam trackTeam(String userId, TrackTeamRequest request) {
        String normalizedLeague = espnSportsClient.normalizeLeague(request.getLeague());
        String normalizedSport = request.getSport() != null ? request.getSport().trim().toLowerCase() : "soccer";

        Optional<UserTrackedSportsTeam> existing = trackedTeamRepository.findByUserIdAndSportAndTeamId(userId, normalizedSport, request.getTeamId());
        if (existing.isPresent()) {
            UserTrackedSportsTeam team = existing.get();
            team.setLeague(normalizedLeague);
            team.setNotifyMatches(request.isNotifyMatches());
            if (request.getTeamName() != null) team.setTeamName(request.getTeamName());
            if (request.getTeamDisplayName() != null) team.setTeamDisplayName(request.getTeamDisplayName());
            if (request.getTeamAbbreviation() != null) team.setTeamAbbreviation(request.getTeamAbbreviation());
            if (request.getLogoUrl() != null) team.setLogoUrl(request.getLogoUrl());
            if (request.getPrimaryColor() != null) team.setPrimaryColor(request.getPrimaryColor());
            if (request.getSecondaryColor() != null) team.setSecondaryColor(request.getSecondaryColor());
            return trackedTeamRepository.save(team);
        }

        UserTrackedSportsTeam newTeam = UserTrackedSportsTeam.builder()
                .userId(userId)
                .sport(normalizedSport)
                .league(normalizedLeague)
                .teamId(request.getTeamId())
                .teamName(request.getTeamName())
                .teamDisplayName(request.getTeamDisplayName() != null ? request.getTeamDisplayName() : request.getTeamName())
                .teamAbbreviation(request.getTeamAbbreviation())
                .logoUrl(request.getLogoUrl())
                .primaryColor(request.getPrimaryColor())
                .secondaryColor(request.getSecondaryColor())
                .notifyMatches(request.isNotifyMatches())
                .build();

        return trackedTeamRepository.save(newTeam);
    }

    @Transactional
    public void untrackTeam(String userId, String teamId, String sport) {
        if (sport != null && !sport.isBlank()) {
            trackedTeamRepository.deleteByUserIdAndSportAndTeamId(userId, sport.trim().toLowerCase(), teamId);
        } else {
            trackedTeamRepository.deleteByUserIdAndTeamId(userId, teamId);
        }
    }

    @Transactional
    public void untrackTeam(String userId, String teamId) {
        untrackTeam(userId, teamId, null);
    }

    @Transactional
    public UserTrackedSportsLeague trackLeague(String userId, TrackLeagueRequest request) {
        String normalizedLeague = espnSportsClient.normalizeLeague(request.getLeague());

        Optional<UserTrackedSportsLeague> existing = trackedLeagueRepository.findByUserIdAndLeague(userId, normalizedLeague);
        if (existing.isPresent()) {
            UserTrackedSportsLeague league = existing.get();
            league.setNotifyMatches(request.isNotifyMatches());
            if (request.getLeagueName() != null) league.setLeagueName(request.getLeagueName());
            if (request.getLeagueLogo() != null) league.setLeagueLogo(request.getLeagueLogo());
            return trackedLeagueRepository.save(league);
        }

        UserTrackedSportsLeague newLeague = UserTrackedSportsLeague.builder()
                .userId(userId)
                .sport(request.getSport())
                .league(normalizedLeague)
                .leagueName(request.getLeagueName())
                .leagueLogo(request.getLeagueLogo())
                .notifyMatches(request.isNotifyMatches())
                .build();

        return trackedLeagueRepository.save(newLeague);
    }

    @Transactional
    public void untrackLeague(String userId, String league) {
        String normalizedLeague = espnSportsClient.normalizeLeague(league);
        trackedLeagueRepository.deleteByUserIdAndLeague(userId, normalizedLeague);
    }

    public SportsUserPreferencesDTO getUserPreferences(String userId) {
        List<UserTrackedSportsTeam> teams = trackedTeamRepository.findByUserId(userId);
        List<UserTrackedSportsLeague> leagues = trackedLeagueRepository.findByUserId(userId);

        return SportsUserPreferencesDTO.builder()
                .trackedTeams(teams)
                .trackedLeagues(leagues)
                .build();
    }

    // -------------------------------------------------------------
    // Database Snapshot & Sync
    // -------------------------------------------------------------

    @Transactional
    public void syncMatchesToDatabase(List<SportMatchDTO> dtos) {
        if (dtos == null || dtos.isEmpty()) return;

        for (SportMatchDTO dto : dtos) {
            if (dto.getId() == null || dto.getId().isBlank()) continue;

            Optional<SportMatch> existingOpt = sportMatchRepository.findById(dto.getId());
            SportMatch match;
            if (existingOpt.isPresent()) {
                match = existingOpt.get();
                match.setStatus(dto.getStatus());
                match.setStatusDetail(dto.getStatusDetail());
                match.setPeriod(dto.getPeriod());
                match.setDisplayClock(dto.getDisplayClock());
                if (dto.getHomeTeam() != null) {
                    match.setHomeScore(dto.getHomeTeam().getScore());
                }
                if (dto.getAwayTeam() != null) {
                    match.setAwayScore(dto.getAwayTeam().getScore());
                }
                if (dto.getBroadcast() != null) {
                    match.setBroadcast(dto.getBroadcast());
                }
                if (dto.getDate() != null) {
                    match.setMatchDate(dto.getDate());
                }
            } else {
                match = mapDtoToEntity(dto);
            }
            sportMatchRepository.save(match);
        }
    }

    public ScoreboardResponseDTO fallbackScoreboardFromDb(String sport, String league, String date) {
        LocalDate targetDate = parseLocalDate(date, SAO_PAULO_ZONE);
        LocalDateTime start = targetDate.atStartOfDay(SAO_PAULO_ZONE).withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();
        LocalDateTime end = targetDate.atTime(LocalTime.MAX).atZone(SAO_PAULO_ZONE).withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();

        List<SportMatch> matches = sportMatchRepository
                .findBySportAndLeagueAndMatchDateBetweenOrderByMatchDateAsc(sport, league, start, end);

        List<SportMatchDTO> matchDTOs = matches.stream().map(this::mapEntityToDto).collect(Collectors.toList());

        String resolvedLeagueName = SportsTranslationHelper.translateLeagueName(league);

        return ScoreboardResponseDTO.builder()
                .sport(sport)
                .league(league)
                .leagueName(resolvedLeagueName)
                .queryDate(date)
                .matches(matchDTOs)
                .build();
    }

    public SportMatchDTO mapEntityToDto(SportMatch entity) {
        TeamCompetitorDTO home = TeamCompetitorDTO.builder()
                .id(entity.getHomeTeamId())
                .name(entity.getHomeTeamName())
                .displayName(entity.getHomeTeamName())
                .abbreviation(entity.getHomeTeamAbbr())
                .logoUrl(entity.getHomeTeamLogo())
                .color(entity.getHomeTeamColor())
                .score(entity.getHomeScore())
                .homeAway("home")
                .winner(entity.getWinnerTeamId() != null && entity.getWinnerTeamId().equals(entity.getHomeTeamId()))
                .build();

        TeamCompetitorDTO away = TeamCompetitorDTO.builder()
                .id(entity.getAwayTeamId())
                .name(entity.getAwayTeamName())
                .displayName(entity.getAwayTeamName())
                .abbreviation(entity.getAwayTeamAbbr())
                .logoUrl(entity.getAwayTeamLogo())
                .color(entity.getAwayTeamColor())
                .score(entity.getAwayScore())
                .homeAway("away")
                .winner(entity.getWinnerTeamId() != null && entity.getWinnerTeamId().equals(entity.getAwayTeamId()))
                .build();

        VenueDTO venue = VenueDTO.builder()
                .name(entity.getVenue())
                .city(entity.getVenueCity())
                .build();

        String resolvedLeagueName = (entity.getLeague() != null)
                ? SportsTranslationHelper.translateLeagueName(entity.getLeague())
                : "Competição";

        SportMatchDTO dto = SportMatchDTO.builder()
                .id(entity.getId())
                .sport(entity.getSport())
                .league(entity.getLeague())
                .leagueName(resolvedLeagueName)
                .season(entity.getSeason())
                .name(entity.getName())
                .shortName(entity.getShortName())
                .status(entity.getStatus())
                .statusDetail(entity.getStatusDetail())
                .period(entity.getPeriod())
                .displayClock(entity.getDisplayClock())
                .homeTeam(home)
                .awayTeam(away)
                .venue(venue)
                .broadcast(entity.getBroadcast())
                .isUserTrackedMatch(false)
                .build();

        dto.setDate(entity.getMatchDate());
        return dto;
    }

    public SportMatch mapDtoToEntity(SportMatchDTO dto) {
        LocalDateTime matchDate = dto.getMatchDate() != null ? dto.getMatchDate() : dto.getDate();
        if (matchDate == null) {
            matchDate = LocalDateTime.now(ZoneOffset.UTC);
        }

        SportMatch match = SportMatch.builder()
                .id(dto.getId())
                .sport(dto.getSport())
                .league(dto.getLeague())
                .season(dto.getSeason())
                .matchDate(matchDate)
                .name(dto.getName() != null ? dto.getName() : "Match")
                .shortName(dto.getShortName())
                .status(dto.getStatus() != null ? dto.getStatus() : "SCHEDULED")
                .statusDetail(dto.getStatusDetail())
                .period(dto.getPeriod())
                .displayClock(dto.getDisplayClock())
                .broadcast(dto.getBroadcast())
                .notified(false)
                .notified15m(false)
                .build();

        if (dto.getHomeTeam() != null) {
            match.setHomeTeamId(dto.getHomeTeam().getId() != null ? dto.getHomeTeam().getId() : "");
            match.setHomeTeamName(dto.getHomeTeam().getName() != null ? dto.getHomeTeam().getName() : dto.getHomeTeam().getDisplayName());
            match.setHomeTeamAbbr(dto.getHomeTeam().getAbbreviation());
            match.setHomeTeamLogo(dto.getHomeTeam().getLogoUrl());
            match.setHomeTeamColor(dto.getHomeTeam().getColor());
            match.setHomeScore(dto.getHomeTeam().getScore());
        } else {
            match.setHomeTeamId("");
            match.setHomeTeamName("");
        }

        if (dto.getAwayTeam() != null) {
            match.setAwayTeamId(dto.getAwayTeam().getId() != null ? dto.getAwayTeam().getId() : "");
            match.setAwayTeamName(dto.getAwayTeam().getName() != null ? dto.getAwayTeam().getName() : dto.getAwayTeam().getDisplayName());
            match.setAwayTeamAbbr(dto.getAwayTeam().getAbbreviation());
            match.setAwayTeamLogo(dto.getAwayTeam().getLogoUrl());
            match.setAwayTeamColor(dto.getAwayTeam().getColor());
            match.setAwayScore(dto.getAwayTeam().getScore());
        } else {
            match.setAwayTeamId("");
            match.setAwayTeamName("");
        }

        if (dto.getVenue() != null) {
            match.setVenue(dto.getVenue().getName());
            match.setVenueCity(dto.getVenue().getCity());
        }

        return match;
    }

    @Cacheable(value = "sports_match_summary", key = "#sport + '::' + #league + '::' + #eventId")
    public JsonNode getMatchSummary(String sport, String league, String eventId) {
        return espnSportsClient.getMatchSummary(sport, league, eventId);
    }

    private LocalDate parseLocalDate(String date, ZoneId zone) {
        if (date == null || date.isBlank()) {
            return LocalDate.now(zone != null ? zone : SAO_PAULO_ZONE);
        }
        String clean = date.replace("-", "").trim();
        try {
            return LocalDate.parse(clean, DateTimeFormatter.BASIC_ISO_DATE);
        } catch (Exception e) {
            try {
                return LocalDate.parse(date, DateTimeFormatter.ISO_LOCAL_DATE);
            } catch (Exception ex) {
                return LocalDate.now(zone != null ? zone : SAO_PAULO_ZONE);
            }
        }
    }

    private LocalDate parseLocalDate(String date) {
        return parseLocalDate(date, SAO_PAULO_ZONE);
    }
}
