package com.lifeos.modules.gaming.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;

@Data
public class SteamOwnedGamesResponse {
    private ResponseData response;

    @Data
    public static class ResponseData {
        @JsonProperty("game_count")
        private Integer gameCount;
        private List<Game> games;
    }

    @Data
    public static class Game {
        private Long appid;
        private String name;
        @JsonProperty("playtime_forever")
        private Integer playtimeForever;
        @JsonProperty("img_icon_url")
        private String imgIconUrl;
        @JsonProperty("playtime_windows_forever")
        private Integer playtimeWindowsForever;
        @JsonProperty("playtime_mac_forever")
        private Integer playtimeMacForever;
        @JsonProperty("playtime_linux_forever")
        private Integer playtimeLinuxForever;
        @JsonProperty("rtime_last_played")
        private Long rtimeLastPlayed;
    }
}
