package com.homeplate.repository;

import com.homeplate.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.*;
import java.util.*;

public interface CustomRequestRepository extends JpaRepository<CustomRequest, Long> {
    List<CustomRequest> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    List<CustomRequest> findByStatusInAndRequiredDateGreaterThanEqualOrderByCreatedAtDesc(Collection<Enums.RequestStatus> statuses, LocalDate date);
    List<CustomRequest> findAllByOrderByCreatedAtDesc();
}
