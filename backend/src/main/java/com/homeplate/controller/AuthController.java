package com.homeplate.controller;

import com.homeplate.config.ApiException;
import com.homeplate.dto.Dtos;
import com.homeplate.entity.*;
import com.homeplate.repository.KitchenRepository;
import com.homeplate.repository.UserRepository;
import com.homeplate.security.CurrentUser;
import com.homeplate.security.JwtService;
import com.homeplate.service.NotificationService;
import com.homeplate.service.OtpService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserRepository users;
    private final KitchenRepository kitchens;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final OtpService otp;
    private final CurrentUser current;
    private final NotificationService notify;

    public AuthController(UserRepository users, KitchenRepository kitchens, PasswordEncoder encoder, JwtService jwt,
                          OtpService otp, CurrentUser current, NotificationService notify) {
        this.users = users;
        this.kitchens = kitchens;
        this.encoder = encoder;
        this.jwt = jwt;
        this.otp = otp;
        this.current = current;
        this.notify = notify;
    }

    @PostMapping("/login")
    public Map<String, Object> login(@Valid @RequestBody Dtos.LoginRequest req) {
        User u = users.findByUsername(req.username().trim())
                .filter(x -> encoder.matches(req.password(), x.getPassword()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid username or password"));
        if (req.portal() != null && !req.portal().isBlank()) {
            Role expected = switch (req.portal()) {
                case "admin" -> Role.ADMIN;
                case "kitchen" -> Role.KITCHEN_OWNER;
                default -> Role.CUSTOMER;
            };
            if (u.getRole() != expected) {
                String where = switch (u.getRole()) {
                    case ADMIN -> "the Admin portal";
                    case KITCHEN_OWNER -> "the Kitchen Partner portal";
                    case CUSTOMER -> "the Customer login";
                };
                throw ApiException.forbidden("This account belongs to " + where + ". Please sign in there.");
            }
        }
        if (u.getStatus() == Enums.UserStatus.SUSPENDED) throw ApiException.forbidden("Your account is suspended. Contact support.");
        return session(u);
    }

    @PostMapping("/otp/send")
    public Map<String, Object> sendOtp(@Valid @RequestBody Dtos.OtpSendRequest req) {
        String code = otp.send(req.phone());
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("sent", true);
        m.put("message", "OTP sent to " + req.phone());
        if (code != null) m.put("devOtp", code); // only while no SMS provider is configured
        return m;
    }

    @PostMapping("/otp/verify")
    public Map<String, Object> verifyOtp(@Valid @RequestBody Dtos.OtpVerifyRequest req) {
        otp.verify(req.phone(), req.code());
        return Map.of("verified", true);
    }

    @PostMapping("/register/customer")
    @Transactional
    public Map<String, Object> registerCustomer(@Valid @RequestBody Dtos.RegisterCustomerRequest req) {
        if (!otp.isVerified(req.phone())) throw ApiException.badRequest("Please verify your mobile number with OTP first");
        if (users.existsByUsername(req.username().trim())) throw ApiException.badRequest("Username already taken");
        User u = new User();
        u.setUsername(req.username().trim());
        u.setPassword(encoder.encode(req.password()));
        u.setFullName(req.fullName());
        u.setPhone(req.phone());
        u.setEmail(req.email());
        u.setHometown(req.hometown());
        u.setRole(Role.CUSTOMER);
        u.setPhoneVerified(true);
        users.save(u);
        notify.sendEmail(u.getEmail(), "Welcome to HomePlate", "Hi " + u.getFullName() + ", a taste of home is now around the corner.");
        return session(u);
    }

    @PostMapping("/register/kitchen")
    @Transactional
    public Map<String, Object> registerKitchen(@Valid @RequestBody Dtos.RegisterKitchenRequest req) {
        if (!otp.isVerified(req.phone())) throw ApiException.badRequest("Please verify your mobile number with OTP first");
        if (users.existsByUsername(req.username().trim())) throw ApiException.badRequest("Username already taken");
        User u = new User();
        u.setUsername(req.username().trim());
        u.setPassword(encoder.encode(req.password()));
        u.setFullName(req.fullName());
        u.setPhone(req.phone());
        u.setEmail(req.email());
        u.setRole(Role.KITCHEN_OWNER);
        u.setPhoneVerified(true);
        users.save(u);
        Kitchen k = new Kitchen();
        k.setOwner(u);
        k.setName(req.kitchenName());
        k.setStatus(Enums.KitchenStatus.PENDING);
        k.setPhoneVerified(true);
        k.setOnboardingStep(2);
        kitchens.save(k);
        return session(u);
    }

    @GetMapping("/me")
    public Map<String, Object> me() {
        return session(current.user());
    }

    @PostMapping("/change-password")
    @Transactional
    public Map<String, Object> changePassword(@Valid @RequestBody Dtos.ChangePasswordRequest req) {
        User u = current.user();
        if (!encoder.matches(req.currentPassword(), u.getPassword())) throw ApiException.badRequest("Current password is incorrect");
        u.setPassword(encoder.encode(req.newPassword()));
        users.save(u);
        return Map.of("changed", true);
    }

    private Map<String, Object> session(User u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("token", jwt.generate(u));
        m.put("user", u);
        if (u.getRole() == Role.KITCHEN_OWNER) m.put("kitchen", kitchens.findByOwnerId(u.getId()).orElse(null));
        return m;
    }
}
