package com.homeplate;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

@SpringBootApplication
public class HomePlateApplication {
    public static void main(String[] args) {
        // All business rules (11 AM cutoff, opening hours) are evaluated in Indian time.
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata"));
        SpringApplication.run(HomePlateApplication.class, args);
    }
}
