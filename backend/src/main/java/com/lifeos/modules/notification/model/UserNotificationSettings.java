package com.lifeos.modules.notification.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "user_notification_settings", schema = "notifications")
public class UserNotificationSettings {

    @Id
    private String userId;

    private String telegramChatId;

    @Builder.Default
    private boolean telegramEnabled = true;

    @Builder.Default
    private boolean mediaEnabled = true;

    @Builder.Default
    private boolean gamingEnabled = true;

    @Builder.Default
    private boolean twitchEnabled = true;

    @Builder.Default
    private boolean f1Enabled = true;

    @Builder.Default
    private boolean sportsEnabled = true;

    @Builder.Default
    private boolean financeEnabled = true;

    @Builder.Default
    private boolean readingEnabled = true;

    @Builder.Default
    private boolean weatherEnabled = true;

    @Builder.Default
    private String mediaTime = "09:00";

    @Builder.Default
    private String sportsMorningTime = "08:00";

    @Builder.Default
    private String f1BriefingTime = "08:00";

    @Builder.Default
    private String financeTime = "09:00";

    @Builder.Default
    private String readingTime = "18:30";

    @Builder.Default
    private String weatherTime = "07:00";

    @Builder.Default
    private boolean quietHoursEnabled = false;

    @Builder.Default
    private String quietHoursStart = "23:00";

    @Builder.Default
    private String quietHoursEnd = "07:00";

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public static UserNotificationSettings defaultSettings(String userId) {
        return UserNotificationSettings.builder()
                .userId(userId)
                .telegramChatId(null)
                .telegramEnabled(true)
                .mediaEnabled(true)
                .gamingEnabled(true)
                .twitchEnabled(true)
                .f1Enabled(true)
                .sportsEnabled(true)
                .financeEnabled(true)
                .readingEnabled(true)
                .weatherEnabled(true)
                .mediaTime("09:00")
                .sportsMorningTime("08:00")
                .f1BriefingTime("08:00")
                .financeTime("09:00")
                .readingTime("18:30")
                .weatherTime("07:00")
                .quietHoursEnabled(false)
                .quietHoursStart("23:00")
                .quietHoursEnd("07:00")
                .build();
    }
}
