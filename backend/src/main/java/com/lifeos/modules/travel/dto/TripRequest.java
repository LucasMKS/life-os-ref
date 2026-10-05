package com.lifeos.modules.travel.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record TripRequest(
    @NotBlank(message = "Destination is required") String destination,
    @NotNull(message = "Start date is required") LocalDate startDate,
    @NotNull(message = "End date is required") LocalDate endDate,
    String flightInfo,
    String hotelInfo,
    String notes,
    @JsonAlias({"checklist_json", "checklistJson"}) String checklistJson,
    @JsonAlias({"places_json", "placesJson"}) String placesJson,
    @JsonAlias({"shopping_json", "shoppingJson"}) String shoppingJson,
    @JsonAlias({"tasks_json", "tasksJson"}) String tasksJson
) {}
