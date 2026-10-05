package com.lifeos.modules.sports.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class SportLeagueDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private String id;
    private String slug;
    private String name;
    private String displayName;
    private String abbreviation;
    private String sport;
    private String logoUrl;
    private Integer seasonYear;
    private List<String> calendarDates;
    private Boolean isFollowed;
}
