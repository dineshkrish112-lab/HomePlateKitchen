package com.homeplate.config;

import com.homeplate.entity.*;
import com.homeplate.entity.Enums.*;
import com.homeplate.repository.*;
import com.homeplate.service.OrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.util.*;

/**
 * First start (empty database): creates platform settings, subscription plans and the
 * super admin owner/owner. Kitchens and customers register themselves with OTP.
 * Optional demo data (homeplate.seed-demo-data=true): sample Coimbatore kitchens, customers and orders.
 */
@Component
public class DataSeeder implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository users;
    private final KitchenRepository kitchens;
    private final MenuItemRepository menu;
    private final FoodOrderRepository orders;
    private final ReviewRepository reviews;
    private final CustomRequestRepository requests;
    private final QuotationRepository quotes;
    private final CookingVideoRepository videos;
    private final SubscriptionRepository subs;
    private final SubscriptionPlanRepository plans;
    private final PlatformSettingsRepository settingsRepo;
    private final ComplaintRepository complaints;
    private final OfferRepository offers;
    private final PasswordEncoder encoder;
    private final OrderService orderService;

    private final Random rnd = new Random(42);

    @org.springframework.beans.factory.annotation.Value("${homeplate.seed-demo-data:false}")
    private boolean seedDemo;

    public DataSeeder(UserRepository users, KitchenRepository kitchens, MenuItemRepository menu, FoodOrderRepository orders,
                      ReviewRepository reviews, CustomRequestRepository requests, QuotationRepository quotes,
                      CookingVideoRepository videos, SubscriptionRepository subs, SubscriptionPlanRepository plans,
                      PlatformSettingsRepository settingsRepo, ComplaintRepository complaints, OfferRepository offers,
                      PasswordEncoder encoder, OrderService orderService) {
        this.users = users;
        this.kitchens = kitchens;
        this.menu = menu;
        this.orders = orders;
        this.reviews = reviews;
        this.requests = requests;
        this.quotes = quotes;
        this.videos = videos;
        this.subs = subs;
        this.plans = plans;
        this.settingsRepo = settingsRepo;
        this.complaints = complaints;
        this.offers = offers;
        this.encoder = encoder;
        this.orderService = orderService;
    }

    private static final String IMG = "/images/";

    record KSeed(String username, String password, String owner, String phone, String name, String area,
                 double lat, double lng, FoodType type, String cuisines, String cover, String desc,
                 KitchenStatus status, String special, String hometown) {}

    @Override
    @Transactional
    public void run(String... args) {
        if (users.count() > 0) return;

        PlatformSettings settings = settingsRepo.save(new PlatformSettings());

        plan("Monthly", "Everything you need to run your home kitchen", "499", 30, false,
                "Unlimited menu items|Daily order management|Custom food requests|Earnings dashboard");
        plan("Quarterly", "Save 13% - most popular with home chefs", "1299", 90, true,
                "Everything in Monthly|Featured in 'Today's Specials'|Priority verification support");
        plan("Annual", "Best value for established kitchens", "4999", 365, false,
                "Everything in Quarterly|Verified Pro badge|Free kitchen photo shoot|Dedicated account manager");

        user("owner", "owner", "Platform Owner", "9000000001", "admin@homeplate.in", Role.ADMIN, null, null, null, null, 200);

        if (!seedDemo) {
            log.info("HomePlate initialised: super admin 'owner' + subscription plans. No demo data (homeplate.seed-demo-data=false).");
            return;
        }
        log.info("Seeding demo kitchens, customers and orders...");

        offer("WELCOME50", "50% off your first homemade meal (max Rs.75)", "50", "75", "149");
        offer("HOMEFOOD10", "10% off on all orders above Rs.199", "10", "50", "199");
        offer("STUDENT20", "20% off for students (max Rs.60)", "20", "60", "120");

        // ---------------- users

        User arun = user("user", "user", "Arun Kumar", "9876543210", "arun.kumar@example.com", Role.CUSTOMER,
                "SITRA", "12, Kalapatti Road, near SITRA bus stop, Coimbatore 641014", 11.0335, 77.0310, 150);
        arun.setHometown("Madurai");

        String[][] customerSeed = {
                {"Priya Raman", "Peelamedu", "11.0270", "77.0060", "Tirunelveli"},
                {"Karthik S", "Saravanampatti", "11.0790", "76.9990", "Salem"},
                {"Divya Menon", "Hope College", "11.0265", "77.0185", "Palakkad"},
                {"Rahul Verma", "SITRA", "11.0330", "77.0290", "Lucknow"},
                {"Sneha Reddy", "Kalapatti", "11.0610", "77.0400", "Nellore"},
                {"Vignesh M", "Singanallur", "10.9990", "77.0320", "Trichy"},
                {"Ananya Iyer", "Gandhipuram", "11.0168", "76.9674", "Thanjavur"},
                {"Mohammed Arif", "Peelamedu", "11.0255", "77.0030", "Vellore"},
                {"Harini B", "Vilankurichi", "11.0640", "77.0170", "Erode"},
                {"Suresh P", "SITRA", "11.0350", "77.0330", "Madurai"},
                {"Lavanya K", "Hope College", "11.0280", "77.0200", "Karur"},
                {"Ajay Nair", "Kalapatti", "11.0590", "77.0380", "Kochi"},
                {"Meera J", "Peelamedu", "11.0290", "77.0080", "Dindigul"},
                {"Gokul R", "Saravanampatti", "11.0770", "77.0010", "Namakkal"},
                {"Fathima S", "Singanallur", "11.0010", "77.0300", "Ramanathapuram"},
                {"Naveen T", "SITRA", "11.0310", "77.0350", "Kumbakonam"},
                {"Pooja G", "Ganapathy", "11.0400", "76.9750", "Hosur"},
                {"Bala Murugan", "Peelamedu", "11.0240", "77.0010", "Sivakasi"},
                {"Keerthana V", "Hope College", "11.0250", "77.0170", "Pollachi"},
                {"Sanjay D", "Kalapatti", "11.0630", "77.0420", "Bengaluru"},
                {"Revathi N", "Vilankurichi", "11.0660", "77.0150", "Theni"},
                {"Imran K", "SITRA", "11.0345", "77.0270", "Chennai"},
                {"Nithya S", "Peelamedu", "11.0275", "77.0045", "Nagercoil"},
                {"Dinesh A", "Singanallur", "10.9970", "77.0340", "Tiruppur"},
        };
        List<User> customers = new ArrayList<>();
        customers.add(arun);
        for (int i = 0; i < customerSeed.length; i++) {
            String[] c = customerSeed[i];
            User u = user("customer" + (i + 1), "user123", c[0], "98" + String.format("%08d", 40000000 + i * 1373),
                    c[0].toLowerCase().replaceAll("[^a-z]", ".") + "@example.com", Role.CUSTOMER, c[1],
                    (10 + i) + ", " + c[1] + " Main Road, Coimbatore", Double.parseDouble(c[2]), Double.parseDouble(c[3]),
                    170 - i * 6);
            u.setHometown(c[4]);
            customers.add(u);
        }

        // ---------------- kitchens
        List<KSeed> seeds = List.of(
                new KSeed("kitchenowner", "kitchenowner", "Lakshmi Ramasamy", "9843012345", "Amma's Kitchen", "SITRA",
                        11.0322, 77.0285, FoodType.BOTH, "Kongu,Chettinad,South Indian", "hero-leaf-meal.jpg",
                        "Home-style Kongu and Chettinad cooking from my family kitchen near SITRA. Everything is cooked fresh every morning with cold-pressed oil, home-ground masalas and vegetables from the Singanallur uzhavar santhai. Feels exactly like amma's lunch box.",
                        KitchenStatus.ACTIVE, "Kongu Pepper Chicken with Rice", "Erode"),
                new KSeed("annapoorna", "kitchen123", "Meena Sundaram", "9843022222", "Annapoorna Home Meals", "Peelamedu",
                        11.0262, 77.0042, FoodType.VEG, "South Indian,Kongu,Tiffin", "veg-leaf-meal.jpg",
                        "Pure vegetarian full meals served on banana leaf - sambar, rasam, two poriyals, kootu, appalam and curd. Loved by PSG and CIT students.",
                        KitchenStatus.ACTIVE, "Banana Leaf Veg Meals", "Coimbatore"),
                new KSeed("chettinad", "kitchen123", "Valli Arunachalam", "9843033333", "Chettinad Veetu Samayal", "Hope College",
                        11.0270, 77.0190, FoodType.BOTH, "Chettinad,South Indian", "chicken-curry.jpg",
                        "Authentic Karaikudi recipes passed down three generations. Our chicken chettinad and mutton kuzhambu are cooked with freshly roasted spices.",
                        KitchenStatus.ACTIVE, "Chicken Chettinad Gravy", "Karaikudi"),
                new KSeed("keralahome", "kitchen123", "Bindu Thomas", "9843044444", "Kerala Thattukada Home", "Kalapatti",
                        11.0598, 77.0385, FoodType.BOTH, "Kerala", "fish-curry.jpg",
                        "Kerala meals with matta rice, fish curry, thoran and pickle - just like home in Kottayam. Coconut oil cooking, no shortcuts.",
                        KitchenStatus.ACTIVE, "Kerala Fish Curry Meals", "Kottayam"),
                new KSeed("madurai", "kitchen123", "Selvi Murugan", "9843055555", "Madurai Mess at Home", "Singanallur",
                        11.0005, 77.0310, FoodType.BOTH, "Madurai,South Indian", "pepper-chicken.jpg",
                        "Madurai-style non-veg specials - kari dosai, mutton chukka and the famous Madurai chicken biryani made in small home batches.",
                        KitchenStatus.ACTIVE, "Madurai Mutton Chukka", "Madurai"),
                new KSeed("andhra", "kitchen123", "Padma Reddy", "9843066666", "Andhra Ruchulu Kitchen", "Vilankurichi",
                        11.0630, 77.0165, FoodType.BOTH, "Andhra", "biryani.jpg",
                        "Spicy Andhra home food - gongura chicken, pappu, pulihora and Guntur-style biryani. Spice level adjustable on request.",
                        KitchenStatus.ACTIVE, "Gongura Chicken Biryani", "Guntur"),
                new KSeed("sunita", "kitchen123", "Sunita Sharma", "9843077777", "Rotis & Sabzi by Sunita", "Saravanampatti",
                        11.0785, 76.9985, FoodType.VEG, "North Indian", "thali-chapati.jpg",
                        "Soft phulkas, dal tadka and seasonal sabzi for everyone missing North Indian ghar ka khana. Popular with IT professionals near KGiSL.",
                        KitchenStatus.ACTIVE, "Rajma Chawal Thali", "Jaipur"),
                new KSeed("gandhipuram", "kitchen123", "Kamala Devi", "9843088888", "Gandhipuram Tiffin House", "Gandhipuram",
                        11.0170, 76.9680, FoodType.VEG, "Tiffin,South Indian", "masala-dosa.jpg",
                        "Idli, dosa, pongal and evening tiffin made fresh at home since 2012.",
                        KitchenStatus.ACTIVE, "Ghee Roast Dosa", "Coimbatore"),
                new KSeed("spicebox", "kitchen123", "Revathi Krishnan", "9843099999", "Spice Box Kitchen", "Peelamedu",
                        11.0280, 77.0070, FoodType.BOTH, "South Indian,Chettinad", "chicken-gravy.jpg",
                        "Newly registered home kitchen offering lunch boxes for office goers in Peelamedu.",
                        KitchenStatus.UNDER_REVIEW, null, "Pudukkottai"),
                new KSeed("nallasoru", "kitchen123", "Anitha Prakash", "9843010101", "Nalla Soru Kitchen", "SITRA",
                        11.0340, 77.0320, FoodType.VEG, "Kongu,South Indian", "lemon-rice.jpg",
                        "Variety rice and kootu specialists - lemon rice, tamarind rice, curd rice and more.",
                        KitchenStatus.UNDER_REVIEW, null, "Gobichettipalayam"),
                new KSeed("paati", "kitchen123", "Saroja Venkatesan", "9843020202", "Paati's Recipes", "Kalapatti",
                        11.0620, 77.0410, FoodType.VEG, "South Indian,Tiffin", "idli-vada.jpg",
                        "Traditional recipes by a 62 year old paati - kanji, kootu, keerai masiyal.",
                        KitchenStatus.APPROVED, null, "Kumbakonam"),
                new KSeed("quickbites", "kitchen123", "Rani Joseph", "9843030303", "Quick Bites Home", "Ganapathy",
                        11.0400, 76.9750, FoodType.BOTH, "South Indian", "samosa.jpg",
                        "Evening snacks and dinner.",
                        KitchenStatus.SUSPENDED, null, "Coimbatore"));

        List<Kitchen> active = new ArrayList<>();
        Kitchen ammas = null;
        int idx = 0;
        for (KSeed s : seeds) {
            User owner = user(s.username(), s.password(), s.owner(), s.phone(),
                    s.username() + "@homeplate-partner.in", Role.KITCHEN_OWNER, s.area(), null, null, null, 210 - idx * 12);
            owner.setHometown(s.hometown());
            Kitchen k = new Kitchen();
            k.setOwner(owner);
            k.setName(s.name());
            k.setArea(s.area());
            k.setAddress((idx * 7 + 3) + ", " + s.area() + " Cross Street, " + s.area() + ", Coimbatore");
            k.setPincode("6410" + (14 + idx % 30));
            k.setLatitude(s.lat());
            k.setLongitude(s.lng());
            k.setFoodType(s.type());
            k.setCuisines(s.cuisines());
            k.setCoverImage(IMG + s.cover());
            k.setGalleryImages(String.join(",", IMG + s.cover(), IMG + "clean-kitchen.jpg", IMG + "fresh-vegetables.jpg", IMG + "spices.jpg"));
            k.setDescription(s.desc());
            k.setTodaySpecial(s.special());
            k.setDeliveryRadiusKm(idx == 0 ? 5.0 : 4.0 + (idx % 3) * 0.5);
            k.setOpenTime(LocalTime.of(idx % 2 == 0 ? 7 : 8, 0));
            k.setCloseTime(LocalTime.of(22, 0));
            k.setWorkingDays(idx % 3 == 0 ? "MON,TUE,WED,THU,FRI,SAT,SUN" : "MON,TUE,WED,THU,FRI,SAT");
            k.setMaxDailyOrders(30 + idx * 5);
            k.setAvgPrepMinutes(25 + (idx % 4) * 5);
            k.setIdProofType("Aadhaar");
            k.setIdProofNumber("XXXX XXXX " + (4000 + idx * 111));
            k.setIdProofUrl(IMG + "clean-kitchen-2.jpg");
            k.setFssaiType("FSSAI Basic Registration");
            k.setFssaiNumber("2242" + String.format("%010d", 1234500000L + idx * 7919L));
            k.setFssaiCertificateUrl(IMG + "clean-kitchen.jpg");
            k.setPhoneVerified(true);
            k.setStatus(s.status());
            k.setOnboardingStep(6);
            LocalDateTime created = LocalDateTime.now().minusDays(200 - idx * 15L);
            k.setCreatedAt(created);
            k.setSubmittedAt(created.plusHours(5));
            if (s.status() == KitchenStatus.ACTIVE || s.status() == KitchenStatus.APPROVED || s.status() == KitchenStatus.SUSPENDED) {
                k.setIdProofStatus(DocumentStatus.VERIFIED);
                k.setFssaiStatus(DocumentStatus.VERIFIED);
                k.setApprovedAt(created.plusDays(2));
                k.setLastInspectionAt(LocalDateTime.now().minusDays(10 + idx * 3L));
            }
            if (s.status() == KitchenStatus.UNDER_REVIEW) {
                k.setCreatedAt(LocalDateTime.now().minusDays(2 + idx % 3));
                k.setSubmittedAt(k.getCreatedAt().plusHours(3));
            }
            if (s.status() == KitchenStatus.SUSPENDED) {
                k.setAdminRemarks("Suspended after repeated hygiene complaints. Pending re-inspection.");
                k.setAcceptingOrders(false);
            }
            kitchens.save(k);
            if (s.status() == KitchenStatus.ACTIVE) active.add(k);
            if (idx == 0) ammas = k;
            idx++;
        }

        // ---------------- menus
        Map<Long, List<MenuItem>> menus = new HashMap<>();
        menus.put(active.get(0).getId(), List.of(
                item(active.get(0), "Kongu Pepper Chicken with Rice", "Country-style pepper chicken, rice, rasam and poriyal", "pepper-chicken.jpg", 140, 120, false, MealType.LUNCH, "Non-Veg Meals", true),
                item(active.get(0), "Homemade Veg Meals", "Rice, sambar, rasam, poriyal, kootu, appalam, curd", "veg-leaf-meal.jpg", 90, null, true, MealType.LUNCH, "Meals", false),
                item(active.get(0), "Chicken Biryani (Seeraga Samba)", "Coimbatore style seeraga samba biryani with raita & brinjal curry", "chicken-biryani.jpg", 150, null, false, MealType.LUNCH, "Biryani", false),
                item(active.get(0), "Chicken Curry (500 g)", "Village style kuzhambu - perfect with rice or chapati", "chicken-curry.jpg", 220, null, false, MealType.LUNCH, "Gravy", false),
                item(active.get(0), "Chapati with Veg Kurma", "3 soft chapatis with coconut veg kurma", "thali-chapati.jpg", 70, null, true, MealType.DINNER, "Tiffin", false),
                item(active.get(0), "Idli Vada Combo", "4 idlis, 1 medu vada, sambar & 2 chutneys", "idli-vada.jpg", 60, null, true, MealType.BREAKFAST, "Tiffin", false),
                item(active.get(0), "Egg Curry with Parotta", "2 parottas with Kongu egg curry", "egg-curry.jpg", 90, null, false, MealType.DINNER, "Tiffin", false),
                item(active.get(0), "Samosa (4 pcs)", "Crispy homemade potato samosas with mint chutney", "samosa.jpg", 50, null, true, MealType.SNACKS, "Snacks", false)));
        menus.put(active.get(1).getId(), List.of(
                item(active.get(1), "Banana Leaf Veg Meals", "Unlimited rice, sambar, rasam, kootu, 2 poriyals, appalam, payasam", "veg-leaf-meal.jpg", 100, 85, true, MealType.LUNCH, "Meals", true),
                item(active.get(1), "Lemon Rice & Potato Fry", "Tangy lemon rice with crispy potato roast", "lemon-rice.jpg", 70, null, true, MealType.LUNCH, "Variety Rice", false),
                item(active.get(1), "Tomato Rice", "Spiced tomato rice with onion raita", "tomato-rice.jpg", 70, null, true, MealType.LUNCH, "Variety Rice", false),
                item(active.get(1), "Masala Dosa", "Crisp dosa with potato masala, sambar & chutney", "masala-dosa.jpg", 60, null, true, MealType.BREAKFAST, "Tiffin", false),
                item(active.get(1), "Idli Sambar (4)", "Soft idlis with drumstick sambar", "idli-vada.jpg", 45, null, true, MealType.BREAKFAST, "Tiffin", false),
                item(active.get(1), "Veg Pulao with Kurma", "Mild vegetable pulao", "veg-pulao.jpg", 80, null, true, MealType.DINNER, "Rice", false)));
        menus.put(active.get(2).getId(), List.of(
                item(active.get(2), "Chicken Chettinad Gravy", "Freshly roasted Chettinad masala, 350 g", "chicken-gravy.jpg", 180, null, false, MealType.LUNCH, "Gravy", true),
                item(active.get(2), "Mutton Kuzhambu Meals", "Rice, mutton kuzhambu, rasam, poriyal", "mutton-curry.jpg", 220, null, false, MealType.LUNCH, "Non-Veg Meals", false),
                item(active.get(2), "Chettinad Chicken Biryani", "Small batch biryani with chicken 65", "chicken-biryani-bowl.jpg", 170, 155, false, MealType.LUNCH, "Biryani", false),
                item(active.get(2), "Kadai Paneer with Chapati", "For our vegetarian friends", "kadai-paneer.jpg", 130, null, true, MealType.DINNER, "Tiffin", false),
                item(active.get(2), "Egg Kulambu & Rice", "Home-style egg curry", "egg-curry.jpg", 110, null, false, MealType.DINNER, "Meals", false)));
        menus.put(active.get(3).getId(), List.of(
                item(active.get(3), "Kerala Fish Curry Meals", "Matta rice, meen curry, thoran, pickle, papad", "fish-curry.jpg", 160, null, false, MealType.LUNCH, "Non-Veg Meals", true),
                item(active.get(3), "Kerala Veg Sadya Mini", "Avial, thoran, olan, sambar, payasam", "veg-leaf-meal.jpg", 120, null, true, MealType.LUNCH, "Meals", false),
                item(active.get(3), "Chicken Roast & Appam", "3 appams with Kerala chicken roast", "butter-chicken.jpg", 150, null, false, MealType.DINNER, "Tiffin", false),
                item(active.get(3), "Egg Roast with Parotta", "Malabar parotta with spicy egg roast", "egg-curry.jpg", 100, null, false, MealType.DINNER, "Tiffin", false)));
        menus.put(active.get(4).getId(), List.of(
                item(active.get(4), "Madurai Mutton Chukka", "Dry roasted mutton, 250 g", "mutton-curry.jpg", 240, null, false, MealType.LUNCH, "Non-Veg", true),
                item(active.get(4), "Madurai Chicken Biryani", "Seeraga samba biryani, egg & raita", "biryani.jpg", 160, null, false, MealType.LUNCH, "Biryani", false),
                item(active.get(4), "Chicken 65 (250 g)", "Crispy, spicy, homemade", "tandoori-chicken.jpg", 150, null, false, MealType.SNACKS, "Starters", false),
                item(active.get(4), "Kari Dosai", "Madurai's famous mutton keema dosa", "masala-dosa.jpg", 140, null, false, MealType.DINNER, "Tiffin", false),
                item(active.get(4), "Veg Meals", "Simple and comforting", "veg-leaf-meal.jpg", 85, null, true, MealType.LUNCH, "Meals", false)));
        menus.put(active.get(5).getId(), List.of(
                item(active.get(5), "Gongura Chicken Biryani", "Andhra spicy biryani with gongura", "biryani.jpg", 170, 150, false, MealType.LUNCH, "Biryani", true),
                item(active.get(5), "Andhra Veg Meals", "Pappu, sambar, rasam, curd, pickle, podi", "poori-thali.jpg", 100, null, true, MealType.LUNCH, "Meals", false),
                item(active.get(5), "Chilli Chicken Fry", "Guntur chilli chicken, 250 g", "pepper-chicken.jpg", 160, null, false, MealType.DINNER, "Non-Veg", false),
                item(active.get(5), "Pulihora", "Andhra tamarind rice", "tomato-rice.jpg", 70, null, true, MealType.LUNCH, "Variety Rice", false)));
        menus.put(active.get(6).getId(), List.of(
                item(active.get(6), "Rajma Chawal Thali", "Rajma, jeera rice, 2 phulkas, salad", "thali-chapati.jpg", 120, null, true, MealType.LUNCH, "Thali", true),
                item(active.get(6), "Paneer Butter Masala & Roti", "Creamy paneer with 3 tawa rotis", "paneer-butter-masala.jpg", 140, null, true, MealType.DINNER, "Tiffin", false),
                item(active.get(6), "Palak Paneer Thali", "Palak paneer, dal, rice, rotis", "palak-paneer.jpg", 130, null, true, MealType.DINNER, "Thali", false),
                item(active.get(6), "Pav Bhaji", "Mumbai style with buttered pav", "pav-bhaji.jpg", 90, null, true, MealType.SNACKS, "Snacks", false)));
        menus.put(active.get(7).getId(), List.of(
                item(active.get(7), "Ghee Roast Dosa", "Crispy ghee roast with 3 chutneys", "masala-dosa.jpg", 80, null, true, MealType.BREAKFAST, "Tiffin", true),
                item(active.get(7), "Idli Vada Set", "Soft idlis and crispy vada", "idli-vada.jpg", 55, null, true, MealType.BREAKFAST, "Tiffin", false),
                item(active.get(7), "Mini Meals", "Rice, sambar, rasam, poriyal, curd", "veg-leaf-meal.jpg", 75, null, true, MealType.LUNCH, "Meals", false)));
        for (List<MenuItem> l : menus.values()) menu.saveAll(l);

        // ---------------- subscriptions
        for (int i = 0; i < active.size(); i++) {
            Kitchen k = active.get(i);
            LocalDate approved = k.getApprovedAt().toLocalDate();
            if (i == 0) { // kitchenowner: inside the free trial
                sub(k, "Free Trial", null, BigDecimal.ZERO, LocalDate.now().minusDays(10), LocalDate.now().plusDays(20), SubscriptionStatus.TRIAL, LocalDateTime.now().minusDays(10));
                continue;
            }
            LocalDate trialEnd = approved.plusDays(settings.getFreeTrialDays());
            sub(k, "Free Trial", null, BigDecimal.ZERO, approved, trialEnd, SubscriptionStatus.TRIAL, approved.atTime(10, 0));
            LocalDate start = trialEnd.plusDays(1);
            boolean annual = i % 4 == 1;
            while (!start.isAfter(LocalDate.now())) {
                int days = annual ? 365 : 30;
                sub(k, annual ? "Annual" : "Monthly", annual ? 3L : 1L, new BigDecimal(annual ? "4999" : "499"),
                        start, start.plusDays(days - 1L), SubscriptionStatus.ACTIVE, start.atTime(9, 30));
                start = start.plusDays(days);
            }
        }
        sub(kitchens.findByOwnerId(users.findByUsername("quickbites").orElseThrow().getId()).orElseThrow(), "Monthly", 1L,
                new BigDecimal("499"), LocalDate.now().minusDays(45), LocalDate.now().minusDays(16), SubscriptionStatus.ACTIVE, LocalDateTime.now().minusDays(45));

        // ---------------- historical orders (last ~6 months)
        PaymentMethod[] methods = {PaymentMethod.UPI, PaymentMethod.UPI, PaymentMethod.UPI, PaymentMethod.CARD, PaymentMethod.COD};
        for (int n = 0; n < 340; n++) {
            Kitchen k = active.get(weightedKitchen(active.size()));
            if (k.getApprovedAt().isAfter(LocalDateTime.now().minusDays(1))) continue;
            long maxDays = Math.max(1, Duration.between(k.getApprovedAt(), LocalDateTime.now()).toDays());
            long daysAgo = (long) (Math.pow(rnd.nextDouble(), 1.6) * Math.min(maxDays, 175)) + 1;
            LocalDateTime at = LocalDate.now().minusDays(daysAgo).atTime(8 + rnd.nextInt(13), rnd.nextInt(60));
            User c = customers.get(rnd.nextInt(customers.size()));
            OrderStatus st = rnd.nextInt(100) < 92 ? OrderStatus.DELIVERED : (rnd.nextBoolean() ? OrderStatus.CANCELLED : OrderStatus.REJECTED);
            historicOrder(c, k, menus.get(k.getId()), at, st, methods[rnd.nextInt(methods.length)], settings);
        }

        // ---------------- today's live orders for Amma's Kitchen (kitchenowner) & Arun (user)
        List<MenuItem> am = menus.get(ammas.getId());
        LocalDateTime now = LocalDateTime.now();
        historicOrder(customers.get(3), ammas, am, now.minusMinutes(5), OrderStatus.PLACED, PaymentMethod.UPI, settings);
        historicOrder(customers.get(10), ammas, am, now.minusMinutes(12), OrderStatus.PLACED, PaymentMethod.COD, settings);
        historicOrder(customers.get(16), ammas, am, now.minusMinutes(25), OrderStatus.CONFIRMED, PaymentMethod.UPI, settings);
        historicOrder(customers.get(22), ammas, am, now.minusMinutes(40), OrderStatus.PREPARING, PaymentMethod.CARD, settings);
        historicOrder(arun, ammas, am, now.minusMinutes(50), OrderStatus.OUT_FOR_DELIVERY, PaymentMethod.UPI, settings);
        historicOrder(customers.get(5), ammas, am, now.minusMinutes(90), OrderStatus.DELIVERED, PaymentMethod.UPI, settings);
        historicOrder(customers.get(1), ammas, am, now.minusMinutes(130), OrderStatus.DELIVERED, PaymentMethod.COD, settings);
        historicOrder(arun, active.get(1), menus.get(active.get(1).getId()), now.minusDays(2).withHour(13), OrderStatus.DELIVERED, PaymentMethod.UPI, settings)
                .setReviewed(false);

        // ---------------- reviews
        String[][] reviewText = {
                {"5", "Tasted exactly like my mother's cooking. The rasam took me straight back home!"},
                {"5", "Very hygienic packing and on-time delivery. Will order daily now."},
                {"4", "Good quantity and fresh food. Slightly spicy but loved it."},
                {"5", "Best homemade biryani near PSG. Not oily at all."},
                {"4", "Affordable and filling. Great for hostel students like me."},
                {"5", "Aunty even called to ask about my spice preference. So caring!"},
                {"3", "Food was good but delivery was 15 minutes late."},
                {"5", "Finally real home food in Coimbatore. Thank you HomePlate!"},
                {"4", "Chapatis were super soft. Kurma could have more vegetables."},
                {"5", "The custom chicken gravy I requested was perfect."},
        };
        for (Kitchen k : active) {
            int count = 5 + rnd.nextInt(6);
            for (int i = 0; i < count; i++) {
                String[] r = reviewText[rnd.nextInt(reviewText.length)];
                Review rv = new Review();
                rv.setKitchen(k);
                User c = customers.get(rnd.nextInt(customers.size()));
                rv.setCustomerId(c.getId());
                rv.setCustomerName(c.getFullName());
                rv.setRating(k == ammas ? Math.max(4, Integer.parseInt(r[0])) : Integer.parseInt(r[0]));
                rv.setComment(r[1]);
                rv.setCreatedAt(LocalDateTime.now().minusDays(rnd.nextInt(90)).minusHours(rnd.nextInt(12)));
                if (i == 0) rv.setKitchenReply("Thank you so much! Happy to cook for you anytime.");
                reviews.save(rv);
            }
            orderService.recalcRating(k);
        }

        // ---------------- cooking videos
        String[] vdesc = {"Morning lunch preparation - washing vegetables and cooking sambar",
                "Preparing chicken gravy with freshly ground masala", "Kitchen cleaning and storage walkthrough",
                "Biryani dum preparation", "Chapati dough and kurma preparation"};
        for (int i = 0; i < active.size(); i++) {
            Kitchen k = active.get(i);
            for (int d = 5; d >= 1; d--) {
                video(k, LocalDate.now().minusDays(d), vdesc[(i + d) % vdesc.length],
                        d == 3 && i % 3 == 2 ? VideoStatus.RESUBMISSION_REQUIRED : VideoStatus.APPROVED,
                        d == 3 && i % 3 == 2 ? "Storage area not visible. Please show refrigerator and dry storage." : "Clean preparation area. Good hygiene.");
            }
            if (i < 5) video(k, LocalDate.now(), vdesc[i % vdesc.length], VideoStatus.PENDING_REVIEW, null);
        }

        // ---------------- custom requests
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        CustomRequest r1 = request(arun, "Homemade Chicken Gravy", "500 g chicken", "Medium", false, "Chettinad", tomorrow, MealType.LUNCH,
                LocalTime.of(13, 0), "Less oil please. Bone-in pieces preferred. Need it with 2 chapatis.", new BigDecimal("300"),
                arun.getAddress(), "SITRA", arun.getLatitude(), arun.getLongitude(), RequestStatus.OFFERS_RECEIVED, 3);
        quote(r1, active.get(2), "260", 90, "Will cook Chettinad style with country chicken masala. Chapatis included.");
        quote(r1, active.get(0), "240", 75, "Kongu style gravy, home ground masala. I can add 2 chapatis free.");
        quote(r1, active.get(4), "280", 80, "Madurai style - medium spicy, bone-in pieces as requested.");

        User rahul = customers.get(4);
        request(rahul, "Dal Khichdi with Ghee", "2 plates", "Mild", true, "North Indian", tomorrow, MealType.DINNER,
                LocalTime.of(20, 0), "Recovering from fever, please keep it very light.", new BigDecimal("150"),
                rahul.getAddress(), "SITRA", rahul.getLatitude(), rahul.getLongitude(), RequestStatus.SUBMITTED, 1);
        User divya = customers.get(3);
        request(divya, "Kerala Style Puttu & Kadala Curry", "2 servings", "Medium", true, "Kerala", tomorrow, MealType.BREAKFAST,
                LocalTime.of(8, 0), "Missing home breakfast!", new BigDecimal("140"),
                divya.getAddress(), "Hope College", divya.getLatitude(), divya.getLongitude(), RequestStatus.SUBMITTED, 2);
        User suresh = customers.get(10);
        request(suresh, "Mutton Biryani for Birthday", "1 kg (serves 4)", "Spicy", false, "Madurai", LocalDate.now().plusDays(3), MealType.LUNCH,
                LocalTime.of(12, 30), "Birthday lunch for roommates. Please add raita and brinjal curry.", new BigDecimal("900"),
                suresh.getAddress(), "SITRA", suresh.getLatitude(), suresh.getLongitude(), RequestStatus.SUBMITTED, 4);

        // ---------------- complaints
        complaint(customers.get(6), active.get(7), "Delivery", "Order delivered late", "Food arrived 40 minutes after the estimated time and was cold.", ComplaintStatus.OPEN, "MEDIUM");
        complaint(customers.get(2), active.get(4), "Quality", "Too much oil in biryani", "Biryani was very oily compared to last time.", ComplaintStatus.IN_PROGRESS, "MEDIUM");
        complaint(customers.get(8), kitchens.findByOwnerId(users.findByUsername("quickbites").orElseThrow().getId()).orElseThrow(),
                "Hygiene", "Found hair in food", "Found a hair strand in the samosa. Very disappointed.", ComplaintStatus.RESOLVED, "HIGH")
                .setResolution("Kitchen suspended pending re-inspection. Customer refunded.");
        complaint(arun, active.get(1), "Payment", "Charged twice", "UPI payment deducted twice for one order.", ComplaintStatus.RESOLVED, "HIGH")
                .setResolution("Duplicate amount refunded to original payment method.");

        log.info("Seed complete: {} users, {} kitchens, {} orders", users.count(), kitchens.count(), orders.count());
    }

    // ------------------------------------------------------------------ helpers

    private int weightedKitchen(int n) {
        double r = rnd.nextDouble();
        if (r < 0.28) return 0;
        return 1 + rnd.nextInt(n - 1);
    }

    private User user(String username, String password, String name, String phone, String email, Role role,
                      String area, String address, Double lat, Double lng, int daysAgo) {
        User u = new User();
        u.setUsername(username);
        u.setPassword(encoder.encode(password));
        u.setFullName(name);
        u.setPhone(phone);
        u.setEmail(email);
        u.setRole(role);
        u.setArea(area);
        u.setAddress(address);
        u.setLatitude(lat);
        u.setLongitude(lng);
        u.setPhoneVerified(true);
        u.setCreatedAt(LocalDateTime.now().minusDays(Math.max(0, daysAgo)).minusHours(rnd.nextInt(10)));
        return users.save(u);
    }

    private void plan(String name, String desc, String price, int days, boolean popular, String features) {
        SubscriptionPlan p = new SubscriptionPlan();
        p.setName(name);
        p.setDescription(desc);
        p.setPrice(new BigDecimal(price));
        p.setDurationDays(days);
        p.setPopular(popular);
        p.setFeatures(features);
        plans.save(p);
    }

    private void offer(String code, String desc, String pct, String max, String min) {
        Offer o = new Offer();
        o.setCode(code);
        o.setDescription(desc);
        o.setDiscountPercent(new BigDecimal(pct));
        o.setMaxDiscount(new BigDecimal(max));
        o.setMinOrder(new BigDecimal(min));
        o.setValidTill(LocalDate.now().plusMonths(3));
        o.setUsageCount(rnd.nextInt(80));
        offers.save(o);
    }

    private MenuItem item(Kitchen k, String name, String desc, String img, int price, Integer offer, boolean veg,
                          MealType meal, String category, boolean special) {
        MenuItem m = new MenuItem();
        m.setKitchen(k);
        m.setName(name);
        m.setDescription(desc);
        m.setImageUrl(IMG + img);
        m.setPrice(BigDecimal.valueOf(price));
        if (offer != null) m.setOfferPrice(BigDecimal.valueOf(offer));
        m.setVeg(veg);
        m.setMealType(meal);
        m.setCategory(category);
        m.setQuantityAvailable(15 + rnd.nextInt(30));
        m.setTodaySpecial(special);
        m.setServingSize(category.contains("Gravy") ? "500 g" : "1 plate");
        return m;
    }

    private void sub(Kitchen k, String plan, Long planId, BigDecimal amount, LocalDate start, LocalDate end,
                     SubscriptionStatus st, LocalDateTime created) {
        Subscription s = new Subscription();
        s.setKitchen(k);
        s.setPlanName(plan);
        s.setPlanId(planId);
        s.setAmount(amount);
        s.setStartDate(start);
        s.setEndDate(end);
        s.setStatus(st);
        s.setCreatedAt(created);
        if (amount.signum() > 0) {
            s.setPaymentMethod(PaymentMethod.UPI);
            s.setPaymentReference("SUB-" + Integer.toHexString(rnd.nextInt(0xFFFFFF) + 0x100000).toUpperCase());
        }
        subs.save(s);
    }

    private FoodOrder historicOrder(User c, Kitchen k, List<MenuItem> items, LocalDateTime at, OrderStatus st,
                                    PaymentMethod pm, PlatformSettings s) {
        FoodOrder o = new FoodOrder();
        o.setCustomer(c);
        o.setKitchen(k);
        int lines = 1 + (rnd.nextInt(10) < 3 ? 1 : 0);
        BigDecimal food = BigDecimal.ZERO;
        Set<Long> used = new HashSet<>();
        for (int i = 0; i < lines; i++) {
            MenuItem m = items.get(rnd.nextInt(items.size()));
            if (!used.add(m.getId())) continue;
            int q = 1 + (rnd.nextInt(10) < 2 ? 1 : 0);
            BigDecimal price = m.getOfferPrice() != null ? m.getOfferPrice() : m.getPrice();
            OrderItem oi = new OrderItem();
            oi.setOrder(o);
            oi.setMenuItemId(m.getId());
            oi.setName(m.getName());
            oi.setImageUrl(m.getImageUrl());
            oi.setVeg(m.isVeg());
            oi.setUnitPrice(price);
            oi.setQuantity(q);
            oi.setLineTotal(price.multiply(BigDecimal.valueOf(q)));
            o.getItems().add(oi);
            food = food.add(oi.getLineTotal());
            if (o.getMealSlot() == null) o.setMealSlot(m.getMealType());
        }
        BigDecimal delivery = food.compareTo(s.getFreeDeliveryAbove()) >= 0 ? BigDecimal.ZERO : s.getDeliveryCharge();
        BigDecimal commission = food.multiply(s.getCommissionPercent()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        o.setFoodTotal(food);
        o.setDeliveryCharge(delivery);
        o.setPlatformFee(s.getPlatformFee());
        o.setTotalAmount(food.add(delivery).add(s.getPlatformFee()));
        o.setCommission(commission);
        o.setKitchenEarning(food.subtract(commission).add(delivery));
        o.setPaymentMethod(pm);
        boolean paidStage = st == OrderStatus.DELIVERED || pm != PaymentMethod.COD;
        o.setPaymentStatus(st == OrderStatus.CANCELLED || st == OrderStatus.REJECTED
                ? (pm == PaymentMethod.COD ? PaymentStatus.PENDING : PaymentStatus.REFUNDED)
                : (paidStage ? PaymentStatus.PAID : PaymentStatus.COD_PENDING));
        if (pm != PaymentMethod.COD) o.setPaymentReference("PAY-" + Integer.toHexString(rnd.nextInt(0xFFFFFF) + 0x1000000).toUpperCase());
        o.setStatus(st);
        o.setDeliveryAddress(c.getAddress());
        o.setDeliveryArea(c.getArea());
        o.setDeliveryLatitude(c.getLatitude());
        o.setDeliveryLongitude(c.getLongitude());
        Double d = com.homeplate.service.Geo.distanceKm(c.getLatitude(), c.getLongitude(), k.getLatitude(), k.getLongitude());
        o.setDistanceKm(d);
        o.setCreatedAt(at);
        o.setEstimatedDeliveryAt(at.plusMinutes(45));
        if (st.ordinal() >= OrderStatus.CONFIRMED.ordinal() && st != OrderStatus.CANCELLED && st != OrderStatus.REJECTED) o.setConfirmedAt(at.plusMinutes(3));
        if (st.ordinal() >= OrderStatus.PREPARING.ordinal() && st.ordinal() <= OrderStatus.DELIVERED.ordinal()) o.setPreparingAt(at.plusMinutes(8));
        if (st.ordinal() >= OrderStatus.READY.ordinal() && st.ordinal() <= OrderStatus.DELIVERED.ordinal()) o.setReadyAt(at.plusMinutes(30));
        if (st.ordinal() >= OrderStatus.OUT_FOR_DELIVERY.ordinal() && st.ordinal() <= OrderStatus.DELIVERED.ordinal()) o.setOutForDeliveryAt(at.plusMinutes(33));
        if (st == OrderStatus.DELIVERED) {
            o.setDeliveredAt(at.plusMinutes(42 + rnd.nextInt(10)));
            o.setReviewed(true);
        }
        if (st == OrderStatus.CANCELLED) o.setCancelReason("Cancelled by customer");
        if (st == OrderStatus.REJECTED) o.setCancelReason("Kitchen at full capacity");
        o = orders.save(o);
        o.setOrderNumber(String.format("HP%06d", 100000 + o.getId()));
        return o;
    }

    private void video(Kitchen k, LocalDate date, String desc, VideoStatus st, String remarks) {
        CookingVideo v = new CookingVideo();
        v.setKitchen(k);
        v.setPreparationDate(date);
        v.setDescription(desc);
        v.setThumbnailUrl(IMG + (desc.contains("Biryani") ? "veg-biryani.jpg" : desc.contains("cleaning") ? "clean-kitchen-2.jpg"
                : desc.contains("chicken") ? "chicken-gravy.jpg" : desc.contains("Chapati") ? "thali-chapati.jpg" : "pan-cooking.jpg"));
        v.setDurationSeconds(60 + rnd.nextInt(180));
        v.setStatus(st);
        v.setAdminRemarks(remarks);
        v.setCreatedAt(date.atTime(9, 15));
        if (st != VideoStatus.PENDING_REVIEW) {
            v.setReviewedAt(date.atTime(15, 0));
            v.setReviewedBy("owner");
            boolean ok = st == VideoStatus.APPROVED;
            v.setCleanlinessOk(true);
            v.setStorageOk(ok);
            v.setHygieneOk(true);
        }
        videos.save(v);
    }

    private CustomRequest request(User c, String dish, String qty, String spice, boolean veg, String style, LocalDate date,
                                  MealType slot, LocalTime time, String instructions, BigDecimal budget, String address,
                                  String area, Double lat, Double lng, RequestStatus st, int hoursAgo) {
        CustomRequest r = new CustomRequest();
        r.setCustomer(c);
        r.setDishName(dish);
        r.setQuantity(qty);
        r.setSpiceLevel(spice);
        r.setVeg(veg);
        r.setCuisineStyle(style);
        r.setRequiredDate(date);
        r.setMealSlot(slot);
        r.setPreferredTime(time);
        r.setInstructions(instructions);
        r.setBudget(budget);
        r.setDeliveryAddress(address);
        r.setDeliveryArea(area);
        r.setLatitude(lat);
        r.setLongitude(lng);
        r.setStatus(st);
        r.setCreatedAt(LocalDateTime.now().minusHours(hoursAgo));
        r = requests.save(r);
        r.setRequestNumber(String.format("CR%05d", 10000 + r.getId()));
        return r;
    }

    private void quote(CustomRequest r, Kitchen k, String price, int prep, String note) {
        Quotation q = new Quotation();
        q.setRequest(r);
        q.setKitchen(k);
        q.setPrice(new BigDecimal(price));
        q.setPrepTimeMinutes(prep);
        q.setNote(note);
        q.setDistanceKm(com.homeplate.service.Geo.distanceKm(r.getLatitude(), r.getLongitude(), k.getLatitude(), k.getLongitude()));
        q.setCreatedAt(LocalDateTime.now().minusMinutes(30 + rnd.nextInt(90)));
        quotes.save(q);
        r.setOfferCount(Optional.ofNullable(r.getOfferCount()).orElse(0) + 1);
    }

    private Complaint complaint(User c, Kitchen k, String cat, String subject, String desc, ComplaintStatus st, String priority) {
        Complaint cp = new Complaint();
        cp.setCustomer(c);
        cp.setKitchen(k);
        cp.setCategory(cat);
        cp.setSubject(subject);
        cp.setDescription(desc);
        cp.setStatus(st);
        cp.setPriority(priority);
        cp.setCreatedAt(LocalDateTime.now().minusDays(1 + rnd.nextInt(20)));
        if (st == ComplaintStatus.RESOLVED) cp.setResolvedAt(cp.getCreatedAt().plusDays(1));
        return complaints.save(cp);
    }
}
