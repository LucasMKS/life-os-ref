package com.lifeos.modules.f1.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "f1_driver_standings", schema = "f1")
public class F1DriverStandings {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private int position;
    private int points;
    private String driverName;
    private String constructorName;
    private int season;
    private int wins;
    private String driverId;
    private String code;
    private String nationality;
}
