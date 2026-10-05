package com.lifeos.modules.notification.repository;

import com.lifeos.modules.notification.model.UserNotificationSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserNotificationSettingsRepository extends JpaRepository<UserNotificationSettings, String> {

    Optional<UserNotificationSettings> findByTelegramChatId(String telegramChatId);

    boolean existsByTelegramChatId(String telegramChatId);
}
