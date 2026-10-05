package com.lifeos.modules.notification.controller;

import com.lifeos.modules.notification.dto.TelegramUpdate;
import com.lifeos.modules.notification.service.BotCommandHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notifications/telegram")
@RequiredArgsConstructor
@Slf4j
public class TelegramWebhookController {

    private final BotCommandHandler botCommandHandler;

    @Value("${telegram.webhook.secret-token:}")
    private String expectedSecretToken;

    @PostMapping("/webhook")
    public ResponseEntity<Void> webhook(
            @RequestHeader(value = "X-Telegram-Bot-Api-Secret-Token", required = false) String secretToken,
            @RequestBody TelegramUpdate update) {

        if (expectedSecretToken != null && !expectedSecretToken.isBlank()) {
            if (secretToken == null || !expectedSecretToken.equals(secretToken)) {
                log.warn("Webhook recebido com secret token inválido");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
        }

        if (update.message() == null || update.message().text() == null) {
            return ResponseEntity.ok().build();
        }

        Long chatId = update.message().chat().id();
        String text = update.message().text();
        log.debug("Webhook recebido: chatId={} text={}", chatId, text);

        botCommandHandler.handle(text, chatId);
        return ResponseEntity.ok().build();
    }
}
