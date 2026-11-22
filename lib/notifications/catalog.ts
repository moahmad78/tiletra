/**
 * IntriHub Notification Catalog — Single Source of Truth
 * Defines all Vendor (V01-V17) and User (U01-U20) notification types,
 * mapped to their respective channels, sounds, priorities, TTLs, and deep links.
 * Conforms to IntriHub Notification System PRD v1 Section 5, 6 & 7.
 */

export type VendorNotificationType =
  | "ORDER_NEW"                   // V01
  | "ORDER_ACCEPT_REMINDER"       // V02
  | "ORDER_SCHEDULED_DUE"         // V03
  | "ORDER_EXPIRED"               // V04
  | "ORDER_CANCELLED_BY_CUSTOMER" // V05
  | "DELIVERY_PARTNER_ASSIGNED"   // V06
  | "PICKUP_DELAY"                // V07
  | "RETURN_REQUEST"              // V08
  | "SLOT_FULL"                   // V09
  | "ORDER_PENDING_STATUS"        // V10
  | "PAYOUT_SETTLED"              // V11
  | "ITEM_APPROVED"               // V12
  | "ITEM_REJECTED"               // V12
  | "STOCK_LOW"                   // V13
  | "STORE_OFFLINE_REMINDER"      // V14
  | "VENDOR_OFFER"                // V15
  | "REVIEW_RECEIVED"             // V16
  | "ACCOUNT_UPDATE";             // V17

export type UserNotificationType =
  | "ORDER_PLACED"                // U01
  | "PAYMENT_FAILED"              // U02
  | "ORDER_ACCEPTED"              // U03
  | "ORDER_PACKED"                // U04
  | "ORDER_DISPATCHED"            // U04
  | "ORDER_OUT_FOR_DELIVERY"      // U05
  | "ORDER_ARRIVING_SOON"         // U06
  | "ORDER_DELIVERED"             // U07
  | "ORDER_CANCELLED"             // U08
  | "ORDER_DELAYED"               // U09
  | "REFUND_INITIATED"            // U10
  | "REFUND_COMPLETED"            // U10
  | "RETURN_STATUS"               // U11
  | "SCHEDULED_CONFIRMED"         // U12
  | "SCHEDULED_REMINDER"          // U12
  | "PROMO_OFFER"                 // U13
  | "CART_ABANDONED"              // U14
  | "WISHLIST_PRICE_DROP"         // U15
  | "BACK_IN_STOCK"               // U15
  | "COUPON_EXPIRING"             // U16
  | "NEW_ARRIVALS"                // U17
  | "REVIEW_REQUEST"              // U18
  | "SUPPORT_REPLY"               // U19
  | "ACCOUNT_UPDATE";             // U20

export type NotificationCatalogType = VendorNotificationType | UserNotificationType;

export interface NotificationTypeMeta {
  type: NotificationCatalogType;
  channelId: string;
  sound: string;
  priority: "high" | "normal" | "default";
  ttlSeconds: number;
  category: "order" | "reminder" | "warning" | "finance" | "promo" | "account";
  role: "vendor" | "customer" | "admin" | "any";
  defaultTitle: string;
  defaultDeepLink: (data: Record<string, any>) => string;
}

