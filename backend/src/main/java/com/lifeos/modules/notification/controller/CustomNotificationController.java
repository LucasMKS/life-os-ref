package com.lifeos.modules.notification.controller;

import com.lifeos.core.security.UserContext;
import com.lifeos.modules.notification.dto.CustomNotificationDto;
import com.lifeos.modules.notification.dto.CustomNotificationRequest;
import com.lifeos.modules.notification.service.CustomNotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications/custom")
@RequiredArgsConstructor
public class CustomNotificationController {

    private final CustomNotificationService customNotificationService;

    private String resolveUserId(String headerUserId) {
        String resolved = UserContext.resolveUserId(headerUserId);
        return (resolved != null && !resolved.isBlank()) ? resolved : "unknown";
    }

    @GetMapping
    public ResponseEntity<List<CustomNotificationDto>> getAll(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(customNotificationService.getCustomNotifications(resolveUserId(userId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomNotificationDto> getById(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String id) {
        return ResponseEntity.ok(customNotificationService.getCustomNotification(resolveUserId(userId), id));
    }

    @PostMapping
    public ResponseEntity<CustomNotificationDto> create(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @Valid @RequestBody CustomNotificationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(customNotificationService.createCustomNotification(resolveUserId(userId), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CustomNotificationDto> update(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String id,
            @Valid @RequestBody CustomNotificationRequest request) {
        return ResponseEntity.ok(customNotificationService.updateCustomNotification(resolveUserId(userId), id, request));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<CustomNotificationDto> toggle(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String id) {
        return ResponseEntity.ok(customNotificationService.toggleEnabled(resolveUserId(userId), id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String id) {
        customNotificationService.deleteCustomNotification(resolveUserId(userId), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/test")
    public ResponseEntity<Map<String, Object>> test(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String id) {
        customNotificationService.testTrigger(resolveUserId(userId), id);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Notificação de teste disparada com sucesso!"
        ));
    }
}
