package com.lifeos.modules.finance.service;

import com.lifeos.modules.finance.dto.SubscriptionDto;
import com.lifeos.modules.finance.dto.SubscriptionRequest;
import com.lifeos.modules.finance.model.Subscription;
import com.lifeos.modules.finance.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

/**
 * Serviço de assinaturas/recorrências do usuário (Netflix, Spotify, etc.).
 * Faz CRUD completo e calcula o próximo vencimento quando o usuário marca
 * como pago.
 *
 * O cache finance_user_subscriptions_v2 guarda a lista de assinaturas por
 * usuário com TTL de 10 minutos. Toda operação de escrita (add/update/delete/
 * markAsPaid) faz @CacheEvict para invalidar imediatamente — sem isso o
 * frontend mostraria valores velhos. O sufixo _v2 no nome da chave é para
 * forçar o cache a ignorar entradas antigas que ainda guardavam entidades
 * JPA cruas (a refatoração para SubscriptionDto mudou o formato).
 *
 * O markAsPaid avança o nextPayment em 1 mês ou 1 ano dependendo do
 * billingCycle ("Mensal", "Anual integral", "Anual dividida"). Não deleta
 * a assinatura — só rola a data.
 */
@Service
@Slf4j
@RequiredArgsConstructor
@SuppressWarnings("null")
public class FinanceService {

    public static final String USER_SUBSCRIPTIONS_CACHE = "finance_user_subscriptions_v2";

    private final SubscriptionRepository repository;

    @Cacheable(value = USER_SUBSCRIPTIONS_CACHE, key = "#userId")
    public List<SubscriptionDto> getUserSubscriptions(String userId) {
        log.info("Buscando assinaturas para o usuário {}", userId);
        return repository.findAllByUserIdOrderByNextPaymentAsc(userId).stream()
                .map(SubscriptionDto::from)
                .toList();
    }

    @CacheEvict(value = USER_SUBSCRIPTIONS_CACHE, key = "#userId")
    public SubscriptionDto addSubscription(String userId, SubscriptionRequest req) {
        log.info("Adicionando nova assinatura: {} para o usuário {}", req.name(), userId);

        Subscription subscription = Subscription.builder()
                .userId(userId)
                .name(req.name())
                .category(req.category())
                .price(req.price())
                .billingCycle(req.billingCycle())
                .nextPayment(req.nextPayment())
                .color((req.color() == null || req.color().isBlank()) ? "#52525b" : req.color())
                .build();

        return SubscriptionDto.from(repository.save(subscription));
    }

    @CacheEvict(value = USER_SUBSCRIPTIONS_CACHE, key = "#userId")
    public SubscriptionDto updateSubscription(String userId, String subscriptionId, SubscriptionRequest req) {
        log.info("Atualizando assinatura {} do usuário {}", subscriptionId, userId);
        Subscription saved = repository.findById(subscriptionId).map(sub -> {
            if (!sub.getUserId().equals(userId)) {
                throw new IllegalArgumentException("Acesso negado");
            }
            sub.setName(req.name());
            sub.setCategory(req.category());
            sub.setPrice(req.price());
            sub.setBillingCycle(req.billingCycle());
            sub.setNextPayment(req.nextPayment());
            if (req.color() != null) {
                sub.setColor(req.color());
            }
            return repository.save(sub);
        }).orElseThrow(() -> new NoSuchElementException("Assinatura não encontrada: " + subscriptionId));

        return SubscriptionDto.from(saved);
    }

    @CacheEvict(value = USER_SUBSCRIPTIONS_CACHE, key = "#userId")
    public void deleteSubscription(String userId, String subscriptionId) {
        log.info("Removendo assinatura {} do usuário {}", subscriptionId, userId);
        repository.findById(subscriptionId).ifPresent(sub -> {
            if (sub.getUserId().equals(userId)) {
                repository.delete(sub);
            }
        });
    }

    @CacheEvict(value = USER_SUBSCRIPTIONS_CACHE, key = "#userId")
    public SubscriptionDto markAsPaid(String userId, String subscriptionId) {
        Subscription saved = repository.findById(subscriptionId).map(sub -> {
            if (!sub.getUserId().equals(userId)) {
                throw new IllegalArgumentException("Acesso negado");
            }
            String cycle = sub.getBillingCycle() != null ? sub.getBillingCycle().toLowerCase() : "";
            if (cycle.contains("anual")) {
                sub.setNextPayment(sub.getNextPayment().plusYears(1));
            } else {
                sub.setNextPayment(sub.getNextPayment().plusMonths(1));
            }
            return repository.save(sub);
        }).orElseThrow(() -> new NoSuchElementException("Assinatura não encontrada: " + subscriptionId));

        return SubscriptionDto.from(saved);
    }
}
