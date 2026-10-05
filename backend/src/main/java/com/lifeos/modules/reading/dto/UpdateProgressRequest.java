package com.lifeos.modules.reading.dto;

import jakarta.validation.constraints.PositiveOrZero;

public record UpdateProgressRequest(
        @PositiveOrZero Integer pagesRead,
        @PositiveOrZero Integer totalPages
) {}
