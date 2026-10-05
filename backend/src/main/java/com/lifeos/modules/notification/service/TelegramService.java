package com.lifeos.modules.notification.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
@RequiredArgsConstructor
public class TelegramService {

    private final WebClient telegramWebClient;
    private final ObjectMapper objectMapper;

    @Value("${telegram.bot.chat-id:}")
    private String chatId;

    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);

    public void sendMessage(String message) {
        sendMessageToChat(null, message);
    }

    public void sendMessage(String message, String buttonLabel, String buttonUrl) {
        sendMessageToChat(null, message, buttonLabel, buttonUrl);
    }

    public void sendMessageToChat(String targetChatId, String message) {
        sendMessageToChat(targetChatId, message, null, null);
    }

    public void sendMessageToChat(String targetChatId, String message, String buttonLabel, String buttonUrl) {
        String resolvedChatId = (targetChatId != null && !targetChatId.isBlank()) ? targetChatId.trim() : chatId;
        if (resolvedChatId == null || resolvedChatId.isBlank()) {
            log.warn("Nenhum chatId configurado para envio de mensagem Telegram.");
            return;
        }

        Map<String, Object> body = new HashMap<>();
        body.put("chat_id", resolvedChatId);
        body.put("text", message);
        body.put("parse_mode", "HTML");
        body.put("disable_web_page_preview", true);

        if (buttonLabel != null && !buttonLabel.isBlank() && buttonUrl != null && !buttonUrl.isBlank()) {
            List<List<Map<String, String>>> keyboard = List.of(
                    List.of(Map.of("text", buttonLabel, "url", buttonUrl))
            );
            body.put("reply_markup", Map.of("inline_keyboard", keyboard));
        }

        Integer msgId = postMessage(body);
        if (msgId != null) {
            try {
                scheduleDelete(Long.parseLong(resolvedChatId), msgId, 24, TimeUnit.HOURS);
            } catch (Exception e) {
                log.warn("Não foi possível agendar deleção para chatId {}: {}", resolvedChatId, e.getMessage());
            }
        }
    }

    public boolean sendTestMessage(String targetChatId, String message) {
        String resolvedChatId = (targetChatId != null && !targetChatId.isBlank()) ? targetChatId.trim() : chatId;
        if (resolvedChatId == null || resolvedChatId.isBlank()) {
            log.warn("Nenhum chatId configurado para teste de envio Telegram.");
            return false;
        }

        Map<String, Object> body = Map.of(
                "chat_id", resolvedChatId,
                "text", message,
                "parse_mode", "HTML",
                "disable_web_page_preview", true
        );

        Integer msgId = postMessage(body);
        if (msgId != null) {
            try {
                scheduleDelete(Long.parseLong(resolvedChatId), msgId, 1, TimeUnit.HOURS);
            } catch (Exception ignored) {}
            return true;
        }
        return false;
    }

    public void sendMessageWithButton(Long targetChatId, String text, String label, String url) {
        List<List<Map<String, String>>> keyboard = List.of(
                List.of(Map.of("text", label, "url", url))
        );
        Map<String, Object> body = Map.of(
                "chat_id", targetChatId,
                "text", text,
                "parse_mode", "HTML",
                "disable_web_page_preview", true,
                "reply_markup", Map.of("inline_keyboard", keyboard)
        );
        Integer msgId = postMessage(body);
        if (msgId != null) scheduleDelete(targetChatId, msgId, 1, TimeUnit.HOURS);
    }

    public void sendMessageWithButtons(Long targetChatId, String text, String[] labels, String[] urls) {
        List<Map<String, String>> row = new ArrayList<>();
        for (int i = 0; i < labels.length; i++) {
            Map<String, String> btn = new HashMap<>();
            btn.put("text", labels[i]);
            btn.put("url", urls[i]);
            row.add(btn);
        }
        Map<String, Object> body = Map.of(
                "chat_id", targetChatId,
                "text", text,
                "parse_mode", "HTML",
                "disable_web_page_preview", true,
                "reply_markup", Map.of("inline_keyboard", List.of(row))
        );
        Integer msgId = postMessage(body);
        if (msgId != null) scheduleDelete(targetChatId, msgId, 1, TimeUnit.HOURS);
    }

    private Integer postMessage(Map<String, Object> body) {
        try {
            String response = telegramWebClient.post()
                    .uri("/sendMessage")
                    .bodyValue(body)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, r ->
                            r.bodyToMono(String.class).flatMap(err ->
                                    Mono.error(new IllegalStateException("Telegram API error: " + err))))
                    .bodyToMono(String.class)
                    .doOnSuccess(r -> log.info("Mensagem enviada com sucesso para o Telegram."))
                    .doOnError(e -> log.error("Erro ao enviar mensagem para o Telegram: {}", e.getMessage(), e))
                    .block();

            if (response != null) {
                JsonNode root = objectMapper.readTree(response);
                int msgId = root.path("result").path("message_id").asInt(0);
                if (msgId != 0) return msgId;
            }
        } catch (Exception e) {
            log.error("Erro ao enviar/parsear resposta do Telegram: {}", e.getMessage());
        }
        return null;
    }

    private void scheduleDelete(Long targetChatId, Integer messageId, long delay, TimeUnit unit) {
        scheduler.schedule(() -> deleteMessage(targetChatId, messageId), delay, unit);
        log.debug("Mensagem {} agendada para deleção em {} {}.", messageId, delay, unit);
    }

    private void deleteMessage(Long targetChatId, Integer messageId) {
        try {
            telegramWebClient.post()
                    .uri("/deleteMessage")
                    .bodyValue(Map.of("chat_id", targetChatId, "message_id", messageId))
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, r ->
                            r.bodyToMono(String.class).flatMap(err ->
                                    Mono.error(new IllegalStateException("Telegram deleteMessage error: " + err))))
                    .bodyToMono(String.class)
                    .doOnSuccess(r -> log.info("Mensagem {} deletada do Telegram.", messageId))
                    .doOnError(e -> log.warn("Falha ao deletar mensagem {}: {}", messageId, e.getMessage()))
                    .block();
        } catch (Exception e) {
            log.warn("Exceção ao deletar mensagem {}: {}", messageId, e.getMessage());
        }
    }
}
