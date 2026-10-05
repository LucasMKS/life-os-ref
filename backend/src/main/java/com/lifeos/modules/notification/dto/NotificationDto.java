package com.lifeos.modules.notification.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.lifeos.modules.notification.model.Notification;

import java.time.LocalDateTime;

public record NotificationDto(
        String id,
        String userId,
        String message,
        String type,
        @JsonProperty("isRead") boolean read,
        LocalDateTime createdAt
) {
    public static NotificationDto from(Notification n) {
        return new NotificationDto(
                n.getId(),
                n.getUserId(),
                n.getMessage(),
                n.getType(),
                n.isRead(),
                n.getCreatedAt()
        );
    }
}
