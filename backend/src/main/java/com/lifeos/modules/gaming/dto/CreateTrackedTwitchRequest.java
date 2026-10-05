package com.lifeos.modules.gaming.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateTrackedTwitchRequest(@NotBlank String channelName) {}
