package com.lifeos.modules.sports.dto;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

public class FlexibleLocalDateTimeDeserializer extends JsonDeserializer<LocalDateTime> {

    @Override
    public LocalDateTime deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String text = p.getText();
        if (text == null || text.isBlank()) {
            return null;
        }

        try {
            return Instant.parse(text).atOffset(ZoneOffset.UTC).toLocalDateTime();
        } catch (Exception e) {
            try {
                return LocalDateTime.parse(text);
            } catch (Exception e2) {
                try {
                    return LocalDateTime.parse(text, DateTimeFormatter.ISO_DATE_TIME);
                } catch (Exception e3) {
                    return null;
                }
            }
        }
    }
}
