# T0 Discovery Note: Push Campaigns & Cart Reminders

**Date**: 2026-10-08  
**Sprint**: Push Campaigns and Cart Reminders (v1.1)

---

### 1. Cart Storage Architecture
- **Database Models**: `Cart` and `CartItem` are fully defined in `prisma/schema.prisma` (lines 388-413).
- **Backend API**: `lib/actions/cart.ts` (`syncCartToDb`, `getCartForUser`) and `app/api/mobile/cart/route.ts` (GET & POST).
- **Customer App (`intrihub-mobile`)**: `intrihub-mobile/src/store/cartStore.ts` stores cart in `AsyncStorage` and automatically calls `syncWithServer()` -> `intrihub-mobile/src/api/cart.ts` (`syncCart`) -> `/api/mobile/cart` on every modification (`addItem`, `removeItem`, `updateQuantity`, `clearCart`).
- **Conclusion**: The cart is already server-synchronized to PostgreSQL in real time. **Task T1 is SKIPPED** as directed by the PRD.

---

### 2. Push Notification Function & Invocation
- **Core Function**: `lib/push-notifications.ts` exports `sendExpoPushNotification(payload: ExpoPushPayload)` communicating directly with the Expo Push API (`https://exp.host/--/api/v2/push/send`).
- **Existing Helpers**: `registerPushToken`, `notifyAdminPush`, `notifyVendorPush`, `sendPushToUser`.
- **Channels**: Supports Android `channelId` and standard Expo payload fields.

---

### 3. Device Token Storage
- **Model**: `DeviceToken` in `prisma/schema.prisma` (lines 1177-1193).
- **Columns**: `id`, `userId`, `role` (customer | vendor | rider | admin), `platform` (android | ios | web), `token` (unique), `appVersion`, `lastSeenAt`, `createdAt`, `updatedAt`.
- **Existing Population**: Handled via `registerPushToken` in `lib/push-notifications.ts` and `/api/mobile/push/register` / `/api/mobile/push/register-token`.
- **Status**: The table exists, is indexed, and is ready for reuse without duplication.

---

### 4. App Notification & Deep Link Handling
- **App Scheme**: `"scheme": "intrihub"` defined in `intrihub-mobile/app.json`.
- **iOS Bundle ID**: `com.intrihub.app`.
- **Android Package**: `com.intrihub.app`.
- **Expo Router Navigation**: Routes in `intrihub-mobile/app/` (`(tabs)/cart`, `product/[id]`, `order/[id]`, etc.).
- **Hook**: `intrihub-mobile/src/hooks/usePushNotifications.ts` sets `Notifications.setNotificationHandler` and listens to `addNotificationResponseReceivedListener`.
- **Deep Links Map**:
  - `cart` -> `/cart`
  - `item:ID` -> `/product/${id}`
  - `category:ID` -> `/category/${id}`
  - `offers` -> `/offers` or `/`
  - `order:ID` -> `/order/${id}`

---

### 5. Admin Panel Structure & Permissions
- **Admin Directory**: `app/admin/` with `layout.tsx` enforcing admin authentication.
- **Navigation**: `components/admin/AdminSidebar.tsx` holds `navItems`.
- **Placement**: New campaigns management dashboard will reside at `app/admin/campaigns/page.tsx` with sidebar navigation under Marketing / Offers.

---

### 6. Hosting Cron Execution & Intervals
- **Cron Directory**: `app/api/cron/` (`order-alerts`, `sla-checker`).
- **Security**: Protected with `Bearer ${process.env.CRON_SECRET}` authentication.
- **Shortest Allowed Interval**: 1 minute.
- **Admin Manual Trigger**: Direct server actions and API route for on-demand "Run cart reminders now" execution with instant diagnostic response.
