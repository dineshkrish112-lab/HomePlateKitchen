package com.homeplate.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "menu_items")
@Getter @Setter @NoArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "kitchen"})
public class MenuItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "kitchen_id")
    private Kitchen kitchen;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 600)
    private String description;

    @Column(length = 500)
    private String imageUrl;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    /** Optional discounted price (special offer). */
    @Column(precision = 10, scale = 2)
    private BigDecimal offerPrice;

    private boolean veg = true;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Enums.MealType mealType = Enums.MealType.LUNCH;

    @Column(length = 60)
    private String category;

    private Integer quantityAvailable = 20;
    private boolean available = true;
    private boolean todaySpecial;

    /** Optional scheduling window. */
    private LocalDate availableFrom;
    private LocalDate availableTo;

    @Column(length = 40)
    private String servingSize;

    private LocalDateTime createdAt = LocalDateTime.now();

    // Exposed to JSON only (not JPA attributes, so Spring Data derived queries are not confused).
    @com.fasterxml.jackson.annotation.JsonProperty("kitchenId")
    public Long kitchenIdJson() { return kitchen == null ? null : kitchen.getId(); }

    @com.fasterxml.jackson.annotation.JsonProperty("kitchenName")
    public String kitchenNameJson() { return kitchen == null ? null : kitchen.getName(); }
}
