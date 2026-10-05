package com.lifeos.modules.f1.repository;

import com.lifeos.modules.f1.model.F1ConstructorStandings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface F1ConstructorStandingsRepository extends JpaRepository<F1ConstructorStandings, String> {
    List<F1ConstructorStandings> findBySeasonOrderByPositionAsc(int season);

    @Transactional
    @Modifying
    @Query("delete from F1ConstructorStandings c where c.season = :season")
    void deleteBySeasonInBatch(@Param("season") int season);
}
