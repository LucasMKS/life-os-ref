package com.lifeos.modules.f1.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
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
@Table(name = "f1_sessions", schema = "f1")
public class F1Session {
    @Id
    private String id;

    private String name;
    private LocalDateTime date;
    private String status;
    private String meetingName;

    @Builder.Default
    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean notified = false;
}
