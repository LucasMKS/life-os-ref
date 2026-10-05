package com.lifeos.modules.gaming.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreateTrackedGameRequest(
        @NotBlank String game,
        @NotNull @Positive Long steamAppId) {
}
