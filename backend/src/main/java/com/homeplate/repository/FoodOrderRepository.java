package com.homeplate.repository;

import com.homeplate.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.*;
import java.util.*;

public interface FoodOrderRepository extends JpaRepository<FoodOrder, Long> {
    Optional<FoodOrder> findByOrderNumber(String orderNumber);
    List<FoodOrder> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    List<FoodOrder> findByKitchenIdOrderByCreatedAtDesc(Long kitchenId);
    List<FoodOrder> findByKitchenIdAndCreatedAtBetween(Long kitchenId, LocalDateTime from, LocalDateTime to);
    List<FoodOrder> findByCreatedAtBetween(LocalDateTime from, LocalDateTime to);
    List<FoodOrder> findAllByOrderByCreatedAtDesc();
    long countByKitchenId(Long kitchenId);
}
