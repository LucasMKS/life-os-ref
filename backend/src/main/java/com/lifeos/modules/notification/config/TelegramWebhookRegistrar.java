package com.lifeos.modules.notification.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Component
@Slf4j
@RequiredArgsConstructor
public class TelegramWebhookRegistrar {

    private final WebClient telegramWebClient;

    @Value("${telegram.webhook.url:}")
    private String webhookUrl;

    @Value("${telegram.webhook.secret-token:}")
    private String secretToken;

    @PostConstruct
    public void registerWebhook() {
        if (webhookUrl == null || webhookUrl.isBlank()) {
            log.info("TELEGRAM_WEBHOOK_URL não configurado. Pulo do registro de webhook.");
            return;
        }

        try {
            Map<String, Object> body = secretToken != null && !secretToken.isBlank()
                    ? Map.of("url", webhookUrl, "secret_token", secretToken)
                    : Map.of("url", webhookUrl);

            telegramWebClient.post()
                    .uri("/setWebhook")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .doOnSuccess(resp -> log.info("Telegram webhook registrado com sucesso: {}", resp))
                    .doOnError(err -> log.warn("Falha ao registrar webhook do Telegram: {}", err.getMessage()))
                    .subscribe();
        } catch (Exception e) {
            log.warn("Erro ao registrar webhook do Telegram: {}", e.getMessage());
        }
    }
}
