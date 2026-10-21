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
import java.util.ArrayList;
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

    private final Set<String> localFallbackDispatched = ConcurrentHashMap.newKeySet();

    private static final ZoneId BRT = ZoneId.of("America/Sao_Paulo");

    @org.springframework.beans.factory.annotation.Value("${app.bot-user-id:}")
    private String ownerUserId;

    @Scheduled(cron = "0 * * * * *", zone = "America/Sao_Paulo")
    public void processDynamicDispatches() {
        LocalTime now = LocalTime.now(BRT);
        String today = LocalDate.now(BRT).format(DateTimeFormatter.ISO_LOCAL_DATE);

        List<UserNotificationSettings> allSettings = new ArrayList<>(settingsRepository.findAll());
        if (allSettings.isEmpty()) {
            if (ownerUserId != null && !ownerUserId.isBlank()) {
                allSettings.add(UserNotificationSettings.defaultSettings(ownerUserId));
            } else {
                return;
            }
        } else if (ownerUserId != null && !ownerUserId.isBlank() && allSettings.stream().noneMatch(s -> ownerUserId.equals(s.getUserId()))) {
            allSettings.add(UserNotificationSettings.defaultSettings(ownerUserId));
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
            if (s.isF1Enabled() && isWithinDispatchWindow(now, s.getF1BriefingTime(), 30)) {
                String key = "dyn_dispatch:f1:" + userId + ":" + today;
                if (markDispatched(key)) {
                    log.info("Disparando Briefing F1 dinâmico para usuário {} às {}", userId, now);
                    try {
                        f1NotificationScheduler.sendDailyNewsBriefing();
                    } catch (Exception e) {
                        clearDispatched(key);
                        log.error("Erro ao executar sendDailyNewsBriefing para usuário {}: {}", userId, e.getMessage(), e);
                    }
                }
            }

            // 2. Resumo Esportivo
            if (s.isSportsEnabled() && isWithinDispatchWindow(now, s.getSportsMorningTime(), 30)) {
                String key = "dyn_dispatch:sports:" + userId + ":" + today;
                if (markDispatched(key)) {
                    log.info("Disparando Resumo Esportivo dinâmico para usuário {} às {}", userId, now);
                    try {
                        sportsNotificationScheduler.sendDailyBriefing();
                    } catch (Exception e) {
                        clearDispatched(key);
                        log.error("Erro ao executar sendDailyBriefing de esportes para usuário {}: {}", userId, e.getMessage(), e);
                    }
                }
            }

            // 3. Clima Matinal
            if (s.isWeatherEnabled() && isWithinDispatchWindow(now, s.getWeatherTime(), 30)) {
                String key = "dyn_dispatch:weather:" + userId + ":" + today;
                if (markDispatched(key)) {
                    log.info("Disparando Previsão do Tempo dinâmica para usuário {} às {}", userId, now);
                    try {
                        routineWeatherService.checkMorningRoutineWeather();
                    } catch (Exception e) {
                        clearDispatched(key);
                        log.error("Erro ao executar checkMorningRoutineWeather para usuário {}: {}", userId, e.getMessage(), e);
                    }
                }
            }

            // 4. Radar de Mídia (Lançamentos da watchlist)
            if (s.isMediaEnabled() && isWithinDispatchWindow(now, s.getMediaTime(), 30)) {
                String canonicalUserId = (ownerUserId != null && !ownerUserId.isBlank() && ("1".equals(userId) || ownerUserId.equalsIgnoreCase(userId)))
                        ? ownerUserId
                        : userId;
                String key = "dyn_dispatch:media:" + canonicalUserId + ":" + today;
                if (markDispatched(key)) {
                    log.info("Disparando Radar de Mídia dinâmico para usuário {} (canônico: {}) às {}", userId, canonicalUserId, now);
                    try {
                        mediaNotificationScheduler.notifyDailyMediaReleasesForUser(canonicalUserId);
                    } catch (Exception e) {
                        clearDispatched(key);
                        log.error("Erro ao executar notifyDailyMediaReleases para usuário {}: {}", canonicalUserId, e.getMessage(), e);
                    }
                }
            }

            // 5. Alertas Financeiros
            if (s.isFinanceEnabled() && isWithinDispatchWindow(now, s.getFinanceTime(), 30)) {
                String key = "dyn_dispatch:finance:" + userId + ":" + today;
                if (markDispatched(key)) {
                    log.info("Disparando Alertas Financeiros dinâmicos para usuário {} às {}", userId, now);
                    try {
                        financeNotificationScheduler.notifyUpcomingPayments();
                    } catch (Exception e) {
                        clearDispatched(key);
                        log.error("Erro ao executar notifyUpcomingPayments para usuário {}: {}", userId, e.getMessage(), e);
                    }
                }
            }

            // 6. Lembrete de Leitura (Nudge)
            if (s.isReadingEnabled() && isWithinDispatchWindow(now, s.getReadingTime(), 30)) {
                String key = "dyn_dispatch:reading:" + userId + ":" + today;
                if (markDispatched(key)) {
                    log.info("Disparando Lembrete de Leitura dinâmico para usuário {} às {}", userId, now);
                    try {
                        readingNotificationScheduler.notifyReadingSlump();
                    } catch (Exception e) {
                        clearDispatched(key);
                        log.error("Erro ao executar notifyReadingSlump para usuário {}: {}", userId, e.getMessage(), e);
                    }
                }
            }
        }
    }

    private boolean isWithinDispatchWindow(LocalTime now, String targetTimeStr, int windowMinutes) {
        if (targetTimeStr == null || targetTimeStr.isBlank()) {
            return false;
        }
        try {
            LocalTime target = LocalTime.parse(targetTimeStr.trim());
            // Tolerância: de target até target + windowMinutes
            LocalTime windowEnd = target.plusMinutes(windowMinutes);
            if (target.isBefore(windowEnd)) {
                return !now.isBefore(target) && now.isBefore(windowEnd);
            } else {
                // Passou da meia-noite
                return !now.isBefore(target) || now.isBefore(windowEnd);
            }
        } catch (Exception e) {
            log.warn("Erro ao fazer parse do horário de notificação '{}': {}", targetTimeStr, e.getMessage());
            return false;
        }
    }

    private boolean markDispatched(String key) {
        try {
            if (redisTemplate != null) {
                Boolean set = redisTemplate.opsForValue().setIfAbsent(key, "1", Duration.ofHours(23));
                return Boolean.TRUE.equals(set);
            }
        } catch (Exception e) {
            log.warn("Falha ao registrar despacho no Redis para chave {}. Usando fallback local.", key, e);
        }
        return localFallbackDispatched.add(key);
    }

    private void clearDispatched(String key) {
        try {
            if (redisTemplate != null) {
                redisTemplate.delete(key);
            }
        } catch (Exception e) {
            log.warn("Falha ao limpar despacho no Redis para chave {}: {}", key, e.getMessage());
        }
        localFallbackDispatched.remove(key);
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
