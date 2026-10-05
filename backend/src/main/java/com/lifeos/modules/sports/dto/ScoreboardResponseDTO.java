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
public class ScoreboardResponseDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private String sport;
    private String league;
    private String leagueName;
    private String queryDate;
    private List<SportMatchDTO> matches;
}
