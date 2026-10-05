package com.lifeos.modules.media.dto;

import java.util.List;

public record SerieWatchStatusDTO(
    String tmdbId,
    String title,
    String posterUrl,
    EpisodeDTO nextToWatch,
    long unwatchedCount,
    long totalAiredEpisodes,
    List<EpisodeDTO> episodes,
    Boolean watchLater,
    Boolean rewatching,
    Integer rewatchCount,
    Boolean inProduction,
    String status,
    List<String> genres,
    List<String> networks,
    String nextAirDate,
    Double rating
) {}
