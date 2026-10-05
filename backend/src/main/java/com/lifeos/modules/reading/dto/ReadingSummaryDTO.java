package com.lifeos.modules.reading.dto;

public record ReadingSummaryDTO(
        long readingCount,
        long readCount,
        long wantToReadCount,
        long totalPagesRead,
        long totalSessions,
        Double averageRating,
        int currentStreak,
        int longestStreak
) {}
