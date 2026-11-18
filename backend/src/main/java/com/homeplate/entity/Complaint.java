package com.homeplate.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "complaints")
@Getter @Setter @NoArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Complaint {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "customer_id")
    private User customer;

    @JsonIgnoreProperties({"description", "galleryImages"})
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "kitchen_id")
    private Kitchen kitchen;

    private Long orderId;
    @Column(length = 40) private String category;
    @Column(length = 160) private String subject;
    @Column(length = 2000) private String description;

    @Enumerated(EnumType.STRING) @Column(length = 20)
    private Enums.ComplaintStatus status = Enums.ComplaintStatus.OPEN;
    @Column(length = 20) private String priority = "MEDIUM";
    @Column(length = 2000) private String resolution;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime resolvedAt;
}
