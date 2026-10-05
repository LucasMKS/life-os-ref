package com.lifeos.modules.reading.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifeos.modules.reading.dto.ReadingPulseDTO;
import com.lifeos.modules.reading.dto.ReadingSummaryDTO;
import com.lifeos.modules.reading.dto.RecentNoteDTO;
import com.lifeos.modules.reading.model.Book;
import com.lifeos.modules.reading.model.BookNote;
import com.lifeos.modules.reading.model.ReadingSession;
import com.lifeos.modules.reading.repository.BookNoteRepository;
import com.lifeos.modules.reading.repository.BookRepository;
import com.lifeos.modules.reading.repository.ReadingSessionRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

/**
 * Serviço central de leitura. Cuida de tudo que envolve livros do usuário:
 * busca em APIs externas (BrasilAPI por ISBN, Google Books no resto), CRUD da
 * biblioteca, registro de progresso (sessions), notas e avaliação final.
 *
 * Cada update de progresso cria uma ReadingSession nova com o delta de páginas,
 * nunca atualiza uma existente — exceto em updateDailyPages, que consolida o dia.
 * Quando o livro chega ao total, publica evento em notification.exchange com a
 * routing key notify.reading e o x-user-id no header, e o listener do
 * notification-service pega e dispara o Telegram. O book.readPages no Book é
 * cumulativo, então preserva saldo histórico de livros legados que tinham
 * progresso antes do sistema de sessions.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ReadingService {

    private final BookRepository repository;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;
    private final WebClient brasilApiWebClient;
    private final WebClient googleBooksWebClient;
    private final ObjectMapper objectMapper;
    private final ReadingSessionRepository sessionRepository;
    private final BookNoteRepository noteRepository;

    @Value("${google.books.api.key}")
    private String googleApiKey;

    /**
     * Busca livros nas APIs externas. Estratégia:
     * - Se for ISBN (10 ou 13 dígitos), tenta BrasilAPI primeiro (tem contagem
     *   de páginas mais precisa para livros nacionais), depois Google Books.
     * - Senão, busca no Google Books primeiro com filtro PT/BR e expande para
     *   busca global se vier pouco resultado.
     *
     * Resultado fica em cache Redis por 6h (TTL default do RedisConfig) — essas
     * APIs têm rate limit e o resultado raramente muda.
     */
    @Cacheable(value = "book_search", key = "#query")
    public List<Book> searchBooks(String query) {
        String cleanQuery = query.replaceAll("-", "").trim();
        boolean isIsbn = cleanQuery.matches("\\d{10}|\\d{13}");

        List<Book> results = new ArrayList<>();

        if (isIsbn) {
            try {
                log.info("ISBN detectado. Buscando na BrasilAPI para a exatidão de páginas: {}", cleanQuery);
                String responseBody = brasilApiWebClient.get()
                        .uri("/api/isbn/v1/{isbn}", cleanQuery)
                        .retrieve()
                        .bodyToMono(String.class)
                        .block();

                if (responseBody != null) {
                    JsonNode root = objectMapper.readTree(responseBody);
                    results.add(bookFromBrasilApiNode(root, cleanQuery));
                    return results;
                }
            } catch (Exception e) {
                log.warn("BrasilAPI não encontrou o ISBN {}, caindo para o Google Books...", cleanQuery);
            }
        }

        if (isIsbn) {
            // Para ISBN: Google Books é mais confiável para título e capa
            List<Book> googleResult = fetchFromGoogleBooks("isbn:" + cleanQuery, null, null, 1);
            if (!googleResult.isEmpty()) {
                Book googleBook = googleResult.get(0);
                // Se BrasilAPI já retornou dados, aproveita a contagem de páginas mais precisa
                if (!results.isEmpty()) {
                    Book brasilBook = results.get(0);
                    if (brasilBook.getTotalPages() > 0 && googleBook.getTotalPages() == 0) {
                        googleBook.setTotalPages(brasilBook.getTotalPages());
                    }
                }
                return List.of(googleBook);
            }
            return results; // retorna BrasilAPI como fallback se Google Books não encontrou
        }

        // Passo 1: busca focada no Brasil (Idioma PT + Disponibilidade Regional BR)
        // O algoritmo do Google Books já prioriza o título exato quando disponível
        log.info("Buscando no Google Books (PT + BR) para: {}", query);
        List<Book> ptResults = fetchFromGoogleBooks(query, "pt", "BR", 15);

        // Passo 2: busca global sem restrição (para livros técnicos, importados ou novos sem tag PT)
        // Só expandimos se a primeira busca trouxe poucos resultados
        List<Book> globalResults = new ArrayList<>();
        if (ptResults.size() < 10) {
            log.info("Expandindo busca global para: {}", query);
            globalResults = fetchFromGoogleBooks(query, null, null, 15);
        }

        // Mesclagem com prioridade para PT/BR e evitando duplicatas por título + autor
        Map<String, Book> merged = new LinkedHashMap<>();
        for (Book b : ptResults) {
            merged.put(normalizeKey(b.getTitle() + b.getAuthor()), b);
        }
        for (Book b : globalResults) {
            merged.putIfAbsent(normalizeKey(b.getTitle() + b.getAuthor()), b);
        }

        return new ArrayList<>(merged.values()).stream().limit(20).toList();
    }

    private List<Book> fetchFromGoogleBooks(String qParam, String langRestrict, String country, int maxResults) {
        List<Book> results = new ArrayList<>();
        try {
            String responseBody = googleBooksWebClient.get()
                    .uri(uriBuilder -> {
                        uriBuilder.queryParam("q", qParam)
                                  .queryParam("maxResults", maxResults)
                                  .queryParam("printType", "books")
                                  .queryParam("key", googleApiKey);
                        if (langRestrict != null) {
                            uriBuilder.queryParam("langRestrict", langRestrict);
                        }
                        if (country != null) {
                            uriBuilder.queryParam("country", country);
                        }
                        return uriBuilder.build();
                    })
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (responseBody != null) {
                JsonNode root = objectMapper.readTree(responseBody);
                JsonNode items = root.path("items");
                if (items.isArray()) {
                    items.forEach(item -> results.add(bookFromGoogleNode(item)));
                }
            }
        } catch (Exception e) {
            log.error("Erro ao buscar livros no Google API (langRestrict={}, country={}): {}", 
                      langRestrict, country, e.getMessage());
        }
        return results;
    }

    private String normalizeKey(String title) {
        if (title == null) return "";
        return title.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }

    private String fetchCoverFromExternalSources(String isbn) {
        // Tenta Google Books primeiro
        try {
            String responseBody = googleBooksWebClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .queryParam("q", "isbn:" + isbn)
                            .queryParam("key", googleApiKey)
                            .build())
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (responseBody != null) {
                JsonNode root = objectMapper.readTree(responseBody);
                JsonNode items = root.path("items");
                if (items.isArray() && items.size() > 0) {
                    JsonNode firstItem = items.get(0);
                    String rawCoverUrl = firstItem.path("volumeInfo").path("imageLinks").path("thumbnail").asText(null);
                    String enhanced = enhanceGoogleBooksCover(rawCoverUrl);
                    if (enhanced != null) return enhanced;

                    // Fallback pelo volume ID
                    String volumeId = firstItem.path("id").asText(null);
                    if (volumeId != null && !volumeId.isEmpty()) {
                        String fallback = "https://books.google.com/books/content?id=" + volumeId
                                + "&printsec=frontcover&img=1&zoom=1&source=gbs_api";
                        return enhanceGoogleBooksCover(fallback);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Google Books não retornou capa para ISBN {}", isbn);
        }

        // Fallback: Open Library (retorna 404 com ?default=false se não tiver capa)
        try {
            String olUrl = "https://covers.openlibrary.org/b/isbn/" + isbn + "-L.jpg";
            googleBooksWebClient.get()
                    .uri(olUrl + "?default=false")
                    .retrieve()
                    .toBodilessEntity()
                    .block();
            log.info("Capa encontrada no Open Library para ISBN {}", isbn);
            return olUrl;
        } catch (Exception e) {
            log.warn("Open Library também não encontrou capa para ISBN {}", isbn);
        }

        return null;
    }

    public Book addBookToLibrary(String userId, Book book) {
        log.info("Adding book to library for user {}: {}", userId, book.getTitle());
        book.setId(UUID.randomUUID().toString());
        book.setUserId(userId);

        if (book.getStatus() == null) {
            book.setStatus("WANT_TO_READ");
        }

        if ("READING".equals(book.getStatus()) && book.getStartedAt() == null) {
            book.setStartedAt(LocalDateTime.now());
        }

        return repository.save(book);
    }

    public List<Book> getUserLibrary(String userId) {
        return repository.findAllByUserIdOrderByStartedAtDesc(userId);
    }

    /**
     * Atualiza o progresso de leitura. Cria uma session nova com o delta de páginas
     * (newPagesRead - oldPagesRead). Se o usuário diminuir páginas, não cria nada
     * — só atualiza o readPages do livro.
     *
     * Side effects:
     * - Status WANT_TO_READ vira READING quando passa de 0.
     * - Status READING vira READ quando atinge totalPages → dispara notificação
     *   "parabéns, terminou de ler!" no Telegram.
     */
    public void updateProgress(String userId, String bookId, int newPagesRead, Integer totalPages) {
        log.info("Atualizando progresso do livro {} para {} páginas para o usuário {}", bookId, newPagesRead, userId);

        repository.findById(bookId).ifPresent(book -> {
            if (userId != null && !userId.equals(book.getUserId())) {
                log.warn("Usuário {} tentou atualizar livro de outro usuário", userId);
                return;
            }

            if (totalPages != null && totalPages > 0) {
                book.setTotalPages(totalPages);
            }

            int oldPagesRead = book.getReadPages();
            int pagesReadToday = newPagesRead - oldPagesRead;

            if (pagesReadToday > 0) {
                ReadingSession session = ReadingSession.builder()
                        .userId(userId)
                        .book(book)
                        .pagesRead(pagesReadToday)
                        .sessionDate(LocalDateTime.now())
                        .build();
                sessionRepository.save(session);
            }

            book.setReadPages(newPagesRead);

            if ("WANT_TO_READ".equals(book.getStatus()) && newPagesRead > 0) {
                book.setStatus("READING");
                book.setStartedAt(LocalDateTime.now());
            }

            if (book.getReadPages() >= book.getTotalPages() && book.getTotalPages() > 0) {
                book.setStatus("READ");
                book.setFinishedAt(LocalDateTime.now());
                book.setReadPages(book.getTotalPages());

                publishBookFinishedNotification(book);
            }

            repository.save(book);
        });
    }

    /**
     * Permite editar o total de páginas lidas em um dia específico (do Ritmo do
     * frontend). Diferente do {@code updateProgress}, esse método CONSOLIDA: deleta
     * todas as sessions daquele dia e cria UMA só com o novo total — útil para
     * corrigir um valor digitado errado.
     *
     * Restrições:
     * - Só permite editar hoje ou ontem (janela de 1 dia calendário).
     * - Recalcula o readPages por delta (não recompõe do zero — preserva saldo
     *   histórico de livros antigos que não tinham sessions).
     * - Se atingir total, marca como READ com finishedAt no dia editado (não em
     *   {@code now()}) e ainda assim dispara a notificação de "parabéns".
     * - Se um livro READ for revertido (reduzir páginas abaixo do total), volta
     *   para READING e zera o finishedAt.
     */
    @Transactional
    public Book updateDailyPages(String userId, String bookId, LocalDate date, int newDayTotal) {
        log.info("Editando Ritmo do livro {} no dia {} para {} páginas (usuário {})", bookId, date, newDayTotal, userId);

        if (date == null) {
            throw new IllegalArgumentException("Data é obrigatória.");
        }

        LocalDate today = LocalDate.now();
        if (date.isBefore(today.minusDays(1)) || date.isAfter(today)) {
            throw new IllegalArgumentException("Edição permitida apenas para hoje ou ontem.");
        }

        if (newDayTotal < 0) {
            throw new IllegalArgumentException("Páginas lidas não podem ser negativas.");
        }

        Book book = repository.findById(bookId)
                .orElseThrow(() -> new NoSuchElementException("Livro não encontrado: " + bookId));

        if (userId != null && !userId.equals(book.getUserId())) {
            throw new IllegalArgumentException("Acesso negado.");
        }

        if (book.getTotalPages() > 0 && newDayTotal > book.getTotalPages()) {
            throw new IllegalArgumentException("Páginas lidas no dia não podem exceder o total do livro.");
        }

        List<ReadingSession> sessionsOfDay = sessionRepository.findByBookIdAndSessionDateBetween(
                bookId, date.atStartOfDay(), date.atTime(LocalTime.MAX));

        int oldDayTotal = sessionsOfDay.stream().mapToInt(ReadingSession::getPagesRead).sum();

        if (!sessionsOfDay.isEmpty()) {
            sessionRepository.deleteAll(sessionsOfDay);
        }

        if (newDayTotal > 0) {
            ReadingSession consolidated = ReadingSession.builder()
                    .userId(userId)
                    .book(book)
                    .pagesRead(newDayTotal)
                    .sessionDate(date.atTime(12, 0))
                    .build();
            sessionRepository.save(consolidated);
        }

        int newReadPages = book.getReadPages() - oldDayTotal + newDayTotal;
        if (newReadPages < 0) newReadPages = 0;
        if (book.getTotalPages() > 0 && newReadPages > book.getTotalPages()) {
            newReadPages = book.getTotalPages();
        }
        book.setReadPages(newReadPages);

        boolean wasRead = "READ".equals(book.getStatus());
        boolean isNowFinished = book.getTotalPages() > 0 && newReadPages >= book.getTotalPages();

        if (isNowFinished && !wasRead) {
            book.setStatus("READ");
            book.setFinishedAt(date.atTime(23, 59));
            publishBookFinishedNotification(book);
        } else if (!isNowFinished && wasRead) {
            book.setStatus("READING");
            book.setFinishedAt(null);
        }

        return repository.save(book);
    }

    public List<ReadingPulseDTO> getReadingPulse(String userId) {
        log.info("Buscando logs de leitura exatos (últimos 7 dias) para o usuário {}", userId);

        LocalDate today = LocalDate.now();
        LocalDateTime startOf7DaysAgo = today.minusDays(6).atStartOfDay();
        LocalDateTime endOfToday = today.atTime(23, 59, 59);

        List<ReadingSession> recentSessions = sessionRepository
                .findByUserIdAndSessionDateBetween(userId, startOf7DaysAgo, endOfToday);

        return java.util.stream.IntStream.rangeClosed(0, 6)
                .mapToObj(i -> {
                    LocalDate targetDate = today.minusDays(6 - i);
                    String raw = targetDate.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.forLanguageTag("pt-BR"));
                    String dayName = Character.toUpperCase(raw.charAt(0)) + raw.substring(1);
                    int dailyPages = recentSessions.stream()
                            .filter(s -> s.getSessionDate().toLocalDate().equals(targetDate))
                            .mapToInt(ReadingSession::getPagesRead)
                            .sum();
                    return new ReadingPulseDTO(dayName, dailyPages);
                })
                .toList();
    }

    public ReadingSummaryDTO getReadingSummary(String userId) {
        long readingCount = repository.countByUserIdAndStatus(userId, "READING");
        long readCount = repository.countByUserIdAndStatus(userId, "READ");
        long wantToReadCount = repository.countByUserIdAndStatus(userId, "WANT_TO_READ");
        long totalPagesRead = repository.sumReadPagesByUserId(userId);
        long totalSessions = sessionRepository.countByUserId(userId);
        Double averageRating = repository.averageRatingOfFinishedBooks(userId);

        int[] streaks = calculateStreaks(userId);
        int currentStreak = streaks[0];
        int longestStreak = streaks[1];

        return new ReadingSummaryDTO(
                readingCount,
                readCount,
                wantToReadCount,
                totalPagesRead,
                totalSessions,
                averageRating,
                currentStreak,
                longestStreak
        );
    }

    private int[] calculateStreaks(String userId) {
        List<ReadingSession> sessions = sessionRepository.findByUserIdOrderBySessionDateDesc(userId);
        if (sessions.isEmpty()) {
            return new int[]{0, 0};
        }

        List<LocalDate> readDates = sessions.stream()
                .map(s -> s.getSessionDate().toLocalDate())
                .distinct()
                .toList();

        if (readDates.isEmpty()) {
            return new int[]{0, 0};
        }

        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        LocalDate firstDate = readDates.get(0);
        boolean isStreakActive = firstDate.equals(today) || firstDate.equals(yesterday);

        int currentStreak = 0;
        int longestStreak = 0;

        if (isStreakActive) {
            currentStreak = 1;
            LocalDate expected = firstDate.minusDays(1);
            for (int i = 1; i < readDates.size(); i++) {
                LocalDate date = readDates.get(i);
                if (date.equals(expected)) {
                    currentStreak++;
                    expected = expected.minusDays(1);
                } else {
                    break;
                }
            }
        }

        int tempStreak = 0;
        LocalDate expectedLongest = null;
        for (LocalDate date : readDates) {
            if (expectedLongest == null || date.equals(expectedLongest)) {
                tempStreak++;
            } else {
                if (tempStreak > longestStreak) {
                    longestStreak = tempStreak;
                }
                tempStreak = 1;
            }
            expectedLongest = date.minusDays(1);
        }
        if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
        }

        if (currentStreak > longestStreak) {
            longestStreak = currentStreak;
        }

        return new int[]{currentStreak, longestStreak};
    }

    public List<RecentNoteDTO> getRecentNotes(String userId, int limit) {
        int clamped = Math.max(1, Math.min(limit, 20));
        return noteRepository.findRecentNotesByUserId(userId, PageRequest.of(0, clamped));
    }

    public void removeBookFromLibrary(String userId, String bookId) {
        log.info("Removing book {} for user {}", bookId, userId);
        repository.findById(bookId).ifPresent(book -> {
            if (userId != null && !userId.equals(book.getUserId())) {
                log.warn("User {} tentou deletar o livro {} que pertence a {}", userId, bookId, book.getUserId());
                return;
            }
            repository.delete(book);
        });
    }

    public Book updateCoverUrl(String userId, String bookId, String coverUrl) {
        log.info("Atualizando capa do livro {} para o usuário {}", bookId, userId);
        return repository.findById(bookId).map(book -> {
            if (userId != null && !userId.equals(book.getUserId())) {
                throw new IllegalArgumentException("Acesso negado.");
            }
            book.setCoverUrl(coverUrl != null && !coverUrl.isBlank() ? coverUrl.trim() : null);
            return repository.save(book);
        }).orElseThrow(() -> new NoSuchElementException("Livro não encontrado: " + bookId));
    }

    public Book updateAuthor(String userId, String bookId, String author) {
        log.info("Atualizando autor do livro {} para '{}' para o usuário {}", bookId, author, userId);
        return repository.findById(bookId).map(book -> {
            if (userId != null && !userId.equals(book.getUserId())) {
                throw new IllegalArgumentException("Acesso negado.");
            }
            book.setAuthor(author != null && !author.isBlank() ? author.trim() : "Autor Desconhecido");
            return repository.save(book);
        }).orElseThrow(() -> new NoSuchElementException("Livro não encontrado: " + bookId));
    }

    public Book rateBook(String userId, String bookId, Double rating, String review) {
        log.info("Adicionando resenha ao livro {} pelo usuário {}", bookId, userId);
        return repository.findById(bookId).map(book -> {
            if (userId != null && !userId.equals(book.getUserId())) {
                throw new IllegalArgumentException("Acesso negado.");
            }

            book.setRating(rating);
            if (review != null && !review.trim().isEmpty()) {
                book.setReview(review);
            }

            return repository.save(book);
        }).orElseThrow(() -> new NoSuchElementException("Livro não encontrado: " + bookId));
    }

    public Book getBookDetails(String userId, String bookId) {
        return repository.findById(bookId).map(book -> {
            if (userId != null && !userId.equals(book.getUserId())) {
                throw new IllegalArgumentException("Acesso negado.");
            }
            return book;
        }).orElseThrow(() -> new NoSuchElementException("Livro não encontrado: " + bookId));
    }

    public BookNote addBookNote(String userId, String bookId, String noteText) {
        log.info("Adicionando nota no livro {} para o usuário {}", bookId, userId);

        Book book = repository.findById(bookId)
                .orElseThrow(() -> new NoSuchElementException("Livro não encontrado: " + bookId));

        if (userId != null && !userId.equals(book.getUserId())) {
            throw new IllegalArgumentException("Acesso negado.");
        }

        BookNote note = BookNote.builder()
                .book(book)
                .userId(userId)
                .note(noteText)
                .build();

        return noteRepository.save(note);
    }

    public BookNote updateBookNote(String userId, String noteId, String newText) {
        log.info("Atualizando nota {} para o usuário {}", noteId, userId);
        BookNote note = noteRepository.findById(noteId)
                .orElseThrow(() -> new NoSuchElementException("Anotação não encontrada: " + noteId));

        if (userId != null && !userId.equals(note.getUserId())) {
            throw new IllegalArgumentException("Acesso negado.");
        }

        note.setNote(newText);
        return noteRepository.save(note);
    }

    public void deleteBookNote(String userId, String noteId) {
        log.info("Deletando nota {} para o usuário {}", noteId, userId);
        BookNote note = noteRepository.findById(noteId)
                .orElseThrow(() -> new NoSuchElementException("Anotação não encontrada: " + noteId));

        if (userId != null && !userId.equals(note.getUserId())) {
            throw new IllegalArgumentException("Acesso negado.");
        }

        noteRepository.delete(note);
    }

    private Book bookFromBrasilApiNode(JsonNode root, String isbn) {
        String author = root.path("authors").isArray() && root.path("authors").size() > 0
                ? root.path("authors").get(0).asText() : "Autor Desconhecido";
        String coverUrl = root.path("cover_url").asText(null);
        if (coverUrl == null || coverUrl.isEmpty() || "null".equals(coverUrl)) {
            coverUrl = fetchCoverFromExternalSources(isbn);
        }
        return Book.builder()
                .id(UUID.randomUUID().toString())
                .title(root.path("title").asText("Título Desconhecido"))
                .subtitle(root.hasNonNull("subtitle") ? root.get("subtitle").asText() : null)
                .publisher(root.hasNonNull("publisher") ? root.get("publisher").asText() : null)
                .author(author)
                .coverUrl(coverUrl)
                .totalPages(root.path("page_count").asInt(0))
                .readPages(0)
                .status("WANT_TO_READ")
                .genres(new ArrayList<>())
                .build();
    }

    private Book bookFromGoogleNode(JsonNode item) {
        JsonNode volumeInfo = item.path("volumeInfo");
        String volumeId = item.path("id").asText(null);

        String author = volumeInfo.path("authors").isArray() && volumeInfo.path("authors").size() > 0
                ? volumeInfo.path("authors").get(0).asText() : "Autor Desconhecido";
        List<String> genres = new ArrayList<>();
        if (volumeInfo.path("categories").isArray()) {
            volumeInfo.path("categories").forEach(cat -> genres.add(cat.asText()));
        }

        // Tenta obter a melhor capa disponível no objeto imageLinks
        String coverUrl = null;
        JsonNode imageLinks = volumeInfo.path("imageLinks");
        if (!imageLinks.isMissingNode()) {
            // Ordem de preferência para qualidade
            String[] qualities = {"extraLarge", "large", "medium", "small", "thumbnail", "smallThumbnail"};
            for (String q : qualities) {
                if (imageLinks.has(q)) {
                    coverUrl = imageLinks.get(q).asText();
                    break;
                }
            }
        }

        // Melhora a URL (HTTPS e zoom se for thumbnail)
        coverUrl = enhanceGoogleBooksCover(coverUrl);

        // Fallback: constrói URL de capa diretamente pelo volume ID se nada foi encontrado
        if (coverUrl == null && volumeId != null && !volumeId.isEmpty()) {
            coverUrl = "https://books.google.com/books/content?id=" + volumeId
                    + "&printsec=frontcover&img=1&zoom=1&source=gbs_api";
            coverUrl = enhanceGoogleBooksCover(coverUrl);
        }

        return Book.builder()
                .id(UUID.randomUUID().toString())
                .title(volumeInfo.path("title").asText("Título Desconhecido"))
                .subtitle(volumeInfo.hasNonNull("subtitle") ? volumeInfo.get("subtitle").asText() : null)
                .publisher(volumeInfo.hasNonNull("publisher") ? volumeInfo.get("publisher").asText() : null)
                .author(author)
                .coverUrl(coverUrl)
                .totalPages(volumeInfo.path("pageCount").asInt(0))
                .readPages(0)
                .status("WANT_TO_READ")
                .genres(genres)
                .build();
    }

    /**
     * Publica o evento "livro terminado" no notification.exchange para o
     * notification-service consumir e mandar Telegram. Inclui o x-user-id no
     * header — ESSENCIAL para o listener saber a quem pertence a notificação
     * (sem isso vira IDOR — qualquer um vê notificação de qualquer um).
     */
    private void publishBookFinishedNotification(Book book) {
        String text = "🎉 <b>Parabéns!</b> Você terminou de ler: <b>" + book.getTitle() + "</b>";
        eventPublisher.publishEvent(com.lifeos.shared.event.NotificationEvent.builder()
                .type("READING")
                .message(text)
                .buttonLabel("Ver Avaliação →")
                .buttonPath("/reading/" + book.getId())
                .userId(book.getUserId())
                .build());
    }

    private String enhanceGoogleBooksCover(String coverUrl) {
        if (coverUrl == null)
            return null;

        String enhanced = coverUrl
                .replace("http:", "https:")
                .replace("&edge=curl", "");

        // Se for uma URL de thumbnail (zoom=1 ou 5), tentamos o zoom=2 que é um equilíbrio melhor
        // O frontend tentará o zoom=3 e fará fallback se necessário
        if (enhanced.contains("zoom=1") || enhanced.contains("zoom=5") || enhanced.contains("zoom=0")) {
            enhanced = enhanced.replaceAll("zoom=\\d", "zoom=2");
        } else if (!enhanced.contains("zoom=")) {
            enhanced = enhanced + (enhanced.contains("?") ? "&" : "?") + "zoom=2";
        }
        return enhanced;
    }
}
