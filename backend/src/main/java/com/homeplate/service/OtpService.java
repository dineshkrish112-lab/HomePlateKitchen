package com.homeplate.service;

import com.homeplate.config.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

/**
 * OTP verification for mobile (SMS) and email.
 *  - SMS: Twilio Verify (Twilio generates, sends and checks the code).
 *  - Email: HomePlate generates the code and sends it via SendGrid / SMTP.
 *  - A channel with no provider only works when homeplate.dev-otp=true (code shown on screen).
 * A verified target stays valid for 30 minutes so the user can finish registration.
 */
@Service
public class OtpService {
    private static final Logger log = LoggerFactory.getLogger(OtpService.class);
    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    public enum Channel { SMS, EMAIL }

    private record Entry(String code, Instant expires, int attempts, boolean remote) {}

    private final Map<String, Entry> codes = new ConcurrentHashMap<>();
    private final Map<String, Instant> lastSent = new ConcurrentHashMap<>();
    private final Map<String, Instant> verified = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();
    private final TwilioClient twilio;
    private final NotificationService notifications;

    @Value("${homeplate.dev-otp:false}")
    private boolean devOtp;

    /**
     * Numbers that accept the fixed test code without sending an SMS, e.g. "9000000002-9000000999" or "9000000002,9000000003".
     * Set to empty in production.
     */
    @Value("${homeplate.otp.test-numbers:}")
    private String testNumbersRaw;

    @Value("${homeplate.otp.test-code:123456}")
    private String testCode;

    private static String last10(String s) {
        String d = s.replaceAll("[^0-9]", "");
        return d.length() >= 10 ? d.substring(d.length() - 10) : null;
    }

    private boolean isTestNumber(String digits) {
        if (testNumbersRaw == null || testNumbersRaw.isBlank()) return false;
        for (String part : testNumbersRaw.split(",")) {
            String p = part.trim();
            int dash = p.indexOf('-');
            if (dash > 0) {
                String from = last10(p.substring(0, dash)), to = last10(p.substring(dash + 1));
                if (from != null && to != null) {
                    long n = Long.parseLong(digits);
                    if (n >= Long.parseLong(from) && n <= Long.parseLong(to)) return true;
                }
            } else if (digits.equals(last10(p))) {
                return true;
            }
        }
        return false;
    }

    /** Text for the sign-up page, e.g. "9000000002-9000000999" (null when test numbers are off). */
    public String testNumbersHint() {
        return testNumbersRaw == null || testNumbersRaw.isBlank() ? null : testNumbersRaw.replace(",", ", ");
    }

    public String testCode() { return testCode; }

    public OtpService(TwilioClient twilio, NotificationService notifications) {
        this.twilio = twilio;
        this.notifications = notifications;
    }

    public static Channel channel(String s) {
        return "email".equalsIgnoreCase(s) ? Channel.EMAIL : Channel.SMS;
    }

    public boolean smsLive() { return twilio.verifyConfigured(); }

    public boolean emailLive() { return notifications.emailConfigured(); }

    /** Email verification is required when an email provider is configured (or in dev mode). */
    public boolean emailRequired() { return emailLive() || devOtp; }

    public boolean devMode() { return devOtp; }

    /** Sends an OTP. Returns the code only in dev mode for a channel without a provider. */
    public String send(Channel ch, String rawTarget) {
        String key = key(ch, rawTarget);
        Instant last = lastSent.get(key);
        if (last != null && last.plusSeconds(25).isAfter(Instant.now()))
            throw ApiException.badRequest("Please wait a few seconds before requesting another OTP");

        if (ch == Channel.SMS && isTestNumber(phoneDigits(rawTarget))) {
            log.info("[TEST NUMBER] OTP for {} is the fixed test code (no SMS sent)", key);
            codes.put(key, new Entry(testCode, Instant.now().plusSeconds(600), 0, false));
            lastSent.put(key, Instant.now());
            return null;
        }

        if (ch == Channel.SMS && twilio.verifyConfigured()) {
            twilio.startVerification(NotificationService.e164(phoneDigits(rawTarget)), "sms");
            codes.put(key, new Entry(null, Instant.now().plusSeconds(600), 0, true));
            lastSent.put(key, Instant.now());
            return null;
        }

        String code = String.format("%06d", random.nextInt(1_000_000));
        if (ch == Channel.EMAIL && notifications.emailConfigured()) {
            try {
                notifications.sendEmailOrThrow(normalEmail(rawTarget), "Your HomePlate verification code",
                        "Your HomePlate email verification code is " + code
                                + "\n\nIt is valid for 10 minutes. Do not share this code with anyone.");
            } catch (Exception e) {
                log.warn("Email OTP failed: {}", e.getMessage());
                throw ApiException.badRequest("Could not send the email. Please check the address and try again.");
            }
            codes.put(key, new Entry(code, Instant.now().plusSeconds(600), 0, false));
            lastSent.put(key, Instant.now());
            return null;
        }

        if (!devOtp) {
            throw ApiException.badRequest(ch == Channel.SMS
                    ? "SMS verification is not available right now. Please try again later."
                    : "Email verification is not available right now. Please try again later.");
        }
        log.info("[DEV OTP {} -> {}] {}", ch, key, code);
        codes.put(key, new Entry(code, Instant.now().plusSeconds(600), 0, false));
        lastSent.put(key, Instant.now());
        return code;
    }

    public void verify(Channel ch, String rawTarget, String code) {
        String key = key(ch, rawTarget);
        String c = code == null ? "" : code.trim();
        Entry e = codes.get(key);
        if (e == null || e.expires().isBefore(Instant.now())) throw ApiException.badRequest("OTP expired. Please request a new one");
        if (e.attempts() >= 5) throw ApiException.badRequest("Too many attempts. Please request a new OTP");

        boolean ok = e.remote()
                ? twilio.checkVerification(NotificationService.e164(phoneDigits(rawTarget)), c)
                : e.code().equals(c);
        if (!ok) {
            codes.put(key, new Entry(e.code(), e.expires(), e.attempts() + 1, e.remote()));
            throw ApiException.badRequest("Incorrect OTP");
        }
        codes.remove(key);
        verified.put(key, Instant.now().plusSeconds(1800));
    }

    public boolean isVerified(Channel ch, String rawTarget) {
        if (rawTarget == null || rawTarget.isBlank()) return false;
        Instant until = verified.get(key(ch, rawTarget));
        return until != null && until.isAfter(Instant.now());
    }

    /** Consumes the verification so it can't be reused for a second account. */
    public void consume(Channel ch, String rawTarget) {
        if (rawTarget != null && !rawTarget.isBlank()) verified.remove(key(ch, rawTarget));
    }

    private String key(Channel ch, String raw) {
        return ch == Channel.SMS ? "sms:" + phoneDigits(raw) : "email:" + normalEmail(raw);
    }

    private static String phoneDigits(String phone) {
        String d = phone == null ? "" : phone.replaceAll("[^0-9]", "");
        if (d.length() > 10) d = d.substring(d.length() - 10);
        if (!d.matches("[6-9]\\d{9}")) throw ApiException.badRequest("Enter a valid 10 digit mobile number");
        return d;
    }

    private static String normalEmail(String email) {
        String e = email == null ? "" : email.trim().toLowerCase();
        if (!EMAIL.matcher(e).matches()) throw ApiException.badRequest("Enter a valid email address");
        return e;
    }
}
