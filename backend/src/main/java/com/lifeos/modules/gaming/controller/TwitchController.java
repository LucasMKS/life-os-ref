package com.lifeos.modules.gaming.controller;

import com.lifeos.modules.gaming.dto.CreateTrackedTwitchRequest;
import com.lifeos.modules.gaming.dto.TwitchStreamDTO;
import com.lifeos.modules.gaming.model.UserTrackedTwitchChannel;
import com.lifeos.modules.gaming.service.TwitchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/gaming/twitch")
@RequiredArgsConstructor
public class TwitchController {

    private final TwitchService twitchService;

    @GetMapping("/live")
    public ResponseEntity<List<TwitchStreamDTO>> getLiveStreams(
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(twitchService.getCachedLiveChannels(userId));
    }

    @GetMapping("/preferences")
    public ResponseEntity<List<UserTrackedTwitchChannel>> getTrackedChannels(
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(twitchService.getTrackedChannels(userId));
    }

    @PostMapping("/preferences")
    public ResponseEntity<UserTrackedTwitchChannel> addTrackedChannel(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody CreateTrackedTwitchRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(twitchService.createTrackedChannel(userId, request));
    }

    @DeleteMapping("/preferences/{id}")
    public ResponseEntity<Void> deleteTrackedChannel(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable String id) {
        twitchService.deleteTrackedChannel(userId, id);
        return ResponseEntity.noContent().build();
    }
}
