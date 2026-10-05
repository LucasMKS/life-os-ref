package com.lifeos.modules.reading.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "books", schema = "reading")
public class Book {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(name = "user_id")
    private String userId;
    
    private String title;
    
    private String subtitle;
    private String publisher;
    
    private String author;

    @Column(columnDefinition = "TEXT")
    private String coverUrl;
    private int totalPages;
    private int readPages;
    private String status;
    
    @ElementCollection
    @CollectionTable(name = "book_genres", joinColumns = @JoinColumn(name = "book_id"))
    @Column(name = "genre")
    private List<String> genres;

    @OneToMany(mappedBy = "book", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sessionDate ASC")
    private List<ReadingSession> sessions;

    @OneToMany(mappedBy = "book", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt DESC")
    private List<BookNote> notes;
    
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;
    
    @Column(nullable = true)
    private Double rating;
    
    @Column(columnDefinition = "TEXT")
    private String review;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}