package com.lifeos.modules.gaming.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifeos.modules.gaming.dto.CreateTrackedTwitchRequest;
import com.lifeos.modules.gaming.dto.TwitchStreamDTO;
import com.lifeos.modules.gaming.model.UserTrackedTwitchChannel;
import com.lifeos.modules.gaming.repository.UserTrackedTwitchChannelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Serviço de monitoramento de canais Twitch favoritos. CRUD dos canais que o
 * usuário quer acompanhar (UserTrackedTwitchChannel) mais a varredura periódica
 * de quem está ao vivo, disparada pelo TwitchNotificationScheduler.
 *
 * Para falar com a Helix API da Twitch precisa de um App Access Token (OAuth
 * client credentials), que é cacheado em memória no campo appAccessToken e
 * renovado on-demand quando expira (a Twitch retorna 401 e o serviço pega um
 * token novo automaticamente).
 *
 * Para evitar notificar o mesmo stream várias vezes no mesmo dia, usa duas
 * chaves Redis:
 * - twitch_live_user:{userId}:{channelName} guarda o estado "ao vivo" entre
 *   ciclos do scheduler para detectar a transição offline → online;
 * - twitch_notified_today:{userId}:{channelName}:{data} marca que já notificou
 *   hoje, com TTL de 24h, para não duplicar se o canal cair e voltar.
 */
@Service
@Slf4j
@RequiredArgsConstructor
@SuppressWarnings("null")
public class TwitchService {

    private final WebClient twitchAuthWebClient;
    private final WebClient twitchApiWebClient;
    private final ObjectMapper objectMapper;
    private final UserTrackedTwitchChannelRepository trackedTwitchRepository;
    private final StringRedisTemplate redisTemplate;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

    @Value("${twitch.client-id}")
    private String clientId;

    @Value("${twitch.client-secret}")
    private String clientSecret;

    private String appAccessToken = null;

    private final String REDIS_KEY_PREFIX = "twitch_live_user:";
    private final String REDIS_NOTIFIED_PREFIX = "twitch_notified_today:";
    private static final ZoneId SAO_PAULO_ZONE = ZoneId.of("America/Sao_Paulo");

    private void generateAccessToken() {
        log.info("Gerando novo token de acesso da Twitch...");
        try {
            String responseBody = twitchAuthWebClient.post()
                    .uri(uriBuilder -> uriBuilder.path("/token")
                            .queryParam("client_id", clientId)
                            .queryParam("client_secret", clientSecret)
                            .queryParam("grant_type", "client_credentials")
                            .build())
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode root = objectMapper.readTree(responseBody);
            this.appAccessToken = root.path("access_token").asText();
            log.info("Token da Twitch gerado com sucesso!");
        } catch (Exception e) {
            log.error("Erro ao gerar token da Twitch: {}", e.getMessage());
        }
    }

