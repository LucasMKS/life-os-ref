package com.lifeos.modules.sports.scheduler;

import com.lifeos.modules.sports.client.SportsTranslationHelper;
import com.lifeos.modules.sports.dto.SportMatchDTO;
import com.lifeos.modules.sports.model.SportMatch;
import com.lifeos.modules.sports.model.UserTrackedSportsLeague;
import com.lifeos.modules.sports.model.UserTrackedSportsTeam;
import com.lifeos.modules.sports.repository.SportMatchRepository;
import com.lifeos.modules.sports.repository.UserTrackedSportsLeagueRepository;
import com.lifeos.modules.sports.repository.UserTrackedSportsTeamRepository;
import com.lifeos.modules.sports.service.SportsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;

@Component
@Slf4j
@RequiredArgsConstructor
public class SportsNotificationScheduler {

    private static final ZoneId SAO_PAULO_ZONE = ZoneId.of("America/Sao_Paulo");

    private final SportMatchRepository sportMatchRepository;
    private final UserTrackedSportsTeamRepository trackedTeamRepository;
    private final UserTrackedSportsLeagueRepository trackedLeagueRepository;
    private final SportsService sportsService;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

    private final AtomicBoolean runningUpcomingWatcher = new AtomicBoolean(false);
    private final AtomicBoolean runningDailyBriefing = new AtomicBoolean(false);

    /**
     * 1-MINUTE WATCHER: Looks ahead 15 minutes for matches involving tracked teams or leagues.
     */
    @Scheduled(
            fixedDelayString = "${app.schedulers.sports-upcoming.fixed-delay-ms:60000}",
            initialDelayString = "${app.schedulers.sports-upcoming.initial-delay-ms:30000}"
    )
    @SchedulerLock(name = "sports-notifyUpcomingMatches", lockAtMostFor = "PT2M", lockAtLeastFor = "PT30S")
    public void notifyUpcomingMatches() {
        if (!runningUpcomingWatcher.compareAndSet(false, true)) {
            log.warn("Sports upcoming watcher is already executing. Skipping cycle.");
            return;
        }

        try {
            List<UserTrackedSportsTeam> activeTeams = trackedTeamRepository.findByNotifyMatchesTrue();
            List<UserTrackedSportsLeague> activeLeagues = trackedLeagueRepository.findByNotifyMatchesTrue();

            if (activeTeams.isEmpty() && activeLeagues.isEmpty()) {
                return;
            }

            // Sync scoreboards for leagues that have active subscribers
            Set<String> leaguesToSync = new HashSet<>();
            Map<String, String> leagueSportMap = new HashMap<>();
            for (UserTrackedSportsLeague l : activeLeagues) {
                leaguesToSync.add(l.getLeague());
                leagueSportMap.put(l.getLeague(), l.getSport());
            }
            for (UserTrackedSportsTeam t : activeTeams) {
                leaguesToSync.add(t.getLeague());
                leagueSportMap.putIfAbsent(t.getLeague(), t.getSport());
            }

            String todayStr = LocalDate.now(SAO_PAULO_ZONE).format(DateTimeFormatter.BASIC_ISO_DATE);
            for (String league : leaguesToSync) {
                String sport = leagueSportMap.getOrDefault(league, "soccer");
                try {
                    sportsService.getScoreboard(sport, league, todayStr);
                } catch (Exception e) {
                    log.debug("Sync scoreboard check for {}/{}: {}", sport, league, e.getMessage());
                }
            }

            // Find matches starting in the 15-minute window
            LocalDateTime nowUtc = LocalDateTime.now(ZoneOffset.UTC);
            LocalDateTime windowEnd = nowUtc.plusMinutes(16);

            List<SportMatch> upcomingMatches = sportMatchRepository
                    .findByMatchDateBetweenAndNotified15mFalse(nowUtc.minusMinutes(2), windowEnd);

            for (SportMatch match : upcomingMatches) {
                Set<String> recipientUserIds = new HashSet<>();

                // Match by tracked league
                for (UserTrackedSportsLeague l : activeLeagues) {
                    if (l.getLeague().equalsIgnoreCase(match.getLeague())) {
                        recipientUserIds.add(l.getUserId());
                    }
                }

                // Match by tracked teams
                for (UserTrackedSportsTeam t : activeTeams) {
                    if (t.getSport() != null && t.getSport().equalsIgnoreCase(match.getSport()) &&
                            (t.getTeamId().equals(match.getHomeTeamId()) || t.getTeamId().equals(match.getAwayTeamId()))) {
                        recipientUserIds.add(t.getUserId());
                    }
                }

                if (!recipientUserIds.isEmpty()) {
                    String sportEmoji = getSportEmoji(match.getSport());
                    String venueText = (match.getVenue() != null && !match.getVenue().isBlank())
                            ? "\n📍 Local: " + match.getVenue() : "";

                    String kickoffTime = match.getMatchDate() != null
                            ? match.getMatchDate().atOffset(ZoneOffset.UTC).atZoneSameInstant(SAO_PAULO_ZONE)
                                .toLocalTime().format(DateTimeFormatter.ofPattern("HH:mm"))
                            : "em breve";

                    String leagueDisplay = SportsTranslationHelper.translateLeagueName(match.getLeague());

                    String message = String.format(
                            "%s <b>Jogo começando em 15 minutos!</b>\n\n" +
                            "<b>%s</b> x <b>%s</b>\n" +
                            "🏆 %s - Horário: %s%s",
                            sportEmoji,
                            match.getHomeTeamName(),
                            match.getAwayTeamName(),
                            leagueDisplay,
                            kickoffTime,
                            venueText
                    );

                    for (String userId : recipientUserIds) {
                        sendWithButton("notify.sports", message, "Ver no LifeOS →", "/sports", userId);
                        log.info("Dispatched 15m sports notification for match {} to user {}", match.getName(), userId);
                    }
                }

                match.setNotified15m(true);
                sportMatchRepository.save(match);
            }
        } catch (Exception ex) {
            log.error("Error in sports notification scheduler: {}", ex.getMessage(), ex);
        } finally {
            runningUpcomingWatcher.set(false);
        }
    }

