package com.lifeos.modules.gaming.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateTrackedTwitchRequest(
    @NotBlank String channelName,
    Boolean recordVod,
    String recordQuality
) {
    public CreateTrackedTwitchRequest(String channelName) {
        this(channelName, false, "720p60");
    }
}
