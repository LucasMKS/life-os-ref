package com.lifeos.modules.reading.dto;

import com.lifeos.modules.reading.model.BookNote;

import java.time.LocalDateTime;

public record BookNoteDto(
        String id,
        String note,
        LocalDateTime createdAt
) {
    public static BookNoteDto from(BookNote n) {
        return new BookNoteDto(n.getId(), n.getNote(), n.getCreatedAt());
    }
}
