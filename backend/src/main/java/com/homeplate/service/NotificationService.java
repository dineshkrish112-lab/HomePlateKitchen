package com.homeplate.service;

import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * SMS / email notifications.
 * SMS: Twilio Messages API (needs homeplate.twilio.from-number). Email: Twilio SendGrid API key or SMTP (spring.mail.*).
 * Anything not configured is only written to the log.
 */
@Service
public class NotificationService {
    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final TwilioClient twilio;
    private final ObjectProvider<JavaMailSender> mailSender;
    private final RestClient rest = RestClient.create();

    @Value("${homeplate.mail.from:}") private String mailFrom;
    @Value("${homeplate.mail.from-name:HomePlate}") private String mailFromName;
    @Value("${homeplate.mail.sendgrid-api-key:}") private String sendgridKey;
    @Value("${spring.mail.host:}") private String smtpHost;
    @Value("${spring.mail.username:}") private String smtpUser;

    public NotificationService(TwilioClient twilio, ObjectProvider<JavaMailSender> mailSender) {
        this.twilio = twilio;
        this.mailSender = mailSender;
    }

    public boolean emailConfigured() {
        return !sendgridKey.isBlank() && !mailFrom.isBlank() || !smtpHost.isBlank() && mailSender.getIfAvailable() != null;
    }

    /** Fire-and-forget SMS (order updates). Never throws. */
    public void sendSms(String phone, String message) {
        if (phone == null || phone.isBlank()) return;
        String to = e164(phone);
        if (!twilio.smsConfigured()) {
            log.info("[SMS -> {}] {}", TwilioClient.mask(to), message);
            return;
        }
        try {
            twilio.sendSms(to, message);
        } catch (Exception e) {
            log.warn("SMS to {} failed: {}", TwilioClient.mask(to), e.getMessage());
        }
    }

    /** Fire-and-forget email. Never throws. */
    public void sendEmail(String to, String subject, String body) {
        try {
            sendEmailOrThrow(to, subject, body);
        } catch (Exception e) {
            log.warn("Email to {} failed: {}", to, e.getMessage());
        }
    }

    /** Sends an email and throws when delivery fails (used for OTPs). */
    public void sendEmailOrThrow(String to, String subject, String body) {
        if (to == null || to.isBlank()) return;
        String html = wrapHtml(subject, body);
        if (!sendgridKey.isBlank() && !mailFrom.isBlank()) {
            rest.post().uri("https://api.sendgrid.com/v3/mail/send")
                    .header("Authorization", "Bearer " + sendgridKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "personalizations", List.of(Map.of("to", List.of(Map.of("email", to)))),
                            "from", Map.of("email", mailFrom, "name", mailFromName),
                            "subject", subject,
                            "content", List.of(Map.of("type", "text/plain", "value", body),
                                    Map.of("type", "text/html", "value", html))))
                    .retrieve().toBodilessEntity();
            log.info("[EMAIL sent via SendGrid -> {}] {}", to, subject);
            return;
        }
        JavaMailSender sender = mailSender.getIfAvailable();
        if (!smtpHost.isBlank() && sender != null) {
            try {
                MimeMessage m = sender.createMimeMessage();
                MimeMessageHelper h = new MimeMessageHelper(m, true, "UTF-8");
                String from = mailFrom.isBlank() ? smtpUser : mailFrom;
                h.setFrom(new InternetAddress(from, mailFromName));
                h.setTo(to);
                h.setSubject(subject);
                h.setText(body, html);
                sender.send(m);
            } catch (Exception e) {
                throw new IllegalStateException(e.getMessage(), e);
            }
            log.info("[EMAIL sent via SMTP -> {}] {}", to, subject);
            return;
        }
        log.info("[EMAIL -> {}] {} :: {}", to, subject, body);
    }

    private String wrapHtml(String subject, String body) {
        String safe = body.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\n", "<br>");
        return "<div style=\"font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px\">"
                + "<h2 style=\"color:#2f6b3a;margin:0 0 12px\">HomePlate</h2>"
                + "<h3 style=\"margin:0 0 12px;color:#222\">" + subject + "</h3>"
                + "<p style=\"font-size:15px;color:#333;line-height:1.6\">" + safe + "</p>"
                + "<p style=\"font-size:12px;color:#888;margin-top:24px\">Homemade food. Local kitchens. A taste of home.</p></div>";
    }

    public static String e164(String phone) {
        String digits = phone.replaceAll("[^0-9+]", "");
        if (digits.startsWith("+")) return digits;
        if (digits.length() == 10) return "+91" + digits;
        return "+" + digits;
    }
}
