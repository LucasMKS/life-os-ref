package com.lifeos.modules.f1.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "f1_constructor_standings", schema = "f1")
public class F1ConstructorStandings {
    @Id
    @Builder.Default
    private String id = UUID.randomUUID().toString();

    private int position;
    private String constructorName;
    private int points;
    private int season;
    private int wins;
    private String constructorId;
    private String nationality;
}
