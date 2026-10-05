package com.lifeos.modules.travel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record ItineraryItemRequest(
    @NotBlank(message = "Title is required") String title,
    @NotNull(message = "Date and time is required") LocalDateTime dateTime,
    String locationName,
    String address,
    Double latitude,
    Double longitude,
    String notes,
    String category,
    Boolean completed
) {}
