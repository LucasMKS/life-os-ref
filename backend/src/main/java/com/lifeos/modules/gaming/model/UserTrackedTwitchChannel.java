package com.lifeos.modules.gaming.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "user_tracked_twitch_channels", schema = "gaming")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserTrackedTwitchChannel {

    @Id
    @UuidGenerator
    private String id;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private String channelName;
}