package com.lifeos.modules.notification.service;

import com.lifeos.modules.notification.dto.NotificationDto;
import com.lifeos.modules.notification.model.Notification;
import com.lifeos.modules.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    private final Map<String, List<SseEmitter>> emittersByUser = new ConcurrentHashMap<>();

    @Transactional
    public Notification saveAndNotify(String message, String type, String userId) {
        Notification notification = Notification.builder()
                .message(message)
                .type(type)
                .userId(userId)
                .read(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        sendToEmitters(saved);
        return saved;
    }

    public List<NotificationDto> getAllNotifications(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(NotificationDto::from)
                .toList();
    }

    public List<NotificationDto> getRecentNotifications(String userId) {
        return notificationRepository.findTop10ByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(NotificationDto::from)
                .toList();
    }

    @Transactional
    public void markAsRead(String userId, String id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Notificação não encontrada: " + id));

        if (notification.getUserId() == null || !notification.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Acesso negado.");
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(String userId) {
        List<Notification> unread = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(n -> !n.isRead())
                .toList();
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    public SseEmitter subscribe(String userId) {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);

        try {
            emitter.send(SseEmitter.event().name("INIT").data("Connected"));
        } catch (IOException e) {
            log.error("Erro ao enviar evento INIT", e);
        }

        List<SseEmitter> userEmitters = emittersByUser.computeIfAbsent(
                userId, k -> new CopyOnWriteArrayList<>());
        userEmitters.add(emitter);

        emitter.onCompletion(() -> removeEmitter(userId, emitter));
        emitter.onTimeout(() -> removeEmitter(userId, emitter));
        emitter.onError((e) -> removeEmitter(userId, emitter));

        return emitter;
    }

    @Scheduled(fixedDelay = 25000)
    public void sendHeartbeat() {
        emittersByUser.forEach((userId, userEmitters) -> {
            List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();
            userEmitters.forEach(emitter -> {
                try {
                    emitter.send(SseEmitter.event().comment("heartbeat"));
                } catch (Exception e) {
                    deadEmitters.add(emitter);
                }
            });
            userEmitters.removeAll(deadEmitters);
        });
    }

    private void removeEmitter(String userId, SseEmitter emitter) {
        List<SseEmitter> userEmitters = emittersByUser.get(userId);
        if (userEmitters != null) {
            userEmitters.remove(emitter);
            if (userEmitters.isEmpty()) {
                emittersByUser.remove(userId);
            }
        }
    }

    private void sendToEmitters(Notification notification) {
        String userId = notification.getUserId();
        if (userId == null) return;

        List<SseEmitter> userEmitters = emittersByUser.get(userId);
        if (userEmitters == null || userEmitters.isEmpty()) return;

        NotificationDto dto = NotificationDto.from(notification);
        List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();

        userEmitters.forEach(emitter -> {
            try {
                emitter.send(SseEmitter.event()
                        .name("NOTIFICATION")
                        .data(dto));
            } catch (Exception e) {
                deadEmitters.add(emitter);
                log.warn("SseEmitter falhou, removendo da lista.");
            }
        });

        userEmitters.removeAll(deadEmitters);
    }
}
