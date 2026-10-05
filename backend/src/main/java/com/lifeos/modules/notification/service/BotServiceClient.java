package com.lifeos.modules.notification.service;

import com.fasterxml.jackson.databind.JsonNode;

public interface BotServiceClient {
    JsonNode getNextF1Sessions();
    JsonNode getReadingLibrary();
    JsonNode getRadarReleases();
}
