package com.homeplate.repository;

import com.homeplate.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.*;
import java.util.*;

public interface PlatformSettingsRepository extends JpaRepository<PlatformSettings, Long> {

}
