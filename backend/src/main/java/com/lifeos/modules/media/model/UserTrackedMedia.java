package com.lifeos.modules.media.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "user_tracked_media",
        schema = "media",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_user_tracked_media", columnNames = {"user_id", "tmdb_id"})
        },
        indexes = {
                @Index(name = "idx_tracked_media_user", columnList = "user_id"),
                @Index(name = "idx_tracked_media_tmdb", columnList = "tmdb_id")
        }
)
public class UserTrackedMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "user_id", nullable = false, length = 64)
    private String userId;

    @Column(name = "tmdb_id", nullable = false, length = 64)
    private String tmdbId;

    @Column(name = "media_type", nullable = false, length = 16)
    private String mediaType; // "MOVIE" ou "SERIES"

    @Column(name = "title")
    private String title;

    @Column(name = "poster_path", length = 512)
    private String posterPath;

    @Column(name = "status", length = 64)
    private String status; // "PLAN_TO_WATCH", "WATCHING", etc.

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
