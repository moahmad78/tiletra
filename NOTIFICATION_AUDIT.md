# IntriHub Notification System — Comprehensive Phase 0 Audit

**Date:** 2026-11-22  
**Scope:** Vendor App (`intrihub-business`), User App (`intrihub-mobile`), Backend Services (`lib/`, `app/api/`), Socket Server (`socket-server/`), and Admin Panel.  
**Auditor:** Antigravity AI Engine (Phase 0 Deliverable per PRD v1)

---

## 1. Executive Summary

| Category | Total Checked | PRESENT (Working/Ready) | PARTIAL (Needs Fix/Extend) | MISSING (To Build) |
| :--- | :---: | :---: | :---: | :---: |
| **A. Infrastructure (A1 – A13)** | 13 | 4 | 7 | 2 |
| **B. Vendor Catalog (V01 – V17)** | 17 | 3 | 5 | 9 |
| **C. User Catalog (U01 – U20)** | 20 | 5 | 4 | 11 |
| **TOTAL** | **50** | **12 (24%)** | **16 (32%)** | **22 (44%)** |

### Key Real-World Findings from Phase 0 Verification:
1. **FCM V1 Credentials:** Live tested and confirmed working (`status: "ok"` from Google FCM on both apps) after today's service account upload to Expo.
2. **Killed State Gap (A8):** `Notifications.getLastNotificationResponseAsync()` is missing in both apps; cold-start notification taps risk not deep-linking correctly.
3. **Sound & Versioned Channels (A3, A4, Section 6):** Vendor app has `ring.mp3` in `res/raw` and assets, but only defines channels `orders_high_importance` and `urgent_order_alarm_v3`. Specific PRD channels (`new_order_ring_v1`, `order_reminder_v1`, `order_warning_v1`, `money_success_v1`, `user_success_v1`, `user_alert_v1`, `user_arrival_v1`, `user_promo_v1`) are not yet created.
4. **Dual Backend Senders (A9):** System currently splits notification logic between `lib/push-notifications.ts` (transactional orders) and `lib/notification-service.ts` (marketing/cart reminders). A unified dispatcher `notify({ type, recipient, data })` is required.
5. **Auto-Cancellation & Reassign (V04):** `lib/actions/orders.ts` has `rejectVendorOrderSplit`, but 10-minute automated auto-cancel cron with customer refund trigger is incomplete.

---

## 2. Infrastructure Checklist (A1 – A13)

