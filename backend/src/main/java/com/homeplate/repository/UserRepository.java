package com.homeplate.repository;

import com.homeplate.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.*;
import java.util.*;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    Optional<User> findFirstByPhone(String phone);
    List<User> findByRoleOrderByCreatedAtDesc(Role role);
    long countByRole(Role role);
    long countByRoleAndCreatedAtBetween(Role role, LocalDateTime from, LocalDateTime to);
}
