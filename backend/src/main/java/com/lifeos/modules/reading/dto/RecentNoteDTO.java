package com.lifeos.modules.reading.dto;

import java.time.LocalDateTime;

public record RecentNoteDTO(
        String id,
        String note,
        LocalDateTime createdAt,
        String bookId,
        String bookTitle,
        String bookCoverUrl
) {}
