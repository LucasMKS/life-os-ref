package com.lifeos.modules.gaming.client;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class TwitchAutomatorClient {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public TwitchAutomatorClient(@Qualifier("twitchAutomatorWebClient") WebClient webClient, ObjectMapper objectMapper) {
        this.webClient = webClient;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> getStatus() {
        try {
            String response = webClient.get()
                    .uri("/api/v0/status")
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            if (response != null) {
                return objectMapper.readValue(response, new TypeReference<Map<String, Object>>() {});
            }
        } catch (Exception e) {
            log.warn("TwitchAutomator não respondeu ao status: {}", e.getMessage());
        }
        return Map.of("online", false, "message", "Gravador offline ou indisponível");
    }

    public List<Map<String, Object>> getChannels() {
        try {
            String response = webClient.get()
                    .uri("/api/v0/channels")
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            if (response != null) {
                JsonNode node = objectMapper.readTree(response);
                if (node.has("data") && node.get("data").isArray()) {
                    return objectMapper.convertValue(node.get("data"), new TypeReference<List<Map<String, Object>>>() {});
                }
            }
        } catch (Exception e) {
            log.warn("Erro ao buscar canais do TwitchAutomator: {}", e.getMessage());
        }
        return List.of();
    }

    public boolean addChannel(String login, String quality) {
        try {
            String q = (quality != null && !quality.isBlank()) ? quality : "720p60";
            Map<String, Object> payload = Map.of(
                    "login", login.toLowerCase().trim(),
                    "quality", List.of(q, "best")
            );
            webClient.post()
                    .uri("/api/v0/channels")
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            log.info("Canal {} cadastrado para gravação no TwitchAutomator com qualidade {}", login, q);
            return true;
        } catch (Exception e) {
            log.error("Erro ao cadastrar canal {} no TwitchAutomator: {}", login, e.getMessage());
            return false;
        }
    }

    public boolean deleteChannel(String login) {
        try {
            webClient.delete()
                    .uri("/api/v0/channels/{login}", login.toLowerCase().trim())
                    .retrieve()
                    .bodyToMono(Void.class)
                    .block();
            log.info("Canal {} removido do TwitchAutomator", login);
            return true;
        } catch (Exception e) {
            log.error("Erro ao remover canal {} do TwitchAutomator: {}", login, e.getMessage());
            return false;
        }
    }

    public List<Map<String, Object>> getVods() {
        try {
            String response = webClient.get()
                    .uri("/api/v0/vods")
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            if (response != null) {
                JsonNode node = objectMapper.readTree(response);
                if (node.has("data") && node.get("data").isArray()) {
                    return objectMapper.convertValue(node.get("data"), new TypeReference<List<Map<String, Object>>>() {});
                }
            }
        } catch (Exception e) {
            log.warn("Erro ao buscar VODs do TwitchAutomator: {}", e.getMessage());
        }
        return List.of();
    }
}
