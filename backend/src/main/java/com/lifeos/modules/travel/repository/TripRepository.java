package com.lifeos.modules.travel.repository;

import com.lifeos.modules.travel.model.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {
    List<Trip> findByUserIdOrderByStartDateAsc(String userId);
    Optional<Trip> findByIdAndUserId(Long id, String userId);
}
