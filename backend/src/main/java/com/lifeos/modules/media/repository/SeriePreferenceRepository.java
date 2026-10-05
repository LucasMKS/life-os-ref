package com.lifeos.modules.media.repository;

import com.lifeos.modules.media.model.SeriePreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface SeriePreferenceRepository extends JpaRepository<SeriePreference, String> {
    Optional<SeriePreference> findByUserIdAndSerieId(String userId, String serieId);

    List<SeriePreference> findByUserIdAndSerieIdIn(String userId, Collection<String> serieIds);
}
