package com.lifeos.modules.reading.repository;

import com.lifeos.modules.reading.model.ReadingSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReadingSessionRepository extends JpaRepository<ReadingSession, String> {
    List<ReadingSession> findByBookIdOrderBySessionDateDesc(String bookId);
    List<ReadingSession> findByUserIdOrderBySessionDateDesc(String userId);
    List<ReadingSession> findByUserIdAndSessionDateBetween(String userId, LocalDateTime start, LocalDateTime end);
    List<ReadingSession> findByBookIdAndSessionDateBetween(String bookId, LocalDateTime start, LocalDateTime end);

    long countByUserId(String userId);
}
