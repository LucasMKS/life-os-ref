package com.lifeos.modules.gaming.controller;

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
            @RequestHeader("X-User-Id") String userId,
            @RequestParam String steamId) {
        return ResponseEntity.ok(gamingService.linkSteamAccount(userId, steamId));
    }

    @GetMapping("/steam/profile")
    public ResponseEntity<SteamProfile> getProfile(@RequestHeader("X-User-Id") String userId) {
        return gamingService.getSteamProfile(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/steam/status")
    public ResponseEntity<SteamPlayerSummaryResponse.Player> getStatus(@RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(gamingService.getCurrentStatus(userId));
    }

    @GetMapping("/steam/library")
    public ResponseEntity<SteamOwnedGamesResponse> getLibrary(@RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(gamingService.getLibrary(userId));
    }

    @GetMapping("/steam/recommendations")
    public ResponseEntity<List<SteamOwnedGamesResponse.Game>> getRecommendations(@RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(gamingService.getRecommendations(userId));
    }

    @PostMapping("/journal")
    public ResponseEntity<TrackedGame> updateTrackedGame(
            @RequestHeader("X-User-Id") String userId,
            @RequestBody UpdateTrackedGameRequest request) {
        return ResponseEntity.ok(gamingService.updateTrackedGame(
                userId, request.getAppId(), request.getName(), request.getStatus(), request.getRating(), request.getGeneralComments()));
    }

    @GetMapping("/journal")
    public ResponseEntity<List<TrackedGame>> getTrackedGames(@RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(gamingService.getTrackedGames(userId));
    }

    @DeleteMapping("/journal/{appId}")
    public ResponseEntity<Void> deleteTrackedGame(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable Long appId) {
        gamingService.deleteTrackedGame(userId, appId);
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
            @RequestHeader("X-User-Id") String userId,
            @PathVariable Long appId,
            @RequestParam Integer priority) {
        return ResponseEntity.ok(gamingService.updateQueuePriority(userId, appId, priority));
    }

    @GetMapping("/queue")
    public ResponseEntity<List<TrackedGame>> getQueue(@RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(gamingService.getQueue(userId));
    }
}
