package com.lifeos.modules.gaming.repository;

import com.lifeos.modules.gaming.model.PlaytimeSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.Optional;

public interface PlaytimeSnapshotRepository extends JpaRepository<PlaytimeSnapshot, String> {
    Optional<PlaytimeSnapshot> findByUserIdAndAppIdAndDate(String userId, Long appId, LocalDate date);
    
    // Find latest snapshot for a game before a certain date
    Optional<PlaytimeSnapshot> findTopByUserIdAndAppIdAndDateBeforeOrderByDateDesc(String userId, Long appId, LocalDate date);
}
