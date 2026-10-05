package com.lifeos.modules.sports.repository;

import com.lifeos.modules.sports.model.SportMatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface SportMatchRepository extends JpaRepository<SportMatch, String> {

    List<SportMatch> findByMatchDateBetweenAndNotified15mFalse(LocalDateTime start, LocalDateTime end);

    List<SportMatch> findByLeagueOrderByMatchDateAsc(String league);

    List<SportMatch> findBySportAndLeagueOrderByMatchDateAsc(String sport, String league);

    List<SportMatch> findBySportAndLeagueAndMatchDateBetweenOrderByMatchDateAsc(
            String sport, String league, LocalDateTime start, LocalDateTime end);

    List<SportMatch> findByHomeTeamIdOrAwayTeamIdOrderByMatchDateAsc(String homeTeamId, String awayTeamId);

    List<SportMatch> findByMatchDateBetweenOrderByMatchDateAsc(LocalDateTime start, LocalDateTime end);

    @Query("SELECT m FROM SportMatch m WHERE " +
           "((:leagues IS NOT NULL AND m.league IN :leagues) OR " +
           "(:teamIds IS NOT NULL AND (m.homeTeamId IN :teamIds OR m.awayTeamId IN :teamIds))) " +
           "AND m.matchDate BETWEEN :start AND :end " +
           "ORDER BY m.matchDate ASC")
    List<SportMatch> findFollowedMatches(
            @Param("leagues") Collection<String> leagues,
            @Param("teamIds") Collection<String> teamIds,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
}
