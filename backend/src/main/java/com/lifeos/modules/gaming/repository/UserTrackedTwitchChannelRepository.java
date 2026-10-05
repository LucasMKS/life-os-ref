package com.lifeos.modules.gaming.repository;

import com.lifeos.modules.gaming.model.UserTrackedTwitchChannel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserTrackedTwitchChannelRepository extends JpaRepository<UserTrackedTwitchChannel, String> {
    List<UserTrackedTwitchChannel> findAllByUserIdOrderByChannelNameAsc(String userId);
    boolean existsByUserIdAndChannelNameIgnoreCase(String userId, String channelName);
    Optional<UserTrackedTwitchChannel> findByIdAndUserId(String id, String userId);
}