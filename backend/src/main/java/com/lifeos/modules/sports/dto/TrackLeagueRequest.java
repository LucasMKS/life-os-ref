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
public class TrackLeagueRequest {

    @NotBlank(message = "sport cannot be blank")
    private String sport;

    @NotBlank(message = "league cannot be blank")
    private String league;

    @NotBlank(message = "leagueName cannot be blank")
    private String leagueName;

    private String leagueLogo;

    @Builder.Default
    private boolean notifyMatches = false;
}
