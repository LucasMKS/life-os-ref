package com.lifeos.modules.notification.repository;

import com.lifeos.modules.notification.model.CustomNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomNotificationRepository extends JpaRepository<CustomNotification, String> {

    List<CustomNotification> findByUserIdOrderByCreatedAtDesc(String userId);

    List<CustomNotification> findByEnabledTrue();

    Optional<CustomNotification> findByIdAndUserId(String id, String userId);
}
