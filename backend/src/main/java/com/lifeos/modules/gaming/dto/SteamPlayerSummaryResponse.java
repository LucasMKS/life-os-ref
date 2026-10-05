package com.lifeos.modules.gaming.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;

@Data
public class SteamPlayerSummaryResponse {
    private ResponseData response;

    @Data
    public static class ResponseData {
        private List<Player> players;
    }

    @Data
    public static class Player {
        private String steamid;
        private String personaname;
        private String profileurl;
        private String avatar;
        private String avatarmedium;
        private String avatarfull;
        @JsonProperty("personastate")
        private Integer personastate; // 0: Offline, 1: Online, ...
        @JsonProperty("gameid")
        private String gameid;
        @JsonProperty("gameextrainfo")
        private String gameextrainfo;
    }
}
