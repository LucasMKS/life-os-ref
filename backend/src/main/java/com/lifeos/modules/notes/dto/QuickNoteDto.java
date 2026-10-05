package com.lifeos.modules.notes.dto;

import com.lifeos.modules.notes.model.QuickNote;

import java.time.LocalDateTime;

public record QuickNoteDto(
        String id,
        String title,
        String content,
        String imageUrl,
        String color,
        boolean pinned,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static QuickNoteDto from(QuickNote n) {
        return new QuickNoteDto(
                n.getId(),
                n.getTitle(),
                n.getContent(),
                n.getImageUrl(),
                n.getColor(),
                n.isPinned(),
                n.getCreatedAt(),
                n.getUpdatedAt()
        );
    }
}