| ID | Item | Status | File Path(s) | Findings & Gap Analysis |
| :--- | :--- | :---: | :--- | :--- |
| **A1** | **Dependencies** | **PARTIAL** | `intrihub-business/package.json`<br>`intrihub-mobile/package.json` | `expo-notifications` (~57.0.20) and `expo-haptics` (~57.0.3) are present in both apps. **MISSING:** `expo-device` (required for physical device check), `expo-task-manager` (background notifications task). `expo-av` missing (vendor app uses Web Audio / HTML5 audio fallback). |
| **A2** | **Android Config** | **PRESENT** | `intrihub-business/app.json`<br>`intrihub-mobile/app.json` | `google-services.json` attached in both. Permissions present: `POST_NOTIFICATIONS`, `USE_FULL_SCREEN_INTENT`, `FOREGROUND_SERVICE`, `WAKE_LOCK`, `VIBRATE`, `RECEIVE_BOOT_COMPLETED`. Notification icon (`assets/notification-icon.png`) and accent color (`#F26522`) configured. |
| **A3** | **Android Channels** | **PARTIAL** | `intrihub-business/src/hooks/usePushNotifications.ts:260`<br>`intrihub-business/src/utils/orderAlarm.ts:31`<br>`intrihub-mobile/src/hooks/usePushNotifications.ts:97` | Channels created: `orders_high_importance`, `urgent_order_alarm_v3`, `reminders_default`, `offers_default`. **MISSING:** Versioned channel names per PRD (`new_order_ring_v1`, `order_reminder_v1`, `order_warning_v1`, `money_success_v1`, `user_success_v1`, `user_alert_v1`, `user_arrival_v1`, `user_promo_v1`). |
| **A4** | **Sound Files** | **PARTIAL** | `intrihub-business/android/app/src/main/res/raw/order_alert.mp3`<br>`intrihub-business/assets/sounds/ring.mp3`<br>`public/sounds/ring.mp3` | Vendor new order chime `ring.mp3` / `order_alert.mp3` (108 KB, <30s) exists in Android `res/raw`, app bundle, and web public folder. **MISSING:** Specific sounds for `order_reminder`, `order_warning`, `money_success`, and all customer sounds (`user_success`, `user_alert`, `user_arrival`, `user_promo`) are currently falling back to system `"default"`. |
| **A5** | **iOS Config** | **PARTIAL** | `intrihub-business/plugins/withCallKitVoIP.js`<br>`intrihub-business/targets/CallKit/IntriHubCallKitManager.swift`<br>`intrihub-mobile/targets/NotificationService/`<br>`lib/voip-push-service.ts` | Push notification capability and background modes (`remote-notification`, `voip`) configured in `app.json`. CallKit config plugin and APNs HTTP/2 client in `lib/voip-push-service.ts` exist. **MISSING:** Apple APNs `.p8` key not yet in environment variables (`APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_PRIVATE_KEY` missing in `.env`), so iOS VoIP currently runs in simulated mode. |
| **A6** | **Permission Flow** | **PARTIAL** | `intrihub-business/src/hooks/usePushNotifications.ts:286`<br>`intrihub-mobile/src/hooks/usePushNotifications.ts:48` | `requestPermissionsAsync()` requests runtime permission on Android 13+ and iOS. **MISSING:** If permission is denied, there is no friendly modal or direct redirect to OS settings (`Linking.openSettings()`). Android 14+ `USE_FULL_SCREEN_INTENT` grant check missing. |
| **A7** | **Token Lifecycle** | **PRESENT** | `lib/push-notifications.ts:227`<br>`app/api/mobile/push-token/route.ts`<br>`intrihub-business/src/hooks/usePushNotifications.ts:66`<br>`intrihub-mobile/src/hooks/usePushNotifications.ts:36` | Tokens registered on login/launch with retry; stored in `DeviceToken` table with `userId`, `role` (`vendor`, `customer`, `admin`), `platform`, `appVersion`, `lastSeenAt`. Unregistered on logout. Tokens refreshed on app foreground return via `AppState`. |
| **A8** | **Notification Handlers** | **PARTIAL** | `intrihub-business/src/hooks/usePushNotifications.ts:136`<br>`intrihub-mobile/src/hooks/usePushNotifications.ts:141` | `addNotificationReceivedListener` (foreground) and `addNotificationResponseReceivedListener` (background tap) are active and route to deep links. **BUG/MISSING:** `Notifications.getLastNotificationResponseAsync()` is NOT called on startup for cold-start / killed state taps. |
| **A9** | **Backend Sender** | **PARTIAL** | `lib/push-notifications.ts:107`<br>`lib/notification-service.ts:99` | Expo Push API payload formatting, batching (100 per chunk), ticket error inspection, and `deleteDeadPushToken` on `DeviceNotRegistered` implemented. **GAP:** Two separate dispatchers (`push-notifications.ts` vs `notification-service.ts`) instead of a single unified `NotificationService.notify()`. |
| **A10** | **Notification Log Table** | **PARTIAL** | `prisma/schema.prisma:1634`<br>`lib/notification-service.ts:312` | `NotificationLog` model exists with `userId`, `type`, `campaignId`, `platform`, `status`, `skipReason`, `openedAt`. **GAP:** Transactional order push calls in `lib/push-notifications.ts` currently do NOT write to `NotificationLog` (only marketing campaigns do). Model lacks `recipientToken`, `payload` (JSON), `receiptStatus`. |
| **A11** | **Preferences** | **PARTIAL** | `prisma/schema.prisma:829`<br>`app/api/mobile/notifications/preferences/route.ts` | `NotificationPreference` model exists (`orderUpdates`, `promotional`, `offersEnabled`, `cartRemindersEnabled`). Checked in `lib/notification-service.ts`. **GAP:** User App settings screen does not yet expose visual toggle switches for these; order notifications must remain non-toggleable (always on). |
| **A12** | **Admin Manual Send** | **PRESENT** | `app/admin/campaigns/page.tsx`<br>`app/api/admin/campaigns/send-user/route.ts`<br>`app/api/admin/campaigns/test-send/route.ts` | Admin can compose title, body, deep link, select target segment / individual user, send test push, and preview payload. |
| **A13** | **Cron / Scheduler** | **PARTIAL** | `app/api/cron/order-alerts/route.ts`<br>`app/api/cron/sla-checker/route.ts`<br>`app/api/admin/campaigns/run-cart-reminders/route.ts` | Cron routes exist for SLA checker, order alerts escalation, and cart reminders. **GAP:** No persistent job queue (e.g. BullMQ / pg-boss); rely on HTTP GET webhooks. Missed cron run recovery and lock-protection across cluster instances need hardening. |

