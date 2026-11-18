package com.homeplate.repository;

import com.homeplate.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.*;
import java.util.*;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    List<Subscription> findByKitchenIdOrderByCreatedAtDesc(Long kitchenId);
    Optional<Subscription> findFirstByKitchenIdOrderByEndDateDesc(Long kitchenId);
    List<Subscription> findAllByOrderByCreatedAtDesc();
}
