package com.lifeos.modules.f1.dto;

public record WeatherDTO(
        double airTemperature,
        double trackTemperature,
        double humidity,
        int rainfall,
        double windSpeed,
        boolean isLive) {}
