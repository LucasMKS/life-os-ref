package com.lifeos.modules.f1.controller;

import com.lifeos.modules.f1.dto.F1NewsDTO;
import com.lifeos.modules.f1.dto.PodiumResultDTO;
import com.lifeos.modules.f1.dto.WeatherDTO;
import com.lifeos.modules.f1.model.F1ConstructorStandings;
import com.lifeos.modules.f1.model.F1DriverStandings;
import com.lifeos.modules.f1.model.F1Session;
import com.lifeos.modules.f1.service.F1Service;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/f1")
@RequiredArgsConstructor
public class F1Controller {

    private final F1Service f1Service;

    @GetMapping("/sessions/next")
    public ResponseEntity<List<F1Session>> getNextSessions(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(f1Service.getNextSessions());
    }

    @GetMapping("/standings")
    public ResponseEntity<List<F1DriverStandings>> getStandings(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(f1Service.getCurrentSeasonStandings());
    }

    @GetMapping("/circuits/next")
    public ResponseEntity<Map<String, Object>> getNextCircuit(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(f1Service.getNextCircuitInfo());
    }

    @GetMapping("/standings/constructors")
    public ResponseEntity<List<F1ConstructorStandings>> getConstructorStandings(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(f1Service.getCurrentConstructorStandings());
    }

    @GetMapping("/podium/last")
    public ResponseEntity<List<PodiumResultDTO>> getLastPodium() {
        return ResponseEntity.ok(f1Service.getLastRacePodium());
    }

    @GetMapping("/weather/latest")
    public ResponseEntity<WeatherDTO> getLiveWeather() {
        return ResponseEntity.ok(f1Service.getLiveWeather());
    }

    @GetMapping("/news")
    public ResponseEntity<List<F1NewsDTO>> getF1News() {
        return ResponseEntity.ok(f1Service.getF1News());
    }
}
