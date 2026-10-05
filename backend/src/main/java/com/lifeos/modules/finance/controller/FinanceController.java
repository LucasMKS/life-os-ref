package com.lifeos.modules.finance.controller;

import com.lifeos.modules.finance.dto.SubscriptionDto;
import com.lifeos.modules.finance.dto.SubscriptionRequest;
import com.lifeos.modules.finance.service.FinanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/finance")
@RequiredArgsConstructor
public class FinanceController {

    private final FinanceService financeService;

    @GetMapping("/subscriptions")
    public ResponseEntity<List<SubscriptionDto>> getSubscriptions(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(financeService.getUserSubscriptions(userId));
    }

    @PostMapping("/subscriptions")
    public ResponseEntity<SubscriptionDto> addSubscription(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @Valid @RequestBody SubscriptionRequest subscription) {
        return ResponseEntity.status(HttpStatus.CREATED).body(financeService.addSubscription(userId, subscription));
    }

    @PostMapping("/subscriptions/{id}/pay")
    public ResponseEntity<SubscriptionDto> markAsPaid(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String id) {
        return ResponseEntity.ok(financeService.markAsPaid(userId, id));
    }

    @DeleteMapping("/subscriptions/{id}")
    public ResponseEntity<Void> deleteSubscription(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String id) {
        financeService.deleteSubscription(userId, id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/subscriptions/{id}")
    public ResponseEntity<SubscriptionDto> updateSubscription(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String id,
            @Valid @RequestBody SubscriptionRequest subscription) {
        return ResponseEntity.ok(financeService.updateSubscription(userId, id, subscription));
    }
}
