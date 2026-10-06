package com.lifeos.modules.f1.scheduler;

import com.lifeos.modules.f1.dto.F1NewsDTO;
import com.lifeos.modules.f1.model.F1Session;
import com.lifeos.modules.f1.repository.F1SessionRepository;
import com.lifeos.modules.f1.service.F1Service;
import com.lifeos.shared.event.NotificationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

@Component
@Slf4j
@RequiredArgsConstructor
public class F1NotificationScheduler {

    private final F1SessionRepository sessionRepository;
    private final F1Service f1Service;
    private final ApplicationEventPublisher eventPublisher;
    private final AtomicBoolean runningUpcomingWatcher = new AtomicBoolean(false);
    private final AtomicBoolean runningDailyBriefing = new AtomicBoolean(false);

    @Value("${app.schedulers.f1-upcoming.lookahead-minutes:15}")
    private long lookaheadMinutes;

    @Scheduled(
            fixedDelayString = "${app.schedulers.f1-upcoming.fixed-delay-ms:60000}",
            initialDelayString = "${app.schedulers.f1-upcoming.initial-delay-ms:45000}"
    )
    @SchedulerLock(name = "f1-notifyUpcomingSessions", lockAtMostFor = "PT2M", lockAtLeastFor = "PT30S")
    public void notifyUpcomingSessions() {
        if (!runningUpcomingWatcher.compareAndSet(false, true)) {
            log.warn("Watcher de F1 ainda em execucao. Ciclo atual sera ignorado para evitar sobreposicao.");
            return;
        }

        try {
            LocalDateTime nowUtc = LocalDateTime.now(ZoneOffset.UTC);
            LocalDateTime targetTime = nowUtc.plusMinutes(lookaheadMinutes);

            LocalDateTime startOfMinute = targetTime.truncatedTo(ChronoUnit.MINUTES);
            LocalDateTime endOfMinute = startOfMinute.plusMinutes(1).minusNanos(1);

            List<F1Session> upcomingSessions = sessionRepository.findByDateBetweenAndNotifiedFalse(startOfMinute, endOfMinute);

            for (F1Session session : upcomingSessions) {
                log.info("Sessão encontrada! Disparando alerta de 15 minutos para: {}", session.getName());

                String message = String.format(
                        "🏎️ <b>F1 Alert: Vai começar!</b>\n\nA sessão <b>%s</b> começa em 15 minutos.",
                        session.getName()
                );

                eventPublisher.publishEvent(NotificationEvent.builder()
                        .type("F1")
                        .message(message)
                        .buttonLabel("Assistir F1TV →")
                        .buttonPath("https://f1tv.formula1.com/")
                        .build());

                session.setNotified(true);
                sessionRepository.save(session);
            }
        } finally {
            runningUpcomingWatcher.set(false);
        }
    }

    // Disparado dinamicamente pelo DynamicNotificationScheduler de acordo com o horário do usuário
    @SchedulerLock(name = "f1-dailyNewsBriefing", lockAtMostFor = "PT15M", lockAtLeastFor = "PT5M")
    public void sendDailyNewsBriefing() {
        if (!runningDailyBriefing.compareAndSet(false, true)) {
            log.warn("Daily briefing da F1 ainda em execucao. Ciclo sera ignorado.");
            return;
        }

        try {
            log.info("Gerando Daily Briefing da F1...");

            List<F1NewsDTO> news = f1Service.getF1News();

            if (news != null && !news.isEmpty()) {
                StringBuilder sb = new StringBuilder("📰 <b>Bom dia! F1 Notícias do dia:</b>\n\n");

                int limit = Math.min(2, news.size());
                for (int i = 0; i < limit; i++) {
                    sb.append("🔹 ").append(news.get(i).title()).append("\n\n");
                }

                eventPublisher.publishEvent(NotificationEvent.builder()
                        .type("F1")
                        .message(sb.toString().trim())
                        .buttonLabel("Ver no LifeOS →")
                        .buttonPath("/f1")
                        .build());
            }
        } finally {
            runningDailyBriefing.set(false);
        }
    }
}
