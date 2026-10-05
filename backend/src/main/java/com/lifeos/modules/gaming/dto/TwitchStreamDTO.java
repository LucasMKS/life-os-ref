package com.lifeos.modules.gaming.dto;

public record TwitchStreamDTO(
        String userName,
        String gameName,
        String title,
        int viewerCount,
        String type,
        String thumbnailUrl) {}
