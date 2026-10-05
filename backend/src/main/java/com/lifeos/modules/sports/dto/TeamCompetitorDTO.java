package com.lifeos.modules.sports.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class TeamCompetitorDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private String id;
    private String name;
    private String displayName;
    private String abbreviation;
    private String logoUrl;
    private String color;
    private Integer score;
    private boolean winner;
    private String record; // e.g. "14-7-7"
    private String homeAway; // "home" or "away"
}
