package com.lifeos.modules.reading.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BookNoteRequest(
        @NotBlank @Size(max = 250) String note
) {}
