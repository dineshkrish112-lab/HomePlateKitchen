package com.homeplate.repository;

import com.homeplate.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.*;
import java.util.*;

public interface CookingVideoRepository extends JpaRepository<CookingVideo, Long> {
    List<CookingVideo> findByKitchenIdOrderByCreatedAtDesc(Long kitchenId);
    List<CookingVideo> findAllByOrderByCreatedAtDesc();
    Optional<CookingVideo> findFirstByKitchenIdAndStatusOrderByPreparationDateDesc(Long kitchenId, Enums.VideoStatus status);
    Optional<CookingVideo> findFirstByKitchenIdOrderByCreatedAtDesc(Long kitchenId);
    long countByStatus(Enums.VideoStatus status);
}
