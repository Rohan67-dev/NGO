package com.ngo.impact.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "impact_stories", indexes = {
    @Index(name = "idx_story_slug", columnList = "slug"),
    @Index(name = "idx_story_published", columnList = "published")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImpactStory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String excerpt;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    private String imageUrl;
    private String author;

    @Builder.Default
    @Column(nullable = false)
    private Boolean published = true;

    private LocalDateTime publishedAt;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
