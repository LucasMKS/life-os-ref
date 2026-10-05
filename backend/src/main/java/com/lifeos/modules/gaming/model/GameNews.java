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
@Table(name = "game_news", schema = "gaming")
public class GameNews {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    private String game;
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String summary;
    
    private String url;
    private String type;
    private String patchVersion;
    private LocalDateTime publishedAt;
}
