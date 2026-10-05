package com.lifeos.modules.notification.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.lifeos.modules.notification.repository.UserNotificationSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

@Service
@Slf4j
@RequiredArgsConstructor
public class BotCommandHandler {

    private final TelegramService telegramService;
    private final BotServiceClient serviceClient;
    private final UserNotificationSettingsRepository userNotificationSettingsRepository;

    @Value("${app.site-url:http://localhost:5173}")
    private String siteUrl;

    @Value("${telegram.bot.chat-id:}")
    private String allowedChatId;

    private static final ZoneId BRT = ZoneId.of("America/Sao_Paulo");

    public void handle(String text, Long chatId) {
        String command = text == null ? "" : text.trim().split("\\s+")[0].toLowerCase();

        if ("/id".equals(command)) {
            handleId(chatId);
            return;
        }
        if ("/start".equals(command)) {
            handleStart(chatId);
            return;
        }
        if ("/ajuda".equals(command) || "/help".equals(command)) {
            handleAjuda(chatId);
            return;
        }

        boolean isAuthorized = (allowedChatId != null && String.valueOf(chatId).equals(allowedChatId))
                || userNotificationSettingsRepository.existsByTelegramChatId(String.valueOf(chatId));

        if (!isAuthorized) {
            log.warn("Mensagem bloqueada de chatId não autorizado: {}", chatId);
            String msg = String.format("""
                    🔒 <b>Acesso não autorizado</b>

                    Seu Telegram Chat ID é: <code>%d</code>

                    Para interagir com o bot do LifeOS, acesse as Configurações de Notificação no LifeOS e vincule seu Chat ID.
                    """, chatId);
            telegramService.sendMessageWithButton(chatId, msg.trim(), "Abrir LifeOS →", siteUrl);
            return;
        }

        switch (command) {
            case "/f1"     -> handleF1(chatId);
            case "/livro"  -> handleLivro(chatId);
            case "/radar"  -> handleRadar(chatId);
            case "/status" -> handleStatus(chatId);
            default        -> handleAjuda(chatId);
        }
    }

