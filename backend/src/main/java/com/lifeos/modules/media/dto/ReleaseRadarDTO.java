package com.lifeos.modules.media.dto;

public record ReleaseRadarDTO(
    String tmdbId,
    String title,
    String type,
    String releaseDate,
    String posterUrl,
    String description,
    Integer episodeNumber,
    Integer seasonNumber,
    Boolean watched,
    String episodeTitle
) {
    public ReleaseRadarDTO(
        String tmdbId,
        String title,
        String type,
        String releaseDate,
        String posterUrl,
        String description,
        Integer episodeNumber,
        Integer seasonNumber,
        Boolean watched
    ) {
        this(tmdbId, title, type, releaseDate, posterUrl, description, episodeNumber, seasonNumber, watched, null);
    }
}