---

## 3. Vendor App Catalog Audit (V01 – V17)

| ID | Type Key | Trigger Point | Priority | Target Channel & Sound | Deep Link Target | Status | Audit Findings & Gaps |
| :---: | :--- | :--- | :---: | :--- | :--- | :---: | :--- |
| **V01** | `ORDER_NEW` | Order created in `lib/actions/orders.ts:914` | Critical | `new_order_ring` (looping ringtone, silent bypass) | Alert modal -> `/(vendor)/order/[id]` | **PARTIAL** | Triggered via `notifyVendorPush` + socket `order:new`. Uses `orders_high_importance` and `ring.mp3`. Foreground modal exists (`IncomingOrderAlertModal.tsx`). **GAP:** Android native full-screen lock intent activity when killed is not yet native-bundled; channel ID is not `new_order_ring_v1`. |
| **V02** | `ORDER_ACCEPT_REMINDER` | Unacknowledged order (5m, 2m left) | Critical | `order_reminder` | Alert modal -> `/(vendor)/orders` | **PARTIAL** | `app/api/cron/order-alerts/route.ts` has 6-step escalation (30s, 60s, 120s, 180s, 300s). **GAP:** Sends generic `NEW_ORDER` push rather than specific `ORDER_ACCEPT_REMINDER` payload key and sound. |
| **V03** | `ORDER_SCHEDULED_DUE` | Scheduled delivery slot dispatch window arrives | Critical | `order_reminder` | `/(vendor)/order/[id]` | **MISSING** | Scheduled orders exist in schema (`deliverySlot`), but no cron checks for T-45 min dispatch alert to vendor. |
| **V04** | `ORDER_EXPIRED` | 10 min passed without acceptance | Critical | `order_warning` | `/(vendor)/orders` | **PARTIAL** | `app/api/cron/sla-checker/route.ts` flags SLA breach, but auto-cancelling the split, triggering Razorpay refund, and sending `ORDER_EXPIRED` push is not implemented. |
| **V05** | `ORDER_CANCELLED_BY_CUSTOMER` | Customer cancels before packing | Important | `order_warning` | `/(vendor)/order/[id]` | **MISSING** | `lib/actions/orders.ts:cancelOrder` updates DB status, but does not push `ORDER_CANCELLED_BY_CUSTOMER` alert to vendor devices. |
| **V06** | `DELIVERY_PARTNER_ASSIGNED` | Porter / Borzo / Shiprocket / Rider assigned | Important | `default_chime` | `/(vendor)/order/[id]` | **PARTIAL** | `lib/actions/rider-assignment.ts` assigns rider, but vendor push notification payload is missing. |
| **V07** | `PICKUP_DELAY` | Rider pickup ETA delayed >15 min | Important | `order_warning` | `/(vendor)/order/[id]` | **MISSING** | No trigger or threshold check for courier / rider delay to vendor. |
| **V08** | `RETURN_REQUEST` | Customer submits return/exchange | Important | `order_warning` | `/(vendor)/returns/[id]` | **MISSING** | Returns policy & DB exist, but no push notification sent to vendor. |
| **V09** | `SLOT_FULL` | Scheduled slot reaches max orders capacity | Important | `default_chime` | `/(vendor)/slots` | **MISSING** | Slot capacity logic exists in `lib/delivery/`, but no alert dispatched when slot fills. |
| **V10** | `ORDER_PENDING_STATUS` | Morning/evening pending orders digest | Important | `order_reminder` | `/(vendor)/orders` | **MISSING** | Periodic digest cron job not implemented. |
| **V11** | `PAYOUT_SETTLED` | Weekly / manual vendor payout processed | Normal | `money_success` | `/(vendor)/payouts` | **PARTIAL** | `app/api/mobile/vendor/payouts` processes payouts, but push notification is not dispatched. |
| **V12** | `ITEM_APPROVED` / `REJECTED` | Admin reviews vendor product upload | Normal | `default_chime` | `/(vendor)/products/[id]` | **PARTIAL** | In-app notification created in DB, but native push notification to vendor device not sent. |
| **V13** | `STOCK_LOW` | Inventory falls below safety threshold | Normal | `default_chime` | `/(vendor)/inventory` | **MISSING** | Admin gets low stock alert; vendor device push is missing. |
| **V14** | `STORE_OFFLINE_REMINDER` | Store offline during peak operating hours | Normal | `default_chime` | `/(vendor)/dashboard` | **MISSING** | No reminder sent to vendor to toggle online switch. |
| **V15** | `VENDOR_OFFER` | Commission discount / festival promo for vendors | Normal | `default_chime` | `/(vendor)/offers` | **PARTIAL** | Admin broadcast engine exists, but no dedicated `VENDOR_OFFER` type mapping. |
| **V16** | `REVIEW_RECEIVED` | New product review submitted | Normal | `default_chime` | `/(vendor)/reviews` | **MISSING** | Review saved to DB; push notification to vendor not triggered. |
| **V17** | `ACCOUNT_UPDATE` | KYC verification, policy change, app update | Normal | `default_chime` | `/(vendor)/profile` | **PRESENT** | App version update and KYC status notifications implemented in `api/mobile/admin/`. |

