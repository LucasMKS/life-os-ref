package com.lifeos.modules.notification.dto;

import com.lifeos.modules.notification.model.CustomNotification;
import com.lifeos.modules.notification.model.RecurrenceType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomNotificationDto {

    private String id;
    private String userId;
    private String title;
    private String description;
    private String time;
    private RecurrenceType recurrence;
    private String daysOfWeek;
    private LocalDate specificDate;
    private boolean enabled;
    private boolean sendTelegram;
    private LocalDateTime lastTriggeredAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CustomNotificationDto from(CustomNotification entity) {
        if (entity == null) return null;
        return CustomNotificationDto.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .time(entity.getTime())
                .recurrence(entity.getRecurrence() != null ? entity.getRecurrence() : RecurrenceType.DAILY)
                .daysOfWeek(entity.getDaysOfWeek())
                .specificDate(entity.getSpecificDate())
                .enabled(entity.isEnabled())
                .sendTelegram(entity.isSendTelegram())
                .lastTriggeredAt(entity.getLastTriggeredAt())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
