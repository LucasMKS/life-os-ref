package com.lifeos.modules.media.controller;

import com.lifeos.modules.media.dto.MediaOverviewDTO;
import com.lifeos.modules.media.dto.ReleaseRadarDTO;
import com.lifeos.modules.media.dto.WeeklyCalendarDayDTO;
import com.lifeos.modules.media.dto.SerieWatchStatusDTO;
import com.lifeos.modules.media.service.ReleaseRadarService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/gaming/radar", "/api/v1/media/radar", "/api/v1/media"})
@RequiredArgsConstructor
public class ReleaseRadarController {

    private final ReleaseRadarService radarService;

    @GetMapping("/upcoming")
    public ResponseEntity<List<ReleaseRadarDTO>> getUpcomingReleases(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        String safeUserId = (userId != null) ? userId : "default";
        return ResponseEntity.ok(radarService.getUpcomingReleases(safeUserId, authHeader));
    }

    @GetMapping("/weekly")
    public ResponseEntity<List<WeeklyCalendarDayDTO>> getWeeklyCalendar(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        String safeUserId = (userId != null) ? userId : "default";
        return ResponseEntity.ok(radarService.getWeeklyCalendar(safeUserId, authHeader));
    }

    @GetMapping("/overview")
    public ResponseEntity<MediaOverviewDTO> getMediaOverview(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        String safeUserId = (userId != null) ? userId : "default";
        return ResponseEntity.ok(radarService.getMediaOverview(safeUserId, authHeader));
    }

    @GetMapping("/episodes/to-watch")
    public ResponseEntity<List<SerieWatchStatusDTO>> getEpisodesToWatch(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String safeUserId = (userId != null) ? userId : "default";
        return ResponseEntity.ok(radarService.getEpisodesToWatch(safeUserId, authHeader));
    }

    @PostMapping("/episodes/watch")
    public ResponseEntity<Void> watchEpisode(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestParam String serieId,
            @RequestParam Integer seasonNumber,
            @RequestParam Integer episodeNumber,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String safeUserId = (userId != null) ? userId : "default";
        radarService.markEpisodeAsWatched(safeUserId, serieId, seasonNumber, episodeNumber, authHeader);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/episodes/unwatch")
    public ResponseEntity<Void> unwatchEpisode(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestParam String serieId,
            @RequestParam Integer seasonNumber,
            @RequestParam Integer episodeNumber,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String safeUserId = (userId != null) ? userId : "default";
        radarService.markEpisodeAsUnwatched(safeUserId, serieId, seasonNumber, episodeNumber, authHeader);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/episodes/watch-all-up-to")
    public ResponseEntity<Void> watchAllUpTo(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestParam String serieId,
            @RequestParam Integer seasonNumber,
            @RequestParam Integer episodeNumber,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String safeUserId = (userId != null) ? userId : "default";
        radarService.markAllEpisodesAsWatchedUpTo(safeUserId, serieId, seasonNumber, episodeNumber, authHeader);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/episodes/rate")
    public ResponseEntity<Void> rateEpisode(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestParam String serieId,
            @RequestParam Integer seasonNumber,
            @RequestParam Integer episodeNumber,
            @RequestParam Double rating,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String safeUserId = (userId != null) ? userId : "default";
        radarService.rateEpisode(safeUserId, serieId, seasonNumber, episodeNumber, rating, authHeader);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/series/watch-later")
    public ResponseEntity<Void> toggleWatchLater(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestParam String serieId,
            @RequestParam Boolean watchLater,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String safeUserId = (userId != null) ? userId : "default";
        radarService.toggleWatchLater(safeUserId, serieId, watchLater, authHeader);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/series/rewatch")
    public ResponseEntity<Void> startRewatch(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestParam String serieId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String safeUserId = (userId != null) ? userId : "default";
        radarService.startRewatch(safeUserId, serieId, authHeader);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/series/cancel-rewatch")
    public ResponseEntity<Void> cancelRewatch(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestParam String serieId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String safeUserId = (userId != null) ? userId : "default";
        radarService.cancelRewatch(safeUserId, serieId, authHeader);
        return ResponseEntity.ok().build();
    }
}
