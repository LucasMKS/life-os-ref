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

    @Column(name = "record_vod", nullable = false, columnDefinition = "boolean default false")
    @Builder.Default
    private Boolean recordVod = false;

    @Column(name = "record_quality", length = 30, columnDefinition = "varchar(30) default '720p60'")
    @Builder.Default
    private String recordQuality = "720p60";

    public boolean isRecordVod() {
        return Boolean.TRUE.equals(this.recordVod);
    }
}