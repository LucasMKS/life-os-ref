package com.lifeos.modules.gaming.controller;

import com.lifeos.core.security.UserContext;
import com.lifeos.modules.gaming.dto.SteamOwnedGamesResponse;
import com.lifeos.modules.gaming.dto.SteamPlayerSummaryResponse;
import com.lifeos.modules.gaming.dto.UpdateTrackedGameRequest;
import com.lifeos.modules.gaming.model.*;
import com.lifeos.modules.gaming.service.GamingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/gaming")
@RequiredArgsConstructor
public class SteamGamingController {

    private final GamingService gamingService;

    @PostMapping("/steam/link")
    public ResponseEntity<SteamProfile> linkAccount(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestParam String steamId) {
        return ResponseEntity.ok(gamingService.linkSteamAccount(UserContext.resolveUserId(userId), steamId));
    }

    @GetMapping("/steam/profile")
    public ResponseEntity<SteamProfile> getProfile(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        return gamingService.getSteamProfile(UserContext.resolveUserId(userId))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/steam/status")
    public ResponseEntity<SteamPlayerSummaryResponse.Player> getStatus(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(gamingService.getCurrentStatus(UserContext.resolveUserId(userId)));
    }

    @GetMapping("/steam/library")
    public ResponseEntity<SteamOwnedGamesResponse> getLibrary(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(gamingService.getLibrary(UserContext.resolveUserId(userId)));
    }

    @GetMapping("/steam/recommendations")
    public ResponseEntity<List<SteamOwnedGamesResponse.Game>> getRecommendations(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(gamingService.getRecommendations(UserContext.resolveUserId(userId)));
    }

    @PostMapping("/journal")
    public ResponseEntity<TrackedGame> updateTrackedGame(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody UpdateTrackedGameRequest request) {
        return ResponseEntity.ok(gamingService.updateTrackedGame(
                UserContext.resolveUserId(userId), request.getAppId(), request.getName(), request.getStatus(), request.getRating(), request.getGeneralComments()));
    }

    @GetMapping("/journal")
    public ResponseEntity<List<TrackedGame>> getTrackedGames(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(gamingService.getTrackedGames(UserContext.resolveUserId(userId)));
    }

    @DeleteMapping("/journal/{appId}")
    public ResponseEntity<Void> deleteTrackedGame(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable Long appId) {
        gamingService.deleteTrackedGame(UserContext.resolveUserId(userId), appId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/journal/{trackedGameId}/notes")
    public ResponseEntity<GameJournalNote> addNote(
            @PathVariable String trackedGameId,
            @RequestBody String content) {
        return ResponseEntity.ok(gamingService.addJournalNote(trackedGameId, content));
    }

    @GetMapping("/journal/{trackedGameId}/notes")
    public ResponseEntity<List<GameJournalNote>> getNotes(@PathVariable String trackedGameId) {
        return ResponseEntity.ok(gamingService.getJournalNotes(trackedGameId));
    }

    @PutMapping("/queue/{appId}")
    public ResponseEntity<TrackedGame> updateQueue(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable Long appId,
            @RequestParam Integer priority) {
        return ResponseEntity.ok(gamingService.updateQueuePriority(UserContext.resolveUserId(userId), appId, priority));
    }

    @GetMapping("/queue")
    public ResponseEntity<List<TrackedGame>> getQueue(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(gamingService.getQueue(UserContext.resolveUserId(userId)));
    }
}
