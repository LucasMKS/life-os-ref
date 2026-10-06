package com.lifeos.modules.media.scheduler;

import com.lifeos.modules.media.service.ReleaseRadarService;
import com.lifeos.modules.media.repository.UserTrackedMediaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

@Component
@Slf4j
@RequiredArgsConstructor
public class MediaNotificationScheduler {

    private final ReleaseRadarService releaseRadarService;
    private final UserTrackedMediaRepository trackedMediaRepository;
    private final AtomicBoolean runningMediaRadar = new AtomicBoolean(false);

    /**
     * Varredura diária de lançamentos do radar de mídia (filmes e séries da watchlist).
     * Executa diariamente às 09:00 (horário de Brasília).
     */
    // Disparado dinamicamente pelo DynamicNotificationScheduler de acordo com o horário do usuário
    @SchedulerLock(name = "mediaDailyRadar", lockAtMostFor = "PT30M", lockAtLeastFor = "PT5M")
    public void notifyDailyMediaReleases() {
        if (!runningMediaRadar.compareAndSet(false, true)) {
            log.warn("Scheduler de radar de mídia ainda em execução. Ciclo será ignorado.");
            return;
        }

        try {
            log.info("Iniciando varredura diária de lançamentos de filmes e séries...");
            List<String> userIds = trackedMediaRepository.findDistinctUserIds();
            log.info("Encontrados {} usuários com mídias rastreadas no LifeOS.", userIds.size());

            for (String userId : userIds) {
                try {
                    releaseRadarService.checkDailyReleasesForUser(userId);
                } catch (Exception e) {
                    log.error("Erro ao processar lançamentos diários de mídia para o usuário {}: {}", userId, e.getMessage(), e);
                }
            }
        } catch (Exception e) {
            log.error("Erro inesperado no MediaNotificationScheduler", e);
        } finally {
            runningMediaRadar.set(false);
        }
    }
}
