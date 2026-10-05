package com.lifeos.modules.gaming.dto;

import com.lifeos.modules.gaming.model.GameStatus;
import lombok.Data;

@Data
public class UpdateTrackedGameRequest {
    private Long appId;
    private String name;
    private GameStatus status;
    private Integer rating;
    private String generalComments;
}
