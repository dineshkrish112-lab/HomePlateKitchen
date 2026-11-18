package com.homeplate.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
@Getter @Setter @NoArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "kitchen"})
public class Review {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "kitchen_id")
    private Kitchen kitchen;

    @Column(length = 120) private String customerName;
    private Long customerId;
    private Long orderId;
    private Integer rating;
    @Column(length = 1000) private String comment;
    @Column(length = 1000) private String kitchenReply;
    private LocalDateTime createdAt = LocalDateTime.now();

    @com.fasterxml.jackson.annotation.JsonProperty("kitchenName")
    public String kitchenNameJson() { return kitchen == null ? null : kitchen.getName(); }
}