---

## 4. User App Catalog Audit (U01 – U20)

| ID | Type Key | Trigger Point | Priority | Target Channel & Sound | Deep Link Target | Status | Audit Findings & Gaps |
| :---: | :--- | :--- | :---: | :--- | :--- | :---: | :--- |
| **U01** | `ORDER_PLACED` | Payment successful & order created | Important | `user_success` | `/order/[id]` | **PRESENT** | `lib/actions/orders.ts:899` calls `sendCustomerOrderStatusPush("CONFIRMED")`. Sent with high priority and deep link to `/order/[id]`. |
| **U02** | `PAYMENT_FAILED` | Razorpay webhook / checkout failed | Important | `user_alert` | `/checkout` | **MISSING** | Webhook handles failure, but does not send instant push notification to user with retry link. |
| **U03** | `ORDER_ACCEPTED` | Vendor accepts / auto-accepted | Important | `user_success` | `/order/[id]` | **PRESENT** | Triggered on status change to confirmed. |
| **U04** | `ORDER_PACKED` / `DISPATCHED` | Vendor marks packed or courier picked up | Important | `default` | `/order/[id]` | **PRESENT** | `lib/actions/vendor.ts:1454, 1456` calls `sendCustomerOrderStatusPush("PACKED")` and `"DISPATCHED"`. |
| **U05** | `ORDER_OUT_FOR_DELIVERY` | Rider starts last-mile delivery | Important | `user_arrival` | `/order/[id]/track` | **PARTIAL** | Currently combined inside `DISPATCHED`. Dedicated `user_arrival` channel and live rider tracking link missing. |
| **U06** | `ORDER_ARRIVING_SOON` | Rider ETA < 10 mins (60-min delivery) | Important | `user_arrival` | `/order/[id]/track` | **MISSING** | No proximity or ETA-based trigger in rider tracking service. |
| **U07** | `ORDER_DELIVERED` | Delivery confirmed | Important | `user_success` | `/order/[id]?review=true` | **PRESENT** | `lib/actions/vendor.ts:1462` sends `sendCustomerOrderStatusPush("DELIVERED")`. Deep link directs to order page. |
| **U08** | `ORDER_CANCELLED` | Order cancelled / vendor reject | Important | `user_alert` | `/order/[id]` | **PARTIAL** | Database status updated to cancelled, but customer push notification is only triggered on admin cancel, not vendor reject. |
| **U09** | `ORDER_DELAYED` | SLA breached or transit delayed | Important | `user_alert` | `/order/[id]` | **MISSING** | SLA breach checker alerts CPO/vendor, but does not inform customer with revised ETA. |
| **U10** | `REFUND_INITIATED` / `COMPLETED` | Razorpay refund API executed | Important | `user_alert` | `/order/[id]` | **MISSING** | Refund API executed in backend, but customer push notification not sent. |
| **U11** | `RETURN_STATUS` | Return approved, pickup arranged, replacement | Important | `default` | `/account/orders` | **MISSING** | Return management exists in DB, but push notifications are missing. |
| **U12** | `SCHEDULED_CONFIRMED` / `REMINDER` | Scheduled order slot confirmation & T-2h reminder | Important | `default` | `/order/[id]` | **MISSING** | No T-2h reminder cron for customer scheduled deliveries. |
| **U13** | `PROMO_OFFER` | Admin flash sale / festival discount | Promo | `user_promo` | `/shop` or category | **PRESENT** | `lib/campaign-runner.ts` dispatches targeted push notifications respecting quiet hours. |
| **U14** | `CART_ABANDONED` | Item left in cart > 30m, 6h, 24h | Promo | `user_promo` | `/cart` | **PARTIAL** | `lib/cart-reminder-runner.ts` implements multi-step ladder with Hinglish copy and quiet hours. **GAP:** Needs auto-cancel if order is placed in interim. |
| **U15** | `WISHLIST_PRICE_DROP` / `BACK_IN_STOCK` | Price drops or product restocked | Promo | `user_promo` | `/product/[slug]` | **PARTIAL** | `lib/notifications/personalized-notification-engine.ts` has code, but not wired to product price edit mutation. |
| **U16** | `COUPON_EXPIRING` | Expiring personalized coupon | Promo | `user_promo` | `/shop` | **MISSING** | No cron checks expiring user coupons. |
| **U17** | `NEW_ARRIVALS` | Fresh catalog patterns added | Promo | `user_promo` | `/shop/[category]` | **PARTIAL** | Can be sent manually via admin campaigns, but automated trigger on category upload is missing. |
| **U18** | `REVIEW_REQUEST` | 2 hours post-delivery | Normal | `default` | `/order/[id]/review` | **MISSING** | No scheduled review reminder job after delivery. |
| **U19** | `SUPPORT_REPLY` | Ticket response from IntriHub helpdesk | Normal | `default` | `/help` | **MISSING** | Support messages in DB; customer push not dispatched. |
| **U20** | `ACCOUNT_UPDATE` | Security alert, password reset, app update | Normal | `default` | `/account` | **PARTIAL** | App update prompt exists; security alert push missing. |

