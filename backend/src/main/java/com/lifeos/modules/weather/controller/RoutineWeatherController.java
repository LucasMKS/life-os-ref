package com.lifeos.modules.weather.controller;

import com.fasterxml.jackson.databind.node.ArrayNode;
import com.lifeos.modules.weather.service.RoutineWeatherService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/v1/gaming/weather", "/api/v1/weather"})
@RequiredArgsConstructor
public class RoutineWeatherController {

    private final RoutineWeatherService routineWeatherService;

    @GetMapping("/current")
    public ResponseEntity<ArrayNode> getCurrentWeather() {
        return ResponseEntity.ok(routineWeatherService.getCurrentWeather());
    }
}
