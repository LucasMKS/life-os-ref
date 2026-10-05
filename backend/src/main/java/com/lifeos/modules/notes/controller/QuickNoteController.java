package com.lifeos.modules.notes.controller;

import com.lifeos.modules.notes.dto.QuickNoteDto;
import com.lifeos.modules.notes.model.QuickNote;
import com.lifeos.modules.notes.service.QuickNoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notes")
@RequiredArgsConstructor
public class QuickNoteController {

    private final QuickNoteService quickNoteService;

    @GetMapping
    public ResponseEntity<List<QuickNoteDto>> getNotes(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(quickNoteService.getNotes(userId).stream()
                .map(QuickNoteDto::from)
                .toList());
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<QuickNoteDto> createNote(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam("content") String content,
            @RequestParam(value = "color", defaultValue = "zinc") String color,
            @RequestParam(value = "imageUrl", required = false) String imageUrl,
            @RequestParam(value = "file", required = false) MultipartFile file) {

        QuickNote note = new QuickNote();
        note.setTitle(title);
        note.setContent(content);
        note.setColor(color);
        note.setImageUrl(imageUrl);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(QuickNoteDto.from(quickNoteService.createNoteWithImage(userId, note, file)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<QuickNoteDto> updateNote(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String id,
            @RequestBody QuickNote updatedData) {
        return ResponseEntity.ok(QuickNoteDto.from(quickNoteService.updateNote(userId, id, updatedData)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNote(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String id) {
        quickNoteService.deleteNote(userId, id);
        return ResponseEntity.noContent().build();
    }
}
