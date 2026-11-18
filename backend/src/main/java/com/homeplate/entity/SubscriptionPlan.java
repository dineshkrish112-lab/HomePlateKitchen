package com.homeplate.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "subscription_plans")
@Getter @Setter @NoArgsConstructor
public class SubscriptionPlan {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 60) private String name;
    @Column(length = 400) private String description;
    @Column(precision = 10, scale = 2) private BigDecimal price;
    private Integer durationDays;
    /** Pipe-separated feature bullet points. */
    @Column(length = 1000) private String features;
    private boolean active = true;
    private boolean popular;
}
