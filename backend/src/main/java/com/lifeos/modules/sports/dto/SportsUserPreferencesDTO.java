package com.lifeos.modules.sports.dto;

import com.lifeos.modules.sports.model.UserTrackedSportsLeague;
import com.lifeos.modules.sports.model.UserTrackedSportsTeam;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SportsUserPreferencesDTO {
    private List<UserTrackedSportsTeam> trackedTeams;
    private List<UserTrackedSportsLeague> trackedLeagues;
}
