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
public class SportTeamDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private String id;
    private String uid;
    private String slug;
    private String name;
    private String displayName;
    private String shortDisplayName;
    private String abbreviation;
    private String color;
    private String alternateColor;
    private String logoUrl;
    private String darkLogoUrl;
    private String sport;
    private String league;
    private Boolean isFollowed;
}
