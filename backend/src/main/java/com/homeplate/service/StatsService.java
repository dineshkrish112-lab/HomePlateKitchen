package com.homeplate.service;

import com.homeplate.entity.*;
import com.homeplate.entity.Enums.OrderStatus;
import com.homeplate.repository.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.*;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collectors;

/** Dashboards, revenue analytics and export-ready reports. */
@Service
public class StatsService {
    private static final Set<OrderStatus> NOT_COUNTED = EnumSet.of(OrderStatus.CANCELLED, OrderStatus.REJECTED, OrderStatus.PAYMENT_PENDING);
    private static final Set<OrderStatus> ACTIVE = EnumSet.of(OrderStatus.PLACED, OrderStatus.CONFIRMED,
            OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.OUT_FOR_DELIVERY);

    private final FoodOrderRepository orders;
    private final KitchenRepository kitchens;
    private final UserRepository users;
    private final SubscriptionRepository subs;
    private final CookingVideoRepository videos;
    private final ComplaintRepository complaints;
    private final CustomRequestRepository requests;
    private final SubscriptionService subscriptionService;
    private final CustomRequestService customRequests;

    public StatsService(FoodOrderRepository orders, KitchenRepository kitchens, UserRepository users,
                        SubscriptionRepository subs, CookingVideoRepository videos, ComplaintRepository complaints,
                        CustomRequestRepository requests, SubscriptionService subscriptionService,
                        CustomRequestService customRequests) {
        this.orders = orders;
        this.kitchens = kitchens;
        this.users = users;
        this.subs = subs;
        this.videos = videos;
        this.complaints = complaints;
        this.requests = requests;
        this.subscriptionService = subscriptionService;
        this.customRequests = customRequests;
    }

    public static boolean counted(FoodOrder o) { return !NOT_COUNTED.contains(o.getStatus()); }