    /**
     * DAILY MORNING BRIEFING: Runs every morning at 08:00 AM (America/Sao_Paulo).
     */
    @Scheduled(
            cron = "${app.schedulers.sports-daily-briefing.cron:0 0 8 * * *}",
            zone = "${app.schedulers.sports-daily-briefing.zone:America/Sao_Paulo}"
    )
    @SchedulerLock(name = "sports-dailyBriefing", lockAtMostFor = "PT15M", lockAtLeastFor = "PT5M")
    public void sendDailyBriefing() {
        if (!runningDailyBriefing.compareAndSet(false, true)) {
            log.warn("Sports daily briefing is already executing. Skipping.");
            return;
        }

        try {
            log.info("Starting Sports Daily Briefing...");
            Set<String> distinctUserIds = new HashSet<>();
            distinctUserIds.addAll(trackedTeamRepository.findAll().stream().map(UserTrackedSportsTeam::getUserId).toList());
            distinctUserIds.addAll(trackedLeagueRepository.findAll().stream().map(UserTrackedSportsLeague::getUserId).toList());

            LocalDate today = LocalDate.now(SAO_PAULO_ZONE);
            String todayStr = today.format(DateTimeFormatter.ISO_LOCAL_DATE);

            for (String userId : distinctUserIds) {
                List<SportMatchDTO> todayMatches = sportsService.getFollowedMatches(userId, todayStr);

                // Strictly filter matches:
                // 1. Must occur today in America/Sao_Paulo
                // 2. Must not be already finished or canceled
                List<SportMatchDTO> validMatches = todayMatches.stream()
                        .filter(m -> {
                            if (m.getDate() == null) return false;
                            LocalDate matchLocalDate = m.getDate().atOffset(ZoneOffset.UTC)
                                    .atZoneSameInstant(SAO_PAULO_ZONE).toLocalDate();
                            if (!matchLocalDate.equals(today)) return false;
                            if (isFinished(m.getStatus()) || "CANCELED".equalsIgnoreCase(m.getStatus())) {
                                return false;
                            }
                            return true;
                        })
                        .sorted(Comparator.comparing(SportMatchDTO::getDate, Comparator.nullsLast(Comparator.naturalOrder())))
                        .toList();

                if (!validMatches.isEmpty()) {
                    StringBuilder sb = new StringBuilder("⚽ <b>Bom dia! Jogos de hoje dos seus times e ligas:</b>\n\n");
                    int limit = Math.min(5, validMatches.size());
                    for (int i = 0; i < limit; i++) {
                        SportMatchDTO m = validMatches.get(i);
                        ZonedDateTime localTime = m.getDate().atOffset(ZoneOffset.UTC).atZoneSameInstant(SAO_PAULO_ZONE);
                        String timeStr = localTime.format(DateTimeFormatter.ofPattern("HH:mm"));

                        String home = m.getHomeTeam() != null ? m.getHomeTeam().getDisplayName() : "Casa";
                        String away = m.getAwayTeam() != null ? m.getAwayTeam().getDisplayName() : "Fora";

                        String leagueDisplay = resolveLeagueDisplayName(m);

                        sb.append(String.format("🔹 <b>%s x %s</b> (%s) - %s\n", home, away, leagueDisplay, timeStr));
                    }
                    if (validMatches.size() > limit) {
                        sb.append(String.format("\n<i>e mais %d jogos...</i>", validMatches.size() - limit));
                    }

                    sendWithButton("notify.sports", sb.toString().trim(), "Ver no LifeOS →", "/sports", userId);
                    log.info("Sent daily sports briefing to user {} with {} matches", userId, validMatches.size());
                } else {
                    log.info("No valid upcoming followed matches for user {} today ({})", userId, today);
                }
            }
        } catch (Exception ex) {
            log.error("Error generating daily sports briefing: {}", ex.getMessage(), ex);
        } finally {
            runningDailyBriefing.set(false);
        }
    }

    private String resolveLeagueDisplayName(SportMatchDTO m) {
        if (m == null) return "Competição";
        if (m.getLeagueName() != null && !m.getLeagueName().isBlank() && !m.getLeagueName().equalsIgnoreCase(m.getLeague())) {
            return SportsTranslationHelper.translateLeagueName(m.getLeagueName());
        }
        if (m.getLeague() != null && !m.getLeague().isBlank()) {
            return SportsTranslationHelper.translateLeagueName(m.getLeague());
        }
        return "Competição";
    }

    private boolean isFinished(String status) {
        if (status == null) return false;
        String s = status.toUpperCase();
        return s.contains("FINISHED") || s.contains("FINAL") || s.contains("POST") || s.contains("COMPLETED") || s.contains("FT");
    }

    private void sendWithButton(String routingKey, String text, String label, String path, String userId) {
        eventPublisher.publishEvent(com.lifeos.shared.event.NotificationEvent.builder()
                .type("SPORTS")
                .message(text)
                .buttonLabel(label)
                .buttonPath(path)
                .userId(userId != null ? userId : "")
                .build());
    }

    private String getSportEmoji(String sport) {
        if (sport == null) return "⚽";
        return switch (sport.toLowerCase()) {
            case "basketball" -> "🏀";
            case "football" -> "🏈";
            default -> "⚽";
        };
    }
}
