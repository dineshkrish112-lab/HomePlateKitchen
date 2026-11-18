package com.homeplate.repository;

import com.homeplate.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.*;
import java.util.*;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    List<Complaint> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    List<Complaint> findByKitchenIdOrderByCreatedAtDesc(Long kitchenId);
    List<Complaint> findAllByOrderByCreatedAtDesc();
    long countByStatus(Enums.ComplaintStatus status);
}
