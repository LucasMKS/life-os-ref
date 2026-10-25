package com.lifeos.modules.notification.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "custom_notifications", schema = "notifications")
public class CustomNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 10)
    private String time; // "09:00" format HH:mm

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private RecurrenceType recurrence = RecurrenceType.DAILY;

    /**
     * Comma-separated DayOfWeek values (e.g. "MONDAY,WEDNESDAY,FRIDAY")
     * Used when recurrence is SPECIFIC_DAYS.
     */
    private String daysOfWeek;

    /**
     * Specific date when recurrence is ONCE.
     */
    private LocalDate specificDate;

    @Builder.Default
    private boolean enabled = true;

    @Builder.Default
    private boolean sendTelegram = true;

    private LocalDateTime lastTriggeredAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
