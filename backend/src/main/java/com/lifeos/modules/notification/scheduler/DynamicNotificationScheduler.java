package com.lifeos.modules.notification.scheduler;

import com.lifeos.modules.f1.scheduler.F1NotificationScheduler;
import com.lifeos.modules.finance.scheduler.FinanceNotificationScheduler;
import com.lifeos.modules.media.scheduler.MediaNotificationScheduler;
import com.lifeos.modules.notification.model.UserNotificationSettings;
import com.lifeos.modules.notification.repository.UserNotificationSettingsRepository;
import com.lifeos.modules.reading.scheduler.ReadingNotificationScheduler;
import com.lifeos.modules.sports.scheduler.SportsNotificationScheduler;
import com.lifeos.modules.weather.service.RoutineWeatherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Agendador dinâmico minuto a minuto.
 *
 * Avalia as preferências e horários personalizados configurados por cada usuário
 * na Central de Notificações (horário de Brasília) e dispara os briefings e lembretes
 * no minuto exato configurado, sem depender de crons estáticos compilados.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class DynamicNotificationScheduler {

    private final UserNotificationSettingsRepository settingsRepository;
    private final StringRedisTemplate redisTemplate;

    private final F1NotificationScheduler f1NotificationScheduler;
    private final ReadingNotificationScheduler readingNotificationScheduler;
    private final RoutineWeatherService routineWeatherService;
    private final FinanceNotificationScheduler financeNotificationScheduler;
    private final MediaNotificationScheduler mediaNotificationScheduler;
    private final SportsNotificationScheduler sportsNotificationScheduler;

    private static final ZoneId BRT = ZoneId.of("America/Sao_Paulo");
    private final Set<String> localFallbackDispatched = ConcurrentHashMap.newKeySet();

    @Scheduled(cron = "0 * * * * *", zone = "America/Sao_Paulo")
    public void processDynamicDispatches() {
        LocalTime now = LocalTime.now(BRT);
        String currentTime = now.format(DateTimeFormatter.ofPattern("HH:mm"));
        String today = LocalDate.now(BRT).format(DateTimeFormatter.ISO_LOCAL_DATE);

        List<UserNotificationSettings> allSettings = settingsRepository.findAll();
        if (allSettings.isEmpty()) {
            return;
        }

        for (UserNotificationSettings s : allSettings) {
            String userId = s.getUserId();
            if (userId == null || userId.isBlank() || !s.isTelegramEnabled()) {
                continue;
            }

            if (isQuietHours(s, now)) {
                log.debug("Usuário {} está no horário de silêncio (quiet hours). Pulando checagem.", userId);
                continue;
            }

            // 1. Briefing F1
            if (s.isF1Enabled() && currentTime.equals(s.getF1BriefingTime())) {
                String key = "dyn_dispatch:f1:" + userId + ":" + today;
                if (markDispatched(key)) {
                    log.info("Disparando Briefing F1 dinâmico para usuário {} às {}", userId, currentTime);
                    try {
                        f1NotificationScheduler.sendDailyNewsBriefing();
                    } catch (Exception e) {
                        log.error("Erro ao executar sendDailyNewsBriefing para usuário {}: {}", userId, e.getMessage(), e);
                    }
                }
            }

            // 2. Resumo Esportivo
            if (s.isSportsEnabled() && currentTime.equals(s.getSportsMorningTime())) {
                String key = "dyn_dispatch:sports:" + userId + ":" + today;
                if (markDispatched(key)) {
                    log.info("Disparando Resumo Esportivo dinâmico para usuário {} às {}", userId, currentTime);
                    try {
                        sportsNotificationScheduler.sendDailyBriefing();
                    } catch (Exception e) {
                        log.error("Erro ao executar sendDailyBriefing de esportes para usuário {}: {}", userId, e.getMessage(), e);
                    }
                }
            }

            // 3. Clima Matinal
            if (s.isWeatherEnabled() && currentTime.equals(s.getWeatherTime())) {
                String key = "dyn_dispatch:weather:" + userId + ":" + today;
                if (markDispatched(key)) {
                    log.info("Disparando Previsão do Tempo dinâmica para usuário {} às {}", userId, currentTime);
                    try {
                        routineWeatherService.checkMorningRoutineWeather();
                    } catch (Exception e) {
                        log.error("Erro ao executar checkMorningRoutineWeather para usuário {}: {}", userId, e.getMessage(), e);
                    }
                }
            }

            // 4. Radar de Mídia (Lançamentos da watchlist)
            if (s.isMediaEnabled() && currentTime.equals(s.getMediaTime())) {
                String key = "dyn_dispatch:media:" + userId + ":" + today;
                if (markDispatched(key)) {
                    log.info("Disparando Radar de Mídia dinâmico para usuário {} às {}", userId, currentTime);
                    try {
                        mediaNotificationScheduler.notifyDailyMediaReleases();
                    } catch (Exception e) {
                        log.error("Erro ao executar notifyDailyMediaReleases para usuário {}: {}", userId, e.getMessage(), e);
                    }
                }
            }

            // 5. Alertas Financeiros
            if (s.isFinanceEnabled() && currentTime.equals(s.getFinanceTime())) {
                String key = "dyn_dispatch:finance:" + userId + ":" + today;
                if (markDispatched(key)) {
                    log.info("Disparando Alertas Financeiros dinâmicos para usuário {} às {}", userId, currentTime);
                    try {
                        financeNotificationScheduler.notifyUpcomingPayments();
                    } catch (Exception e) {
                        log.error("Erro ao executar notifyUpcomingPayments para usuário {}: {}", userId, e.getMessage(), e);
                    }
                }
            }

            // 6. Lembrete de Leitura (Nudge)
            if (s.isReadingEnabled() && currentTime.equals(s.getReadingTime())) {
                String key = "dyn_dispatch:reading:" + userId + ":" + today;
                if (markDispatched(key)) {
                    log.info("Disparando Lembrete de Leitura dinâmico para usuário {} às {}", userId, currentTime);
                    try {
                        readingNotificationScheduler.notifyReadingSlump();
                    } catch (Exception e) {
                        log.error("Erro ao executar notifyReadingSlump para usuário {}: {}", userId, e.getMessage(), e);
                    }
                }
            }
        }
    }

    private boolean markDispatched(String key) {
        try {
            if (redisTemplate != null) {
                Boolean set = redisTemplate.opsForValue().setIfAbsent(key, "1", Duration.ofHours(20));
                return Boolean.TRUE.equals(set);
            }
        } catch (Exception e) {
            log.warn("Falha ao registrar despacho no Redis para chave {}. Usando fallback local.", key, e);
        }
        return localFallbackDispatched.add(key);
    }

    private boolean isQuietHours(UserNotificationSettings settings, LocalTime now) {
        if (!settings.isQuietHoursEnabled()) {
            return false;
        }

        String startStr = settings.getQuietHoursStart();
        String endStr = settings.getQuietHoursEnd();
        if (startStr == null || endStr == null || startStr.isBlank() || endStr.isBlank()) {
            return false;
        }

        try {
            LocalTime start = LocalTime.parse(startStr.trim());
            LocalTime end = LocalTime.parse(endStr.trim());

            if (start.equals(end)) return false;

            if (start.isBefore(end)) {
                return !now.isBefore(start) && now.isBefore(end);
            } else {
                return !now.isBefore(start) || now.isBefore(end);
            }
        } catch (Exception e) {
            return false;
        }
    }
}
