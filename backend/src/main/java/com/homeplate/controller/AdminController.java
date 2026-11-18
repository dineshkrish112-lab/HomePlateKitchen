package com.homeplate.controller;

import com.homeplate.config.ApiException;
import com.homeplate.dto.Dtos;
import com.homeplate.entity.*;
import com.homeplate.repository.*;
import com.homeplate.security.CurrentUser;
import com.homeplate.service.*;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/** Super admin portal API. */
@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final CurrentUser current;
    private final KitchenRepository kitchens;
    private final UserRepository users;
    private final FoodOrderRepository orders;
    private final CookingVideoRepository videos;
    private final CustomRequestRepository requests;
    private final QuotationRepository quotes;
    private final SubscriptionRepository subs;
    private final SubscriptionPlanRepository plans;
    private final OfferRepository offers;
    private final ComplaintRepository complaints;
    private final MenuItemRepository menu;
    private final StatsService stats;
    private final SettingsService settings;
    private final SubscriptionService subscriptions;
    private final KitchenService kitchenService;
    private final NotificationService notify;

    public AdminController(CurrentUser current, KitchenRepository kitchens, UserRepository users, FoodOrderRepository orders,
                           CookingVideoRepository videos, CustomRequestRepository requests, QuotationRepository quotes,
                           SubscriptionRepository subs, SubscriptionPlanRepository plans, OfferRepository offers,
                           ComplaintRepository complaints, MenuItemRepository menu, StatsService stats,
                           SettingsService settings, SubscriptionService subscriptions, KitchenService kitchenService,
                           NotificationService notify) {
        this.current = current;
        this.kitchens = kitchens;
        this.users = users;
        this.orders = orders;
        this.videos = videos;
        this.requests = requests;
        this.quotes = quotes;
        this.subs = subs;
        this.plans = plans;
        this.offers = offers;
        this.complaints = complaints;
        this.menu = menu;
        this.stats = stats;
        this.settings = settings;
        this.subscriptions = subscriptions;
        this.kitchenService = kitchenService;
        this.notify = notify;
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() { return stats.adminDashboard(); }

    // ---------------- kitchens
    @GetMapping("/kitchens")
    public List<Map<String, Object>> kitchens() {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Kitchen k : kitchens.findAllByOrderByCreatedAtDesc()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("kitchen", k);
            m.put("subscriptionStatus", subscriptions.statusLabel(k.getId()));
            m.put("totalOrders", orders.countByKitchenId(k.getId()));
            out.add(m);
        }
        return out;
    }

    @GetMapping("/kitchens/{id}")
    public Map<String, Object> kitchen(@PathVariable Long id) {
        Kitchen k = kitchens.findById(id).orElseThrow(() -> ApiException.notFound("Kitchen not found"));
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("kitchen", k);
        m.put("trust", kitchenService.trustProfile(k));
        m.put("subscription", subscriptions.summary(id));
        m.put("menu", menu.findByKitchenIdOrderByMealTypeAscIdAsc(id));
        m.put("videos", videos.findByKitchenIdOrderByCreatedAtDesc(id));
        m.put("recentOrders", orders.findByKitchenIdOrderByCreatedAtDesc(id).stream().limit(10).toList());
        m.put("complaints", complaints.findByKitchenIdOrderByCreatedAtDesc(id));
        return m;
    }

    /** action: approve | reject | suspend | activate | request_docs | mark_inspected */
    @PatchMapping("/kitchens/{id}/status")
    @Transactional
    public Kitchen decide(@PathVariable Long id, @Valid @RequestBody Dtos.KitchenDecision d) {
        Kitchen k = kitchens.findById(id).orElseThrow(() -> ApiException.notFound("Kitchen not found"));
        String msg;
        switch (d.action()) {
            case "approve" -> {
                k.setStatus(Enums.KitchenStatus.APPROVED);
                k.setApprovedAt(LocalDateTime.now());
                if (k.getIdProofStatus() == Enums.DocumentStatus.PENDING) k.setIdProofStatus(Enums.DocumentStatus.VERIFIED);
                if (k.getFssaiNumber() != null && k.getFssaiStatus() == Enums.DocumentStatus.PENDING) k.setFssaiStatus(Enums.DocumentStatus.VERIFIED);
                msg = "Congratulations! " + k.getName() + " is approved. Log in to activate your 30-day free trial.";
            }
            case "activate" -> {
                if (k.getStatus() == Enums.KitchenStatus.PENDING || k.getStatus() == Enums.KitchenStatus.UNDER_REVIEW) {
                    k.setApprovedAt(LocalDateTime.now());
                }
                k.setStatus(Enums.KitchenStatus.ACTIVE);
                subscriptions.startTrial(k);
                msg = k.getName() + " is now live on HomePlate.";
            }
            case "reject" -> {
                k.setStatus(Enums.KitchenStatus.REJECTED);
                msg = "Your kitchen application was not approved. Reason: " + d.remarks();
            }
            case "suspend" -> {
                k.setStatus(Enums.KitchenStatus.SUSPENDED);
                k.setAcceptingOrders(false);
                msg = "Your kitchen has been suspended. Reason: " + d.remarks();
            }
            case "request_docs" -> {
                k.setStatus(Enums.KitchenStatus.DOCS_REQUESTED);
                msg = "Additional documents required for " + k.getName() + ": " + d.remarks();
            }
            case "mark_inspected" -> {
                k.setLastInspectionAt(LocalDateTime.now());
                msg = null;
            }
            default -> throw ApiException.badRequest("Unknown action " + d.action());
        }
        if (d.remarks() != null && !d.remarks().isBlank()) k.setAdminRemarks(d.remarks());
        if (msg != null) {
            notify.sendSms(k.getOwner().getPhone(), "HomePlate: " + msg);
            notify.sendEmail(k.getOwner().getEmail(), "HomePlate kitchen update", msg);
        }
        return kitchens.save(k);
    }

    @PatchMapping("/kitchens/{id}/documents")
    @Transactional
    public Kitchen document(@PathVariable Long id, @Valid @RequestBody Dtos.DocumentDecision d) {
        Kitchen k = kitchens.findById(id).orElseThrow(() -> ApiException.notFound("Kitchen not found"));
        if ("identity".equals(d.document())) k.setIdProofStatus(d.status());
        else if ("fssai".equals(d.document())) k.setFssaiStatus(d.status());
        else throw ApiException.badRequest("Unknown document");
        if (d.remarks() != null && !d.remarks().isBlank()) k.setAdminRemarks(d.remarks());
        return kitchens.save(k);
    }

    // ---------------- customers
    @GetMapping("/customers")
    public List<Map<String, Object>> customers() {
        List<Map<String, Object>> out = new ArrayList<>();
        for (User u : users.findByRoleOrderByCreatedAtDesc(Role.CUSTOMER)) {
            List<FoodOrder> uo = orders.findByCustomerIdOrderByCreatedAtDesc(u.getId());
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("user", u);
            m.put("orders", uo.size());
            m.put("totalSpent", uo.stream().filter(StatsService::counted).map(FoodOrder::getTotalAmount)
                    .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add));
            m.put("lastOrderAt", uo.isEmpty() ? null : uo.get(0).getCreatedAt());
            out.add(m);
        }
        return out;
    }

    @PatchMapping("/users/{id}/status")
    @Transactional
    public User userStatus(@PathVariable Long id, @Valid @RequestBody Dtos.UserStatusUpdate req) {
        User u = users.findById(id).orElseThrow(() -> ApiException.notFound("User not found"));
        if (u.getRole() == Role.ADMIN) throw ApiException.badRequest("Admin accounts can't be suspended");
        u.setStatus(req.status());
        return users.save(u);
    }

    // ---------------- videos
    @GetMapping("/videos")
    public List<CookingVideo> videos() { return videos.findAllByOrderByCreatedAtDesc(); }

    @PatchMapping("/videos/{id}/review")
    @Transactional
    public CookingVideo reviewVideo(@PathVariable Long id, @Valid @RequestBody Dtos.VideoReviewRequest req) {
        CookingVideo v = videos.findById(id).orElseThrow(() -> ApiException.notFound("Video not found"));
        v.setStatus(req.status());
        v.setAdminRemarks(req.remarks());
        v.setCleanlinessOk(req.cleanlinessOk());
        v.setStorageOk(req.storageOk());
        v.setHygieneOk(req.hygieneOk());
        v.setReviewedAt(LocalDateTime.now());
        v.setReviewedBy(current.principal().username());
        notify.sendSms(v.getKitchen().getOwner().getPhone(), "HomePlate: Your cooking video for " + v.getPreparationDate()
                + " was reviewed: " + req.status().name().replace('_', ' ').toLowerCase()
                + (req.remarks() == null || req.remarks().isBlank() ? "" : ". Remarks: " + req.remarks()));
        return videos.save(v);
    }

    // ---------------- orders & requests
    @GetMapping("/orders")
    public List<FoodOrder> orders() { return orders.findAllByOrderByCreatedAtDesc(); }

    @GetMapping("/custom-requests")
    public List<Map<String, Object>> customRequests() {
        List<Map<String, Object>> out = new ArrayList<>();
        for (CustomRequest r : requests.findAllByOrderByCreatedAtDesc()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("request", r);
            m.put("quotations", quotes.findByRequestIdOrderByPriceAsc(r.getId()));
            out.add(m);
        }
        return out;
    }

    // ---------------- subscriptions & plans
    @GetMapping("/subscriptions")
    public Map<String, Object> subscriptions() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("subscriptions", subs.findAllByOrderByCreatedAtDesc());
        m.put("plans", plans.findAll());
        m.put("settings", settings.get());
        return m;
    }

    @PostMapping("/plans")
    @Transactional
    public SubscriptionPlan createPlan(@RequestBody SubscriptionPlan p) {
        p.setId(null);
        validatePlan(p);
        return plans.save(p);
    }

    @PutMapping("/plans/{id}")
    @Transactional
    public SubscriptionPlan updatePlan(@PathVariable Long id, @RequestBody SubscriptionPlan p) {
        SubscriptionPlan e = plans.findById(id).orElseThrow(() -> ApiException.notFound("Plan not found"));
        validatePlan(p);
        e.setName(p.getName());
        e.setDescription(p.getDescription());
        e.setPrice(p.getPrice());
        e.setDurationDays(p.getDurationDays());
        e.setFeatures(p.getFeatures());
        e.setActive(p.isActive());
        e.setPopular(p.isPopular());
        return plans.save(e);
    }

    private void validatePlan(SubscriptionPlan p) {
        if (p.getName() == null || p.getName().isBlank()) throw ApiException.badRequest("Plan name is required");
        if (p.getPrice() == null || p.getPrice().signum() < 0) throw ApiException.badRequest("Enter a valid price");
        if (p.getDurationDays() == null || p.getDurationDays() < 1) throw ApiException.badRequest("Enter a valid duration");
    }

    @GetMapping("/revenue")
    public Map<String, Object> revenue() { return stats.revenue(); }

    // ---------------- offers
    @GetMapping("/offers")
    public List<Offer> offers() { return offers.findAll(); }

    @PostMapping("/offers")
    @Transactional
    public Offer createOffer(@RequestBody Offer o) {
        o.setId(null);
        if (o.getCode() == null || o.getCode().isBlank()) throw ApiException.badRequest("Coupon code is required");
        o.setCode(o.getCode().trim().toUpperCase());
        if (offers.findByCodeIgnoreCase(o.getCode()).isPresent()) throw ApiException.badRequest("Coupon code already exists");
        if (o.getUsageCount() == null) o.setUsageCount(0);
        return offers.save(o);
    }

    @PutMapping("/offers/{id}")
    @Transactional
    public Offer updateOffer(@PathVariable Long id, @RequestBody Offer in) {
        Offer o = offers.findById(id).orElseThrow(() -> ApiException.notFound("Offer not found"));
        o.setDescription(in.getDescription());
        o.setDiscountPercent(in.getDiscountPercent());
        o.setMaxDiscount(in.getMaxDiscount());
        o.setMinOrder(in.getMinOrder());
        o.setValidTill(in.getValidTill());
        o.setActive(in.isActive());
        return offers.save(o);
    }

    @DeleteMapping("/offers/{id}")
    @Transactional
    public Map<String, Object> deleteOffer(@PathVariable Long id) {
        offers.deleteById(id);
        return Map.of("deleted", true);
    }

    // ---------------- complaints
    @GetMapping("/complaints")
    public List<Complaint> complaints() { return complaints.findAllByOrderByCreatedAtDesc(); }

    @PatchMapping("/complaints/{id}")
    @Transactional
    public Complaint updateComplaint(@PathVariable Long id, @Valid @RequestBody Dtos.ComplaintUpdate req) {
        Complaint c = complaints.findById(id).orElseThrow(() -> ApiException.notFound("Complaint not found"));
        c.setStatus(req.status());
        if (req.resolution() != null) c.setResolution(req.resolution());
        if (req.priority() != null) c.setPriority(req.priority());
        if (req.status() == Enums.ComplaintStatus.RESOLVED || req.status() == Enums.ComplaintStatus.CLOSED) {
            c.setResolvedAt(LocalDateTime.now());
            notify.sendSms(c.getCustomer().getPhone(), "HomePlate: Your complaint \"" + c.getSubject() + "\" has been resolved.");
        }
        return complaints.save(c);
    }

    // ---------------- reports & settings
    @GetMapping("/reports")
    public List<Map<String, Object>> report(@RequestParam String type,
                                            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return stats.report(type, from, to);
    }

    @GetMapping("/settings")
    public PlatformSettings getSettings() { return settings.get(); }

    @PutMapping("/settings")
    public PlatformSettings updateSettings(@RequestBody PlatformSettings s) { return settings.update(s); }
}
