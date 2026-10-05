package com.lifeos.modules.finance.dto;

import com.lifeos.modules.finance.model.Subscription;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;

public record SubscriptionDto(
        String id,
        String name,
        String category,
        BigDecimal price,
        String billingCycle,
        LocalDate nextPayment,
        String color
) implements Serializable {
    public static SubscriptionDto from(Subscription s) {
        return new SubscriptionDto(
                s.getId(),
                s.getName(),
                s.getCategory(),
                s.getPrice(),
                s.getBillingCycle(),
                s.getNextPayment(),
                s.getColor()
        );
    }
}
