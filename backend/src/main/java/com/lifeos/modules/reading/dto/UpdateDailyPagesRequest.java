package com.lifeos.modules.reading.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;

public record UpdateDailyPagesRequest(
        @JsonFormat(pattern = "yyyy-MM-dd") LocalDate date,
        int pagesRead
) {}
