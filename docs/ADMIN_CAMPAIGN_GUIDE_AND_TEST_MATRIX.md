# IntriHub Universal Campaign & Notification System
## Admin Guide & Production Verification Test Matrix

---

## Part 1: Admin Guide — How to Send Each Campaign Type

The Super Admin Campaigns Dashboard is located at `/admin/campaigns`. It provides full centralized control over all push campaigns, audience targeting, live previews, in-app popups, and automated triggers across both mobile apps (`IntriHub` customer app and `IntriHub Business` vendor app) without requiring Play Store releases.

---

### Campaign Type Presets & Step-by-Step Composer Guide

| Campaign Type | Primary Goal | Default Accent | Sound & Channel | Default CTA | Primary Deep Link Target |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. SALE** | Flash sales, mega discounts, clearance | `#E11D48` (Rose/Red) | `user_promo` (Promo Alerts) | "Shop Now" | `offers` or `category:<slug>` |
| **2. OFFER** | Coupons, festive vouchers, promo codes | `#F26522` (IntriHub Orange) | `user_promo` (Promo Alerts) | "Claim Offer" | `cart` or `product:<id>` |
| **3. WISH** | Festival & holiday greetings | `#8B5CF6` (Purple) | `user_promo` (Promo Alerts) | "Celebrate" | `offers` |
| **4. APP_UPDATE** | Store update announcements | `#003478` (Deep Navy) | `ring.mp3` (App Updates) | "Update Now" | `market://details?id=...` |
| **5. COUNTDOWN** | Time-limited expiring deals (with ticking clock) | `#EA580C` (Amber/Orange) | `user_promo` (Promo Alerts) | "Grab Deal" | `offers` or `product:<id>` |
| **6. STOCK_ALERT** | Manual broad inventory replenishment | `#059669` (Emerald Green) | `user_promo` (Promo Alerts) | "Order Now" | `product:<id>` |
| **7. CUSTOM** | Fully customizable messages & announcements | Custom Picker | Configurable | Custom Label | Whitelisted Deep Link |

---

### Step-by-Step Instructions by Campaign Type

#### 1. Flash Sale & Mega Deals (`SALE`)
1. In `/admin/campaigns`, click **"New Campaign"**.
2. Select preset **"Sale / Discount"**.
3. **Accent Colour:** Pre-fills with `#E11D48` (or choose another via the colour picker).
4. **Title & Body:** Enter an engaging headline (e.g. `Weekend Mega Sale: Flat 20% Off Cement & Steel! 💥`).
5. **Banner Image:** Paste a public HTTPS banner URL (e.g. `https://www.intrihub.com/banners/steel-sale.jpg`).
6. **Target Deep Link:** Enter `category:building-materials` or `offers`.
7. **Audience Filtering:** Select target city or target all customers.
8. Click **"Review Audience"** to view real-time audience size and token counts, then confirm send.

#### 2. Promotional Offer & Coupon (`OFFER`)
1. Click **"New Campaign"** and select **"Special Offer"**.
2. **Accent Colour:** `#F26522`.
3. **Title & Body:** e.g. `Use Code INTRI500 for ₹500 Off Your Next Order! 🏷️`.
4. **CTA Label:** `Apply Coupon`.
5. **In-App Popup Option:**
   - Under the *In-App Popup* section, toggle **"Enable In-App Popup"**.
   - Choose Layout: **Center Modal** or **Bottom Sheet**.
   - Enter Popup Background Color (e.g. `#052a51`) and upload a matching modal graphic.
6. Customers will receive the push notification and also see the popup the next time they open the app.

#### 3. Festival Greeting (`WISH`)
- **Option A (Instant Send):** Select **"Festival Greeting"**, set festive text (e.g. `Happy Diwali from Team IntriHub! 🪔`), set accent `#8B5CF6`, and dispatch.
- **Option B (Automated Calendar):**
  1. Open the **"Festival Calendar"** tab.
  2. Click **"Add Festival Event"**.
  3. Enter Name (e.g. `New Year Celebration`), Date (`2027-01-01`), Title (e.g. `Happy New Year 2027! 🎉`), and Message.
  4. Toggle **"Auto-Send (09:00 AM)"**.
  5. The VPS cron timer (`intrihub-festival-wishes.timer`) will automatically dispatch the push at 09:00 AM IST on that exact day.

#### 4. Mandatory / Recommended App Update (`APP_UPDATE`)
1. Select **"App Update Alert"**.
2. **App Target:** Choose **Customer App Only**, **Business App Only**, or **Both**.
   - The system automatically customizes the branding: `"IntriHub"` with `com.intrihub.app` vs `"IntriHub Business"` with `com.intrihub.business`.
3. **Audio & Channel:** Uses the custom ringtone `ring.mp3` on channel `app_update_ring_v1`.
4. **Audience Filter:** In *App Version Below*, enter e.g. `1.3.0` to avoid notifying users who are already on the latest version.
5. **Action:** CTA automatically defaults to `"Update Now"`, routing directly to Google Play Store.

#### 5. Time-Limited Countdown Deal (`COUNTDOWN`)
1. Select **"Countdown Offer"**.
2. **Countdown End Time:** Pick the exact expiration date and time in the countdown picker.
3. **Live Native Card:** Android devices will automatically display a live ticking chronometer in the notification header and expanded card (`Ends in: MM:SS`).
4. **Target Deep Link:** `offers` or `product:<id>`.
5. Once the countdown expires, any attempt to launch from notification routes safely to the home screen.

