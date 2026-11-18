package com.homeplate.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * SMS / email notifications.
 *
 * Twilio is wired through its plain REST API (no SDK needed). Until credentials are provided
 * (homeplate.twilio.enabled=false) every message is only written to the application log.
 * To enable: set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER and homeplate.twilio.enabled=true.
 */
@Service
public class NotificationService {
    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    @Value("${homeplate.twilio.enabled:false}") private boolean twilioEnabled;
    @Value("${homeplate.twilio.account-sid:}") private String accountSid;
    @Value("${homeplate.twilio.auth-token:}") private String authToken;
    @Value("${homeplate.twilio.from-number:}") private String fromNumber;

    private final RestClient rest = RestClient.create();

    public void sendSms(String phone, String message) {
        if (phone == null || phone.isBlank()) return;
        String to = normalise(phone);
        if (!twilioEnabled || accountSid.isBlank()) {
            log.info("[SMS -> {}] {}", to, message);
            return;
        }
        try {
            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("To", to);
            form.add("From", fromNumber);
            form.add("Body", message);
            String basic = Base64.getEncoder()
                    .encodeToString((accountSid + ":" + authToken).getBytes(StandardCharsets.UTF_8));
            rest.post()
                .uri("https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json", accountSid)
                .header("Authorization", "Basic " + basic)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .toBodilessEntity();
            log.info("[SMS sent via Twilio -> {}]", to);
        } catch (Exception e) {
            log.warn("Twilio SMS to {} failed: {}", to, e.getMessage());
        }
    }

    public void sendEmail(String to, String subject, String body) {
        if (to == null || to.isBlank()) return;
        // Email provider (Twilio SendGrid) will be plugged in here once credentials are available.
        log.info("[EMAIL -> {}] {} :: {}", to, subject, body);
    }

    private String normalise(String phone) {
        String digits = phone.replaceAll("[^0-9+]", "");
        if (digits.startsWith("+")) return digits;
        if (digits.length() == 10) return "+91" + digits;
        return "+" + digits;
    }
}
