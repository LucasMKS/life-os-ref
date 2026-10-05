package com.lifeos.modules.notification.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record TelegramUpdate(
        @JsonProperty("update_id") Long updateId,
        @JsonProperty("message") TelegramMessage message
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record TelegramMessage(
            @JsonProperty("message_id") Long messageId,
            @JsonProperty("text") String text,
            @JsonProperty("chat") TelegramChat chat
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record TelegramChat(
            @JsonProperty("id") Long id
    ) {}
}
