package com.lifeos.modules.gaming.repository;

import com.lifeos.modules.gaming.model.SteamProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SteamProfileRepository extends JpaRepository<SteamProfile, String> {
    Optional<SteamProfile> findByUserId(String userId);
    Optional<SteamProfile> findBySteamId(String steamId);
}
