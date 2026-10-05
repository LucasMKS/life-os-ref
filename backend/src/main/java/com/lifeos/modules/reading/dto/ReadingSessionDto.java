package com.lifeos.modules.reading.dto;

import com.lifeos.modules.reading.model.ReadingSession;

import java.time.LocalDateTime;

public record ReadingSessionDto(
        String id,
        int pagesRead,
        LocalDateTime sessionDate
) {
    public static ReadingSessionDto from(ReadingSession s) {
        return new ReadingSessionDto(s.getId(), s.getPagesRead(), s.getSessionDate());
    }
}
