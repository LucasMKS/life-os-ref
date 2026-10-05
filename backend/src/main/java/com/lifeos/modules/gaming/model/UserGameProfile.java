package com.lifeos.modules.gaming.model;

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
@Table(name = "user_game_profiles", schema = "gaming")
public class UserGameProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    private String userId;
    private String game;
    private String inGameName;
    private String serverRegion;
    private String rankOrLevel;
    
    @Column(columnDefinition = "TEXT")
    private String additionalData;
}
