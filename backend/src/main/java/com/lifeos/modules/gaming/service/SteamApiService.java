package com.lifeos.modules.gaming.service;

import com.lifeos.modules.gaming.dto.SteamOwnedGamesResponse;
import com.lifeos.modules.gaming.dto.SteamPlayerSummaryResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

/**
 * Cliente fino sobre a Web API da Steam. Tem só dois endpoints usados aqui:
 * GetPlayerSummaries para puxar nome/avatar/url do perfil pelo steamId, e
 * GetOwnedGames para listar todos os jogos com tempo jogado total e nas
 * últimas 2 semanas. A apiKey vem da env STEAM_API_KEY.
 *
 * Quem consome: GamingService.linkSteamAccount (puxa o perfil quando o
 * usuário conecta a conta), o getOwnedGames é usado pelo PlaytimeSchedulerService
 * que roda à meia-noite e calcula o quanto o usuário jogou no dia.
 */
@Service
public class SteamApiService {

    private final WebClient webClient;
    private final String apiKey;

    public SteamApiService(@Qualifier("steamWebClient") WebClient webClient, @Value("${steam.api.key}") String apiKey) {
        this.webClient = webClient;
        this.apiKey = apiKey;
    }

    public Mono<SteamPlayerSummaryResponse.Player> getPlayerSummary(String steamId) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/ISteamUser/GetPlayerSummaries/v0002/")
                        .queryParam("key", apiKey)
                        .queryParam("steamids", steamId)
                        .build())
                .retrieve()
                .bodyToMono(SteamPlayerSummaryResponse.class)
                .map(response -> response.getResponse().getPlayers().get(0));
    }

    public Mono<SteamOwnedGamesResponse> getOwnedGames(String steamId) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/IPlayerService/GetOwnedGames/v0001/")
                        .queryParam("key", apiKey)
                        .queryParam("steamid", steamId)
                        .queryParam("include_appinfo", 1)
                        .queryParam("include_played_free_games", 1)
                        .queryParam("format", "json")
                        .build())
                .retrieve()
                .bodyToMono(SteamOwnedGamesResponse.class);
    }
}
