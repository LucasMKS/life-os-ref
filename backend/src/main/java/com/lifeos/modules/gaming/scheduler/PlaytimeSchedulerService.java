package com.lifeos.modules.gaming.scheduler;

import com.lifeos.modules.gaming.dto.SteamOwnedGamesResponse;
import com.lifeos.modules.gaming.model.DailyPlaytimeLog;
import com.lifeos.modules.gaming.model.PlaytimeSnapshot;
import com.lifeos.modules.gaming.model.SteamProfile;
import com.lifeos.modules.gaming.repository.DailyPlaytimeLogRepository;
import com.lifeos.modules.gaming.repository.PlaytimeSnapshotRepository;
import com.lifeos.modules.gaming.repository.SteamProfileRepository;
import com.lifeos.modules.gaming.service.SteamApiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Job diário que tira um snapshot do tempo total jogado de cada jogo e calcula
 * o quanto o usuário jogou no dia. Roda às 23:55 (cron 0 55 23 * * *).
 *
 * Para cada SteamProfile cadastrado:
 * busca a lista de jogos com playtime acumulado da Steam,
 * compara com o último PlaytimeSnapshot (delta = playtime de hoje),
 * salva um DailyPlaytimeLog para cada jogo jogado hoje (>= 1 minuto),
 * sobrescreve o snapshot com os valores atuais para a comparação de amanhã.
 *
 * Os DailyPlaytimeLog alimentam o gráfico de "horas jogadas por dia" no
 * dashboard. Se a Steam estiver fora do ar quando o job rodar, o método
 * registra erro e segue — no dia seguinte o delta abrange duas datas.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PlaytimeSchedulerService {

    private final SteamProfileRepository steamProfileRepository;
    private final SteamApiService steamApiService;
    private final PlaytimeSnapshotRepository playtimeSnapshotRepository;
    private final DailyPlaytimeLogRepository dailyPlaytimeLogRepository;

    // Runs every day at 23:55
    @Scheduled(cron = "0 55 23 * * *")
    @SchedulerLock(name = "gaming-trackDailyPlaytime", lockAtMostFor = "PT30M", lockAtLeastFor = "PT5M")
    @Transactional
    public void trackDailyPlaytime() {
        log.info("Starting daily playtime tracking job...");
        List<SteamProfile> profiles = steamProfileRepository.findAll();
        LocalDate today = LocalDate.now();

        for (SteamProfile profile : profiles) {
            try {
                processUserPlaytime(profile, today);
            } catch (Exception e) {
                log.error("Error processing playtime for user {}: {}", profile.getUserId(), e.getMessage());
            }
        }
        log.info("Daily playtime tracking job finished.");
    }

    private void processUserPlaytime(SteamProfile profile, LocalDate today) {
        SteamOwnedGamesResponse response = steamApiService.getOwnedGames(profile.getSteamId()).block();
        if (response == null || response.getResponse() == null || response.getResponse().getGames() == null) {
            return;
        }

        for (SteamOwnedGamesResponse.Game steamGame : response.getResponse().getGames()) {
            if (steamGame.getPlaytimeForever() == 0) continue;

            Long appId = steamGame.getAppid();
            Integer currentTotal = steamGame.getPlaytimeForever();

            // Find previous snapshot
            Optional<PlaytimeSnapshot> lastSnapshotOpt = playtimeSnapshotRepository
                    .findTopByUserIdAndAppIdAndDateBeforeOrderByDateDesc(profile.getUserId(), appId, today);

            if (lastSnapshotOpt.isPresent()) {
                PlaytimeSnapshot lastSnapshot = lastSnapshotOpt.get();
                int delta = currentTotal - lastSnapshot.getTotalPlaytimeForever();

                if (delta > 0) {
                    log.info("User {} played {} for {} minutes today", profile.getUserId(), steamGame.getName(), delta);
                    
                    // Save log for today
                    DailyPlaytimeLog logEntry = dailyPlaytimeLogRepository
                            .findByUserIdAndDate(profile.getUserId(), today).stream()
                            .filter(l -> l.getAppId().equals(appId))
                            .findFirst()
                            .orElse(DailyPlaytimeLog.builder()
                                    .userId(profile.getUserId())
                                    .appId(appId)
                                    .date(today)
                                    .build());
                    
                    logEntry.setMinutesPlayed(delta);
                    dailyPlaytimeLogRepository.save(logEntry);
                }
            }

            // Always update/save today's snapshot
            PlaytimeSnapshot todaySnapshot = playtimeSnapshotRepository
                    .findByUserIdAndAppIdAndDate(profile.getUserId(), appId, today)
                    .orElse(PlaytimeSnapshot.builder()
                            .userId(profile.getUserId())
                            .appId(appId)
                            .date(today)
                            .build());
            
            todaySnapshot.setTotalPlaytimeForever(currentTotal);
            playtimeSnapshotRepository.save(todaySnapshot);
        }
    }
}
