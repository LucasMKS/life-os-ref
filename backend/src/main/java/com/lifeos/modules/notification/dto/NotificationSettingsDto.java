package com.lifeos.modules.notification.dto;

import com.lifeos.modules.notification.model.UserNotificationSettings;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationSettingsDto {
    private String userId;
    private String telegramChatId;
    private Boolean telegramEnabled;
    private Boolean mediaEnabled;
    private Boolean gamingEnabled;
    private Boolean twitchEnabled;
    private Boolean f1Enabled;
    private Boolean sportsEnabled;
    private Boolean financeEnabled;
    private Boolean readingEnabled;
    private Boolean weatherEnabled;
    private String mediaTime;
    private String sportsMorningTime;
    private String f1BriefingTime;
    private String financeTime;
    private String readingTime;
    private String weatherTime;
    private Boolean quietHoursEnabled;
    private String quietHoursStart;
    private String quietHoursEnd;
    private LocalDateTime updatedAt;

    public static NotificationSettingsDto from(UserNotificationSettings s) {
        if (s == null) {
            return null;
        }
        return NotificationSettingsDto.builder()
                .userId(s.getUserId())
                .telegramChatId(s.getTelegramChatId())
                .telegramEnabled(s.isTelegramEnabled())
                .mediaEnabled(s.isMediaEnabled())
                .gamingEnabled(s.isGamingEnabled())
                .twitchEnabled(s.isTwitchEnabled())
                .f1Enabled(s.isF1Enabled())
                .sportsEnabled(s.isSportsEnabled())
                .financeEnabled(s.isFinanceEnabled())
                .readingEnabled(s.isReadingEnabled())
                .weatherEnabled(s.isWeatherEnabled())
                .mediaTime(s.getMediaTime())
                .sportsMorningTime(s.getSportsMorningTime())
                .f1BriefingTime(s.getF1BriefingTime())
                .financeTime(s.getFinanceTime())
                .readingTime(s.getReadingTime())
                .weatherTime(s.getWeatherTime())
                .quietHoursEnabled(s.isQuietHoursEnabled())
                .quietHoursStart(s.getQuietHoursStart())
                .quietHoursEnd(s.getQuietHoursEnd())
                .updatedAt(s.getUpdatedAt())
                .build();
    }
}
