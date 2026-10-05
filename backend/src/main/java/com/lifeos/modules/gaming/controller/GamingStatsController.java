package com.lifeos.modules.gaming.controller;

import com.lifeos.modules.gaming.dto.ActivityRadarDTO;
import com.lifeos.modules.gaming.service.GamingStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/gaming/stats")
@RequiredArgsConstructor
public class GamingStatsController {

    private final GamingStatsService statsService;

    @GetMapping("/activity")
    public ResponseEntity<List<ActivityRadarDTO>> getGamingActivity(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(statsService.getGamingActivityRadar(userId));
    }

    @GetMapping("/playtime")
    public ResponseEntity<List<com.lifeos.modules.gaming.model.DailyPlaytimeLog>> getDailyPlaytime(
            @RequestHeader(value = "X-User-Id") String userId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        
        LocalDate start = startDate != null ? LocalDate.parse(startDate) : LocalDate.now().minusDays(7);
        LocalDate end = endDate != null ? LocalDate.parse(endDate) : LocalDate.now();
        
        return ResponseEntity.ok(statsService.getDailyPlaytime(userId, start, end));
    }
}
