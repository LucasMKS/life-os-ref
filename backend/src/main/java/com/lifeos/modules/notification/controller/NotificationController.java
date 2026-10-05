package com.lifeos.modules.notification.controller;

import com.lifeos.core.security.UserContext;
import com.lifeos.modules.notification.dto.NotificationDto;
import com.lifeos.modules.notification.service.NotificationService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    private String resolveUserId(String headerUserId) {
        if (headerUserId != null && !headerUserId.isBlank()) {
            return headerUserId;
        }
        String contextUser = UserContext.getUserId();
        return (contextUser != null && !contextUser.isBlank()) ? contextUser : "unknown";
    }

    @GetMapping
    public ResponseEntity<List<NotificationDto>> getAll(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(notificationService.getAllNotifications(resolveUserId(userId)));
    }

    @GetMapping("/recent")
    public ResponseEntity<List<NotificationDto>> getRecent(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(notificationService.getRecentNotifications(resolveUserId(userId)));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String id) {
        notificationService.markAsRead(resolveUserId(userId), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        notificationService.markAllAsRead(resolveUserId(userId));
        return ResponseEntity.noContent().build();
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            HttpServletResponse response) {
        response.setHeader("X-Accel-Buffering", "no");
        response.setHeader("Cache-Control", "no-cache");
        return notificationService.subscribe(resolveUserId(userId));
    }
}
