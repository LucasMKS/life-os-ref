package com.lifeos.modules.sports.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class SportMatchDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private String id;
    private String sport;
    private String league;
    private String leagueName;
    private Integer season;

    @JsonProperty("date")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @JsonDeserialize(using = FlexibleLocalDateTimeDeserializer.class)
    private LocalDateTime date;

    @JsonProperty("matchDate")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @JsonDeserialize(using = FlexibleLocalDateTimeDeserializer.class)
    private LocalDateTime matchDate;

    private String name;
    private String shortName;
    private String status; // SCHEDULED, IN_PROGRESS, HALFTIME, FINISHED, POSTPONED, CANCELED
    private String statusDetail;
    private Integer period;
    private String displayClock;
    private TeamCompetitorDTO homeTeam;
    private TeamCompetitorDTO awayTeam;
    private VenueDTO venue;
    private String broadcast;

    @JsonProperty("isUserTrackedMatch")
    private boolean isUserTrackedMatch;

    public void setDate(LocalDateTime date) {
        this.date = date;
        if (this.matchDate == null) {
            this.matchDate = date;
        }
    }

    public void setMatchDate(LocalDateTime matchDate) {
        this.matchDate = matchDate;
        if (this.date == null) {
            this.date = matchDate;
        }
    }
}
