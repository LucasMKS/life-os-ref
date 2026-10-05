package com.lifeos.modules.sports.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "sports_matches", indexes = {
    @Index(name = "idx_sports_match_date", columnList = "match_date"),
    @Index(name = "idx_sports_match_league_date", columnList = "sport, league, match_date"),
    @Index(name = "idx_sports_match_home_team", columnList = "home_team_id"),
    @Index(name = "idx_sports_match_away_team", columnList = "away_team_id"),
    @Index(name = "idx_sports_match_status", columnList = "status")
})
public class SportMatch {

    @Id
    @Column(length = 64)
    private String id; // ESPN Event ID e.g. "401841168"

    @Column(nullable = false, length = 32)
    private String sport; // soccer, basketball, football

    @Column(nullable = false, length = 64)
    private String league; // bra.1, nba, nfl, etc.

    private Integer season;

    @Column(name = "match_date", nullable = false)
    private LocalDateTime matchDate; // Stored in UTC

    @Column(nullable = false)
    private String name; // "Cruzeiro at Atlético-MG"

    @Column(name = "short_name", length = 64)
    private String shortName; // "CRU @ CAM"

    @Column(nullable = false, length = 32)
    private String status; // SCHEDULED, IN_PROGRESS, HALFTIME, FINISHED, POSTPONED, CANCELED

    @Column(name = "status_detail", length = 128)
    private String statusDetail; // "FT", "45'+2'", "Final", "Scheduled"

    private Integer period;

    @Column(name = "display_clock", length = 32)
    private String displayClock;

    // Home Competitor
    @Column(name = "home_team_id", nullable = false, length = 64)
    private String homeTeamId;

    @Column(name = "home_team_name", nullable = false)
    private String homeTeamName;

    @Column(name = "home_team_abbr", length = 16)
    private String homeTeamAbbr;

    @Column(name = "home_team_logo", length = 512)
    private String homeTeamLogo;

    @Column(name = "home_team_color", length = 16)
    private String homeTeamColor;

    @Column(name = "home_score")
    private Integer homeScore;

    // Away Competitor
    @Column(name = "away_team_id", nullable = false, length = 64)
    private String awayTeamId;

    @Column(name = "away_team_name", nullable = false)
    private String awayTeamName;

    @Column(name = "away_team_abbr", length = 16)
    private String awayTeamAbbr;

    @Column(name = "away_team_logo", length = 512)
    private String awayTeamLogo;

    @Column(name = "away_team_color", length = 16)
    private String awayTeamColor;

    @Column(name = "away_score")
    private Integer awayScore;

    @Column(name = "winner_team_id", length = 64)
    private String winnerTeamId;

    @Column(name = "venue")
    private String venue; // e.g. "Arena MRV"

    @Column(name = "venue_city", length = 128)
    private String venueCity;

    @Column(name = "broadcast", length = 128)
    private String broadcast; // e.g. "Premiere", "ESPN"

    @Builder.Default
    @Column(name = "notified", nullable = false)
    private boolean notified = false;

    @Builder.Default
    @Column(name = "notified15m", nullable = false)
    private boolean notified15m = false;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
