package com.lifeos.modules.sports.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "user_tracked_sports_leagues", indexes = {
    @Index(name = "idx_tracked_league_user", columnList = "user_id"),
    @Index(name = "idx_tracked_league_unique", columnList = "user_id, sport, league", unique = true)
})
public class UserTrackedSportsLeague {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(nullable = false, length = 32)
    private String sport; // soccer, basketball, football

    @Column(nullable = false, length = 64)
    private String league; // "bra.1", "uefa.champions", "nba", etc.

    @Column(name = "league_name", nullable = false)
    private String leagueName; // "Brasileirão Série A"

    @Column(name = "league_logo", length = 512)
    private String leagueLogo;

    @Builder.Default
    @Column(name = "notify_matches", nullable = false)
    private boolean notifyMatches = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
