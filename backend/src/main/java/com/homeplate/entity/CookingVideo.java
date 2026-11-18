package com.homeplate.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "cooking_videos")
@Getter @Setter @NoArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class CookingVideo {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnoreProperties({"description", "galleryImages"})
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "kitchen_id")
    private Kitchen kitchen;

    @Column(length = 500) private String videoUrl;
    @Column(length = 500) private String thumbnailUrl;
    private LocalDate preparationDate;
    @Column(length = 600) private String description;
    private Integer durationSeconds;

    @Enumerated(EnumType.STRING) @Column(length = 30)
    private Enums.VideoStatus status = Enums.VideoStatus.PENDING_REVIEW;

    // Admin hygiene checklist
    private Boolean cleanlinessOk;
    private Boolean storageOk;
    private Boolean hygieneOk;
    @Column(length = 800) private String adminRemarks;
    @Column(length = 80) private String reviewedBy;
    private LocalDateTime reviewedAt;

    private LocalDateTime createdAt = LocalDateTime.now();
}
