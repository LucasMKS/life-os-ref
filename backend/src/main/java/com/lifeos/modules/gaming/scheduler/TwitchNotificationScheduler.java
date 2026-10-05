package com.lifeos.modules.gaming.scheduler;

import com.lifeos.modules.gaming.service.TwitchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Scheduler que detecta quando algum canal Twitch favorito sobe ao vivo.
 * Roda a cada 5 minutos (fixedDelay) chamando TwitchService.fetchLiveChannelsFromTwitch
 * que faz a comparação com o estado anterior em Redis e dispara notify.media
 * para os canais que acabaram de entrar ao vivo.
 *
 * O delay inicial de 60s evita disparar a primeira varredura no boot do
 * serviço (quando o token OAuth da Twitch ainda pode não ter sido obtido).
 * O AtomicBoolean previne execução concorrente — útil para o caso raro de
 * uma chamada à Twitch demorar mais de 5 minutos.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class TwitchNotificationScheduler {

    private final TwitchService twitchService;
    private final AtomicBoolean runningTwitchCheck = new AtomicBoolean(false);

    @Scheduled(
            fixedDelayString = "${app.schedulers.twitch-live-check.fixed-delay-ms:300000}",
            initialDelayString = "${app.schedulers.twitch-live-check.initial-delay-ms:60000}"
    )
    @SchedulerLock(name = "gaming-twitchLiveCheck", lockAtMostFor = "PT4M", lockAtLeastFor = "PT1M")
    public void checkLiveStreams() {
        if (!runningTwitchCheck.compareAndSet(false, true)) {
            log.warn("Scheduler de Twitch ainda em execucao. Ciclo sera ignorado.");
            return;
        }

        try {
            twitchService.fetchLiveChannelsFromTwitch();
        } finally {
            runningTwitchCheck.set(false);
        }
    }
    
}