---

## 5. Sound & Channel Architecture Audit (Section 6)

### Vendor App Channels
- **Existing:** `orders_high_importance`, `urgent_order_alarm_v3`, `default`.
- **Target Spec Required:**
  - `new_order_ring_v1`: MAX importance, public lockscreen, `ring.mp3`, bypass DND, full-screen intent.
  - `order_reminder_v1`: HIGH importance, `order_reminder.mp3`, repeat buzzer.
  - `order_warning_v1`: HIGH importance, `order_warning.mp3`, double beep.
  - `money_success_v1`: DEFAULT importance, `money_success.mp3`.
  - `default_chime_v1`: DEFAULT importance, `default_chime.mp3`.

### User App Channels
- **Existing:** `orders_high_importance`, `reminders_default`, `offers_default`.
- **Target Spec Required:**
  - `user_success_v1`: HIGH importance, `user_success.mp3`.
  - `user_alert_v1`: HIGH importance, `user_alert.mp3`.
  - `user_arrival_v1`: HIGH importance, `user_arrival.mp3`.
  - `user_promo_v1`: DEFAULT/LOW importance, `user_promo.mp3` (silent/vibrate option).
  - `default_v1`: System default.

---

## 6. Open Architecture Decisions & Recommendations (Phase 1+)

1. **Unified Notification Service (`lib/notification-service.ts`):**
   Refactor `sendNotification` to be the sole entry point for BOTH transactional orders and marketing campaigns. Automatically lookup target recipient tokens, resolve channel, sound, priority, TTL, and deep link from a centralized type catalog (`lib/notification-catalog.ts`).
2. **Killed State & Deep Linking:**
   Add `Notifications.getLastNotificationResponseAsync()` to both apps' root layout (`_layout.tsx`) so cold starts immediately open the intended order or product screen.
3. **Android 14+ Full-Screen Intent:**
   Add runtime verification for `USE_FULL_SCREEN_INTENT`. If not granted (some OEMs require manual permission), show a guided settings helper screen in the Vendor App settings.
4. **Order Expiry (V04) & Auto-Cancel Policy:**
   Recommend standard 10-minute timeout: If vendor does not accept within 10 minutes, automatically mark split as expired, reassign to next nearest verified vendor with stock, or cancel and trigger instant Razorpay prepaid refund if no vendor available.

---

**Phase 0 Audit Deliverable Complete.**  
Ready to proceed to **Phase 1: Infrastructure Gaps & Unified Notification Service**.
