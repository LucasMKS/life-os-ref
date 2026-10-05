package com.lifeos.modules.media.dto;

public record EpisodeDTO(
    Integer seasonNumber,
    Integer episodeNumber,
    String name,
    String airDate,
    String overview,
    String stillPath,
    Boolean watched,
    Double rating,
    String watchedAt
) {}