    private static BigDecimal sum(Collection<FoodOrder> list, Function<FoodOrder, BigDecimal> f) {
        return list.stream().map(f).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static BigDecimal platformRevenue(FoodOrder o) {
        return Optional.ofNullable(o.getCommission()).orElse(BigDecimal.ZERO)
                .add(Optional.ofNullable(o.getPlatformFee()).orElse(BigDecimal.ZERO));
    }

    private static List<YearMonth> lastMonths(int n) {
        YearMonth now = YearMonth.now();
        List<YearMonth> list = new ArrayList<>();
        for (int i = n - 1; i >= 0; i--) list.add(now.minusMonths(i));
        return list;
    }

    private static String label(YearMonth ym) {
        return ym.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + " " + String.valueOf(ym.getYear()).substring(2);
    }

    // ------------------------------------------------------------------ admin

    public Map<String, Object> adminDashboard() {
        List<FoodOrder> all = orders.findAllByOrderByCreatedAtDesc();
        List<FoodOrder> valid = all.stream().filter(StatsService::counted).toList();
        LocalDate today = LocalDate.now();
        YearMonth thisMonth = YearMonth.now();
        List<Kitchen> allKitchens = kitchens.findAll();

        Map<String, Object> kpi = new LinkedHashMap<>();
        kpi.put("totalKitchens", allKitchens.size());
        kpi.put("activeKitchens", allKitchens.stream().filter(k -> k.getStatus() == Enums.KitchenStatus.ACTIVE).count());
        kpi.put("pendingApprovals", allKitchens.stream().filter(k -> k.getStatus() == Enums.KitchenStatus.UNDER_REVIEW
                || k.getStatus() == Enums.KitchenStatus.DOCS_REQUESTED).count());
        kpi.put("totalCustomers", users.countByRole(Role.CUSTOMER));
        kpi.put("totalOrders", valid.size());
        List<FoodOrder> todays = valid.stream().filter(o -> o.getCreatedAt().toLocalDate().equals(today)).toList();
        kpi.put("todayOrders", todays.size());
        kpi.put("todayRevenue", sum(todays, StatsService::platformRevenue));
        kpi.put("todayGmv", sum(todays, FoodOrder::getTotalAmount));
        List<FoodOrder> month = valid.stream().filter(o -> YearMonth.from(o.getCreatedAt()).equals(thisMonth)).toList();
        BigDecimal monthSubs = subs.findAll().stream().filter(s -> s.getCreatedAt() != null && YearMonth.from(s.getCreatedAt()).equals(thisMonth))
                .map(Subscription::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        kpi.put("monthlyPlatformRevenue", sum(month, StatsService::platformRevenue).add(monthSubs));
        kpi.put("activeSubscriptions", allKitchens.stream().filter(k -> subscriptionService.isValid(k.getId())).count());
        kpi.put("pendingVideos", videos.countByStatus(Enums.VideoStatus.PENDING_REVIEW));
        kpi.put("openComplaints", complaints.countByStatus(Enums.ComplaintStatus.OPEN) + complaints.countByStatus(Enums.ComplaintStatus.IN_PROGRESS));
        kpi.put("activeOrders", all.stream().filter(o -> ACTIVE.contains(o.getStatus())).count());

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("kpis", kpi);
        m.put("monthly", monthlySeries(valid, 6));
        Map<String, Long> subBreakdown = new LinkedHashMap<>();
        for (Kitchen k : allKitchens) {
            if (k.getStatus() != Enums.KitchenStatus.ACTIVE && k.getStatus() != Enums.KitchenStatus.SUSPENDED) continue;
            subBreakdown.merge(subscriptionService.statusLabel(k.getId()), 1L, Long::sum);
        }
        m.put("subscriptionBreakdown", subBreakdown.entrySet().stream()
                .map(e -> Map.of("name", e.getKey(), "value", e.getValue())).toList());
        m.put("recentOrders", all.stream().limit(8).toList());
        m.put("pendingKitchens", allKitchens.stream().filter(k -> k.getStatus() == Enums.KitchenStatus.UNDER_REVIEW
                || k.getStatus() == Enums.KitchenStatus.DOCS_REQUESTED).limit(6).toList());
        Map<String, Long> byStatus = new LinkedHashMap<>();
        all.stream().filter(o -> o.getCreatedAt().toLocalDate().isAfter(today.minusDays(30)))
                .forEach(o -> byStatus.merge(o.getStatus().name(), 1L, Long::sum));
        m.put("ordersByStatus", byStatus.entrySet().stream().map(e -> Map.of("name", e.getKey(), "value", e.getValue())).toList());
        Map<String, Long> byArea = new TreeMap<>();
        valid.forEach(o -> byArea.merge(Optional.ofNullable(o.getKitchen().getArea()).orElse("Other"), 1L, Long::sum));
        m.put("ordersByArea", byArea.entrySet().stream().map(e -> Map.of("name", e.getKey(), "value", e.getValue())).toList());
        return m;
    }

    private List<Map<String, Object>> monthlySeries(List<FoodOrder> valid, int months) {
        List<User> customers = users.findByRoleOrderByCreatedAtDesc(Role.CUSTOMER);
        List<Kitchen> allKitchens = kitchens.findAll();
        List<Subscription> allSubs = subs.findAll();
        List<Map<String, Object>> out = new ArrayList<>();
        for (YearMonth ym : lastMonths(months)) {
            Predicate<LocalDateTime> inMonth = t -> t != null && YearMonth.from(t).equals(ym);
            List<FoodOrder> mo = valid.stream().filter(o -> inMonth.test(o.getCreatedAt())).toList();
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("month", label(ym));
            row.put("orders", mo.size());
            row.put("gmv", sum(mo, FoodOrder::getTotalAmount));
            row.put("commission", sum(mo, FoodOrder::getCommission));
            row.put("platformRevenue", sum(mo, StatsService::platformRevenue));
            row.put("subscriptionRevenue", allSubs.stream().filter(s -> inMonth.test(s.getCreatedAt()))
                    .map(Subscription::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add));
            row.put("newKitchens", allKitchens.stream().filter(k -> inMonth.test(k.getCreatedAt())).count());
            row.put("newCustomers", customers.stream().filter(c -> inMonth.test(c.getCreatedAt())).count());
            LocalDateTime end = ym.atEndOfMonth().atTime(23, 59, 59);
            row.put("totalCustomers", customers.stream().filter(c -> c.getCreatedAt() != null && !c.getCreatedAt().isAfter(end)).count());
            row.put("activeSubscriptions", allSubs.stream().filter(s -> s.getStartDate() != null
                    && !s.getStartDate().isAfter(ym.atEndOfMonth()) && !s.getEndDate().isBefore(ym.atDay(1))).count());
            out.add(row);
        }
        return out;
    }

    public Map<String, Object> revenue() {
        List<FoodOrder> valid = orders.findAllByOrderByCreatedAtDesc().stream().filter(StatsService::counted).toList();
        List<Subscription> allSubs = subs.findAllByOrderByCreatedAtDesc();
        Map<String, Object> m = new LinkedHashMap<>();
        BigDecimal subRevenue = allSubs.stream().map(Subscription::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        m.put("gmv", sum(valid, FoodOrder::getTotalAmount));
        m.put("commission", sum(valid, FoodOrder::getCommission));
        m.put("platformFees", sum(valid, FoodOrder::getPlatformFee));
        m.put("discounts", sum(valid, FoodOrder::getDiscount));
        m.put("subscriptionRevenue", subRevenue);
        m.put("totalPlatformRevenue", sum(valid, StatsService::platformRevenue).add(subRevenue));
        m.put("monthlyRevenue", sum(valid.stream().filter(o -> YearMonth.from(o.getCreatedAt()).equals(YearMonth.now())).toList(),
                StatsService::platformRevenue));
        m.put("monthly", monthlySeries(valid, 12));

        LocalDate today = LocalDate.now();
        List<Map<String, Object>> expiring = new ArrayList<>();
        List<Map<String, Object>> expired = new ArrayList<>();
        Map<Long, List<FoodOrder>> byKitchen = valid.stream().collect(Collectors.groupingBy(o -> o.getKitchen().getId()));
        List<Map<String, Object>> perKitchen = new ArrayList<>();
        for (Kitchen k : kitchens.findAll()) {
            subscriptionService.current(k.getId()).ifPresent(s -> {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("kitchenId", k.getId());
                row.put("kitchenName", k.getName());
                row.put("ownerName", k.getOwner().getFullName());
                row.put("phone", k.getOwner().getPhone());
                row.put("planName", s.getPlanName());
                row.put("endDate", s.getEndDate());
                row.put("status", s.getStatus());
                if (s.getEndDate().isBefore(today)) expired.add(row);
                else if (!s.getEndDate().isAfter(today.plusDays(10))) expiring.add(row);
            });
            List<FoodOrder> ko = byKitchen.getOrDefault(k.getId(), List.of());
            if (ko.isEmpty()) continue;
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("kitchenId", k.getId());
            row.put("kitchenName", k.getName());
            row.put("area", k.getArea());
            row.put("orders", ko.size());
            row.put("gmv", sum(ko, FoodOrder::getTotalAmount));
            row.put("commission", sum(ko, FoodOrder::getCommission));
            row.put("kitchenEarnings", sum(ko, FoodOrder::getKitchenEarning));
            perKitchen.add(row);
        }
        perKitchen.sort((a, b) -> ((BigDecimal) b.get("gmv")).compareTo((BigDecimal) a.get("gmv")));
        m.put("expiringSoon", expiring);
        m.put("expired", expired);
        m.put("perKitchen", perKitchen);
        m.put("recentSubscriptionPayments", allSubs.stream().filter(s -> s.getAmount().signum() > 0).limit(15).toList());
        return m;
    }

    // ------------------------------------------------------------------ kitchen

    public Map<String, Object> kitchenDashboard(Kitchen k) {
        List<FoodOrder> all = orders.findByKitchenIdOrderByCreatedAtDesc(k.getId());
        List<FoodOrder> valid = all.stream().filter(StatsService::counted).toList();
        LocalDate today = LocalDate.now();
        List<FoodOrder> todays = valid.stream().filter(o -> o.getCreatedAt().toLocalDate().equals(today)).toList();
        List<FoodOrder> month = valid.stream().filter(o -> YearMonth.from(o.getCreatedAt()).equals(YearMonth.now())).toList();

        Map<String, Object> kpi = new LinkedHashMap<>();
        kpi.put("todayOrders", todays.size());
        kpi.put("pendingOrders", all.stream().filter(o -> ACTIVE.contains(o.getStatus())).count());
        kpi.put("completedOrders", todays.stream().filter(o -> o.getStatus() == OrderStatus.DELIVERED).count());
        kpi.put("completedAllTime", valid.stream().filter(o -> o.getStatus() == OrderStatus.DELIVERED).count());
        kpi.put("todayEarnings", sum(todays, FoodOrder::getKitchenEarning));
        kpi.put("monthlyEarnings", sum(month, FoodOrder::getKitchenEarning));
        kpi.put("rating", k.getRating());
        kpi.put("ratingCount", k.getRatingCount());

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("kpis", kpi);
        m.put("weekly", dailySeries(valid, 7, DateTimeFormatter.ofPattern("EEE")));
        List<Map<String, Object>> monthly = new ArrayList<>();
        for (YearMonth ym : lastMonths(6)) {
            List<FoodOrder> mo = valid.stream().filter(o -> YearMonth.from(o.getCreatedAt()).equals(ym)).toList();
            monthly.add(Map.of("month", label(ym), "earnings", sum(mo, FoodOrder::getKitchenEarning), "orders", mo.size()));
        }
        m.put("monthly", monthly);
        m.put("recentOrders", all.stream().limit(8).toList());
        m.put("activeOrders", all.stream().filter(o -> ACTIVE.contains(o.getStatus())).toList());
        m.put("openRequests", customRequests.openForKitchen(k).stream().limit(5).toList());
        m.put("kitchen", k);
        m.put("subscription", subscriptionService.summary(k.getId()));
        Optional<CookingVideo> todayVideo = videos.findByKitchenIdOrderByCreatedAtDesc(k.getId()).stream()
                .filter(v -> today.equals(v.getPreparationDate())).findFirst();
        m.put("todayVideo", todayVideo.orElse(null));
        m.put("lastVideo", videos.findFirstByKitchenIdOrderByCreatedAtDesc(k.getId()).orElse(null));
        return m;
    }

    private List<Map<String, Object>> dailySeries(List<FoodOrder> valid, int days, DateTimeFormatter fmt) {
        List<Map<String, Object>> out = new ArrayList<>();
        LocalDate today = LocalDate.now();
        for (int i = days - 1; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            List<FoodOrder> dayOrders = valid.stream().filter(o -> o.getCreatedAt().toLocalDate().equals(d)).toList();
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("day", d.format(fmt));
            row.put("date", d);
            row.put("earnings", sum(dayOrders, FoodOrder::getKitchenEarning));
            row.put("orders", dayOrders.size());
            out.add(row);
        }
        return out;
    }

    public Map<String, Object> kitchenEarnings(Kitchen k) {
        List<FoodOrder> all = orders.findByKitchenIdOrderByCreatedAtDesc(k.getId());
        List<FoodOrder> valid = all.stream().filter(StatsService::counted).toList();
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.minusDays(6);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("daily", sum(valid.stream().filter(o -> o.getCreatedAt().toLocalDate().equals(today)).toList(), FoodOrder::getKitchenEarning));
        m.put("weekly", sum(valid.stream().filter(o -> !o.getCreatedAt().toLocalDate().isBefore(weekStart)).toList(), FoodOrder::getKitchenEarning));
        m.put("monthly", sum(valid.stream().filter(o -> YearMonth.from(o.getCreatedAt()).equals(YearMonth.now())).toList(), FoodOrder::getKitchenEarning));
        m.put("totalOrders", all.size());
        m.put("completedOrders", all.stream().filter(o -> o.getStatus() == OrderStatus.DELIVERED).count());
        m.put("cancelledOrders", all.stream().filter(o -> o.getStatus() == OrderStatus.CANCELLED || o.getStatus() == OrderStatus.REJECTED).count());
        m.put("grossSales", sum(valid, FoodOrder::getFoodTotal));
        m.put("deliveryCharges", sum(valid, FoodOrder::getDeliveryCharge));
        m.put("platformCommission", sum(valid, FoodOrder::getCommission));
        m.put("netEarnings", sum(valid, FoodOrder::getKitchenEarning));
        m.put("last30Days", dailySeries(valid, 30, DateTimeFormatter.ofPattern("dd MMM")));
        m.put("orders", all.stream().limit(100).toList());
        return m;
    }

    // ------------------------------------------------------------------ reports

    public List<Map<String, Object>> report(String type, LocalDate from, LocalDate to) {
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = to.plusDays(1).atStartOfDay();
        Predicate<LocalDateTime> inRange = t -> t != null && !t.isBefore(start) && t.isBefore(end);
        List<Map<String, Object>> rows = new ArrayList<>();
        switch (type) {
            case "orders" -> orders.findAllByOrderByCreatedAtDesc().stream().filter(o -> inRange.test(o.getCreatedAt())).forEach(o -> {
                Map<String, Object> r = new LinkedHashMap<>();
                r.put("Order #", o.getOrderNumber());
                r.put("Date", o.getCreatedAt().toLocalDate());
                r.put("Customer", o.getCustomer().getFullName());
                r.put("Kitchen", o.getKitchen().getName());
                r.put("Type", o.getOrderType());
                r.put("Items", o.getItems().stream().map(i -> i.getQuantity() + "x " + i.getName()).collect(Collectors.joining("; ")));
                r.put("Food Total", o.getFoodTotal());
                r.put("Delivery", o.getDeliveryCharge());
                r.put("Discount", o.getDiscount());
                r.put("Total", o.getTotalAmount());
                r.put("Commission", o.getCommission());
                r.put("Payment", o.getPaymentMethod() + " / " + o.getPaymentStatus());
                r.put("Status", o.getStatus());
                rows.add(r);
            });
            case "kitchens" -> kitchens.findAllByOrderByCreatedAtDesc().stream().filter(k -> inRange.test(k.getCreatedAt())).forEach(k -> {
                Map<String, Object> r = new LinkedHashMap<>();
                r.put("Kitchen ID", "KT" + (1000 + k.getId()));
                r.put("Kitchen", k.getName());
                r.put("Owner", k.getOwner().getFullName());
                r.put("Mobile", k.getOwner().getPhone());
                r.put("Area", k.getArea());
                r.put("Registered", k.getCreatedAt().toLocalDate());
                r.put("Status", k.getStatus());
                r.put("Subscription", subscriptionService.statusLabel(k.getId()));
                r.put("Rating", k.getRating());
                r.put("Orders", orders.countByKitchenId(k.getId()));
                rows.add(r);
            });
            case "customers" -> users.findByRoleOrderByCreatedAtDesc(Role.CUSTOMER).stream().filter(u -> inRange.test(u.getCreatedAt())).forEach(u -> {
                List<FoodOrder> uo = orders.findByCustomerIdOrderByCreatedAtDesc(u.getId());
                Map<String, Object> r = new LinkedHashMap<>();
                r.put("Customer", u.getFullName());
                r.put("Username", u.getUsername());
                r.put("Mobile", u.getPhone());
                r.put("Area", u.getArea());
                r.put("Hometown", u.getHometown());
                r.put("Joined", u.getCreatedAt().toLocalDate());
                r.put("Orders", uo.size());
                r.put("Total Spent", sum(uo.stream().filter(StatsService::counted).toList(), FoodOrder::getTotalAmount));
                r.put("Status", u.getStatus());
                rows.add(r);
            });
            case "earnings" -> {
                Map<Long, List<FoodOrder>> byK = orders.findByCreatedAtBetween(start, end).stream().filter(StatsService::counted)
                        .collect(Collectors.groupingBy(o -> o.getKitchen().getId()));
                byK.forEach((id, list) -> {
                    Kitchen k = list.get(0).getKitchen();
                    Map<String, Object> r = new LinkedHashMap<>();
                    r.put("Kitchen", k.getName());
                    r.put("Area", k.getArea());
                    r.put("Orders", list.size());
                    r.put("Gross Sales", sum(list, FoodOrder::getFoodTotal));
                    r.put("Delivery Charges", sum(list, FoodOrder::getDeliveryCharge));
                    r.put("Commission", sum(list, FoodOrder::getCommission));
                    r.put("Platform Fees", sum(list, FoodOrder::getPlatformFee));
                    r.put("Kitchen Net", sum(list, FoodOrder::getKitchenEarning));
                    rows.add(r);
                });
            }
            case "subscriptions" -> subs.findAllByOrderByCreatedAtDesc().stream().filter(s -> inRange.test(s.getCreatedAt())).forEach(s -> {
                Map<String, Object> r = new LinkedHashMap<>();
                r.put("Kitchen", s.getKitchen().getName());
                r.put("Plan", s.getPlanName());
                r.put("Amount", s.getAmount());
                r.put("Start", s.getStartDate());
                r.put("End", s.getEndDate());
                r.put("Status", s.getEndDate().isBefore(LocalDate.now()) ? "EXPIRED" : s.getStatus());
                r.put("Payment Ref", s.getPaymentReference());
                rows.add(r);
            });
            case "requests" -> requests.findAllByOrderByCreatedAtDesc().stream().filter(c -> inRange.test(c.getCreatedAt())).forEach(c -> {
                Map<String, Object> r = new LinkedHashMap<>();
                r.put("Request #", c.getRequestNumber());
                r.put("Customer", c.getCustomer().getFullName());
                r.put("Dish", c.getDishName());
                r.put("Quantity", c.getQuantity());
                r.put("Required", c.getRequiredDate() + " " + c.getMealSlot());
                r.put("Area", c.getDeliveryArea());
                r.put("Offers", c.getOfferCount());
                r.put("Status", c.getStatus());
                rows.add(r);
            });
            default -> {}
        }
        return rows;
    }
}
