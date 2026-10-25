package com.lifeos.modules.notification.service;

import com.lifeos.core.exception.ResourceNotFoundException;
import com.lifeos.modules.notification.dto.CustomNotificationDto;
import com.lifeos.modules.notification.dto.CustomNotificationRequest;
import com.lifeos.modules.notification.model.CustomNotification;
import com.lifeos.modules.notification.model.RecurrenceType;
import com.lifeos.modules.notification.repository.CustomNotificationRepository;
import com.lifeos.shared.event.NotificationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
@RequiredArgsConstructor
public class CustomNotificationService {

    private final CustomNotificationRepository repository;
    private final ApplicationEventPublisher eventPublisher;
    private final StringRedisTemplate redisTemplate;

    private static final ZoneId BRT = ZoneId.of("America/Sao_Paulo");
    private final Set<String> localFallbackDispatched = ConcurrentHashMap.newKeySet();

    public List<CustomNotificationDto> getCustomNotifications(String userId) {
        if (userId == null || userId.isBlank()) {
            return Collections.emptyList();
        }
        return repository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(CustomNotificationDto::from)
                .toList();
    }

    public CustomNotificationDto getCustomNotification(String userId, String id) {
        CustomNotification notification = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Notificação personalizada não encontrada: " + id));
        return CustomNotificationDto.from(notification);
    }

