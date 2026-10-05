package com.lifeos.modules.finance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SubscriptionRequest(
        @NotBlank String name,
        @NotBlank String category,
        @NotNull @Positive BigDecimal price,
        String billingCycle,
        @NotNull LocalDate nextPayment,
        String color
) {}
