package com.lifeos.modules.travel.model;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "trips", schema = "travel")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Trip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String destination;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "flight_info", columnDefinition = "TEXT")
    private String flightInfo;

    @Column(name = "hotel_info", columnDefinition = "TEXT")
    private String hotelInfo;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @JsonProperty("checklistJson")
    @JsonAlias({"checklist_json", "checklistJson"})
    @Column(name = "checklist_json", columnDefinition = "TEXT")
    private String checklistJson;

    @JsonProperty("placesJson")
    @JsonAlias({"places_json", "placesJson"})
    @Column(name = "places_json", columnDefinition = "TEXT")
    private String placesJson;

    @JsonProperty("shoppingJson")
    @JsonAlias({"shopping_json", "shoppingJson"})
    @Column(name = "shopping_json", columnDefinition = "TEXT")
    private String shoppingJson;

    @JsonProperty("tasksJson")
    @JsonAlias({"tasks_json", "tasksJson"})
    @Column(name = "tasks_json", columnDefinition = "TEXT")
    private String tasksJson;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @OneToMany(mappedBy = "trip", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("dateTime ASC")
    private List<ItineraryItem> itinerary = new ArrayList<>();
}
