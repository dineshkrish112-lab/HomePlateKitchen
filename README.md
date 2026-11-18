# HomePlate — Homemade food. Local kitchens. A taste of home.

Hyperlocal homemade food marketplace for Coimbatore: customers discover verified home kitchens
within 5 km, order today's homemade menu, or request a custom dish and pick the best quote.

Three portals on one backend:

| Portal | URL | Demo login |
|---|---|---|
| Customer | http://localhost:5173 → Login | `user` / `user` |
| Kitchen Owner | http://localhost:5173/kitchen/login | `kitchenowner` / `kitchenowner` |
| Super Admin | http://localhost:5173/admin/login | `owner` / `owner` |

Other seeded kitchen owners: `annapoorna`, `chettinad`, `keralahome`, `madurai`, `andhra`, `sunita`,
`gandhipuram`, `spicebox` (under review), `nallasoru` (under review), `paati` (approved), `quickbites` (suspended) —
password `kitchen123`. Extra customers: `customer1` … `customer24`, password `user123`.

## Tech stack

- **Backend:** Java 17 · Spring Boot 3.5 · Spring Security (JWT) · Spring Data JPA · MySQL 8
- **Frontend:** React 18 · TypeScript · Vite · Tailwind CSS · React Router · Recharts · Lucide icons · Leaflet (OpenStreetMap)

## Run it

Requirements: JDK 17+ (you have 25), Node 18+, MySQL running on `localhost:3306`.

1. **Backend** (port **8090** — 8080 is used by another app on this machine)
   Double-click `start-backend.bat`, or:
   ```bash
   cd backend
   mvn spring-boot:run
   ```
   The database `homeplate` is created automatically and filled with sample data on first start.
   **First time on a new machine:** copy `backend/src/main/resources/application-secrets.example.yml` to
   `application-secrets.yml` in the same folder and put your MySQL password there (this file is git-ignored).
   Alternatively set the `DB_USERNAME` / `DB_PASSWORD` environment variables.

2. **Frontend** (port 5173)
   Double-click `start-frontend.bat`, or:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. Open http://localhost:5173

**Reset the sample data:** stop the backend, run `DROP DATABASE homeplate;` in MySQL, start the backend again.

## Business rules implemented

- **Discovery:** GPS / area based, configurable radius (default 5 km), also limited by each kitchen's own delivery radius.
  Only `ACTIVE` kitchens with a valid trial or paid subscription (+ grace period) are shown.
- **Kitchen onboarding:** register → mobile OTP → kitchen info → address + GPS pin → ID proof + FSSAI → operations → submit.
  Status: Pending → Under Review → Approved → Active (also Docs requested / Rejected / Suspended).
  Activation starts the free trial (default 30 days).
- **Daily menu orders:** one kitchen per cart, stock decremented, max-orders-per-day limit, coupons, free delivery threshold.
  Lifecycle: Placed → Accepted → Preparing → Ready → Out for delivery → Delivered (or Rejected / Cancelled with refund status).
- **Custom food requests:** sent to eligible kitchens nearby (veg-only kitchens skip non-veg requests).
  Kitchens accept & quote or reject → customer compares offers → selects one → pays → confirmed → normal order lifecycle.
  **11:00 AM cutoff** for same-day lunch (dinner/snacks cutoff 4 PM, breakfast needs the previous day) — enforced on the server.
- **Cooking videos:** kitchens upload daily videos; admin reviews with a hygiene checklist (Approve / Reject / Resubmission required).
  Shown on the customer-facing **Kitchen Trust Profile** together with documents, ratings, complaints and inspections —
  presented as supporting evidence, not a safety guarantee.
- **Revenue (hybrid model):** subscription plans + configurable commission % on food total + small platform fee.
  Kitchen earning = food total − commission + delivery charge (self-delivery). Coupons are platform-funded.
- **Admin:** dashboards, kitchen & document verification, video reviews, orders, custom requests, subscriptions & plans,
  revenue, offers, CSV reports (today / week / month / custom range), complaints, platform settings.

## Integration points (ready for later)

- **Twilio SMS:** `NotificationService` already calls the Twilio REST API. Set `homeplate.twilio.enabled=true` and the
  env vars `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, then set `homeplate.dev-otp=false`
  so OTPs are no longer shown on screen. Until then every SMS is printed in the backend log.
- **Email:** `NotificationService.sendEmail` (logs today) — plug in Twilio SendGrid.
- **Payments:** `OrderService.pay` / `SubscriptionService.subscribe` are mock gateways (test mode). Replace with Razorpay
  checkout + signature verification.
- **File storage:** `FileStorageService` saves to `backend/uploads/`. Swap for S3 / cloud storage.
- **Maps:** OpenStreetMap via Leaflet (no key). Can be switched to Google Maps / Mapbox in `components/Maps.tsx`.

## Project structure

```
backend/src/main/java/com/homeplate/
  config/       DataSeeder, exception handling, static uploads
  security/     JWT filter, security rules per portal
  entity/       JPA entities (User, Kitchen, MenuItem, FoodOrder, CustomRequest, Quotation, CookingVideo, …)
  repository/   Spring Data repositories
  service/      Business logic (orders, custom requests, discovery, subscriptions, stats, OTP, notifications)
  controller/   REST APIs: /api/auth, /api/public, /api/customer, /api/kitchen, /api/admin, /api/files
frontend/src/
  api/ context/ components/ layouts/ types/ utils/
  pages/customer  pages/kitchen  pages/admin  pages/auth
```

## Before going live

- Change the JWT secret (`JWT_SECRET` env var) and the database password; never commit real secrets.
- Turn off `dev-otp`, connect Twilio and a real payment gateway.
- Food-safety: keep FSSAI verification and periodic inspections as part of the process.
