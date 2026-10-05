package com.lifeos.modules.media.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "watched_episodes", schema = "media", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"userId", "serieId", "seasonNumber", "episodeNumber"})
})
public class WatchedEpisode {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String userId;
    private String serieId;
    private Integer seasonNumber;
    private Integer episodeNumber;
    private LocalDateTime watchedAt;
    private Double rating;
}
