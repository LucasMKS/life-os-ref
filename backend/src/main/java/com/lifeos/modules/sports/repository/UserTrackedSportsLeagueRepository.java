package com.lifeos.modules.sports.repository;

import com.lifeos.modules.sports.model.UserTrackedSportsLeague;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserTrackedSportsLeagueRepository extends JpaRepository<UserTrackedSportsLeague, String> {

    List<UserTrackedSportsLeague> findByUserId(String userId);

    Optional<UserTrackedSportsLeague> findByUserIdAndLeague(String userId, String league);

    Optional<UserTrackedSportsLeague> findByUserIdAndSportAndLeague(String userId, String sport, String league);

    boolean existsByUserIdAndLeague(String userId, String league);

    boolean existsByUserIdAndSportAndLeague(String userId, String sport, String league);

    void deleteByUserIdAndLeague(String userId, String league);

    void deleteByUserIdAndSportAndLeague(String userId, String sport, String league);

    List<UserTrackedSportsLeague> findByNotifyMatchesTrue();

    List<UserTrackedSportsLeague> findByUserIdAndNotifyMatchesTrue(String userId);
}