// ─────────────────────────────────────────────────────────────────────────────
// VENDOR CHANNELS & METADATA (V01 – V17)
// ─────────────────────────────────────────────────────────────────────────────
export const VENDOR_CATALOG: Record<VendorNotificationType, NotificationTypeMeta> = {
  ORDER_NEW: {
    type: "ORDER_NEW",
    channelId: "new_order_ring_v1",
    sound: "ring.mp3",
    priority: "high",
    ttlSeconds: 600, // 10 minutes accept window
    category: "order",
    role: "vendor",
    defaultTitle: "🚨 New Order Received!",
    defaultDeepLink: (d) => `intrihub-biz://order/${d.orderId || ""}`,
  },
  ORDER_ACCEPT_REMINDER: {
    type: "ORDER_ACCEPT_REMINDER",
    channelId: "order_reminder_v1",
    sound: "order_reminder.mp3",
    priority: "high",
    ttlSeconds: 300,
    category: "reminder",
    role: "vendor",
    defaultTitle: "⏰ Urgent: Order Acceptance Pending",
    defaultDeepLink: (d) => `intrihub-biz://order/${d.orderId || ""}`,
  },
  ORDER_SCHEDULED_DUE: {
    type: "ORDER_SCHEDULED_DUE",
    channelId: "order_reminder_v1",
    sound: "order_reminder.mp3",
    priority: "high",
    ttlSeconds: 1800,
    category: "reminder",
    role: "vendor",
    defaultTitle: "📦 Scheduled Order Dispatch Due",
    defaultDeepLink: (d) => `intrihub-biz://order/${d.orderId || ""}`,
  },
  ORDER_EXPIRED: {
    type: "ORDER_EXPIRED",
    channelId: "order_warning_v1",
    sound: "order_warning.mp3",
    priority: "high",
    ttlSeconds: 3600,
    category: "warning",
    role: "vendor",
    defaultTitle: "⚠️ Order Acceptance Window Expired",
    defaultDeepLink: (d) => `intrihub-biz://order/${d.orderId || ""}`,
  },
  ORDER_CANCELLED_BY_CUSTOMER: {
    type: "ORDER_CANCELLED_BY_CUSTOMER",
    channelId: "order_warning_v1",
    sound: "order_warning.mp3",
    priority: "high",
    ttlSeconds: 7200,
    category: "warning",
    role: "vendor",
    defaultTitle: "🚫 Order Cancelled by Customer",
    defaultDeepLink: (d) => `intrihub-biz://order/${d.orderId || ""}`,
  },
  DELIVERY_PARTNER_ASSIGNED: {
    type: "DELIVERY_PARTNER_ASSIGNED",
    channelId: "default_chime_v1",
    sound: "default_chime.mp3",
    priority: "normal",
    ttlSeconds: 3600,
    category: "order",
    role: "vendor",
    defaultTitle: "🛵 Delivery Partner Assigned",
    defaultDeepLink: (d) => `intrihub-biz://order/${d.orderId || ""}`,
  },
  PICKUP_DELAY: {
    type: "PICKUP_DELAY",
    channelId: "order_warning_v1",
    sound: "order_warning.mp3",
    priority: "normal",
    ttlSeconds: 3600,
    category: "warning",
    role: "vendor",
    defaultTitle: "⏳ Pickup Delay Alert",
    defaultDeepLink: (d) => `intrihub-biz://order/${d.orderId || ""}`,
  },
  RETURN_REQUEST: {
    type: "RETURN_REQUEST",
    channelId: "order_warning_v1",
    sound: "order_warning.mp3",
    priority: "normal",
    ttlSeconds: 86400,
    category: "warning",
    role: "vendor",
    defaultTitle: "↩️ New Return/Replacement Request",
    defaultDeepLink: (d) => `intrihub-biz://returns/${d.returnId || d.orderId || ""}`,
  },
  SLOT_FULL: {
    type: "SLOT_FULL",
    channelId: "default_chime_v1",
    sound: "default_chime.mp3",
    priority: "normal",
    ttlSeconds: 7200,
    category: "order",
    role: "vendor",
    defaultTitle: "📊 Delivery Slot Capacity Full",
    defaultDeepLink: () => `intrihub-biz://(vendor)/profile`,
  },
  ORDER_PENDING_STATUS: {
    type: "ORDER_PENDING_STATUS",
    channelId: "order_reminder_v1",
    sound: "order_reminder.mp3",
    priority: "normal",
    ttlSeconds: 7200,
    category: "reminder",
    role: "vendor",
    defaultTitle: "📋 Pending Orders Awaiting Action",
    defaultDeepLink: () => `intrihub-biz://(vendor)/orders`,
  },
  PAYOUT_SETTLED: {
    type: "PAYOUT_SETTLED",
    channelId: "money_success_v1",
    sound: "money_success.mp3",
    priority: "normal",
    ttlSeconds: 86400,
    category: "finance",
    role: "vendor",
    defaultTitle: "💰 Payout Processed Successfully",
    defaultDeepLink: () => `intrihub-biz://(vendor)/earnings`,
  },
  ITEM_APPROVED: {
    type: "ITEM_APPROVED",
    channelId: "default_chime_v1",
    sound: "default_chime.mp3",
    priority: "normal",
    ttlSeconds: 86400,
    category: "order",
    role: "vendor",
    defaultTitle: "✅ Product Approved for Marketplace",
    defaultDeepLink: (d) => `intrihub-biz://(vendor)/products/${d.productId || ""}`,
  },
  ITEM_REJECTED: {
    type: "ITEM_REJECTED",
    channelId: "default_chime_v1",
    sound: "default_chime.mp3",
    priority: "normal",
    ttlSeconds: 86400,
    category: "warning",
    role: "vendor",
    defaultTitle: "⚠️ Product Verification Update",
    defaultDeepLink: (d) => `intrihub-biz://(vendor)/products/${d.productId || ""}`,
  },
  STOCK_LOW: {
    type: "STOCK_LOW",
    channelId: "default_chime_v1",
    sound: "default_chime.mp3",
    priority: "normal",
    ttlSeconds: 86400,
    category: "warning",
    role: "vendor",
    defaultTitle: "📉 Low Stock Alert",
    defaultDeepLink: () => `intrihub-biz://(vendor)/inventory`,
  },
  STORE_OFFLINE_REMINDER: {
    type: "STORE_OFFLINE_REMINDER",
    channelId: "default_chime_v1",
    sound: "default_chime.mp3",
    priority: "normal",
    ttlSeconds: 7200,
    category: "reminder",
    role: "vendor",
    defaultTitle: "🏪 Store Is Offline During Business Hours",
    defaultDeepLink: () => `intrihub-biz://(vendor)/dashboard`,
  },
  VENDOR_OFFER: {
    type: "VENDOR_OFFER",
    channelId: "default_chime_v1",
    sound: "default_chime.mp3",
    priority: "normal",
    ttlSeconds: 86400,
    category: "promo",
    role: "vendor",
    defaultTitle: "🎉 Exclusive Vendor Growth Offer",
    defaultDeepLink: () => `intrihub-biz://(vendor)/dashboard`,
  },
  REVIEW_RECEIVED: {
    type: "REVIEW_RECEIVED",
    channelId: "default_chime_v1",
    sound: "default_chime.mp3",
    priority: "normal",
    ttlSeconds: 86400,
    category: "order",
    role: "vendor",
    defaultTitle: "⭐ New Review Received",
    defaultDeepLink: () => `intrihub-biz://(vendor)/reviews`,
  },
  ACCOUNT_UPDATE: {
    type: "ACCOUNT_UPDATE",
    channelId: "default_chime_v1",
    sound: "default_chime.mp3",
    priority: "normal",
    ttlSeconds: 86400,
    category: "account",
    role: "vendor",
    defaultTitle: "🛡️ Account Security & System Update",
    defaultDeepLink: () => `intrihub-biz://(vendor)/profile`,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// USER / CUSTOMER CHANNELS & METADATA (U01 – U20)
// ─────────────────────────────────────────────────────────────────────────────
export const USER_CATALOG: Record<UserNotificationType, NotificationTypeMeta> = {
  ORDER_PLACED: {
    type: "ORDER_PLACED",
    channelId: "user_success_v1",
    sound: "user_success.mp3",
    priority: "high",
    ttlSeconds: 86400,
    category: "order",
    role: "customer",
    defaultTitle: "Order Confirmed ⚡",
    defaultDeepLink: (d) => `intrihub://order/${d.orderId || ""}`,
  },
  PAYMENT_FAILED: {
    type: "PAYMENT_FAILED",
    channelId: "user_alert_v1",
    sound: "user_alert.mp3",
    priority: "high",
    ttlSeconds: 3600,
    category: "warning",
    role: "customer",
    defaultTitle: "⚠️ Payment Incomplete",
    defaultDeepLink: () => `intrihub://checkout`,
  },
  ORDER_ACCEPTED: {
    type: "ORDER_ACCEPTED",
    channelId: "user_success_v1",
    sound: "user_success.mp3",
    priority: "high",
    ttlSeconds: 86400,
    category: "order",
    role: "customer",
    defaultTitle: "Order Accepted by Vendor 🛠️",
    defaultDeepLink: (d) => `intrihub://order/${d.orderId || ""}`,
  },
  ORDER_PACKED: {
    type: "ORDER_PACKED",
    channelId: "default_v1",
    sound: "default",
    priority: "high",
    ttlSeconds: 86400,
    category: "order",
    role: "customer",
    defaultTitle: "Order Packed & Crated 📦",
    defaultDeepLink: (d) => `intrihub://order/${d.orderId || ""}`,
  },
  ORDER_DISPATCHED: {
    type: "ORDER_DISPATCHED",
    channelId: "default_v1",
    sound: "default",
    priority: "high",
    ttlSeconds: 86400,
    category: "order",
    role: "customer",
    defaultTitle: "Dispatched from Warehouse 🚚",
    defaultDeepLink: (d) => `intrihub://order/${d.orderId || ""}`,
  },
  ORDER_OUT_FOR_DELIVERY: {
    type: "ORDER_OUT_FOR_DELIVERY",
    channelId: "user_arrival_v1",
    sound: "user_arrival.mp3",
    priority: "high",
    ttlSeconds: 7200,
    category: "order",
    role: "customer",
    defaultTitle: "Out for Site Delivery 🛵",
    defaultDeepLink: (d) => `intrihub://order/${d.orderId || ""}`,
  },
  ORDER_ARRIVING_SOON: {
    type: "ORDER_ARRIVING_SOON",
    channelId: "user_arrival_v1",
    sound: "user_arrival.mp3",
    priority: "high",
    ttlSeconds: 3600,
    category: "order",
    role: "customer",
    defaultTitle: "Arriving in 10 Minutes! 📍",
    defaultDeepLink: (d) => `intrihub://order/${d.orderId || ""}`,
  },
  ORDER_DELIVERED: {
    type: "ORDER_DELIVERED",
    channelId: "user_success_v1",
    sound: "user_success.mp3",
    priority: "high",
    ttlSeconds: 86400,
    category: "order",
    role: "customer",
    defaultTitle: "Order Delivered Safely 🎉",
    defaultDeepLink: (d) => `intrihub://order/${d.orderId || ""}`,
  },
  ORDER_CANCELLED: {
    type: "ORDER_CANCELLED",
    channelId: "user_alert_v1",
    sound: "user_alert.mp3",
    priority: "high",
    ttlSeconds: 86400,
    category: "warning",
    role: "customer",
    defaultTitle: "Order Cancellation Notice 🚫",
    defaultDeepLink: (d) => `intrihub://order/${d.orderId || ""}`,
  },
  ORDER_DELAYED: {
    type: "ORDER_DELAYED",
    channelId: "user_alert_v1",
    sound: "user_alert.mp3",
    priority: "high",
    ttlSeconds: 14400,
    category: "warning",
    role: "customer",
    defaultTitle: "Delivery ETA Update ⏱️",
    defaultDeepLink: (d) => `intrihub://order/${d.orderId || ""}`,
  },
  REFUND_INITIATED: {
    type: "REFUND_INITIATED",
    channelId: "user_alert_v1",
    sound: "user_alert.mp3",
    priority: "high",
    ttlSeconds: 86400,
    category: "finance",
    role: "customer",
    defaultTitle: "Refund Initiated 💳",
    defaultDeepLink: (d) => `intrihub://order/${d.orderId || ""}`,
  },
  REFUND_COMPLETED: {
    type: "REFUND_COMPLETED",
    channelId: "user_success_v1",
    sound: "user_success.mp3",
    priority: "high",
    ttlSeconds: 86400,
    category: "finance",
    role: "customer",
    defaultTitle: "Refund Credited to Account 💰",
    defaultDeepLink: (d) => `intrihub://order/${d.orderId || ""}`,
  },
  RETURN_STATUS: {
    type: "RETURN_STATUS",
    channelId: "default_v1",
    sound: "default",
    priority: "normal",
    ttlSeconds: 86400,
    category: "order",
    role: "customer",
    defaultTitle: "Return Request Update 🔄",
    defaultDeepLink: () => `intrihub://account/orders`,
  },
  SCHEDULED_CONFIRMED: {
    type: "SCHEDULED_CONFIRMED",
    channelId: "default_v1",
    sound: "default",
    priority: "normal",
    ttlSeconds: 86400,
    category: "order",
    role: "customer",
    defaultTitle: "Scheduled Delivery Slot Confirmed 🗓️",
    defaultDeepLink: (d) => `intrihub://order/${d.orderId || ""}`,
  },
  SCHEDULED_REMINDER: {
    type: "SCHEDULED_REMINDER",
    channelId: "default_v1",
    sound: "default",
    priority: "high",
    ttlSeconds: 7200,
    category: "reminder",
    role: "customer",
    defaultTitle: "Delivery Reminder (Today) 🕒",
    defaultDeepLink: (d) => `intrihub://order/${d.orderId || ""}`,
  },
  PROMO_OFFER: {
    type: "PROMO_OFFER",
    channelId: "user_promo_v1",
    sound: "user_promo.mp3",
    priority: "normal",
    ttlSeconds: 86400,
    category: "promo",
    role: "customer",
    defaultTitle: "Special Seasonal Savings 🔥",
    defaultDeepLink: (d) => `intrihub://shop/${d.category || ""}`,
  },
  CART_ABANDONED: {
    type: "CART_ABANDONED",
    channelId: "user_promo_v1",
    sound: "user_promo.mp3",
    priority: "normal",
    ttlSeconds: 43200,
    category: "promo",
    role: "customer",
    defaultTitle: "Items Waiting in Your Cart 🛒",
    defaultDeepLink: () => `intrihub://cart`,
  },
  WISHLIST_PRICE_DROP: {
    type: "WISHLIST_PRICE_DROP",
    channelId: "user_promo_v1",
    sound: "user_promo.mp3",
    priority: "normal",
    ttlSeconds: 86400,
    category: "promo",
    role: "customer",
    defaultTitle: "Price Drop on Saved Materials! 📉",
    defaultDeepLink: (d) => `intrihub://product/${d.slug || d.productId || ""}`,
  },
  BACK_IN_STOCK: {
    type: "BACK_IN_STOCK",
    channelId: "user_promo_v1",
    sound: "user_promo.mp3",
    priority: "normal",
    ttlSeconds: 86400,
    category: "promo",
    role: "customer",
    defaultTitle: "Back in Stock! 📦",
    defaultDeepLink: (d) => `intrihub://product/${d.slug || d.productId || ""}`,
  },
  COUPON_EXPIRING: {
    type: "COUPON_EXPIRING",
    channelId: "user_promo_v1",
    sound: "user_promo.mp3",
    priority: "normal",
    ttlSeconds: 43200,
    category: "promo",
    role: "customer",
    defaultTitle: "Your Discount Coupon Expires Soon ⏳",
    defaultDeepLink: () => `intrihub://shop`,
  },
  NEW_ARRIVALS: {
    type: "NEW_ARRIVALS",
    channelId: "user_promo_v1",
    sound: "user_promo.mp3",
    priority: "normal",
    ttlSeconds: 86400,
    category: "promo",
    role: "customer",
    defaultTitle: "Fresh Architectural Surfaces Added ✨",
    defaultDeepLink: (d) => `intrihub://shop/${d.category || ""}`,
  },
  REVIEW_REQUEST: {
    type: "REVIEW_REQUEST",
    channelId: "default_v1",
    sound: "default",
    priority: "normal",
    ttlSeconds: 86400,
    category: "account",
    role: "customer",
    defaultTitle: "How Was Your Material Delivery? ⭐",
    defaultDeepLink: (d) => `intrihub://order/${d.orderId || ""}?review=true`,
  },
  SUPPORT_REPLY: {
    type: "SUPPORT_REPLY",
    channelId: "default_v1",
    sound: "default",
    priority: "high",
    ttlSeconds: 86400,
    category: "account",
    role: "customer",
    defaultTitle: "IntriHub Support Message 💬",
    defaultDeepLink: () => `intrihub://help`,
  },
  ACCOUNT_UPDATE: {
    type: "ACCOUNT_UPDATE",
    channelId: "default_v1",
    sound: "default",
    priority: "normal",
    ttlSeconds: 86400,
    category: "account",
    role: "customer",
    defaultTitle: "Account & Profile Notice 🛡️",
    defaultDeepLink: () => `intrihub://account`,
  },
};

export const NOTIFICATION_CATALOG: Record<string, NotificationTypeMeta> = {
  ...VENDOR_CATALOG,
  ...USER_CATALOG,
};

export function getNotificationMeta(type: string): NotificationTypeMeta {
  return (
    NOTIFICATION_CATALOG[type] || {
      type: type as any,
      channelId: "default_v1",
      sound: "default",
      priority: "normal",
      ttlSeconds: 86400,
      category: "account",
      role: "any",
      defaultTitle: "IntriHub Notification",
      defaultDeepLink: () => `intrihub://`,
    }
  );
}
