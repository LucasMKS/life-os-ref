package com.lifeos.modules.notes.service;

import com.lifeos.modules.notes.model.QuickNote;
import com.lifeos.modules.notes.repository.QuickNoteRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

/**
 * Notas rápidas (quick notes) do usuário — é a feature de "post-it" que aparece
 * em /notes no frontend. Permite título, conteúdo, cor de fundo, e uma imagem
 * anexada (upload local em disco).
 *
 * Quando uma nota é criada com imagem, o arquivo é salvo bruto em uploadDir e a
 * url pública é gravada na nota. Em seguida o id da nota é publicado em
 * IMAGE_QUEUE_NAME para o ImageProcessorConsumer otimizar (resize + compressão
 * JPEG) o arquivo em background — assim a request do POST não precisa esperar
 * o processamento.
 */
@Service
@Slf4j
@RequiredArgsConstructor
@SuppressWarnings("null")
public class QuickNoteService {

    private final QuickNoteRepository repository;
    private final ImageProcessorService imageProcessorService;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.public-url:https://api-lifeos.lucasmks.com.br}")
    private String publicUrl;

    public List<QuickNote> getNotes(String userId) {
        log.info("Buscando notas para o usuário: {}", userId);
        return repository.findAllByUserIdOrderByIsPinnedDescCreatedAtDesc(userId);
    }

    public QuickNote createNote(String userId, QuickNote note) {
        log.info("Criando nova nota para o usuário: {}", userId);
        note.setUserId(userId);

        if (note.getColor() == null || note.getColor().isBlank()) {
            note.setColor("zinc");
        }

        return repository.save(note);
    }

    public QuickNote updateNote(String userId, String noteId, QuickNote updatedData) {
        log.info("Atualizando nota {} para o usuário: {}", noteId, userId);

        return repository.findById(noteId).map(note -> {
            if (!note.getUserId().equals(userId)) {
                log.warn("Usuário {} tentou editar a nota {} de outro usuário", userId, noteId);
                throw new IllegalArgumentException("Acesso negado");
            }

            note.setTitle(updatedData.getTitle());
            note.setContent(updatedData.getContent());
            note.setImageUrl(updatedData.getImageUrl());
            note.setColor(updatedData.getColor());
            note.setPinned(updatedData.isPinned());

            return repository.save(note);
        }).orElseThrow(() -> new NoSuchElementException("Nota não encontrada: " + noteId));
    }

    public void deleteNote(String userId, String noteId) {
        log.info("Deletando nota {} do usuário: {}", noteId, userId);

        repository.findById(noteId).ifPresent(note -> {
            if (note.getUserId().equals(userId)) {
                repository.delete(note);
            } else {
                log.warn("Usuário {} tentou deletar a nota {} de outro usuário", userId, noteId);
            }
        });
    }

    /**
     * Salva a nota com upload de imagem opcional. O arquivo recebe um nome
     * randômico (UUID + nome original sanitizado) para evitar colisão e
     * caracteres problemáticos no path. Depois de salvar a nota no banco,
     * dispara mensagem RabbitMQ para o ImageProcessorConsumer comprimir a
     * imagem em segundo plano.
     */
    public QuickNote createNoteWithImage(String userId, QuickNote note, MultipartFile file) {
        log.info("Criando nova nota para o usuário: {}", userId);
        note.setUserId(userId);
        if (note.getColor() == null || note.getColor().isBlank())
            note.setColor("zinc");

        if (file != null && !file.isEmpty()) {
            try {
                Path uploadPath = Paths.get(uploadDir);
                if (!Files.exists(uploadPath)) {
                    Files.createDirectories(uploadPath);
                }

                String originalFilename = file.getOriginalFilename();
                String safeName = originalFilename != null ? originalFilename.replaceAll("[^a-zA-Z0-9\\.\\-]", "_") : "image.jpg";
                String fileName = UUID.randomUUID().toString() + "_" + safeName;
                Path filePath = uploadPath.resolve(fileName);

                Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

                note.setImageUrl(publicUrl + "/api/v1/notes/uploads/" + fileName);

            } catch (Exception e) {
                log.error("Erro ao salvar arquivo de imagem", e);
                throw new IllegalStateException("Não foi possível salvar a imagem", e);
            }
        }

        QuickNote savedNote = repository.save(note);

        if (file != null && !file.isEmpty()) {
            imageProcessorService.processImageAsync(savedNote.getId());
            log.info("Disparado processamento assíncrono para imagem da nota {}", savedNote.getId());
        }

        return savedNote;
    }
}