package com.homeplate.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
@Getter @Setter @NoArgsConstructor
public class OrderItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id")
    private FoodOrder order;

    private Long menuItemId;
    @Column(nullable = false, length = 160) private String name;
    @Column(length = 500) private String imageUrl;
    private boolean veg;
    @Column(precision = 10, scale = 2) private BigDecimal unitPrice;
    private Integer quantity;
    @Column(precision = 10, scale = 2) private BigDecimal lineTotal;
}
