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
@Table(name = "steam_profiles", schema = "gaming")
public class SteamProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(unique = true, nullable = false)
    private String userId;
    
    @Column(unique = true, nullable = false)
    private String steamId;
    
    private String personaName;
    private String profileUrl;
    private String avatarUrl;
}
