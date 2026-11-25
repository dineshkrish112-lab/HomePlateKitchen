package com.homeplate.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.homeplate.config.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * Thin wrapper over the Twilio REST API (no SDK). Authenticates with an API key (SK... + secret),
 * or with the account auth token as a fallback.
 */
@Component
public class TwilioClient {
    private static final Logger log = LoggerFactory.getLogger(TwilioClient.class);

    @Value("${homeplate.twilio.enabled:false}") private boolean enabled;
    @Value("${homeplate.twilio.account-sid:}") private String accountSid;
    @Value("${homeplate.twilio.api-key-sid:}") private String apiKeySid;
    @Value("${homeplate.twilio.api-key-secret:}") private String apiKeySecret;
    @Value("${homeplate.twilio.auth-token:}") private String authToken;
    @Value("${homeplate.twilio.verify-service-sid:}") private String verifyServiceSid;
    @Value("${homeplate.twilio.from-number:}") private String fromNumber;

    private final RestClient rest = RestClient.create();
    private final ObjectMapper json = new ObjectMapper();

    private boolean hasCredentials() {
        return enabled && !accountSid.isBlank()
                && ((!apiKeySid.isBlank() && !apiKeySecret.isBlank()) || !authToken.isBlank());
    }

    public boolean verifyConfigured() { return hasCredentials() && !verifyServiceSid.isBlank(); }

    public boolean smsConfigured() { return hasCredentials() && !fromNumber.isBlank(); }

    private String basicAuth() {
        String user = !apiKeySid.isBlank() ? apiKeySid : accountSid;
        String pass = !apiKeySid.isBlank() ? apiKeySecret : authToken;
        return "Basic " + Base64.getEncoder().encodeToString((user + ":" + pass).getBytes(StandardCharsets.UTF_8));
    }

    private JsonNode post(String url, MultiValueMap<String, String> form) {
        try {
            String body = rest.post().uri(url)
                    .header("Authorization", basicAuth())
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(String.class);
            return json.readTree(body == null ? "{}" : body);
        } catch (RestClientResponseException e) {
            throw translate(e);
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Twilio call failed: {}", e.getMessage());
            throw ApiException.badRequest("Could not reach the SMS service. Please try again.");
        }
    }

    /** Starts a Twilio Verify verification (sends the OTP). channel = sms | email | whatsapp | call */
    public void startVerification(String to, String channel) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("To", to);
        form.add("Channel", channel);
        post("https://verify.twilio.com/v2/Services/" + verifyServiceSid + "/Verifications", form);
        log.info("[Twilio Verify] {} code sent to {}", channel, mask(to));
    }

    /** Returns true when Twilio approves the code. */
    public boolean checkVerification(String to, String code) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("To", to);
        form.add("Code", code);
        try {
            JsonNode r = post("https://verify.twilio.com/v2/Services/" + verifyServiceSid + "/VerificationCheck", form);
            return "approved".equals(r.path("status").asText());
        } catch (ApiException e) {
            throw e;
        }
    }

    /** Plain SMS through the Messages API (order notifications). Needs a Twilio phone number. */
    public void sendSms(String to, String message) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("To", to);
        form.add("From", fromNumber);
        form.add("Body", message);
        post("https://api.twilio.com/2010-04-01/Accounts/" + accountSid + "/Messages.json", form);
    }

    private ApiException translate(RestClientResponseException e) {
        int code = 0;
        String msg = e.getMessage();
        try {
            JsonNode n = json.readTree(e.getResponseBodyAsString());
            code = n.path("code").asInt();
            msg = n.path("message").asText(msg);
        } catch (Exception ignored) { }
        log.warn("Twilio error {} ({}): {}", e.getStatusCode().value(), code, msg);
        return switch (code) {
            case 20404 -> ApiException.badRequest("OTP expired. Please request a new one");
            case 60202, 60203 -> ApiException.badRequest("Too many attempts. Please wait 10 minutes and try again");
            case 60200, 21211, 60205 -> ApiException.badRequest("This mobile number is not valid for SMS");
            case 21608, 21610, 21408, 60410 -> ApiException.badRequest(
                    "SMS can't be sent to this number yet (Twilio trial account: only verified numbers). "
                    + "For testing use a test number like 9000000005 with OTP 123456.");
            case 20003 -> ApiException.badRequest("SMS service credentials are invalid. Contact support.");
            default -> ApiException.badRequest("SMS service error: " + msg);
        };
    }

    static String mask(String to) {
        if (to == null || to.length() < 5) return "***";
        return to.substring(0, 3) + "****" + to.substring(to.length() - 3);
    }
}
