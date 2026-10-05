package com.lifeos.modules.reading.controller;

import com.lifeos.modules.reading.dto.BookDto;
import com.lifeos.modules.reading.dto.BookNoteDto;
import com.lifeos.modules.reading.dto.BookNoteRequest;
import com.lifeos.modules.reading.dto.RateBookRequest;
import com.lifeos.modules.reading.dto.ReadingPulseDTO;
import com.lifeos.modules.reading.dto.ReadingSummaryDTO;
import com.lifeos.modules.reading.dto.RecentNoteDTO;
import com.lifeos.modules.reading.dto.UpdateCoverRequest;
import com.lifeos.modules.reading.dto.UpdateAuthorRequest;
import com.lifeos.modules.reading.dto.UpdateDailyPagesRequest;
import com.lifeos.modules.reading.dto.UpdateProgressRequest;
import com.lifeos.modules.reading.model.Book;
import com.lifeos.modules.reading.service.ReadingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints REST de leitura sob /api/v1/reading. Faz a ponte entre o frontend
 * e o ReadingService, convertendo as entidades JPA em DTOs antes de devolver
 * a resposta para evitar expor campos internos como userId. Recebe o
 * X-User-Id do gateway em todos os endpoints autenticados.
 *
 * Os endpoints de listagem (/library, /search) usam BookDto.summaryFrom para
 * cortar sessions e notes do retorno — só os detalhes em /books/{bookId}
 * trazem o objeto completo.
 */
@RestController
@RequestMapping("/api/v1/reading")
@RequiredArgsConstructor
public class ReadingController {

    private final ReadingService readingService;

    @GetMapping("/library")
    public ResponseEntity<List<BookDto>> getLibrary(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(readingService.getUserLibrary(userId).stream()
                .map(BookDto::summaryFrom)
                .toList());
    }

    @GetMapping("/search")
    public ResponseEntity<List<BookDto>> searchBooks(@RequestParam String query) {
        return ResponseEntity.ok(readingService.searchBooks(query).stream()
                .map(BookDto::summaryFrom)
                .toList());
    }

    @PostMapping("/library")
    public ResponseEntity<BookDto> addBook(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody Book book) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(BookDto.from(readingService.addBookToLibrary(userId, book)));
    }

    @PatchMapping("/{bookId}/progress")
    public ResponseEntity<Void> updateProgress(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String bookId,
            @Valid @RequestBody UpdateProgressRequest request) {

        int pagesRead = request.pagesRead() != null ? request.pagesRead() : 0;
        readingService.updateProgress(userId, bookId, pagesRead, request.totalPages());

        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{bookId}/sessions/by-date")
    public ResponseEntity<BookDto> updateDailyPages(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String bookId,
            @RequestBody UpdateDailyPagesRequest req) {

        return ResponseEntity.ok(BookDto.from(
                readingService.updateDailyPages(userId, bookId, req.date(), req.pagesRead())));
    }

    @DeleteMapping("/{bookId}")
    public ResponseEntity<Void> removeBook(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String bookId) {

        readingService.removeBookFromLibrary(userId, bookId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats/pulse")
    public ResponseEntity<List<ReadingPulseDTO>> getReadingPulse(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(readingService.getReadingPulse(userId));
    }

    @GetMapping("/stats/summary")
    public ResponseEntity<ReadingSummaryDTO> getReadingSummary(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(readingService.getReadingSummary(userId));
    }

    @GetMapping("/stats/recent-notes")
    public ResponseEntity<List<RecentNoteDTO>> getRecentNotes(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestParam(value = "limit", defaultValue = "5") int limit) {
        return ResponseEntity.ok(readingService.getRecentNotes(userId, limit));
    }

    @PostMapping("/books/{bookId}/rate")
    public ResponseEntity<BookDto> rateBook(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String bookId,
            @Valid @RequestBody RateBookRequest payload) {

        Double rating = payload.rating() != null ? payload.rating() : 0.0;
        String review = payload.review() != null ? payload.review() : "";

        return ResponseEntity.ok(BookDto.from(readingService.rateBook(userId, bookId, rating, review)));
    }

    @GetMapping("/books/{bookId}")
    public ResponseEntity<BookDto> getBookDetails(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String bookId) {
        return ResponseEntity.ok(BookDto.from(readingService.getBookDetails(userId, bookId)));
    }

    @PostMapping("/books/{bookId}/notes")
    public ResponseEntity<BookNoteDto> addBookNote(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String bookId,
            @Valid @RequestBody BookNoteRequest payload) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(BookNoteDto.from(readingService.addBookNote(userId, bookId, payload.note())));
    }

    @PutMapping("/books/{bookId}/notes/{noteId}")
    public ResponseEntity<BookNoteDto> editBookNote(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String bookId,
            @PathVariable String noteId,
            @Valid @RequestBody BookNoteRequest payload) {

        return ResponseEntity.ok(BookNoteDto.from(readingService.updateBookNote(userId, noteId, payload.note())));
    }

    @PatchMapping("/books/{bookId}/cover")
    public ResponseEntity<BookDto> updateCover(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String bookId,
            @RequestBody UpdateCoverRequest payload) {

        return ResponseEntity.ok(BookDto.from(readingService.updateCoverUrl(userId, bookId, payload.coverUrl())));
    }

    @PatchMapping("/books/{bookId}/author")
    public ResponseEntity<BookDto> updateAuthor(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String bookId,
            @RequestBody UpdateAuthorRequest payload) {

        return ResponseEntity.ok(BookDto.from(readingService.updateAuthor(userId, bookId, payload.author())));
    }

    @DeleteMapping("/books/{bookId}/notes/{noteId}")
    public ResponseEntity<Void> deleteBookNote(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String bookId,
            @PathVariable String noteId) {

        readingService.deleteBookNote(userId, noteId);
        return ResponseEntity.noContent().build();
    }
}
