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
@Table(name = "subscriptions")
@Getter @Setter @NoArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Subscription {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnoreProperties({"description", "galleryImages"})
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "kitchen_id")
    private Kitchen kitchen;

    @Column(length = 60) private String planName;
    private Long planId;
    @Column(precision = 10, scale = 2) private BigDecimal amount = BigDecimal.ZERO;
    private LocalDate startDate;
    private LocalDate endDate;

    @Enumerated(EnumType.STRING) @Column(length = 20)
    private Enums.SubscriptionStatus status;

    @Column(length = 60) private String paymentReference;
    @Enumerated(EnumType.STRING) @Column(length = 20)
    private Enums.PaymentMethod paymentMethod;

    private LocalDateTime createdAt = LocalDateTime.now();
}
