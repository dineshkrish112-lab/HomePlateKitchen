package com.homeplate.repository;

import com.homeplate.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.*;
import java.util.*;

public interface KitchenRepository extends JpaRepository<Kitchen, Long> {
    Optional<Kitchen> findByOwnerId(Long ownerId);
    List<Kitchen> findByStatus(Enums.KitchenStatus status);
    List<Kitchen> findByStatusIn(Collection<Enums.KitchenStatus> statuses);
    List<Kitchen> findAllByOrderByCreatedAtDesc();
    long countByStatus(Enums.KitchenStatus status);
    long countByCreatedAtBetween(LocalDateTime from, LocalDateTime to);
}
