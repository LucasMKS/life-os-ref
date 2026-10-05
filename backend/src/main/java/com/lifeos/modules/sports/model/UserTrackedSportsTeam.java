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
@Table(name = "user_tracked_sports_teams", indexes = {
    @Index(name = "idx_tracked_team_user", columnList = "user_id"),
    @Index(name = "idx_tracked_team_unique", columnList = "user_id, sport, team_id", unique = true)
})
public class UserTrackedSportsTeam {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(nullable = false, length = 32)
    private String sport; // soccer, basketball, football

    @Column(nullable = false, length = 64)
    private String league; // bra.1, nba, nfl, etc.

    @Column(name = "team_id", nullable = false, length = 64)
    private String teamId; // ESPN team ID e.g. "2022"

    @Column(name = "team_name", nullable = false)
    private String teamName; // "Cruzeiro"

    @Column(name = "team_display_name")
    private String teamDisplayName;

    @Column(name = "team_abbreviation", length = 16)
    private String teamAbbreviation; // "CRU"

    @Column(name = "logo_url", length = 512)
    private String logoUrl;

    @Column(name = "primary_color", length = 16)
    private String primaryColor; // "0093EC"

    @Column(name = "secondary_color", length = 16)
    private String secondaryColor;

    @Builder.Default
    @Column(name = "notify_matches", nullable = false)
    private boolean notifyMatches = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
