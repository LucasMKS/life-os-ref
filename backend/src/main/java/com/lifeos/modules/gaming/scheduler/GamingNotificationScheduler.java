package com.lifeos.modules.gaming.scheduler;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifeos.modules.gaming.model.GameNews;
import com.lifeos.modules.gaming.model.UserTrackedGame;
import com.lifeos.modules.gaming.repository.UserTrackedGameRepository;
import com.lifeos.modules.gaming.service.GamingNewsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Scheduler que avisa quando saiu novidade nos jogos rastreados pelo usuário.
 * Roda de 4 em 4 horas (00:00, 04:00, 08:00, 12:00, 16:00, 20:00) e:
 *
 * - Pega todos os usuários distintos que têm pelo menos um UserTrackedGame
 *   cadastrado;
 * - Para cada user, busca as notícias mais recentes do GameNews e filtra as
 *   que foram publicadas nas últimas 4 horas (mesma janela do cron);
 * - Manda uma mensagem por notícia para o RabbitMQ (notify.gaming),
 *   linkando direto para a URL da notícia.
 *
 * O Set<String> notifiedNewsIds dentro do método é importante: como vários
 * usuários podem rastrear o mesmo jogo, sem essa deduplicação a mesma
 * notícia chegaria N vezes no Telegram do dono do app (que é só uma pessoa
 * em multi-user, mas vira spam aqui). O id do GameNews vem da Steam/Riot
 * e é estável o bastante para usar como chave.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class GamingNotificationScheduler {

    private final org.springframework.context.ApplicationEventPublisher eventPublisher;
    private final GamingNewsService gamingNewsService;
    private final UserTrackedGameRepository trackedGameRepository;
    private final ObjectMapper objectMapper;
    private final AtomicBoolean runningGamingUpdates = new AtomicBoolean(false);

    @Value("${app.schedulers.gaming-updates.lookback-hours:4}")
    private long lookbackHours;

    /**
     * RADAR DE ATUALIZAÇÕES: Roda a cada 4 horas (00:00, 04:00, 08:00...).
     * Pega apenas as notícias que saíram na janela dessas 4 horas.
     */
    @Scheduled(cron = "${app.schedulers.gaming-updates.cron:0 0 0/4 * * *}")
    @SchedulerLock(name = "gaming-notifyGameUpdates", lockAtMostFor = "PT15M", lockAtLeastFor = "PT5M")
    public void notifyGameUpdates() {
        if (!runningGamingUpdates.compareAndSet(false, true)) {
            log.warn("Scheduler de updates gaming ainda em execucao. Ciclo sera ignorado.");
            return;
        }

        try {
            log.info("Iniciando varredura de atualizações na Steam e Riot...");

            List<UserTrackedGame> allTracked = trackedGameRepository.findAll();
            List<String> userIds = allTracked.stream()
                    .map(UserTrackedGame::getUserId)
                    .distinct()
                    .toList();

            LocalDateTime fourHoursAgo = LocalDateTime.now(ZoneOffset.UTC).minusHours(lookbackHours);
            
            Set<String> notifiedNewsIds = new HashSet<>();

            for (String userId : userIds) {
                Object rawNews = gamingNewsService.getLatestNews(userId);

                List<GameNews> latestNews = objectMapper.convertValue(
                        rawNews, 
                        new TypeReference<List<GameNews>>() {}
                );

                if (latestNews == null || latestNews.isEmpty()) {
                    continue;
                }

                List<GameNews> recentUpdates = latestNews.stream()
                        .filter(news -> news.getPublishedAt() != null && news.getPublishedAt().isAfter(fourHoursAgo))
                        .toList();

                List<GameNews> unnotifiedForUser = new ArrayList<>();
                for (GameNews news : recentUpdates) {
                    if (notifiedNewsIds.add(news.getId())) {
                        unnotifiedForUser.add(news);
                    }
                }

                if (unnotifiedForUser.isEmpty()) {
                    continue;
                }

                if (unnotifiedForUser.size() == 1) {
                    GameNews news = unnotifiedForUser.get(0);
                    String message = String.format(
                        "🎮 <b>Update Detectado!</b>\n\n" +
                        "Saiu uma nova notícia para <b>%s</b>:\n<i>%s</i>",
                        news.getGame(),
                        news.getTitle()
                    );

                    sendWithButton("notify.gaming", message, "Ver notícia →", news.getUrl(), userId);
                    log.info("Alerta de atualização individual enviado para o jogo: {} (userId={})", news.getGame(), userId);
                } else {
                    long distinctGamesCount = unnotifiedForUser.stream()
                            .map(GameNews::getGame)
                            .filter(Objects::nonNull)
                            .distinct()
                            .count();

                    StringBuilder sb = new StringBuilder();
                    sb.append("🎮 <b>Updates nos seus Jogos!</b>\n\n");
                    sb.append(String.format("Saiu novidade para %d dos seus jogos:\n", distinctGamesCount));
                    for (GameNews news : unnotifiedForUser) {
                        sb.append(String.format("• <b>%s:</b> %s\n", news.getGame(), news.getTitle()));
                    }

                    sendWithButton("notify.gaming", sb.toString().trim(), "Abrir Central Gaming →", "/gaming", userId);
                    log.info("Alerta de atualização consolidado enviado com {} notícias para o usuário {}",
                            unnotifiedForUser.size(), userId);
                }
            }
        } catch (Exception e) {
            log.error("Erro inesperado ao rodar o scheduler de atualizacoes de games", e);
        } finally {
            runningGamingUpdates.set(false);
        }
    }

    private void sendWithButton(String routingKey, String text, String label, String path, String userId) {
        eventPublisher.publishEvent(com.lifeos.shared.event.NotificationEvent.builder()
                .type("GAMING")
                .message(text)
                .buttonLabel(label)
                .buttonPath(path)
                .userId(userId != null ? userId : "")
                .build());
    }

    private void sendWithButton(String routingKey, String text, String label, String path) {
        sendWithButton(routingKey, text, label, path, null);
    }
}