package com.lifeos.shared.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationEvent {
    private String message;
    private String type; // F1, FINANCE, TWITCH, GAMING, READING, SPORTS, MEDIA, WEATHER, SYSTEM
    private String buttonLabel;
    private String buttonPath;
    private String userId;
}
