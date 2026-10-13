package com.lifeos.modules.gaming.client;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.*;

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
                    .uri("/api/v0/about")
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            if (response != null) {
                Map<String, Object> result = objectMapper.readValue(response, new TypeReference<Map<String, Object>>() {});
                result.put("online", true);
                return result;
            }
        } catch (Exception e) {
            log.warn("TwitchAutomator não respondeu ao status (/api/v0/about): {}", e.getMessage());
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
                JsonNode root = objectMapper.readTree(response);
                JsonNode data = root.path("data");
                JsonNode streamerList = data.has("streamer_list") ? data.path("streamer_list") : data;
                if (streamerList.isArray()) {
                    return objectMapper.convertValue(streamerList, new TypeReference<List<Map<String, Object>>>() {});
                }
            }
        } catch (Exception e) {
            log.warn("Erro ao buscar canais do TwitchAutomator: {}", e.getMessage());
        }
        return List.of();
    }

    public boolean addChannel(String login, String quality) {
        String cleanLogin = login.toLowerCase().trim();
        try {
            String q = (quality != null && !quality.isBlank()) ? quality : "720p60";

            Map<String, Object> payload = new HashMap<>();
            payload.put("provider", "twitch");
            payload.put("internalName", cleanLogin);
            payload.put("quality", List.of(q, "best"));
            payload.put("match", List.of());
            payload.put("download_chat", false);
            payload.put("burn_chat", false);
            payload.put("no_capture", false);
            payload.put("live_chat", false);
            payload.put("no_cleanup", false);
            payload.put("max_storage", 0);
            payload.put("max_vods", 0);
            payload.put("download_vod_at_end", false);
            payload.put("download_vod_at_end_quality", "best");

            webClient.post()
                    .uri("/api/v0/channels")
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            log.info("Canal {} cadastrado com sucesso no TwitchAutomator (qualidade={})", cleanLogin, q);
            return true;
        } catch (WebClientResponseException e) {
            log.error("Erro na API do TwitchAutomator ao cadastrar canal {}: Status {} - Resposta: {}",
                    cleanLogin, e.getStatusCode(), e.getResponseBodyAsString());
            return false;
        } catch (Exception e) {
            log.error("Erro inesperado ao cadastrar canal {} no TwitchAutomator: {}", cleanLogin, e.getMessage());
            return false;
        }
    }

    public boolean deleteChannel(String login) {
        String cleanLogin = login.toLowerCase().trim();
        try {
            // LiveStreamDVR usa /api/v0/channels/:uuid para exclusão
            List<Map<String, Object>> channels = getChannels();
            String uuidToDelete = null;

            for (Map<String, Object> ch : channels) {
                String chName = String.valueOf(ch.getOrDefault("internalName", ch.getOrDefault("login", ""))).toLowerCase().trim();
                if (cleanLogin.equalsIgnoreCase(chName)) {
                    uuidToDelete = String.valueOf(ch.get("uuid"));
                    break;
                }
            }

            String target = (uuidToDelete != null && !uuidToDelete.isBlank()) ? uuidToDelete : cleanLogin;

            webClient.delete()
                    .uri("/api/v0/channels/{uuid}", target)
                    .retrieve()
                    .bodyToMono(Void.class)
                    .block();

            log.info("Canal {} (uuid={}) removido do TwitchAutomator", cleanLogin, target);
            return true;
        } catch (WebClientResponseException e) {
            log.warn("Erro ao remover canal {} do TwitchAutomator: Status {} - Resposta: {}",
                    cleanLogin, e.getStatusCode(), e.getResponseBodyAsString());
            return false;
        } catch (Exception e) {
            log.error("Erro inesperado ao remover canal {} do TwitchAutomator: {}", cleanLogin, e.getMessage());
            return false;
        }
    }

    public List<Map<String, Object>> getVods() {
        try {
            // No LiveStreamDVR os VODs ficam agregados dentro de cada streamer em /api/v0/channels
            List<Map<String, Object>> channels = getChannels();
            List<Map<String, Object>> allVods = new ArrayList<>();

            for (Map<String, Object> ch : channels) {
                Object vodsObj = ch.get("vods_list");
                String streamerName = String.valueOf(ch.getOrDefault("displayName", ch.getOrDefault("internalName", "")));

                if (vodsObj instanceof List<?> vodList) {
                    for (Object v : vodList) {
                        if (v instanceof Map<?, ?> vodMap) {
                            Map<String, Object> normalized = new HashMap<>();
                            vodMap.forEach((k, val) -> normalized.put(String.valueOf(k), val));
                            normalized.putIfAbsent("channel_name", streamerName);
                            allVods.add(normalized);
                        }
                    }
                }
            }

            return allVods;
        } catch (Exception e) {
            log.warn("Erro ao processar VODs do TwitchAutomator: {}", e.getMessage());
        }
        return List.of();
    }
}
