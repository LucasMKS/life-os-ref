package com.lifeos.modules.f1.repository;

import com.lifeos.modules.f1.model.F1Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface F1SessionRepository extends JpaRepository<F1Session, String> {
    List<F1Session> findAllByOrderByDateAsc();

    List<F1Session> findByDateBetweenAndNotifiedFalse(LocalDateTime start, LocalDateTime end);
}
