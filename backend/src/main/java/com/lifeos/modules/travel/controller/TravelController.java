package com.lifeos.modules.travel.controller;

import com.lifeos.modules.travel.dto.ItineraryItemRequest;
import com.lifeos.modules.travel.dto.TripRequest;
import com.lifeos.modules.travel.model.ItineraryItem;
import com.lifeos.modules.travel.model.Trip;
import com.lifeos.modules.travel.service.TravelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/travel")
@RequiredArgsConstructor
public class TravelController {

    private final TravelService travelService;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    private String extractJsonString(Object body, String key) {
        if (body == null) return null;
        String snakeKey = key.replaceAll("([a-z])([A-Z]+)", "$1_$2").toLowerCase();

        if (body instanceof String str) {
            try {
                com.fasterxml.jackson.databind.JsonNode node = objectMapper.readTree(str);
                if (node.isObject()) {
                    if (node.has(key)) {
                        com.fasterxml.jackson.databind.JsonNode target = node.get(key);
                        return target.isTextual() ? target.asText() : objectMapper.writeValueAsString(target);
                    }
                    if (node.has(snakeKey)) {
                        com.fasterxml.jackson.databind.JsonNode target = node.get(snakeKey);
                        return target.isTextual() ? target.asText() : objectMapper.writeValueAsString(target);
                    }
                }
            } catch (Exception ignored) {}
            return str;
        }
        if (body instanceof java.util.Map<?, ?> map) {
            Object val = map.containsKey(key) ? map.get(key) : (map.containsKey(snakeKey) ? map.get(snakeKey) : null);
            if (val != null) {
                if (val instanceof String s) return s;
                try {
                    return objectMapper.writeValueAsString(val);
                } catch (Exception e) {
                    return val.toString();
                }
            }
        }
        try {
            return objectMapper.writeValueAsString(body);
        } catch (Exception e) {
            return body.toString();
        }
    }

    @GetMapping("/trips")
    public ResponseEntity<List<Trip>> getTrips(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(travelService.getUserTrips(userId));
    }

    @GetMapping("/trips/{tripId}")
    public ResponseEntity<Trip> getTrip(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable Long tripId) {
        return ResponseEntity.ok(travelService.getTrip(tripId, userId));
    }

    @PostMapping("/trips")
    public ResponseEntity<Trip> createTrip(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @Valid @RequestBody TripRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(travelService.createTrip(userId, request));
    }

    @PutMapping("/trips/{tripId}")
    public ResponseEntity<Trip> updateTrip(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable Long tripId,
            @Valid @RequestBody TripRequest request) {
        return ResponseEntity.ok(travelService.updateTrip(tripId, userId, request));
    }

    @DeleteMapping("/trips/{tripId}")
    public ResponseEntity<Void> deleteTrip(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable Long tripId) {
        travelService.deleteTrip(tripId, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/trips/{tripId}/itinerary")
    public ResponseEntity<ItineraryItem> addItineraryItem(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable Long tripId,
            @Valid @RequestBody ItineraryItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(travelService.addItineraryItem(tripId, userId, request));
    }

    @PutMapping("/trips/{tripId}/itinerary/{itemId}")
    public ResponseEntity<ItineraryItem> updateItineraryItem(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable Long tripId,
            @PathVariable Long itemId,
            @Valid @RequestBody ItineraryItemRequest request) {
        return ResponseEntity.ok(travelService.updateItineraryItem(tripId, itemId, userId, request));
    }

    @PatchMapping(value = "/trips/{tripId}/places", consumes = {"application/json", "text/plain", "*/*"})
    public ResponseEntity<Trip> updatePlaces(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable Long tripId,
            @RequestBody(required = false) Object body) {
        return ResponseEntity.ok(travelService.updatePlaces(tripId, userId, extractJsonString(body, "placesJson")));
    }

    @PatchMapping(value = "/trips/{tripId}/shopping", consumes = {"application/json", "text/plain", "*/*"})
    public ResponseEntity<Trip> updateShopping(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable Long tripId,
            @RequestBody(required = false) Object body) {
        return ResponseEntity.ok(travelService.updateShopping(tripId, userId, extractJsonString(body, "shoppingJson")));
    }

    @PatchMapping(value = "/trips/{tripId}/tasks", consumes = {"application/json", "text/plain", "*/*"})
    public ResponseEntity<Trip> updateTasks(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable Long tripId,
            @RequestBody(required = false) Object body) {
        return ResponseEntity.ok(travelService.updateTasks(tripId, userId, extractJsonString(body, "tasksJson")));
    }

    @PatchMapping(value = "/trips/{tripId}/checklist", consumes = {"application/json", "text/plain", "*/*"})
    public ResponseEntity<Trip> updateChecklist(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable Long tripId,
            @RequestBody(required = false) Object body) {
        return ResponseEntity.ok(travelService.updateChecklist(tripId, userId, extractJsonString(body, "checklistJson")));
    }

    @PatchMapping(value = "/trips/{tripId}/notes", consumes = {"application/json", "text/plain", "*/*"})
    public ResponseEntity<Trip> updateNotes(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable Long tripId,
            @RequestBody(required = false) Object body) {
        return ResponseEntity.ok(travelService.updateNotes(tripId, userId, extractJsonString(body, "notes")));
    }

    @PatchMapping("/trips/{tripId}/itinerary/{itemId}/toggle")
    public ResponseEntity<ItineraryItem> toggleItineraryItem(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable Long tripId,
            @PathVariable Long itemId) {
        return ResponseEntity.ok(travelService.toggleItineraryItemCompleted(tripId, itemId, userId));
    }

    @DeleteMapping("/trips/{tripId}/itinerary/{itemId}")
    public ResponseEntity<Void> deleteItineraryItem(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable Long tripId,
            @PathVariable Long itemId) {
        travelService.deleteItineraryItem(tripId, itemId, userId);
        return ResponseEntity.noContent().build();
    }
}
