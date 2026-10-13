package com.lifeos.modules.gaming.dto;

public record UpdateTwitchRecordRequest(
    boolean recordVod,
    String recordQuality
) {}
