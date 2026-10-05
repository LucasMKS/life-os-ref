package com.lifeos.modules.gaming.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tracked_games", schema = "gaming", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"userId", "appId"})
})
public class TrackedGame {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false)
    private String userId;
    
    @Column(nullable = false)
    private Long appId;
    
    private String name;
    
    @Enumerated(EnumType.STRING)
    private GameStatus status;
    
    private Integer queuePriority; // For "To Play" queue
    
    private Integer rating; // 1-10 or 1-5
    
    @Column(columnDefinition = "TEXT")
    private String generalComments;
    
    private LocalDateTime lastPlayedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
