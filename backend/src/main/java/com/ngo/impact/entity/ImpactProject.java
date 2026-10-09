package com.ngo.impact.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "impact_projects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImpactProject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(nullable = false)
    private String location; // e.g., "Rajasthan, India"

    private Long beneficiariesCount; // e.g. 1200

    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Status status = Status.ACTIVE;

    private LocalDate startDate;
    private LocalDate endDate;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public enum Status {
        PLANNING, ACTIVE, COMPLETED
    }
}
