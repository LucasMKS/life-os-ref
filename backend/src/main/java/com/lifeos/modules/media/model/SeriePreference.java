package com.lifeos.modules.media.model;

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
@Table(name = "serie_preferences", schema = "media", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"userId", "serieId"})
})
public class SeriePreference {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String userId;
    private String serieId;
    private boolean watchLater;

    @Column(nullable = false, columnDefinition = "boolean default false")
    @Builder.Default
    private boolean rewatching = false;

    @Column(name = "rewatch_count", nullable = false, columnDefinition = "integer default 0")
    @Builder.Default
    private int rewatchCount = 0;
}
