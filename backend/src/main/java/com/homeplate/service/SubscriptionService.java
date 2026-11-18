package com.homeplate.service;

import com.homeplate.config.ApiException;
import com.homeplate.entity.*;
import com.homeplate.repository.SubscriptionPlanRepository;
import com.homeplate.repository.SubscriptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class SubscriptionService {
    private final SubscriptionRepository subs;
    private final SubscriptionPlanRepository plans;
    private final SettingsService settings;

    public SubscriptionService(SubscriptionRepository subs, SubscriptionPlanRepository plans, SettingsService settings) {
        this.subs = subs;
        this.plans = plans;
        this.settings = settings;
    }

    public Optional<Subscription> current(Long kitchenId) {
        return subs.findFirstByKitchenIdOrderByEndDateDesc(kitchenId);
    }

    /** A kitchen is visible to customers while its trial / paid plan (plus grace period) is valid. */
    public boolean isValid(Long kitchenId) {
        int grace = Optional.ofNullable(settings.get().getGracePeriodDays()).orElse(0);
        return current(kitchenId)
                .map(s -> s.getStatus() != Enums.SubscriptionStatus.CANCELLED
                        && !s.getEndDate().plusDays(grace).isBefore(LocalDate.now()))
                .orElse(false);
    }

    @Transactional
    public Subscription startTrial(Kitchen kitchen) {
        if (!subs.findByKitchenIdOrderByCreatedAtDesc(kitchen.getId()).isEmpty()) {
            return current(kitchen.getId()).orElseThrow();
        }
        Subscription s = new Subscription();
        s.setKitchen(kitchen);
        s.setPlanName("Free Trial");
        s.setAmount(java.math.BigDecimal.ZERO);
        s.setStartDate(LocalDate.now());
        s.setEndDate(LocalDate.now().plusDays(settings.get().getFreeTrialDays()));
        s.setStatus(Enums.SubscriptionStatus.TRIAL);
        return subs.save(s);
    }

    /** Mock payment: in production this is called after the payment gateway confirms success. */
    @Transactional
    public Subscription subscribe(Kitchen kitchen, Long planId, Enums.PaymentMethod method) {
        SubscriptionPlan plan = plans.findById(planId).orElseThrow(() -> ApiException.notFound("Plan not found"));
        if (!plan.isActive()) throw ApiException.badRequest("This plan is no longer available");
        LocalDate start = current(kitchen.getId())
                .map(Subscription::getEndDate)
                .filter(end -> !end.isBefore(LocalDate.now()))
                .map(end -> end.plusDays(1))
                .orElse(LocalDate.now());
        Subscription s = new Subscription();
        s.setKitchen(kitchen);
        s.setPlanId(plan.getId());
        s.setPlanName(plan.getName());
        s.setAmount(plan.getPrice());
        s.setStartDate(start);
        s.setEndDate(start.plusDays(plan.getDurationDays() - 1L));
        s.setStatus(Enums.SubscriptionStatus.ACTIVE);
        s.setPaymentMethod(method == null ? Enums.PaymentMethod.UPI : method);
        s.setPaymentReference("SUB-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        return subs.save(s);
    }

    public Map<String, Object> summary(Long kitchenId) {
        Map<String, Object> m = new LinkedHashMap<>();
        Optional<Subscription> cur = current(kitchenId);
        m.put("current", cur.orElse(null));
        m.put("valid", isValid(kitchenId));
        m.put("daysLeft", cur.map(s -> ChronoUnit.DAYS.between(LocalDate.now(), s.getEndDate())).orElse(0L));
        m.put("history", subs.findByKitchenIdOrderByCreatedAtDesc(kitchenId));
        m.put("trial", subs.findByKitchenIdOrderByCreatedAtDesc(kitchenId).stream()
                .filter(s -> s.getStatus() == Enums.SubscriptionStatus.TRIAL).findFirst().orElse(null));
        return m;
    }

    /** Status shown in admin tables: TRIAL / ACTIVE / EXPIRED / NONE. */
    public String statusLabel(Long kitchenId) {
        return current(kitchenId).map(s -> s.getEndDate().isBefore(LocalDate.now()) ? "EXPIRED" : s.getStatus().name())
                .orElse("NONE");
    }
}
