package com.lifeos.modules.media.repository;

import com.lifeos.modules.media.model.UserTrackedMedia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserTrackedMediaRepository extends JpaRepository<UserTrackedMedia, String> {

    List<UserTrackedMedia> findByUserId(String userId);

    List<UserTrackedMedia> findByUserIdAndMediaType(String userId, String mediaType);

    List<UserTrackedMedia> findByTmdbId(String tmdbId);

    List<UserTrackedMedia> findDistinctByTmdbId(String tmdbId);

    @Query("SELECT DISTINCT m.tmdbId FROM UserTrackedMedia m")
    List<String> findDistinctTmdbIds();

    @Query("SELECT DISTINCT m.userId FROM UserTrackedMedia m")
    List<String> findDistinctUserIds();

    Optional<UserTrackedMedia> findByUserIdAndTmdbId(String userId, String tmdbId);

    Optional<UserTrackedMedia> findByUserIdAndTmdbIdAndMediaType(String userId, String tmdbId, String mediaType);

    boolean existsByUserIdAndTmdbId(String userId, String tmdbId);

    void deleteByUserIdAndTmdbId(String userId, String tmdbId);
}
