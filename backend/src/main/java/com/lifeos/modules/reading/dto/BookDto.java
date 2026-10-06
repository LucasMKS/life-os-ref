package com.lifeos.modules.reading.dto;

import com.lifeos.modules.reading.model.Book;
import org.hibernate.Hibernate;

import java.time.LocalDateTime;
import java.util.ArrayList;
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
        List<ReadingSessionDto> sessions = (b.getSessions() != null && Hibernate.isInitialized(b.getSessions()))
                ? b.getSessions().stream().map(ReadingSessionDto::from).toList()
                : List.of();
        List<BookNoteDto> notes = (b.getNotes() != null && Hibernate.isInitialized(b.getNotes()))
                ? b.getNotes().stream().map(BookNoteDto::from).toList()
                : List.of();
        List<String> genres = (b.getGenres() != null && Hibernate.isInitialized(b.getGenres()))
                ? new ArrayList<>(b.getGenres())
                : List.of();

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
                genres,
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
        List<String> genres = (b.getGenres() != null && Hibernate.isInitialized(b.getGenres()))
                ? new ArrayList<>(b.getGenres())
                : List.of();

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
                genres,
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
