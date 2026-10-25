package com.lifeos.modules.notification.service;

import com.lifeos.modules.notification.dto.CustomNotificationDto;
import com.lifeos.modules.notification.dto.CustomNotificationRequest;
import com.lifeos.modules.notification.model.CustomNotification;
import com.lifeos.modules.notification.model.RecurrenceType;
import com.lifeos.modules.notification.repository.CustomNotificationRepository;
import com.lifeos.shared.event.NotificationEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomNotificationServiceTest {

    @Mock
    private CustomNotificationRepository repository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private CustomNotificationService service;

    @BeforeEach
    void setUp() {
        service = new CustomNotificationService(repository, eventPublisher, redisTemplate);
    }

    @Test
    void shouldCreateCustomNotification() {
        CustomNotificationRequest request = CustomNotificationRequest.builder()
                .title("Dar remédio a cachorra")
                .description("2 gotas")
                .time("09:00")
                .recurrence(RecurrenceType.DAILY)
                .sendTelegram(true)
                .enabled(true)
                .build();

        when(repository.save(any(CustomNotification.class))).thenAnswer(invocation -> {
            CustomNotification n = invocation.getArgument(0);
            n.setId("rem-1");
            return n;
        });

        CustomNotificationDto result = service.createCustomNotification("user-1", request);

        assertNotNull(result);
        assertEquals("Dar remédio a cachorra", result.getTitle());
        assertEquals("09:00", result.getTime());
        assertEquals(RecurrenceType.DAILY, result.getRecurrence());
        assertTrue(result.isEnabled());
        assertTrue(result.isSendTelegram());
        verify(repository).save(any(CustomNotification.class));
    }

    @Test
    void shouldTestTriggerNotification() {
        CustomNotification notification = CustomNotification.builder()
                .id("rem-1")
                .userId("user-1")
                .title("Dar remédio a cachorra")
                .description("2 gotas")
                .time("09:00")
                .recurrence(RecurrenceType.DAILY)
                .sendTelegram(true)
                .enabled(true)
                .build();

        when(repository.findByIdAndUserId("rem-1", "user-1")).thenReturn(Optional.of(notification));

        service.testTrigger("user-1", "rem-1");

        ArgumentCaptor<NotificationEvent> eventCaptor = ArgumentCaptor.forClass(NotificationEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());

        NotificationEvent event = eventCaptor.getValue();
        assertEquals("user-1", event.getUserId());
        assertEquals("CUSTOM", event.getType());
        assertTrue(event.getMessage().contains("Dar remédio a cachorra"));
        assertTrue(event.getMessage().contains("2 gotas"));
        assertTrue(event.isSendTelegram());
        assertTrue(event.isIgnoreQuietHours());
        assertTrue(event.isSkipTelegramDedup());
    }

    @Test
    void shouldDispatchDueNotification() {
        CustomNotification notification = CustomNotification.builder()
                .id("rem-1")
                .userId("user-1")
                .title("Dar remédio a cachorra")
                .time("09:00")
                .recurrence(RecurrenceType.DAILY)
                .enabled(true)
                .sendTelegram(true)
                .build();

        when(repository.findByEnabledTrue()).thenReturn(List.of(notification));
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(anyString(), anyString(), any())).thenReturn(Boolean.TRUE);
        when(repository.save(any())).thenReturn(notification);

        service.dispatchDueNotifications(LocalTime.of(9, 2), LocalDate.of(2026, 10, 25));

        verify(eventPublisher).publishEvent(any(NotificationEvent.class));
        assertNotNull(notification.getLastTriggeredAt());
        verify(repository).save(notification);
    }
}
