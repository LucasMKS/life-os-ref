package com.lifeos.modules.reading.scheduler;

import com.lifeos.modules.reading.model.Book;
import com.lifeos.modules.reading.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;

/**
 * Scheduler do nudge de leitura ("ressaca literária"). Todo dia às 18:30
 * varre os livros marcados como READING que não tiveram updatedAt nos
 * últimos 3 dias (configurável via app.schedulers.reading-nudge.inactive-days)
 * e dispara uma mensagem no Telegram lembrando o usuário de voltar à leitura,
 * mostrando o progresso atual em páginas e percentual.
 *
 * Cada mensagem vai como Message do RabbitMQ com headers button.label e
 * button.path para o NotificationListener montar o teclado inline do bot
 * com link direto para a página /reading. O @SchedulerLock garante que só
 * uma instância do serviço dispara a varredura mesmo com múltiplas réplicas.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class ReadingNotificationScheduler {

    private final BookRepository bookRepository;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;
    private final AtomicBoolean runningReadingNudge = new AtomicBoolean(false);

    @Value("${app.schedulers.reading-nudge.inactive-days:3}")
    private long inactiveDays;

    /**
     * NUDGE DE LEITURA: Roda todos os dias às 18:30.
     * Verifica livros que não são lidos há mais de 3 dias.
     */
    // Disparado dinamicamente pelo DynamicNotificationScheduler de acordo com o horário do usuário
    @SchedulerLock(name = "reading-notifyReadingSlump", lockAtMostFor = "PT15M", lockAtLeastFor = "PT5M")
    public void notifyReadingSlump() {
        if (!runningReadingNudge.compareAndSet(false, true)) {
            log.warn("Scheduler de reading nudge ainda em execucao. Ciclo sera ignorado.");
            return;
        }

        try {
            log.info("Cronjob Reading: Verificando livros parados (Ressaca Literária)...");

            LocalDateTime threeDaysAgo = LocalDateTime.now(ZoneOffset.UTC).minusDays(inactiveDays);

            List<Book> staleBooks = bookRepository.findByStatusAndUpdatedAtBefore("READING", threeDaysAgo);

            Map<String, List<Book>> booksByUser = staleBooks.stream()
                    .filter(b -> b.getUserId() != null)
                    .collect(Collectors.groupingBy(Book::getUserId));

            for (Map.Entry<String, List<Book>> entry : booksByUser.entrySet()) {
                String userId = entry.getKey();
                List<Book> userBooks = entry.getValue();

                if (userBooks.size() == 1) {
                    Book book = userBooks.get(0);
                    String progress = "";
                    if (book.getReadPages() > 0 && book.getTotalPages() > 0) {
                        int percent = (int) ((book.getReadPages() * 100.0) / book.getTotalPages());
                        progress = String.format("\nVocê parou na página %d (%d%%).", book.getReadPages(), percent);
                    }

                    String message = String.format(
                        "📚 <b>Hora da Leitura!</b>\n\n" +
                        "Saudades de <b>%s</b>? Faz um tempinho que você não atualiza a sua leitura.%s\n\n" +
                        "Que tal ler 10 paginazinhas hoje para não perder o ritmo?",
                        book.getTitle(),
                        progress
                    );

                    sendWithButton("notify.reading", message, "Continuar leitura →", "/reading", userId);
                    log.info("Alerta de leitura individual enviado para o livro: {} (Usuário: {})", book.getTitle(), userId);
                } else if (userBooks.size() >= 2) {
                    StringBuilder sb = new StringBuilder();
                    sb.append("📚 <b>Hora da Leitura!</b>\n\nFaz um tempinho que você não atualiza suas leituras:\n");
                    for (Book book : userBooks) {
                        int percent = book.getTotalPages() > 0 ? (int) ((book.getReadPages() * 100.0) / book.getTotalPages()) : 0;
                        sb.append(String.format("• <b>%s:</b> pág. %d/%d (%d%%)\n", book.getTitle(), book.getReadPages(), book.getTotalPages(), percent));
                    }
                    sb.append("\nQue tal ler algumas páginas hoje para não perder o ritmo?");

                    sendWithButton("notify.reading", sb.toString(), "Continuar leitura →", "/reading", userId);
                    log.info("Alerta agregado de leitura enviado para o usuário: {} ({} livros)", userId, userBooks.size());
                }
            }
        } finally {
            runningReadingNudge.set(false);
        }
    }

    private void sendWithButton(String routingKey, String text, String label, String path, String userId) {
        eventPublisher.publishEvent(com.lifeos.shared.event.NotificationEvent.builder()
                .type("READING")
                .message(text)
                .buttonLabel(label)
                .buttonPath(path)
                .userId(userId)
                .build());
    }
}