    public void fetchLiveChannelsFromTwitch() {
        if (appAccessToken == null) {
            generateAccessToken();
        }

        List<UserTrackedTwitchChannel> allTrackedChannels = trackedTwitchRepository.findAll();
        if (allTrackedChannels.isEmpty()) {
            return;
        }

        Set<String> uniqueChannelsToFetch = allTrackedChannels.stream()
                .map(UserTrackedTwitchChannel::getChannelName)
                .collect(Collectors.toSet());

        Map<String, TwitchStreamDTO> liveStreamsByChannelName = new HashMap<>();

        try {
            String responseBody = twitchApiWebClient.get()
                    .uri(uriBuilder -> {
                        uriBuilder.path("/streams");
                        for (String channel : uniqueChannelsToFetch) {
                            uriBuilder.queryParam("user_login", channel.trim());
                        }
                        return uriBuilder.build();
                    })
                    .header("Client-Id", clientId)
                    .header("Authorization", "Bearer " + appAccessToken)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode data = objectMapper.readTree(responseBody).path("data");

            if (data.isArray()) {
                for (JsonNode stream : data) {
                    String userName = stream.path("user_name").asText();
                    String userLogin = stream.path("user_login").asText();
                    String canonicalChannel = (userLogin != null && !userLogin.isBlank())
                            ? userLogin.trim().toLowerCase()
                            : userName.trim().toLowerCase();
                    String gameName = stream.path("game_name").asText();
                    String title = stream.path("title").asText();
                    String thumbUrl = stream.path("thumbnail_url").asText()
                            .replace("{width}", "320").replace("{height}", "180")
                            + "?v=" + System.currentTimeMillis();

                    TwitchStreamDTO streamInfo = new TwitchStreamDTO(
                            userName, gameName, title,
                            stream.path("viewer_count").asInt(),
                            stream.path("type").asText(),
                            thumbUrl);

                    liveStreamsByChannelName.put(canonicalChannel, streamInfo);

                    String today = LocalDate.now(SAO_PAULO_ZONE).toString();
                    String notifiedKey = REDIS_NOTIFIED_PREFIX + canonicalChannel + ":" + today;

                    Boolean acquired = redisTemplate.opsForValue().setIfAbsent(notifiedKey, "true", Duration.ofHours(24));
                    if (Boolean.TRUE.equals(acquired)) {
                        String messageText = String.format(
                                "🎮 <b>%s está Ao Vivo!</b>\n\n" +
                                "<b>Jogando:</b> %s\n" +
                                "<b>Título:</b> %s",
                                userName, gameName, title
                        );

                        String channelUrl = "https://twitch.tv/" + canonicalChannel;
                        eventPublisher.publishEvent(com.lifeos.shared.event.NotificationEvent.builder()
                                .type("TWITCH")
                                .message(messageText)
                                .buttonLabel("Assistir agora →")
                                .buttonPath(channelUrl)
                                .build());
                        log.info("Notificação enviada para {} e registrada no Anti-Spam (chave={})", userName, notifiedKey);
                    }
                }
            }

            Map<String, List<UserTrackedTwitchChannel>> channelsByUser = allTrackedChannels.stream()
                    .collect(Collectors.groupingBy(UserTrackedTwitchChannel::getUserId));

            for (Map.Entry<String, List<UserTrackedTwitchChannel>> entry : channelsByUser.entrySet()) {
                String userId = entry.getKey();
                List<TwitchStreamDTO> userLiveStreams = entry.getValue().stream()
                        .map(tracked -> liveStreamsByChannelName.get(tracked.getChannelName().toLowerCase().trim()))
                        .filter(Objects::nonNull)
                        .toList();
                try {
                    String json = objectMapper.writeValueAsString(userLiveStreams);
                    redisTemplate.opsForValue().set(REDIS_KEY_PREFIX + userId, json, Duration.ofMinutes(10));
                } catch (Exception e) {
                    log.error("Erro ao serializar cache", e);
                }
            }

        } catch (WebClientResponseException.Unauthorized e) {
            log.warn("Token Twitch expirado ou inválido. Será renovado no próximo ciclo de 5 min.");
            this.appAccessToken = null;
        } catch (Exception e) {
            log.error("Falha ao buscar canais na Twitch", e);
        }
    }

    public List<TwitchStreamDTO> getCachedLiveChannels(String userId) {
        try {
            String json = redisTemplate.opsForValue().get(REDIS_KEY_PREFIX + userId);
            if (json != null) {
                return objectMapper.readValue(json, new TypeReference<List<TwitchStreamDTO>>() {});
            }
        } catch (Exception e) {
            log.error("Erro ao ler cache do Redis para o usuário {}", userId, e);
        }
        return List.of();
    }

    public List<TwitchStreamDTO> getAllCachedLiveChannels() {
        List<TwitchStreamDTO> allLive = new ArrayList<>();
        Set<String> seen = new HashSet<>();

        try {
            Set<String> keys = redisTemplate.keys(REDIS_KEY_PREFIX + "*");
            if (keys != null) {
                for (String key : keys) {
                    String json = redisTemplate.opsForValue().get(key);
                    if (json != null) {
                        List<TwitchStreamDTO> userStreams = objectMapper.readValue(
                                json, new TypeReference<List<TwitchStreamDTO>>() {});
                        for (TwitchStreamDTO stream : userStreams) {
                            if (seen.add(stream.userName())) {
                                allLive.add(stream);
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Erro ao varrer caches globais da Twitch no Redis", e);
        }

        return allLive;
    }

    public List<UserTrackedTwitchChannel> getTrackedChannels(String userId) {
        return trackedTwitchRepository.findAllByUserIdOrderByChannelNameAsc(userId);
    }

    public UserTrackedTwitchChannel createTrackedChannel(String userId, CreateTrackedTwitchRequest request) {
        String cleanChannelName = request.channelName().trim().toLowerCase();

        if (trackedTwitchRepository.existsByUserIdAndChannelNameIgnoreCase(userId, cleanChannelName)) {
            throw new IllegalArgumentException("Você já está monitorando este canal.");
        }

        UserTrackedTwitchChannel saved = trackedTwitchRepository.save(
                UserTrackedTwitchChannel.builder().userId(userId).channelName(cleanChannelName).build());

        fetchLiveChannelsFromTwitch();
        return saved;
    }

    public void deleteTrackedChannel(String userId, String trackedChannelId) {
        UserTrackedTwitchChannel trackedChannel = trackedTwitchRepository.findByIdAndUserId(trackedChannelId, userId)
                .orElseThrow(() -> new NoSuchElementException("Canal não encontrado: " + trackedChannelId));
        trackedTwitchRepository.delete(trackedChannel);

        fetchLiveChannelsFromTwitch();
    }
}
