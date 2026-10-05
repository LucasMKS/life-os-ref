package com.lifeos.modules.gaming.repository;

import com.lifeos.modules.gaming.model.DailyPlaytimeLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface DailyPlaytimeLogRepository extends JpaRepository<DailyPlaytimeLog, String> {
    List<DailyPlaytimeLog> findByUserIdAndDate(String userId, LocalDate date);
    List<DailyPlaytimeLog> findByUserIdAndAppIdOrderByDateDesc(String userId, Long appId);
    List<DailyPlaytimeLog> findByUserIdAndDateBetweenOrderByDateDesc(String userId, LocalDate startDate, LocalDate endDate);
}
