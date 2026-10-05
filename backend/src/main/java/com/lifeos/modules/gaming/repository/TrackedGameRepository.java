package com.lifeos.modules.gaming.repository;

import com.lifeos.modules.gaming.model.TrackedGame;
import com.lifeos.modules.gaming.model.GameStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TrackedGameRepository extends JpaRepository<TrackedGame, String> {
    List<TrackedGame> findByUserId(String userId);
    Optional<TrackedGame> findByUserIdAndAppId(String userId, Long appId);
    List<TrackedGame> findByUserIdAndStatus(String userId, GameStatus status);
    List<TrackedGame> findByUserIdAndQueuePriorityIsNotNullOrderByQueuePriorityAsc(String userId);
}
