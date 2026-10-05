package com.lifeos.modules.notification.repository;

import com.lifeos.modules.notification.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {
    List<Notification> findAllByOrderByCreatedAtDesc();
    List<Notification> findTop10ByOrderByCreatedAtDesc();
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);
    List<Notification> findTop10ByUserIdOrderByCreatedAtDesc(String userId);
    long countByReadFalse();
    long countByUserIdAndReadFalse(String userId);
}
