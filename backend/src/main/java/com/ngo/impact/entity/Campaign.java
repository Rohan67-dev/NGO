package com.ngo.impact.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "campaigns", indexes = {
    @Index(name = "idx_campaign_slug", columnList = "slug"),
    @Index(name = "idx_campaign_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Campaign {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal targetAmount;

    @Column(nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal currentAmount = BigDecimal.ZERO;

    private LocalDate startDate;
    private LocalDate endDate;

    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Status status = Status.ACTIVE;

    @Builder.Default
    private Boolean featured = false;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public enum Status {
        UPCOMING, ACTIVE, COMPLETED, CANCELLED
    }
}
