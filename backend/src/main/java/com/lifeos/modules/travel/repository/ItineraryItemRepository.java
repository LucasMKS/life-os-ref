package com.lifeos.modules.travel.repository;

import com.lifeos.modules.travel.model.ItineraryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ItineraryItemRepository extends JpaRepository<ItineraryItem, Long> {
    List<ItineraryItem> findByTripIdOrderByDateTimeAsc(Long tripId);
    Optional<ItineraryItem> findByIdAndTripId(Long id, Long tripId);
}
