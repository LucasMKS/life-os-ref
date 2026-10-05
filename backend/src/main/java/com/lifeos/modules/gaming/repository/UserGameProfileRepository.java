package com.lifeos.modules.gaming.repository;

import com.lifeos.modules.gaming.model.UserGameProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserGameProfileRepository extends JpaRepository<UserGameProfile, String> {
    Optional<UserGameProfile> findByUserIdAndGame(String userId, String game);
}
