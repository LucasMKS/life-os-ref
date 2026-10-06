package com.lifeos.modules.notification.service;

import com.lifeos.modules.notification.dto.NotificationSettingsDto;
import com.lifeos.modules.notification.model.UserNotificationSettings;
import com.lifeos.modules.notification.repository.UserNotificationSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.time.ZoneId;

@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationSettingsService {

    private final UserNotificationSettingsRepository settingsRepository;
    private final TelegramService telegramService;
    private final org.springframework.data.redis.core.StringRedisTemplate redisTemplate;

    private static final ZoneId BRT = ZoneId.of("America/Sao_Paulo");

    public UserNotificationSettings getSettings(String userId) {
        if (userId == null || userId.isBlank()) {
            return UserNotificationSettings.defaultSettings("unknown");
        }
        return settingsRepository.findById(userId)
                .orElseGet(() -> UserNotificationSettings.defaultSettings(userId));
    }

    @Transactional
    public UserNotificationSettings updateSettings(String userId, NotificationSettingsDto dto) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("UserId obrigatório para atualizar configurações.");
        }

        UserNotificationSettings settings = settingsRepository.findById(userId)
                .orElseGet(() -> UserNotificationSettings.defaultSettings(userId));

        if (dto.getTelegramChatId() != null) {
            String chatId = dto.getTelegramChatId().trim();
            settings.setTelegramChatId(chatId.isEmpty() ? null : chatId);
        }

        if (dto.getTelegramEnabled() != null) settings.setTelegramEnabled(dto.getTelegramEnabled());
        if (dto.getMediaEnabled() != null) settings.setMediaEnabled(dto.getMediaEnabled());
        if (dto.getGamingEnabled() != null) settings.setGamingEnabled(dto.getGamingEnabled());
        if (dto.getTwitchEnabled() != null) settings.setTwitchEnabled(dto.getTwitchEnabled());
        if (dto.getF1Enabled() != null) settings.setF1Enabled(dto.getF1Enabled());
        if (dto.getSportsEnabled() != null) settings.setSportsEnabled(dto.getSportsEnabled());
        if (dto.getFinanceEnabled() != null) settings.setFinanceEnabled(dto.getFinanceEnabled());
        if (dto.getReadingEnabled() != null) settings.setReadingEnabled(dto.getReadingEnabled());
        if (dto.getWeatherEnabled() != null) settings.setWeatherEnabled(dto.getWeatherEnabled());

        if (dto.getMediaTime() != null && !dto.getMediaTime().isBlank()) settings.setMediaTime(dto.getMediaTime().trim());
        if (dto.getSportsMorningTime() != null && !dto.getSportsMorningTime().isBlank()) settings.setSportsMorningTime(dto.getSportsMorningTime().trim());
        if (dto.getF1BriefingTime() != null && !dto.getF1BriefingTime().isBlank()) settings.setF1BriefingTime(dto.getF1BriefingTime().trim());
        if (dto.getFinanceTime() != null && !dto.getFinanceTime().isBlank()) settings.setFinanceTime(dto.getFinanceTime().trim());
        if (dto.getReadingTime() != null && !dto.getReadingTime().isBlank()) settings.setReadingTime(dto.getReadingTime().trim());
        if (dto.getWeatherTime() != null && !dto.getWeatherTime().isBlank()) settings.setWeatherTime(dto.getWeatherTime().trim());

        if (dto.getQuietHoursEnabled() != null) settings.setQuietHoursEnabled(dto.getQuietHoursEnabled());
        if (dto.getQuietHoursStart() != null && !dto.getQuietHoursStart().isBlank()) settings.setQuietHoursStart(dto.getQuietHoursStart().trim());
        if (dto.getQuietHoursEnd() != null && !dto.getQuietHoursEnd().isBlank()) settings.setQuietHoursEnd(dto.getQuietHoursEnd().trim());

        clearDispatchLocks(userId);
        settings.setUserId(userId);
        return settingsRepository.save(settings);
    }

    private void clearDispatchLocks(String userId) {
        try {
            if (redisTemplate != null) {
                java.time.LocalDate today = java.time.LocalDate.now(BRT);
                String pattern = "dyn_dispatch:*:" + userId + ":" + today;
                java.util.Set<String> keys = redisTemplate.keys(pattern);
                if (keys != null && !keys.isEmpty()) {
                    redisTemplate.delete(keys);
                    log.info("Chaves de despacho resetadas para usuário {} para permitir novos testes imediatos.", userId);
                }
            }
        } catch (Exception e) {
            log.warn("Não foi possível limpar travas de despacho no Redis para usuário {}: {}", userId, e.getMessage());
        }
    }

    public boolean testTelegram(String userId, String chatId) {
        String targetChatId = (chatId != null && !chatId.isBlank())
                ? chatId.trim()
                : getEffectiveChatId(userId);

        if (targetChatId == null || targetChatId.isBlank()) {
            log.warn("Nenhum chatId disponível para teste de telegram do usuário: {}", userId);
            return false;
        }

        String testMessage = "🤖 <b>LifeOS — Teste de Notificação</b>\n\n"
                + "Seu Telegram está configurado corretamente e pronto para receber notificações!";

        return telegramService.sendTestMessage(targetChatId, testMessage);
    }

    public String getEffectiveChatId(String userId) {
        if (userId == null || userId.isBlank()) {
            return null;
        }
        return settingsRepository.findById(userId)
                .map(UserNotificationSettings::getTelegramChatId)
                .filter(c -> !c.isBlank())
                .orElse(null);
    }

    public boolean isNotificationAllowed(String userId, String type) {
        if (userId == null || userId.isBlank()) {
            return true;
        }

        UserNotificationSettings settings = getSettings(userId);

        if (!settings.isTelegramEnabled()) {
            log.debug("Notificações desabilitadas globalmente para o usuário {}", userId);
            return false;
        }

        if (type != null) {
            String normalizedType = type.trim().toUpperCase();
            boolean typeAllowed = switch (normalizedType) {
                case "F1" -> settings.isF1Enabled();
                case "FINANCE" -> settings.isFinanceEnabled();
                case "GAMING" -> settings.isGamingEnabled();
                case "TWITCH" -> settings.isTwitchEnabled();
                case "MEDIA" -> settings.isMediaEnabled();
                case "SPORTS" -> settings.isSportsEnabled();
                case "READING" -> settings.isReadingEnabled();
                case "WEATHER" -> settings.isWeatherEnabled();
                default -> true;
            };

            if (!typeAllowed) {
                log.debug("Notificação do tipo {} desabilitada nas configurações do usuário {}", normalizedType, userId);
                return false;
            }
        }

        if (isQuietHours(settings)) {
            log.info("Notificação bloqueada por horário de silêncio (quiet hours) para o usuário {}", userId);
            return false;
        }

        return true;
    }

    public boolean isQuietHours(UserNotificationSettings settings) {
        return isQuietHours(settings, LocalTime.now(BRT));
    }

    boolean isQuietHours(UserNotificationSettings settings, LocalTime now) {
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

            if (start.equals(end)) {
                return false;
            }

            if (start.isBefore(end)) {
                return !now.isBefore(start) && now.isBefore(end);
            } else {
                return !now.isBefore(start) || now.isBefore(end);
            }
        } catch (Exception e) {
            log.warn("Erro ao avaliar quiet hours (start={}, end={}): {}", startStr, endStr, e.getMessage());
            return false;
        }
    }
}
