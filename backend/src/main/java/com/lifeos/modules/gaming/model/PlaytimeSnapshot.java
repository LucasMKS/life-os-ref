package com.lifeos.modules.gaming.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "playtime_snapshots", schema = "gaming", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"userId", "appId", "date"})
})
public class PlaytimeSnapshot {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false)
    private String userId;
    
    @Column(nullable = false)
    private Long appId;
    
    @Column(nullable = false)
    private Integer totalPlaytimeForever; // Total minutes on Steam
    
    @Column(nullable = false)
    private LocalDate date;
}
