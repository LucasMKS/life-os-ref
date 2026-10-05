package com.lifeos.modules.travel.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "itinerary_items", schema = "travel")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ItineraryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    @JsonIgnore
    private Trip trip;

    @Column(nullable = false)
    private String title;

    @Column(name = "date_time", nullable = false)
    private LocalDateTime dateTime;

    @Column(name = "location_name")
    private String locationName;

    private String address;

    private Double latitude;

    private Double longitude;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private String category;

    @Column(nullable = false)
    private Boolean completed = false;
}
