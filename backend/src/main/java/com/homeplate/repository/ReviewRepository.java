package com.homeplate.repository;

import com.homeplate.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.*;
import java.util.*;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByKitchenIdOrderByCreatedAtDesc(Long kitchenId);
    List<Review> findTop12ByOrderByCreatedAtDesc();
}
