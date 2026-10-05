package com.lifeos.modules.sports.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.lifeos.modules.sports.dto.*;
import com.lifeos.modules.sports.model.UserTrackedSportsLeague;
import com.lifeos.modules.sports.model.UserTrackedSportsTeam;
import com.lifeos.modules.sports.service.SportsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/gaming/sports", "/api/v1/sports"})
@Slf4j
@RequiredArgsConstructor
public class SportsController {

    private final SportsService sportsService;

    /**
     * List supported sports leagues.
     */
    @GetMapping("/leagues")
    public ResponseEntity<List<SportLeagueDTO>> getLeagues() {
        return ResponseEntity.ok(sportsService.getLeagues());
    }

    /**
     * List teams in a league (cached 24h).
     */
    @GetMapping("/teams")
    public ResponseEntity<List<SportTeamDTO>> getTeams(
            @RequestParam String sport,
            @RequestParam String league) {
        return ResponseEntity.ok(sportsService.getTeams(sport, league));
    }

    /**
     * In-memory search for teams (<1ms, no external HTTP calls).
     */
    @GetMapping("/teams/search")
    public ResponseEntity<List<SportTeamDTO>> searchTeams(
            @RequestParam("q") String query,
            @RequestParam(value = "sport", required = false) String sport,
            @RequestParam(value = "league", required = false) String league) {
        return ResponseEntity.ok(sportsService.searchTeams(query, sport, league));
    }

    /**
     * Scoreboard / Live matches for a sport and league (cached 2m).
     */
    @GetMapping("/scoreboard")
    public ResponseEntity<ScoreboardResponseDTO> getScoreboard(
            @RequestParam String sport,
            @RequestParam String league,
            @RequestParam(value = "date", required = false) String date) {
        return ResponseEntity.ok(sportsService.getScoreboard(sport, league, date));
    }

    /**
     * Team schedule for the season (cached 1h).
     */
    @GetMapping("/teams/{teamId}/schedule")
    public ResponseEntity<List<SportMatchDTO>> getTeamSchedule(
            @PathVariable String teamId,
            @RequestParam String sport,
            @RequestParam String league) {
        return ResponseEntity.ok(sportsService.getTeamSchedule(sport, league, teamId));
    }

    /**
     * Matches for user's tracked teams and leagues on a given date.
     */
    @GetMapping("/matches/followed")
    public ResponseEntity<List<SportMatchDTO>> getFollowedMatches(
            @RequestHeader(value = "X-User-Id", defaultValue = "default") String userId,
            @RequestParam(value = "date", required = false) String date) {
        return ResponseEntity.ok(sportsService.getFollowedMatches(userId, date));
    }

    /**
     * Aggregated matches of the day across all leagues or filtered by league.
     */
    @GetMapping("/matches/day")
    public ResponseEntity<List<SportMatchDTO>> getDayMatches(
            @RequestParam(value = "date", required = false) String date,
            @RequestParam(value = "league", required = false) String league) {
        return ResponseEntity.ok(sportsService.getDayMatches(date, league));
    }

    /**
     * Radar of upcoming matches for user's tracked teams and leagues (next 7-14 days).
     */
    @GetMapping("/matches/radar")
    public ResponseEntity<List<SportMatchDTO>> getRadarMatches(
            @RequestHeader(value = "X-User-Id", defaultValue = "default") String userId,
            @RequestParam(value = "days", required = false, defaultValue = "14") Integer days) {
        return ResponseEntity.ok(sportsService.getRadarMatches(userId, days));
    }

    /**
     * Get user preferences (tracked teams and leagues).
     */
    @GetMapping("/preferences")
    public ResponseEntity<SportsUserPreferencesDTO> getUserPreferences(
            @RequestHeader(value = "X-User-Id", defaultValue = "default") String userId) {
        return ResponseEntity.ok(sportsService.getUserPreferences(userId));
    }

    /**
     * Follow / Track a team.
     */
    @PostMapping("/track/team")
    public ResponseEntity<UserTrackedSportsTeam> trackTeam(
            @RequestHeader(value = "X-User-Id", defaultValue = "default") String userId,
            @Valid @RequestBody TrackTeamRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sportsService.trackTeam(userId, request));
    }

    /**
     * Unfollow / Untrack a team.
     */
    @DeleteMapping("/track/team/{teamId}")
    public ResponseEntity<Void> untrackTeam(
            @RequestHeader(value = "X-User-Id", defaultValue = "default") String userId,
            @PathVariable String teamId,
            @RequestParam(value = "sport", required = false) String sport) {
        sportsService.untrackTeam(userId, teamId, sport);
        return ResponseEntity.noContent().build();
    }

    /**
     * Follow / Track a league.
     */
    @PostMapping("/track/league")
    public ResponseEntity<UserTrackedSportsLeague> trackLeague(
            @RequestHeader(value = "X-User-Id", defaultValue = "default") String userId,
            @Valid @RequestBody TrackLeagueRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sportsService.trackLeague(userId, request));
    }

    /**
     * Unfollow / Untrack a league.
     */
    @DeleteMapping("/track/league/{league}")
    public ResponseEntity<Void> untrackLeague(
            @RequestHeader(value = "X-User-Id", defaultValue = "default") String userId,
            @PathVariable String league) {
        sportsService.untrackLeague(userId, league);
        return ResponseEntity.noContent().build();
    }

    /**
     * Match detailed summary (boxscore, linescores, key events, leaders, game info).
     */
    @GetMapping("/matches/{eventId}/summary")
    public ResponseEntity<JsonNode> getMatchSummary(
            @PathVariable String eventId,
            @RequestParam String sport,
            @RequestParam String league) {
        JsonNode summary = sportsService.getMatchSummary(sport, league, eventId);
        if (summary == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(summary);
    }
}
