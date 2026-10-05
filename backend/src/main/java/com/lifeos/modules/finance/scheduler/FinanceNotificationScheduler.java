package com.lifeos.modules.finance.scheduler;

import com.lifeos.modules.finance.model.Subscription;
import com.lifeos.modules.finance.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;

/**
 * Schedulers financeiros. São dois jobs distintos protegidos por @SchedulerLock
 * para não duplicarem em cenário multi-réplica:
 *
 * notifyUpcomingPayments roda todo dia às 9h e busca todas as assinaturas com
 * nextPayment = amanhã, mandando um alerta individual no Telegram para cada
 * uma com nome e valor. O routing key notify.finance bate no NotificationListener
 * que persiste e dispara a mensagem.
 *
 * sendMonthlyBalance roda no dia 1 de cada mês às 10h e calcula o gasto
 * estimado mensal somando todas as assinaturas (assinaturas anuais entram
 * dividas por 12). Manda uma única mensagem com o total e a contagem de
 * serviços ativos.
 *
 * O AtomicBoolean é defesa redundante para o caso do scheduler tentar rodar
 * antes da execução anterior terminar — não substitui o @SchedulerLock,
 * que protege contra múltiplas instâncias do serviço.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class FinanceNotificationScheduler {

    private final SubscriptionRepository repository;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;
    private final AtomicBoolean runningUpcomingPayments = new AtomicBoolean(false);
    private final AtomicBoolean runningMonthlyBalance = new AtomicBoolean(false);

    /**
     * LEMBRETE DE VÉSPERA: Roda todos os dias às 09:00 da manhã.
     * Verifica se alguma assinatura vence exatamante no dia seguinte.
     */
    @Scheduled(cron = "${app.schedulers.finance-upcoming.cron:0 0 9 * * *}")
    @SchedulerLock(name = "finance-notifyUpcomingPayments", lockAtMostFor = "PT15M", lockAtLeastFor = "PT5M")
    public void notifyUpcomingPayments() {
        if (!runningUpcomingPayments.compareAndSet(false, true)) {
            log.warn("Scheduler financeiro de vencimentos ainda em execucao. Ciclo sera ignorado.");
            return;
        }

        try {
            LocalDate tomorrow = LocalDate.now().plusDays(1);
            log.info("Cronjob Finance: Buscando assinaturas com vencimento para amanhã ({})", tomorrow);

            List<Subscription> upcoming = repository.findByNextPayment(tomorrow);

            Map<String, List<Subscription>> subsByUser = upcoming.stream()
                    .filter(s -> s.getUserId() != null)
                    .collect(Collectors.groupingBy(Subscription::getUserId));

            for (Map.Entry<String, List<Subscription>> entry : subsByUser.entrySet()) {
                String userId = entry.getKey();
                List<Subscription> userSubs = entry.getValue();

                if (userSubs.size() == 1) {
                    Subscription sub = userSubs.get(0);
                    String message = String.format(
                        "💳 <b>Alerta de Cobrança!</b>\n\nA assinatura de <b>%s</b> será renovada amanhã.\nValor: R$ %.2f\n\n<i>Se não usa mais, cancele hoje!</i>",
                        sub.getName(),
                        sub.getPrice()
                    );

                    sendWithButton("notify.finance", message, "Ver assinaturas →", "/finance", userId);
                    log.info("Alerta de cobrança individual enviado para a assinatura: {} (Usuário: {})", sub.getName(), userId);
                } else if (userSubs.size() >= 2) {
                    StringBuilder sb = new StringBuilder();
                    sb.append(String.format("💳 <b>Alerta de Cobranças de Amanhã!</b>\n\nVocê tem <b>%d assinaturas</b> com renovação amanhã:\n", userSubs.size()));
                    BigDecimal total = BigDecimal.ZERO;
                    for (Subscription sub : userSubs) {
                        BigDecimal price = sub.getPrice() != null ? sub.getPrice() : BigDecimal.ZERO;
                        total = total.add(price);
                        sb.append(String.format("• <b>%s:</b> R$ %.2f\n", sub.getName(), price));
                    }
                    sb.append(String.format("\n<b>Total:</b> R$ %.2f\n\n<i>Se não usa mais, cancele antes da renovação!</i>", total));

                    sendWithButton("notify.finance", sb.toString(), "Ver assinaturas →", "/finance", userId);
                    log.info("Alerta de cobranças agregadas enviado para o usuário: {} ({} assinaturas)", userId, userSubs.size());
                }
            }
        } finally {
            runningUpcomingPayments.set(false);
        }
    }

    /**
     * BALANÇO MENSAL: Roda todo dia 1º do mês às 10:00 da manhã.
     * Faz a soma total de todas as assinaturas ativas para dar o panorama do mês.
     */
    @Scheduled(cron = "${app.schedulers.finance-monthly-balance.cron:0 0 10 1 * *}")
    @SchedulerLock(name = "finance-sendMonthlyBalance", lockAtMostFor = "PT30M", lockAtLeastFor = "PT5M")
    public void sendMonthlyBalance() {
        if (!runningMonthlyBalance.compareAndSet(false, true)) {
            log.warn("Scheduler financeiro de balanco mensal ainda em execucao. Ciclo sera ignorado.");
            return;
        }

        try {
            log.info("Cronjob Finance: Gerando balanço mensal...");

            List<Subscription> allSubs = repository.findAll();

            if (allSubs.isEmpty()) {
                return;
            }

            Map<String, List<Subscription>> subsByUser = allSubs.stream()
                    .filter(sub -> sub.getUserId() != null)
                    .collect(Collectors.groupingBy(Subscription::getUserId));

            for (Map.Entry<String, List<Subscription>> entry : subsByUser.entrySet()) {
                String userId = entry.getKey();
                List<Subscription> userSubs = entry.getValue();

                double totalMensalEstimado = userSubs.stream()
                        .mapToDouble(sub -> {
                            if (sub.getBillingCycle() != null && sub.getBillingCycle().toLowerCase().contains("anual")) {
                                return sub.getPrice().doubleValue() / 12.0;
                            }
                            return sub.getPrice().doubleValue();
                        })
                        .sum();

                String message = String.format(
                    "📊 <b>LifeOS - Balanço Financeiro Mensal</b>\n\n" +
                    "Aqui está o radar de custos digitais:\n\n" +
                    "🔹 <b>Serviços Ativos:</b> %d\n" +
                    "🔹 <b>Custo Estimado do Mês:</b> R$ %.2f\n\n" +
                    "Dê uma olhada no seu Dashboard para gerenciar.",
                    userSubs.size(),
                    totalMensalEstimado
                );

                sendWithButton("notify.finance", message, "Abrir dashboard →", "/finance", userId);
                log.info("Balanço mensal enviado para o usuário: {} (Gasto estimado: R$ %.2f)", userId, totalMensalEstimado);
            }
        } finally {
            runningMonthlyBalance.set(false);
        }
    }

    private void sendWithButton(String routingKey, String text, String label, String path, String userId) {
        eventPublisher.publishEvent(com.lifeos.shared.event.NotificationEvent.builder()
                .type("FINANCE")
                .message(text)
                .buttonLabel(label)
                .buttonPath(path)
                .userId(userId)
                .build());
    }
}
