package com.lifeos.modules.reading.dto;

import com.lifeos.modules.reading.model.Book;

import java.time.LocalDateTime;
import java.util.List;

public record BookDto(
        String id,
        String title,
        String subtitle,
        String publisher,
        String author,
        String coverUrl,
        int totalPages,
        int readPages,
        String status,
        List<String> genres,
        List<ReadingSessionDto> sessions,
        List<BookNoteDto> notes,
        LocalDateTime startedAt,
        LocalDateTime finishedAt,
        Double rating,
        String review,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static BookDto from(Book b) {
        List<ReadingSessionDto> sessions = b.getSessions() == null ? List.of()
                : b.getSessions().stream().map(ReadingSessionDto::from).toList();
        List<BookNoteDto> notes = b.getNotes() == null ? List.of()
                : b.getNotes().stream().map(BookNoteDto::from).toList();
        return new BookDto(
                b.getId(),
                b.getTitle(),
                b.getSubtitle(),
                b.getPublisher(),
                b.getAuthor(),
                b.getCoverUrl(),
                b.getTotalPages(),
                b.getReadPages(),
                b.getStatus(),
                b.getGenres() == null ? List.of() : b.getGenres(),
                sessions,
                notes,
                b.getStartedAt(),
                b.getFinishedAt(),
                b.getRating(),
                b.getReview(),
                b.getCreatedAt(),
                b.getUpdatedAt()
        );
    }

    /**
     * Versão compacta sem coleções pesadas (para listagens da biblioteca).
     */
    public static BookDto summaryFrom(Book b) {
        return new BookDto(
                b.getId(),
                b.getTitle(),
                b.getSubtitle(),
                b.getPublisher(),
                b.getAuthor(),
                b.getCoverUrl(),
                b.getTotalPages(),
                b.getReadPages(),
                b.getStatus(),
                b.getGenres() == null ? List.of() : b.getGenres(),
                List.of(),
                List.of(),
                b.getStartedAt(),
                b.getFinishedAt(),
                b.getRating(),
                b.getReview(),
                b.getCreatedAt(),
                b.getUpdatedAt()
        );
    }
}
