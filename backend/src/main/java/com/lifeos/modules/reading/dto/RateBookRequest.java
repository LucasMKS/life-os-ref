package com.lifeos.modules.reading.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.PositiveOrZero;

public record RateBookRequest(
        @PositiveOrZero @DecimalMax("5.0") Double rating,
        String review
) {}
