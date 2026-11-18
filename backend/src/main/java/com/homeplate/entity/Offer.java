package com.homeplate.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "offers")
@Getter @Setter @NoArgsConstructor
public class Offer {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 30) private String code;
    @Column(length = 300) private String description;
    @Column(precision = 5, scale = 2) private BigDecimal discountPercent;
    @Column(precision = 10, scale = 2) private BigDecimal maxDiscount;
    @Column(precision = 10, scale = 2) private BigDecimal minOrder = BigDecimal.ZERO;
    private LocalDate validTill;
    private boolean active = true;
    private Integer usageCount = 0;
}
