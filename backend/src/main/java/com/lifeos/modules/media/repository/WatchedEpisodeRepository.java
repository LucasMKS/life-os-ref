package com.lifeos.modules.media.repository;

import com.lifeos.modules.media.model.WatchedEpisode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface WatchedEpisodeRepository extends JpaRepository<WatchedEpisode, String> {

    List<WatchedEpisode> findByUserId(String userId);

    List<WatchedEpisode> findByUserIdAndSerieId(String userId, String serieId);

    Optional<WatchedEpisode> findByUserIdAndSerieIdAndSeasonNumberAndEpisodeNumber(
            String userId, String serieId, Integer seasonNumber, Integer episodeNumber);

    List<WatchedEpisode> findByUserIdAndSerieIdIn(String userId, Collection<String> serieIds);

    boolean existsByUserIdAndSerieIdAndSeasonNumberAndEpisodeNumber(
            String userId, String serieId, Integer seasonNumber, Integer episodeNumber);

    @Transactional
    void deleteByUserIdAndSerieIdAndSeasonNumberAndEpisodeNumber(
            String userId, String serieId, Integer seasonNumber, Integer episodeNumber);

    @Transactional
    void deleteByUserIdAndSerieId(String userId, String serieId);
}
