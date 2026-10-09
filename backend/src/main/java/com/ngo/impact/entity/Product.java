package com.ngo.impact.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products", indexes = {
    @Index(name = "idx_product_slug", columnList = "slug"),
    @Index(name = "idx_product_sku", columnList = "sku"),
    @Index(name = "idx_product_featured", columnList = "featured"),
    @Index(name = "idx_product_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String shortDescription;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(precision = 10, scale = 2)
    private BigDecimal discountPrice;

    @Column(nullable = false, unique = true)
    private String sku;

    @Column(nullable = false)
    private Integer stockQuantity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    // NGO Impact Details
    @Column(columnDefinition = "TEXT")
    private String impactDescription; // e.g., "Provides 5 meals to rural school children"

    private BigDecimal impactAmount; // Optional financial impact contribution metric

    // Catalogue / compliance details (e.g. from the NGO's product catalogue spreadsheet). All optional.
    private String sourceSerialNo;   // Serial number / identifier in the source catalogue
    private String brand;
    private String manufacturer;
    private String hsnCode;

    @Column(precision = 5, scale = 2)
    private BigDecimal gstRate;      // GST percentage recorded in the catalogue, e.g. 5.00 or 12.00

    private String material;
    private String dimensions;       // Size / dimensions as written in the catalogue
    private String colour;
    private String listingStatus;    // Marketplace listing / upload status from the catalogue

    // Any additional catalogue columns that have no dedicated field, kept verbatim as a JSON object
    @Column(columnDefinition = "TEXT")
    private String extraAttributes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Status status = Status.ACTIVE;

    @Builder.Default
    private Boolean featured = false;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<ProductImage> images = new ArrayList<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum Status {
        ACTIVE, INACTIVE, OUT_OF_STOCK
    }
}
