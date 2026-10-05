package com.lifeos.modules.gaming.service;

import com.lifeos.modules.gaming.dto.SteamOwnedGamesResponse;
import com.lifeos.modules.gaming.dto.SteamPlayerSummaryResponse;
import com.lifeos.modules.gaming.model.*;
import com.lifeos.modules.gaming.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

/**
 * Serviço do "Game Journal" e da fila de jogos a jogar. Faz a ligação entre o
 * perfil Steam do usuário (SteamProfile) e os jogos que ele decidiu acompanhar
 * (TrackedGame), com status (PLAYING, PLAYED, DROPPED, etc), nota, comentários
 * gerais e prioridade na queue de "to-play".
 *
 * O linkSteamAccount cria/atualiza o perfil do usuário usando o steamId que
 * ele cadastrou, puxando nome e avatar pela Web API da Steam. A partir daí,
 * o user pode adicionar jogos individuais ao journal usando o appId do Steam
 * — cada combinação (userId, appId) é única (constraint no banco).
 *
 * Não tem nada de notificação aqui — esse serviço só responde a requisições
 * REST. As notificações de novidades nos jogos rastreados são geradas pelo
 * GamingNotificationScheduler (varredura periódica do GameNews).
 */
@Service
@RequiredArgsConstructor
public class GamingService {

    private final SteamApiService steamApiService;
    private final SteamProfileRepository steamProfileRepository;
    private final TrackedGameRepository trackedGameRepository;
    private final GameJournalNoteRepository gameJournalNoteRepository;

    @Transactional
    public SteamProfile linkSteamAccount(String userId, String steamId) {
        SteamPlayerSummaryResponse.Player summary = steamApiService.getPlayerSummary(steamId).block();
        
        SteamProfile profile = steamProfileRepository.findByUserId(userId)
                .orElse(new SteamProfile());
        
        profile.setUserId(userId);
        profile.setSteamId(steamId);
        profile.setPersonaName(summary.getPersonaname());
        profile.setProfileUrl(summary.getProfileurl());
        profile.setAvatarUrl(summary.getAvatarfull());
        
        return steamProfileRepository.save(profile);
    }

    public Optional<SteamProfile> getSteamProfile(String userId) {
        return steamProfileRepository.findByUserId(userId);
    }

    public SteamPlayerSummaryResponse.Player getCurrentStatus(String userId) {
        SteamProfile profile = steamProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Steam account not linked"));
        return steamApiService.getPlayerSummary(profile.getSteamId()).block();
    }

    public SteamOwnedGamesResponse getLibrary(String userId) {
        SteamProfile profile = steamProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Steam account not linked"));
        
        SteamOwnedGamesResponse response = steamApiService.getOwnedGames(profile.getSteamId()).block();
        
        // Overlay local status if available
        // We could enrich the response here or let the frontend do the join
        return response;
    }

    @Transactional
    public TrackedGame updateTrackedGame(String userId, Long appId, String name, GameStatus status, Integer rating, String comments) {
        TrackedGame trackedGame = trackedGameRepository.findByUserIdAndAppId(userId, appId)
                .orElse(TrackedGame.builder()
                        .userId(userId)
                        .appId(appId)
                        .name(name)
                        .build());
        
        if (status != null) trackedGame.setStatus(status);
        if (rating != null) trackedGame.setRating(rating);
        if (comments != null) trackedGame.setGeneralComments(comments);
        
        return trackedGameRepository.save(trackedGame);
    }

    @Transactional
    public GameJournalNote addJournalNote(String trackedGameId, String content) {
        GameJournalNote note = GameJournalNote.builder()
                .trackedGameId(trackedGameId)
                .content(content)
                .build();
        return gameJournalNoteRepository.save(note);
    }

    public List<TrackedGame> getTrackedGames(String userId) {
        return trackedGameRepository.findByUserId(userId);
    }

    @Transactional
    public void deleteTrackedGame(String userId, Long appId) {
        trackedGameRepository.findByUserIdAndAppId(userId, appId)
                .ifPresent(trackedGameRepository::delete);
    }

    public List<GameJournalNote> getJournalNotes(String trackedGameId) {
        return gameJournalNoteRepository.findByTrackedGameIdOrderByCreatedAtDesc(trackedGameId);
    }

    @Transactional
    public TrackedGame updateQueuePriority(String userId, Long appId, Integer priority) {
        TrackedGame trackedGame = trackedGameRepository.findByUserIdAndAppId(userId, appId)
                .orElseThrow(() -> new RuntimeException("Game not tracked"));
        trackedGame.setQueuePriority(priority);
        return trackedGameRepository.save(trackedGame);
    }
    
    public List<TrackedGame> getQueue(String userId) {
        return trackedGameRepository.findByUserIdAndQueuePriorityIsNotNullOrderByQueuePriorityAsc(userId);
    }

    public List<SteamOwnedGamesResponse.Game> getRecommendations(String userId) {
        SteamProfile profile = steamProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Steam account not linked"));
        
        SteamOwnedGamesResponse library = steamApiService.getOwnedGames(profile.getSteamId()).block();
        if (library == null || library.getResponse() == null || library.getResponse().getGames() == null) {
            return List.of();
        }

        List<TrackedGame> trackedGames = trackedGameRepository.findByUserId(userId);
        
        // Games to exclude: COMPLETED, ABANDONED, or currently PLAYING
        List<Long> excludeAppIds = trackedGames.stream()
                .filter(g -> g.getStatus() == GameStatus.COMPLETED || g.getStatus() == GameStatus.ABANDONED || g.getStatus() == GameStatus.PLAYING)
                .map(TrackedGame::getAppId)
                .toList();

        return library.getResponse().getGames().stream()
                .filter(g -> !excludeAppIds.contains(g.getAppid()))
                .sorted((g1, g2) -> {
                    // Sort by: Started (playtime > 0) first, then by total playtime
                    if (g1.getPlaytimeForever() > 0 && g2.getPlaytimeForever() == 0) return -1;
                    if (g1.getPlaytimeForever() == 0 && g2.getPlaytimeForever() > 0) return 1;
                    return g2.getPlaytimeForever().compareTo(g1.getPlaytimeForever());
                })
                .limit(5)
                .toList();
    }
}
