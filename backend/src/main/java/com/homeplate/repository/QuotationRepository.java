package com.homeplate.repository;

import com.homeplate.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.*;
import java.util.*;

public interface QuotationRepository extends JpaRepository<Quotation, Long> {
    List<Quotation> findByRequestIdOrderByPriceAsc(Long requestId);
    List<Quotation> findByKitchenIdOrderByCreatedAtDesc(Long kitchenId);
    Optional<Quotation> findByRequestIdAndKitchenId(Long requestId, Long kitchenId);
}