    @Transactional
    public CustomNotificationDto createCustomNotification(String userId, CustomNotificationRequest req) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("UserId é obrigatório.");
        }

        CustomNotification entity = CustomNotification.builder()
                .userId(userId)
                .title(req.getTitle().trim())
                .description(req.getDescription() != null ? req.getDescription().trim() : null)
                .time(normalizeTime(req.getTime()))
                .recurrence(req.getRecurrence() != null ? req.getRecurrence() : RecurrenceType.DAILY)
                .daysOfWeek(req.getDaysOfWeek() != null ? req.getDaysOfWeek().trim() : null)
                .specificDate(req.getSpecificDate())
                .enabled(req.getEnabled() == null || req.getEnabled())
                .sendTelegram(req.getSendTelegram() == null || req.getSendTelegram())
                .build();

        CustomNotification saved = repository.save(entity);
        log.info("Lembrete personalizado criado: '{}' para usuário {} às {}", saved.getTitle(), userId, saved.getTime());
        return CustomNotificationDto.from(saved);
    }

    @Transactional
    public CustomNotificationDto updateCustomNotification(String userId, String id, CustomNotificationRequest req) {
        CustomNotification entity = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Notificação personalizada não encontrada: " + id));

        String oldTime = entity.getTime();
        RecurrenceType oldRecurrence = entity.getRecurrence();

        entity.setTitle(req.getTitle().trim());
        entity.setDescription(req.getDescription() != null ? req.getDescription().trim() : null);
        entity.setTime(normalizeTime(req.getTime()));
        entity.setRecurrence(req.getRecurrence() != null ? req.getRecurrence() : RecurrenceType.DAILY);
        entity.setDaysOfWeek(req.getDaysOfWeek() != null ? req.getDaysOfWeek().trim() : null);
        entity.setSpecificDate(req.getSpecificDate());

        if (req.getEnabled() != null) {
            entity.setEnabled(req.getEnabled());
        }
        if (req.getSendTelegram() != null) {
            entity.setSendTelegram(req.getSendTelegram());
        }

        // Se o horário ou recorrência mudou, limpa o último disparo para permitir disparo no novo horário hoje
        if (!entity.getTime().equals(oldTime) || entity.getRecurrence() != oldRecurrence) {
            entity.setLastTriggeredAt(null);
            clearDispatchedLock(entity.getId());
        }

        CustomNotification updated = repository.save(entity);
        log.info("Lembrete personalizado atualizado: '{}' ({})", updated.getTitle(), id);
        return CustomNotificationDto.from(updated);
    }

    @Transactional
    public CustomNotificationDto toggleEnabled(String userId, String id) {
        CustomNotification entity = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Notificação personalizada não encontrada: " + id));

        entity.setEnabled(!entity.isEnabled());
        if (entity.isEnabled()) {
            clearDispatchedLock(entity.getId());
        }

        CustomNotification updated = repository.save(entity);
        log.info("Lembrete '{}' ({}) status alterado para enabled={}", updated.getTitle(), id, updated.isEnabled());
        return CustomNotificationDto.from(updated);
    }

    @Transactional
    public void deleteCustomNotification(String userId, String id) {
        CustomNotification entity = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Notificação personalizada não encontrada: " + id));

        clearDispatchedLock(entity.getId());
        repository.delete(entity);
        log.info("Lembrete personalizado removido: '{}' ({})", entity.getTitle(), id);
    }

    public void testTrigger(String userId, String id) {
        CustomNotification entity = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Notificação personalizada não encontrada: " + id));

        String message = buildNotificationMessage(entity);

        eventPublisher.publishEvent(NotificationEvent.builder()
                .userId(entity.getUserId())
                .type("CUSTOM")
                .message(message)
                .sendTelegram(entity.isSendTelegram())
                .ignoreQuietHours(true)
                .skipTelegramDedup(true)
                .build());

        log.info("Disparo de teste realizado para lembrete '{}' ({})", entity.getTitle(), id);
    }

    @Transactional
    public void dispatchDueNotifications(LocalTime now, LocalDate today) {
        List<CustomNotification> activeNotifications = repository.findByEnabledTrue();
        if (activeNotifications.isEmpty()) {
            return;
        }

        for (CustomNotification notification : activeNotifications) {
            try {
                if (!isDueToday(notification, today)) {
                    continue;
                }

                // Se já foi disparado hoje, evita repetição
                if (notification.getLastTriggeredAt() != null &&
                        notification.getLastTriggeredAt().toLocalDate().isEqual(today)) {
                    continue;
                }

                // Verifica janela de tolerância de 15 minutos
                if (!isWithinDispatchWindow(now, notification.getTime(), 15)) {
                    continue;
                }

                String lockKey = "dyn_dispatch:custom:" + notification.getId() + ":" + today;
                if (!markDispatched(lockKey)) {
                    continue;
                }

                log.info("Disparando lembrete personalizado '{}' para usuário {} às {}",
                        notification.getTitle(), notification.getUserId(), now);

                String message = buildNotificationMessage(notification);

                eventPublisher.publishEvent(NotificationEvent.builder()
                        .userId(notification.getUserId())
                        .type("CUSTOM")
                        .message(message)
                        .sendTelegram(notification.isSendTelegram())
                        .ignoreQuietHours(true)
                        .build());

                notification.setLastTriggeredAt(LocalDateTime.now(BRT));
                if (notification.getRecurrence() == RecurrenceType.ONCE) {
                    notification.setEnabled(false);
                }
                repository.save(notification);

            } catch (Exception e) {
                log.error("Erro ao processar lembrete personalizado {} (id={}): {}",
                        notification.getTitle(), notification.getId(), e.getMessage(), e);
            }
        }
    }

    private String buildNotificationMessage(CustomNotification n) {
        StringBuilder sb = new StringBuilder();
        sb.append("🔔 <b>Lembrete:</b> ").append(n.getTitle().trim());
        if (n.getDescription() != null && !n.getDescription().isBlank()) {
            sb.append("\n").append(n.getDescription().trim());
        }
        return sb.toString();
    }

    private boolean isDueToday(CustomNotification n, LocalDate today) {
        RecurrenceType recurrence = n.getRecurrence() != null ? n.getRecurrence() : RecurrenceType.DAILY;
        DayOfWeek dow = today.getDayOfWeek();

        switch (recurrence) {
            case DAILY:
                return true;
            case WEEKDAYS:
                return dow != DayOfWeek.SATURDAY && dow != DayOfWeek.SUNDAY;
            case WEEKENDS:
                return dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY;
            case SPECIFIC_DAYS:
                if (n.getDaysOfWeek() == null || n.getDaysOfWeek().isBlank()) {
                    return false;
                }
                return n.getDaysOfWeek().toUpperCase().contains(dow.name());
            case ONCE:
                return n.getSpecificDate() != null && n.getSpecificDate().isEqual(today);
            default:
                return false;
        }
    }

    private boolean isWithinDispatchWindow(LocalTime now, String targetTimeStr, int windowMinutes) {
        if (targetTimeStr == null || targetTimeStr.isBlank()) {
            return false;
        }
        try {
            LocalTime target = LocalTime.parse(targetTimeStr.trim());
            LocalTime windowEnd = target.plusMinutes(windowMinutes);
            if (target.isBefore(windowEnd)) {
                return !now.isBefore(target) && now.isBefore(windowEnd);
            } else {
                return !now.isBefore(target) || now.isBefore(windowEnd);
            }
        } catch (Exception e) {
            log.warn("Erro ao fazer parse do horário de notificação personalizada '{}': {}", targetTimeStr, e.getMessage());
            return false;
        }
    }

    private String normalizeTime(String raw) {
        if (raw == null) return "09:00";
        String trimmed = raw.trim();
        // Se vier "9:00", converte para "09:00"
        if (trimmed.length() == 4 && trimmed.charAt(1) == ':') {
            return "0" + trimmed;
        }
        return trimmed;
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

    private void clearDispatchedLock(String reminderId) {
        try {
            if (redisTemplate != null) {
                String pattern = "dyn_dispatch:custom:" + reminderId + ":*";
                Set<String> keys = redisTemplate.keys(pattern);
                if (keys != null && !keys.isEmpty()) {
                    redisTemplate.delete(keys);
                }
            }
        } catch (Exception e) {
            log.warn("Falha ao limpar chave no Redis para lembrete {}: {}", reminderId, e.getMessage());
        }
        localFallbackDispatched.removeIf(k -> k.startsWith("dyn_dispatch:custom:" + reminderId + ":"));
    }
}