#### 6. Stock Alert Broadcast (`STOCK_ALERT`)
1. Select **"Stock Alert"**.
2. In Audience Settings, enter the specific **Product ID in Cart** or **Product ID in Wishlist**.
3. **Pre-Flight Check:** The composer will calculate the exact count of shoppers who have saved that specific item.
4. Dispatch sends targeted pushes directly to those interested buyers.

---

### Part 2: Product Automations (Phase 2 — Backend Triggers)

The **"Product Automations (Phase 2)"** tab allows configuring real-time automated triggers that require zero admin intervention:
1. **Back in Stock Alert:**
   - Automatically detects when a vendor or admin updates a product inventory from `stock = 0` to `stock > 0`.
   - Dispatches `BACK_IN_STOCK` to customers who wishlisted or carted that product.
   - Customizable template: `Back in Stock: {{productName}}! 📦` with placeholders `{{productName}}`, `{{oldPrice}}`, `{{newPrice}}`.
2. **Wishlist Price Drop Alert:**
   - Automatically detects when a product's price is updated to a lower value.
   - Dispatches `WISHLIST_PRICE_DROP` to all wishlisted shoppers.
   - Customizable template: `Price Drop on {{productName}}! 📉` with `{{discountPercent}}`.
3. **Built-in Guardrails:**
   - **24h Debounce:** Max 1 alert per product per user per 24 hours.
   - **Quiet Hours:** Suppressed between 21:00 and 08:00 IST.
   - **Daily Frequency Cap:** Max 2 promotional pushes/day per user.
   - **Smart Deduplication:** If an item returns to stock and drops in price simultaneously, `BACK_IN_STOCK` takes precedence.

---

## Part 3: Production Verification & Test Matrix

This test matrix covers all execution states across both apps.

| # | Test Scenario | Target App | Trigger / Payload | Expected Behavior | Verification Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **T1** | **Android Foreground State** | Customer (`com.intrihub.app`) | Admin sends Promo Campaign while app is active on screen. | Notification arrives with sound. In-app badge count increments in bottom navigation bar. Does not interrupt active user checkout. | ✅ Verified |
| **T2** | **Android Background State** | Customer (`com.intrihub.app`) | App minimized in background. Send Countdown Campaign with banner image. | Heads-up notification appears with custom expanded layout: branded logo, accent color, banner image, and ticking countdown timer. | ✅ Verified |
| **T3** | **Android Killed / Terminated State** | Customer (`com.intrihub.app`) | App force-closed from Android Recent Apps. High-priority FCM data push sent. | `IntriHubFirebaseMessagingService` wakes up device via high-priority FCM. RemoteViews card renders with full colour logo and CTA. Tap launches app directly into whitelisted deep link. | ✅ Verified |
| **T4** | **Co-existence (Both Apps Installed)** | Customer & Business on same phone | Dispatch an App Update campaign to "Both Apps". | Two separate notifications appear with distinct branding: Customer notification says "IntriHub" (`#003478`), Business notification says "IntriHub Business" (`#F26522`). Ring.mp3 plays on both. Tapping each opens its respective Play Store listing. | ✅ Verified |
| **T5** | **Live Native Countdown** | Customer (`com.intrihub.app`) | COUNTDOWN campaign with `countdownEndsAt = NOW + 2 hours`. | Chronometer starts ticking down in Android notification panel (`⏰ Ends in: 01:59:45`). In-app popup also shows live timer. Once passed, timer displays zero. | ✅ Verified |
| **T6** | **Recurring Campaign Execution** | Both | Campaign set to `recurrence: "weekly"`. Cron timer runs on VPS. | Campaign sends at scheduled time. `campaign-sender` cron automatically schedules next week's occurrence idempotently with no double sends. | ✅ Verified |
| **T7** | **Automated Back in Stock Trigger** | Customer (`com.intrihub.app`) | Vendor updates product from 0 to 50 stock in Vendor Portal. | Interested shoppers who wishlisted the product receive instant push: *"Back in Stock: Ultratech Cement! 📦"*. Debounce prevents duplicate alerts if vendor updates stock again within 24h. | ✅ Verified |
| **T8** | **Backward Compatibility (Old App Build)** | Customer (Old build < 1.3.0) | New campaign sent with `schemaVersion: 2`, in-app popup payload, and rich media. | Old app build safely falls back without crashing via safe fallback in `IntriHubFirebaseMessagingService.kt` and standard Expo listeners. | ✅ Verified |
| **T9** | **Quiet Hours Suppression** | Customer (`com.intrihub.app`) | Automated stock alert triggered at 23:00 IST (11:00 PM). | System recognizes Kolkata Quiet Hours (21:00 - 08:00 IST) and suppresses notification to respect customer sleep hours. | ✅ Verified |
| **T10** | **OTA Updates Verification** | Both | `npx eas-cli update --channel production` executed. | Apps download updated JavaScript bundle upon next launch without requiring Google Play Store approval or download. | ✅ Verified |

---

## Part 4: Phase 4 Roadmap (Web Push & Web In-App Popups)

*As requested, Phase 4 is scoped for a later, separate PRD:*
1. **Web Push Protocol:** Standard VAPID keys + Service Worker registration (`sw.js`).
2. **Web Permission Prompt:** Non-intrusive soft prompt banner ("Stay updated on your orders & exclusive deals").
3. **Web In-App Popup:** Responsive desktop & mobile web modal matching the mobile app popup schema.
