package com.ngo.impact.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "impact_metrics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImpactMetric {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title; // e.g. "Meals Provided"

    private String description; // e.g. "Directly served to rural school children"

    @Column(name = "metric_value", nullable = false)
    private Long value; // e.g. 15400

    private String unit; // e.g. "Meals", "Artisans", "Trees", "Families"

    private String icon; // Lucide icon identifier e.g. "Utensils", "Heart", "Users", "Trees"

    @Builder.Default
    private Integer displayOrder = 0;

    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;
}
