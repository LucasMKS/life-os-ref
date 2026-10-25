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
    private String type; // F1, FINANCE, TWITCH, GAMING, READING, SPORTS, MEDIA, WEATHER, SYSTEM, CUSTOM
    private String buttonLabel;
    private String buttonPath;
    private String userId;

    @Builder.Default
    private boolean sendTelegram = true;

    @Builder.Default
    private boolean ignoreQuietHours = false;

    @Builder.Default
    private boolean skipTelegramDedup = false;
}
