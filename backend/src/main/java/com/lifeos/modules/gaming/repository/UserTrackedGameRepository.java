package com.lifeos.modules.gaming.repository;

import com.lifeos.modules.gaming.model.UserTrackedGame;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserTrackedGameRepository extends JpaRepository<UserTrackedGame, String> {
    List<UserTrackedGame> findAllByUserIdOrderByGameAsc(String userId);

    Optional<UserTrackedGame> findByIdAndUserId(String id, String userId);

    boolean existsByUserIdAndSteamAppId(String userId, Long steamAppId);
}