    private void handleF1(Long chatId) {
        JsonNode sessions = serviceClient.getNextF1Sessions();

        if (sessions == null || !sessions.isArray() || sessions.isEmpty()) {
            telegramService.sendMessageWithButton(chatId,
                    "🏎️ Nenhuma sessão de F1 encontrada.",
                    "Abrir F1", siteUrl + "/f1");
            return;
        }

        StringBuilder sb = new StringBuilder("🏎️ <b>F1 — Próximas Sessões</b>\n\n");

        int shown = 0;
        for (JsonNode session : sessions) {
            if (shown >= 4) break;
            String name   = session.path("name").asText("Sessão");
            String status = session.path("status").asText("");
            String dateRaw = session.path("date").asText(null);

            if (dateRaw == null) continue;

            LocalDateTime utcDate = LocalDateTime.parse(dateRaw, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            LocalDateTime brtDate = utcDate.atZone(ZoneOffset.UTC).withZoneSameInstant(BRT).toLocalDateTime();
            String dateFmt = brtDate.format(DateTimeFormatter.ofPattern("EEE dd/MM 'às' HH:mm", java.util.Locale.forLanguageTag("pt-BR")));

            if ("ao vivo".equalsIgnoreCase(status)) {
                sb.append("🔴 <b>").append(name).append("</b> — <b>AO VIVO AGORA</b>\n");
            } else {
                Duration diff = Duration.between(LocalDateTime.now(BRT), brtDate);
                String countdown = formatCountdown(diff);
                sb.append("📅 <b>").append(name).append("</b>\n");
                sb.append("   ").append(dateFmt).append("\n");
                sb.append("   ⏱ Falta: <b>").append(countdown).append("</b>\n");
            }
            sb.append("\n");
            shown++;
        }

        telegramService.sendMessageWithButton(chatId, sb.toString().trim(), "Abrir F1 →", siteUrl + "/f1");
    }

    private void handleLivro(Long chatId) {
        JsonNode library = serviceClient.getReadingLibrary();

        if (library == null || !library.isArray()) {
            telegramService.sendMessageWithButton(chatId,
                    "📚 Não foi possível buscar sua biblioteca.",
                    "Abrir Leitura →", siteUrl + "/reading");
            return;
        }

        JsonNode current = null;
        for (JsonNode book : library) {
            if ("READING".equalsIgnoreCase(book.path("status").asText())) {
                current = book;
                break;
            }
        }

        if (current == null) {
            telegramService.sendMessageWithButton(chatId,
                    "📚 Nenhum livro em leitura no momento.",
                    "Abrir Leitura →", siteUrl + "/reading");
            return;
        }

        String title   = current.path("title").asText("?");
        String author  = current.path("author").asText("?");
        int readPages  = current.path("readPages").asInt(0);
        int totalPages = current.path("totalPages").asInt(0);
        int pct = totalPages > 0 ? (readPages * 100 / totalPages) : 0;

        String bar = "█".repeat(pct / 10) + "░".repeat(10 - pct / 10);

        String msg = String.format(
                "📚 <b>Leitura Atual</b>\n\n" +
                "<b>%s</b>\n" +
                "✍️ %s\n\n" +
                "Página <b>%d</b> de <b>%d</b>\n" +
                "%s <b>%d%%</b> concluído",
                title, author, readPages, totalPages, bar, pct);

        telegramService.sendMessageWithButton(chatId, msg, "Abrir Leitura →", siteUrl + "/reading");
    }

    private void handleRadar(Long chatId) {
        JsonNode releases = serviceClient.getRadarReleases();

        if (releases == null || !releases.isArray() || releases.isEmpty()) {
            telegramService.sendMessageWithButton(chatId,
                    "🎬 Nenhum lançamento encontrado para hoje.",
                    "Abrir Radar →", siteUrl + "/media");
            return;
        }

        LocalDate today = LocalDate.now(BRT);
        StringBuilder sb = new StringBuilder("🎬 <b>Radar de Lançamentos</b>\n\n");
        int count = 0;

        for (JsonNode item : releases) {
            String dateRaw = item.path("releaseDate").asText(null);
            if (dateRaw == null) continue;

            LocalDate releaseDate;
            try {
                releaseDate = LocalDate.parse(dateRaw);
            } catch (Exception e) {
                continue;
            }

            long daysUntil = today.until(releaseDate).getDays();
            if (daysUntil < 0 || daysUntil > 7) continue;

            String title   = item.path("title").asText("?");
            String type    = item.path("type").asText("").toUpperCase();
            String network = item.path("network").asText("");
            String episode = item.path("nextEpisode").asText("");

            String typeEmoji = "SERIES".equals(type) ? "📺" : "🎬";
            String when = daysUntil == 0 ? "<b>Hoje</b>" :
                          daysUntil == 1 ? "Amanhã" :
                          "Em " + daysUntil + " dias";

            sb.append(typeEmoji).append(" <b>").append(title).append("</b>");
            if (!episode.isBlank()) sb.append(" — ").append(episode);
            sb.append("\n");
            if (!network.isBlank()) sb.append("   📡 ").append(network);
            sb.append("   🗓 ").append(when).append("\n\n");
            count++;
        }

        if (count == 0) {
            telegramService.sendMessageWithButton(chatId,
                    "🎬 Nenhum lançamento nos próximos 7 dias.",
                    "Abrir Radar →", siteUrl + "/media");
            return;
        }

        telegramService.sendMessageWithButton(chatId, sb.toString().trim(), "Abrir Radar →", siteUrl + "/media");
    }

    private void handleStatus(Long chatId) {
        String f1Line = "🏎️ <b>F1</b> — indisponível";
        JsonNode sessions = serviceClient.getNextF1Sessions();
        if (sessions != null && sessions.isArray() && !sessions.isEmpty()) {
            JsonNode next = sessions.get(0);
            String name    = next.path("name").asText("?");
            String dateRaw = next.path("date").asText(null);
            if (dateRaw != null) {
                LocalDateTime utc = LocalDateTime.parse(dateRaw, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                Duration diff = Duration.between(LocalDateTime.now(BRT),
                        utc.atZone(ZoneOffset.UTC).withZoneSameInstant(BRT).toLocalDateTime());
                f1Line = "🏎️ <b>F1</b> — " + name + " em <b>" + formatCountdown(diff) + "</b>";
            }
        }

        String bookLine = "📚 <b>Leitura</b> — nenhum livro em andamento";
        JsonNode library = serviceClient.getReadingLibrary();
        if (library != null && library.isArray()) {
            for (JsonNode book : library) {
                if ("READING".equalsIgnoreCase(book.path("status").asText())) {
                    String title = book.path("title").asText("?");
                    int read  = book.path("readPages").asInt(0);
                    int total = book.path("totalPages").asInt(0);
                    int pct   = total > 0 ? (read * 100 / total) : 0;
                    bookLine = "📚 <b>Leitura</b> — " + title + " <b>(" + pct + "%)</b>";
                    break;
                }
            }
        }

        String radarLine = "🎬 <b>Radar</b> — nenhum lançamento hoje";
        JsonNode releases = serviceClient.getRadarReleases();
        if (releases != null && releases.isArray()) {
            LocalDate today = LocalDate.now(BRT);
            long todayCount = 0;
            for (JsonNode item : releases) {
                try {
                    if (LocalDate.parse(item.path("releaseDate").asText("")).equals(today)) todayCount++;
                } catch (Exception ignored) {}
            }
            if (todayCount > 0) radarLine = "🎬 <b>Radar</b> — <b>" + todayCount + "</b> lançamento" + (todayCount > 1 ? "s" : "") + " hoje";
        }

        String msg = "🤖 <b>LifeOS Status</b>\n\n" + f1Line + "\n" + bookLine + "\n" + radarLine;
        telegramService.sendMessageWithButtons(chatId, msg,
                new String[]{"F1 →", "Leitura →", "Radar →"},
                new String[]{siteUrl + "/f1", siteUrl + "/reading", siteUrl + "/media"});
    }

    private void handleId(Long chatId) {
        String msg = String.format("""
                🆔 <b>Seu Telegram Chat ID:</b>
                <code>%d</code>

                Copie este ID e cole no LifeOS (<i>Configurações → Notificações → Telegram Chat ID</i>) para receber seus alertas pessoais.
                """, chatId);
        telegramService.sendMessageWithButton(chatId, msg.trim(), "Abrir Notificações →", siteUrl + "/notifications");
    }

    private void handleStart(Long chatId) {
        String msg = String.format("""
                👋 <b>Olá! Bem-vindo ao LifeOS Bot!</b>

                Seu Telegram Chat ID é:
                <code>%d</code>

                <b>Como conectar ao LifeOS:</b>
                1. Copie o ID numérico acima
                2. Acesse o LifeOS em <i>Configurações → Notificações</i>
                3. Cole seu Chat ID no campo do Telegram e salve!

                <b>Comandos disponíveis:</b>
                /id — Ver seu Telegram Chat ID
                /f1 — Próximas sessões de Fórmula 1
                /livro — Livro atual e progresso de leitura
                /radar — Lançamentos de séries e filmes
                /status — Resumo geral do LifeOS
                /ajuda — Lista completa de comandos
                """, chatId);
        telegramService.sendMessageWithButton(chatId, msg.trim(), "Abrir LifeOS →", siteUrl);
    }

    private void handleAjuda(Long chatId) {
        String msg = String.format("""
                🤖 <b>LifeOS Bot</b> — Comandos disponíveis:

                /id — Ver seu Telegram Chat ID (<code>%d</code>)
                /f1 — Próximas sessões de Fórmula 1
                /livro — Livro atual e progresso de leitura
                /radar — Lançamentos de séries e filmes
                /status — Resumo geral do LifeOS
                /ajuda — Esta lista de comandos
                """, chatId);
        telegramService.sendMessageWithButton(chatId, msg.trim(), "Abrir LifeOS →", siteUrl);
    }

    private String formatCountdown(Duration d) {
        if (d.isNegative()) return "ao vivo / encerrado";
        long days  = d.toDays();
        long hours = d.toHours() % 24;
        long mins  = d.toMinutes() % 60;
        if (days > 0)  return days + "d " + hours + "h";
        if (hours > 0) return hours + "h " + mins + "min";
        return mins + " minutos";
    }
}
