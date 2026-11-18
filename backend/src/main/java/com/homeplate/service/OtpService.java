package com.homeplate.service;

import com.homeplate.config.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** Phone OTP verification. Codes live in memory for 5 minutes. */
@Service
public class OtpService {
    private record Entry(String code, Instant expires, int attempts) {}

    private final Map<String, Entry> codes = new ConcurrentHashMap<>();
    private final Map<String, Instant> verified = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();
    private final NotificationService notifications;

    @Value("${homeplate.dev-otp:true}")
    private boolean devOtp;

    public OtpService(NotificationService notifications) {
        this.notifications = notifications;
    }

    /** Sends an OTP and returns it only when dev mode is on (no SMS provider configured). */
    public String send(String phone) {
        String key = key(phone);
        if (key.length() < 10) throw ApiException.badRequest("Enter a valid 10 digit mobile number");
        String code = String.format("%06d", random.nextInt(1_000_000));
        codes.put(key, new Entry(code, Instant.now().plusSeconds(300), 0));
        notifications.sendSms(phone, "Your HomePlate verification code is " + code + ". Valid for 5 minutes.");
        return devOtp ? code : null;
    }

    public void verify(String phone, String code) {
        String key = key(phone);
        Entry e = codes.get(key);
        if (e == null || e.expires().isBefore(Instant.now())) throw ApiException.badRequest("OTP expired. Please request a new one");
        if (e.attempts() >= 5) throw ApiException.badRequest("Too many attempts. Please request a new OTP");
        if (!e.code().equals(code == null ? "" : code.trim())) {
            codes.put(key, new Entry(e.code(), e.expires(), e.attempts() + 1));
            throw ApiException.badRequest("Incorrect OTP");
        }
        codes.remove(key);
        verified.put(key, Instant.now().plusSeconds(1800));
    }

    public boolean isVerified(String phone) {
        Instant until = verified.get(key(phone));
        return until != null && until.isAfter(Instant.now());
    }

    private String key(String phone) {
        String d = phone == null ? "" : phone.replaceAll("[^0-9]", "");
        return d.length() > 10 ? d.substring(d.length() - 10) : d;
    }
}
