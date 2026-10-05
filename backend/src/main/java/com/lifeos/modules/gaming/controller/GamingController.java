package com.lifeos.modules.gaming.controller;

import com.lifeos.modules.gaming.dto.CreateTrackedGameRequest;
import com.lifeos.modules.gaming.dto.SteamAppSearchResult;
import com.lifeos.modules.gaming.model.GameNews;
import com.lifeos.modules.gaming.model.UserTrackedGame;
import com.lifeos.modules.gaming.service.GamingNewsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/gaming")
@RequiredArgsConstructor
public class GamingController {

    private final GamingNewsService gamingNewsService;

    @GetMapping("/news")
    public ResponseEntity<List<GameNews>> getLatestNews(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(gamingNewsService.getLatestNews(userId));
    }

    @GetMapping("/preferences")
    public ResponseEntity<List<UserTrackedGame>> getTrackedGames(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(gamingNewsService.getTrackedGames(userId));
    }

    @GetMapping("/steam/search")
    public ResponseEntity<List<SteamAppSearchResult>> searchSteamApps(@RequestParam("query") String query) {
        return ResponseEntity.ok(gamingNewsService.searchSteamApps(query));
    }

    @PostMapping("/preferences")
    public ResponseEntity<UserTrackedGame> addTrackedGame(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @Valid @RequestBody CreateTrackedGameRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(gamingNewsService.createTrackedGame(userId, request));
    }

    @DeleteMapping("/preferences/{trackedGameId}")
    public ResponseEntity<Void> removeTrackedGame(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String trackedGameId) {
        gamingNewsService.deleteTrackedGame(userId, trackedGameId);
        return ResponseEntity.noContent().build();
    }
}
