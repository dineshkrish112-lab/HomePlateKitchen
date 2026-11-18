package com.homeplate.entity;

/** Shared enum types for the domain. */
public final class Enums {
    private Enums() {}

    public enum UserStatus { ACTIVE, SUSPENDED }

    /** Pending -> Under Review -> Approved -> Active (plus Rejected / Suspended / Docs requested). */
    public enum KitchenStatus { PENDING, UNDER_REVIEW, APPROVED, ACTIVE, REJECTED, SUSPENDED, DOCS_REQUESTED }

    public enum FoodType { VEG, NON_VEG, BOTH }

    public enum MealType { BREAKFAST, LUNCH, SNACKS, DINNER }

    public enum OrderType { DAILY_MENU, CUSTOM_REQUEST }

    public enum OrderStatus { PAYMENT_PENDING, PLACED, CONFIRMED, PREPARING, READY, OUT_FOR_DELIVERY, DELIVERED, CANCELLED, REJECTED }

    public enum PaymentStatus { PENDING, PAID, COD_PENDING, REFUNDED, FAILED }

    public enum PaymentMethod { UPI, CARD, NET_BANKING, COD }

    public enum RequestStatus { SUBMITTED, OFFERS_RECEIVED, OFFER_SELECTED, CONFIRMED, CANCELLED, EXPIRED }

    public enum QuotationStatus { PENDING, SELECTED, NOT_SELECTED, DECLINED }

    public enum VideoStatus { PENDING_REVIEW, APPROVED, REJECTED, RESUBMISSION_REQUIRED }

    public enum SubscriptionStatus { TRIAL, ACTIVE, EXPIRED, CANCELLED }

    public enum ComplaintStatus { OPEN, IN_PROGRESS, RESOLVED, CLOSED }

    public enum DocumentStatus { PENDING, VERIFIED, REJECTED }
}
