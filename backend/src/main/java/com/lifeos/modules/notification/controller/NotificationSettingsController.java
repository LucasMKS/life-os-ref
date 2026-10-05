package com.lifeos.modules.notification.controller;

import com.lifeos.core.security.UserContext;
import com.lifeos.modules.notification.dto.NotificationSettingsDto;
import com.lifeos.modules.notification.model.UserNotificationSettings;
import com.lifeos.modules.notification.service.NotificationSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications/settings")
@RequiredArgsConstructor
public class NotificationSettingsController {

    private final NotificationSettingsService settingsService;

    private String resolveUserId(String headerUserId) {
        if (headerUserId != null && !headerUserId.isBlank()) {
            return headerUserId;
        }
        String contextUser = UserContext.getUserId();
        return (contextUser != null && !contextUser.isBlank()) ? contextUser : "unknown";
    }

    @GetMapping
    public ResponseEntity<NotificationSettingsDto> getSettings(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        UserNotificationSettings settings = settingsService.getSettings(resolveUserId(userId));
        return ResponseEntity.ok(NotificationSettingsDto.from(settings));
    }

    @PutMapping
    public ResponseEntity<NotificationSettingsDto> updateSettings(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody NotificationSettingsDto dto) {
        UserNotificationSettings updated = settingsService.updateSettings(resolveUserId(userId), dto);
        return ResponseEntity.ok(NotificationSettingsDto.from(updated));
    }

    @PostMapping("/test-telegram")
    public ResponseEntity<Map<String, Object>> testTelegram(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody(required = false) Map<String, String> body) {
        String effectiveUserId = resolveUserId(userId);
        String chatId = (body != null) ? body.get("chatId") : null;
        boolean success = settingsService.testTelegram(effectiveUserId, chatId);

        if (success) {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Mensagem de teste enviada com sucesso para o Telegram!"
            ));
        } else {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Falha ao enviar mensagem de teste. Verifique se o Chat ID é válido e se você já iniciou conversa com o bot (/start)."
            ));
        }
    }
}
