package com.homeplate.repository;

import com.homeplate.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.*;
import java.util.*;

public interface OfferRepository extends JpaRepository<Offer, Long> {
    Optional<Offer> findByCodeIgnoreCase(String code);
    List<Offer> findByActiveTrue();
}
