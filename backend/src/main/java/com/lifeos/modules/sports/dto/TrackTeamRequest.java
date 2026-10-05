package com.lifeos.modules.sports.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrackTeamRequest {

    @NotBlank(message = "sport cannot be blank")
    private String sport;

    @NotBlank(message = "league cannot be blank")
    private String league;

    @NotBlank(message = "teamId cannot be blank")
    private String teamId;

    @NotBlank(message = "teamName cannot be blank")
    private String teamName;

    private String teamDisplayName;
    private String teamAbbreviation;
    private String logoUrl;
    private String primaryColor;
    private String secondaryColor;

    @Builder.Default
    private boolean notifyMatches = true;
}
