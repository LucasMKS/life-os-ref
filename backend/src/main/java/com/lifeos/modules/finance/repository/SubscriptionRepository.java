package com.lifeos.modules.finance.repository;

import com.lifeos.modules.finance.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, String> {
    
    List<Subscription> findAllByUserIdOrderByNextPaymentAsc(String userId);

    List<Subscription> findByNextPayment(LocalDate date);
}