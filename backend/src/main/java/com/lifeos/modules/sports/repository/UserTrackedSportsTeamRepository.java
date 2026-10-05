package com.lifeos.modules.sports.repository;

import com.lifeos.modules.sports.model.UserTrackedSportsTeam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserTrackedSportsTeamRepository extends JpaRepository<UserTrackedSportsTeam, String> {

    List<UserTrackedSportsTeam> findByUserId(String userId);

    Optional<UserTrackedSportsTeam> findByUserIdAndTeamId(String userId, String teamId);

    Optional<UserTrackedSportsTeam> findByUserIdAndSportAndTeamId(String userId, String sport, String teamId);

    boolean existsByUserIdAndTeamId(String userId, String teamId);

    boolean existsByUserIdAndSportAndTeamId(String userId, String sport, String teamId);

    void deleteByUserIdAndTeamId(String userId, String teamId);

    void deleteByUserIdAndSportAndTeamId(String userId, String sport, String teamId);

    List<UserTrackedSportsTeam> findByNotifyMatchesTrue();

    List<UserTrackedSportsTeam> findByUserIdAndNotifyMatchesTrue(String userId);
}
