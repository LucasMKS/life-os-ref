package com.lifeos.modules.travel.service;

import com.lifeos.modules.travel.dto.ItineraryItemRequest;
import com.lifeos.modules.travel.dto.TripRequest;
import com.lifeos.modules.travel.model.ItineraryItem;
import com.lifeos.modules.travel.model.Trip;
import com.lifeos.modules.travel.repository.ItineraryItemRepository;
import com.lifeos.modules.travel.repository.TripRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TravelService {

    private final TripRepository tripRepository;
    private final ItineraryItemRepository itineraryItemRepository;

    public List<Trip> getUserTrips(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User ID header is missing");
        }
        return tripRepository.findByUserIdOrderByStartDateAsc(userId);
    }

    public Trip getTrip(Long tripId, String userId) {
        if (userId == null || userId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User ID header is missing");
        }
        return tripRepository.findByIdAndUserId(tripId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found or does not belong to user"));
    }

    @Transactional
    public Trip createTrip(String userId, TripRequest request) {
        if (userId == null || userId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User ID header is missing");
        }
        Trip trip = new Trip();
        trip.setUserId(userId);
        trip.setDestination(request.destination());
        trip.setStartDate(request.startDate());
        trip.setEndDate(request.endDate());
        trip.setFlightInfo(request.flightInfo());
        trip.setHotelInfo(request.hotelInfo());
        trip.setNotes(request.notes());
        trip.setChecklistJson(request.checklistJson());
        trip.setPlacesJson(request.placesJson());
        trip.setShoppingJson(request.shoppingJson());
        trip.setTasksJson(request.tasksJson());

        return tripRepository.save(trip);
    }

    @Transactional
    public Trip updateTrip(Long tripId, String userId, TripRequest request) {
        Trip trip = getTrip(tripId, userId);

        trip.setDestination(request.destination());
        trip.setStartDate(request.startDate());
        trip.setEndDate(request.endDate());
        trip.setFlightInfo(request.flightInfo());
        trip.setHotelInfo(request.hotelInfo());
        trip.setNotes(request.notes());
        trip.setChecklistJson(request.checklistJson());
        trip.setPlacesJson(request.placesJson());
        trip.setShoppingJson(request.shoppingJson());
        trip.setTasksJson(request.tasksJson());

        return tripRepository.saveAndFlush(trip);
    }

    @Transactional
    public Trip updatePlaces(Long tripId, String userId, String placesJson) {
        Trip trip = getTrip(tripId, userId);
        trip.setPlacesJson(placesJson);
        return tripRepository.saveAndFlush(trip);
    }

    @Transactional
    public Trip updateShopping(Long tripId, String userId, String shoppingJson) {
        Trip trip = getTrip(tripId, userId);
        trip.setShoppingJson(shoppingJson);
        return tripRepository.saveAndFlush(trip);
    }

    @Transactional
    public Trip updateTasks(Long tripId, String userId, String tasksJson) {
        Trip trip = getTrip(tripId, userId);
        trip.setTasksJson(tasksJson);
        return tripRepository.saveAndFlush(trip);
    }

    @Transactional
    public Trip updateChecklist(Long tripId, String userId, String checklistJson) {
        Trip trip = getTrip(tripId, userId);
        trip.setChecklistJson(checklistJson);
        return tripRepository.saveAndFlush(trip);
    }

    @Transactional
    public Trip updateNotes(Long tripId, String userId, String notes) {
        Trip trip = getTrip(tripId, userId);
        trip.setNotes(notes);
        return tripRepository.saveAndFlush(trip);
    }

    @Transactional
    public void deleteTrip(Long tripId, String userId) {
        Trip trip = getTrip(tripId, userId);
        tripRepository.delete(trip);
    }

    @Transactional
    public ItineraryItem addItineraryItem(Long tripId, String userId, ItineraryItemRequest request) {
        Trip trip = getTrip(tripId, userId);

        ItineraryItem item = new ItineraryItem();
        item.setTrip(trip);
        item.setTitle(request.title());
        item.setDateTime(request.dateTime());
        item.setLocationName(request.locationName());
        item.setAddress(request.address());
        item.setLatitude(request.latitude());
        item.setLongitude(request.longitude());
        item.setNotes(request.notes());
        item.setCategory(request.category() != null ? request.category() : "ATTRACTION");
        item.setCompleted(request.completed() != null ? request.completed() : false);

        trip.getItinerary().add(item);
        itineraryItemRepository.save(item);
        return item;
    }

    @Transactional
    public ItineraryItem updateItineraryItem(Long tripId, Long itemId, String userId, ItineraryItemRequest request) {
        // Valida que a viagem pertence ao usuário
        Trip trip = getTrip(tripId, userId);

        ItineraryItem item = itineraryItemRepository.findByIdAndTripId(itemId, tripId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Itinerary item not found in this trip"));

        item.setTitle(request.title());
        item.setDateTime(request.dateTime());
        item.setLocationName(request.locationName());
        item.setAddress(request.address());
        item.setLatitude(request.latitude());
        item.setLongitude(request.longitude());
        item.setNotes(request.notes());
        if (request.category() != null) {
            item.setCategory(request.category());
        }
        if (request.completed() != null) {
            item.setCompleted(request.completed());
        }

        return itineraryItemRepository.save(item);
    }

    @Transactional
    public ItineraryItem toggleItineraryItemCompleted(Long tripId, Long itemId, String userId) {
        Trip trip = getTrip(tripId, userId);

        ItineraryItem item = itineraryItemRepository.findByIdAndTripId(itemId, tripId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Itinerary item not found in this trip"));

        item.setCompleted(item.getCompleted() == null || !item.getCompleted());
        return itineraryItemRepository.save(item);
    }

    @Transactional
    public void deleteItineraryItem(Long tripId, Long itemId, String userId) {
        // Valida que a viagem pertence ao usuário
        Trip trip = getTrip(tripId, userId);

        ItineraryItem item = itineraryItemRepository.findByIdAndTripId(itemId, tripId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Itinerary item not found in this trip"));

        trip.getItinerary().remove(item);
        itineraryItemRepository.delete(item);
    }
}
