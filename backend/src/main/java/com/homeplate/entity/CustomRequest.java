package com.homeplate.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "custom_requests")
@Getter @Setter @NoArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class CustomRequest {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, length = 20)
    private String requestNumber;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "customer_id")
    private User customer;

    @Column(nullable = false, length = 120) private String dishName;
    @Column(length = 60) private String quantity;
    private Integer servings = 1;
    @Column(length = 20) private String spiceLevel;
    private boolean veg;
    @Column(length = 40) private String cuisineStyle;

    private LocalDate requiredDate;
    @Enumerated(EnumType.STRING) @Column(length = 20)
    private Enums.MealType mealSlot = Enums.MealType.LUNCH;
    private LocalTime preferredTime;

    @Column(length = 1000) private String instructions;
    @Column(precision = 10, scale = 2) private BigDecimal budget;

    @Column(length = 400) private String deliveryAddress;
    @Column(length = 80) private String deliveryArea;
    private Double latitude;
    private Double longitude;

    @Enumerated(EnumType.STRING) @Column(length = 20)
    private Enums.RequestStatus status = Enums.RequestStatus.SUBMITTED;

    private Long selectedQuotationId;
    private Long orderId;
    private Integer offerCount = 0;

    private LocalDateTime createdAt = LocalDateTime.now();
}
