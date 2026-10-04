# IntriHub Vendor Workspace (Admin Impersonation Mode)

## Overview
The **Vendor Workspace** feature enables an authorized administrator (`vendor:act_as` permission or Super Admin) to access and manage any registered vendor's account on their behalf—such as creating/editing catalog products, fulfilling orders, and configuring delivery time slots—without requiring the vendor's OTP and without bypassing vendor authentication.

---

## Non-Negotiable Security Architecture

1. **Zero Vendor OTP / Password Bypass**:
   - The vendor login and OTP verification system remains strictly untouched.
   - Administrators authenticate exclusively using their **own** administrative session (`intrihub_admin_token`).
   - Admins never possess or compromise the vendor's credentials.

2. **Server-Side Enforcement**:
   - Every action resolves identity through `resolveVendorContext()`.
   - `vendorId` is derived strictly from the server-verified `ImpersonationSession` in the database, never from client-submitted parameters, query strings, or body fields.
   - Any attempt to spoof or tamper with `vendorId` is immediately rejected.

3. **Step-Up Verification**:
   - Opening a workspace requires step-up verification: either entering the administrator's password or verifying a 6-digit email/2FA OTP code.

4. **Timeouts & Revocability**:
   - **Absolute Expiry**: 60 minutes maximum session duration.
   - **Idle Timeout**: 20 minutes of inactivity terminates the session.
   - **Single Active Workspace**: Only one active workspace per admin at a time. Starting a new workspace automatically closes previous active sessions.
   - **Revocability**: Database-backed in `ImpersonationSession`. Super Admins can force-terminate any active session instantly from `/admin/workspace-activity`.

---

## Data Model (Prisma)

### 1. `ImpersonationSession`
```prisma
model ImpersonationSession {
  id           String    @id @default(cuid())
  adminId      String
  vendorId     String
  reason       String    // Vendor onboarding | Vendor needs help | OTP/login issue | Bulk catalog upload | Other
  startedAt    DateTime  @default(now())
  expiresAt    DateTime  // 60-minute absolute expiry
  lastActiveAt DateTime  @default(now()) // 20-minute idle timeout
  endedAt      DateTime?
  ip           String?
  userAgent    String?

  admin        User      @relation("AdminImpersonationSessions", fields: [adminId], references: [id], onDelete: Cascade)
  vendor       Vendor    @relation("VendorImpersonationSessions", fields: [vendorId], references: [id], onDelete: Cascade)

  @@index([adminId, endedAt])
  @@index([vendorId, endedAt])
  @@index([expiresAt])
  @@index([lastActiveAt])
}
```

### 2. `AdminAuditLog`
```prisma
model AdminAuditLog {
  id        String   @id @default(cuid())
  adminId   String
  vendorId  String?
  sessionId String?
  action    String
  entity    String
  entityId  String?
  before    Json?
  after     Json?
  ip        String?
  createdAt DateTime @default(now())

  admin     User     @relation("AdminAuditLogs", fields: [adminId], references: [id], onDelete: Cascade)
  vendor    Vendor?  @relation("VendorAuditLogs", fields: [vendorId], references: [id], onDelete: SetNull)

  @@index([adminId, createdAt])
  @@index([vendorId, createdAt])
  @@index([sessionId])
}
```

### 3. `Product` Tracking Fields
- `createdByAdminId String?` (nullable: stamped when an admin creates a product in workspace mode)
- `updatedByAdminId String?` (nullable: stamped when an admin updates a product in workspace mode)

---

## Permission Matrix (`lib/config/vendor-workspace-permissions.ts`)

| Category | Actions | Status | Behavior |
| :--- | :--- | :--- | :--- |
| **ALLOWED** | `item:create`, `item:edit`, `item:delete`, `item:hide`, `item:bulk_upload`, `item:image_upload`, `stock:manage`, `order:view`, `order:update_status`, `order:bulk_status`, `delivery_slots:manage`, `delivery_slots:view`, `dashboard:view`, `inventory:view`, `reviews:view` | **Permitted** | Executes with admin audit logging & admin identity stamping (`createdByAdminId` / `updatedByAdminId`). |
| **VIEW ONLY** | `profile:view`, `kyc:view`, `business:view`, `payouts:view_history` | **Read-Only** | Accessible to view store configuration; mutating operations return `403 Forbidden`. |
| **BLOCKED** | `bank:update`, `bank:view_details`, `payout:withdraw`, `payout:initiate`, `auth:change_password`, `auth:change_phone`, `auth:change_email`, `vendor:delete_account`, `vendor:suspend_account`, `auth:login_settings`, `financial:money_transfer` | **Blocked (403)** | Server actions and route handlers strictly reject with `HTTP 403 Forbidden`. UI renders visual lock icon and "Not allowed in admin mode" panel. |

---

## Changed Files & Components

1. **`lib/vendor-workspace-auth.ts`**:
   - `resolveVendorContext(req?)`: Central server helper resolving effective vendor context (`VENDOR` vs `ADMIN`).
   - `startWorkspaceSession()`: Step-up authentication, single active session constraint, rate limit (10/hr), and DB session creation.
   - `endWorkspaceSession()`: Graceful session termination and dispatching batched vendor notifications.
   - `forceEndWorkspaceSession()`: Super Admin revocation of any active impersonation session.
   - `getActiveWorkspaceStatus()`: Returns time remaining, idle expiry, and active vendor details.
   - `logAdminAuditAction()`: Persists state-changing mutations with before/after payloads to `AdminAuditLog`.
   - `getAdminWorkspaceAuditLogs()`: Filterable audit trail queries.
   - `getActiveImpersonationSessions()`: Real-time active session monitor.
   - `getVendorAdminActivity()`: Scoped vendor audit log for transparency.

2. **`lib/actions/vendor.ts`**:
   - Updated `updateVendorProfile`: Blocks profile/business updates in workspace mode (`403 Forbidden`).
   - Updated `updateVendorKycDocuments`: Blocks KYC submissions in workspace mode (`403 Forbidden`).
   - Updated `updateVendorBankDetails`: Blocks bank details changes in workspace mode (`403 Forbidden`).
   - Updated `changeVendorPassword`: Blocks password resets in workspace mode (`403 Forbidden`).
   - Updated `updateVendorDeliverySettings`: Scoped to `effectiveVendorId` with audit logging.
   - Integrated `notifyVendorOfAdminChanges` for consolidated notifications.

3. **`lib/actions/products.ts`**:
   - Updated `createProduct`, `updateProduct`, `bulkCreateProducts`, `deleteProduct` to stamp `createdByAdminId` and `updatedByAdminId` and record `AdminAuditLog` events.

4. **`components/admin/VendorWorkspaceModal.tsx`**:
   - Step-up verification modal (Password or 2FA OTP).
   - Searchable vendor selector with category, phone, and shop name matching.
   - Reason dropdown with standard reasons + optional note.
   - Correctly redirects to `/vendor` or `/vendor/products/new`.

5. **`components/admin/VendorWorkspaceBanner.tsx`**:
   - Non-dismissible top bar with warning colors and pulsing security badge.
   - Displays vendor name, ID, and real-time countdown timer (60m session / 20m idle).
   - "Quick Add Item" shortcut (`/vendor/products/new`).
   - "Activity Log" link (`/admin/workspace-activity`).
   - "Exit Workspace" button immediately terminating session.

6. **`components/admin/VendorWorkspaceSwitcher.tsx`**:
   - Global header switcher in `AdminHeader.tsx` allowing one-click workspace activation and switching.

7. **`app/admin/workspace-activity/page.tsx`**:
   - Dedicated admin dashboard showing:
     - Real-time active sessions with "Force End" termination.
     - Filterable audit logs (by Admin, Vendor, Date Range, Action).
     - Before/After JSON diff inspection.

8. **`app/vendor/settings/page.tsx`**:
   - Migrated to `useEffectiveVendor()`.
   - Displays Lock icons and "Blocked" badges on Bank & Payouts and Password & Security tabs.
   - Shows "Not allowed in admin mode (403 Forbidden)" explanation panels with disabled form fields.
   - Displays "View-Only in Admin Workspace" banner on Shop Profile and Legal KYC tabs.
   - Keeps Delivery & Shipping (time slots, fees) fully accessible for admin operational management.

9. **`app/vendor/payouts/page.tsx`**:
   - Migrated to `useEffectiveVendor()`.
   - Displays lock banner and blocks bank update/withdrawal actions in workspace mode.

10. **`app/vendor/products/page.tsx` & `app/vendor/page.tsx`**:
    - Displays "Added by IntriHub Admin" and "Edited by IntriHub Admin" badges on products.
    - Embeds `<AdminActivitySection vendorId={vendor.id} />` displaying all administrative changes for transparency.

11. **`lib/notifications/vendor-workspace-notify.ts`**:
    - Batches notifications to prevent alert fatigue.
    - Sends in-app customer notification, Expo push notification, and WhatsApp/Email summary.

---

## Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `ADMIN_ALLOWED_EMAIL` | Super Admin email possessing `vendor:act_as` by default | `admin@intrihub.com` |
| `ADMIN_PASSWORD` | Fallback system admin password for step-up verification | Configured in `.env` |
| `ADMIN_SESSION_SECRET` | HMAC secret for admin session tokens | Configured in `.env` |
| `VENDOR_SESSION_SECRET` | HMAC secret for vendor session tokens | Configured in `.env` |

---

## Manual Test Steps

### Step 1: Open Vendor Workspace with Step-Up Verification
1. Log into the IntriHub Admin Panel (`/admin/login`).
2. Navigate to **Vendors** (`/admin/vendors`).
3. On any approved vendor row, click **Workspace** (or the top-bar **Vendor Workspace** button).
4. Select a reason (e.g., *"Vendor onboarding"* or *"Vendor needs help"*).
5. Enter your admin password (or choose 2FA OTP and enter the 6-digit code).
6. Click **Activate Vendor Workspace**.
7. Confirm redirect to `/vendor` and verify the persistent red/orange banner is displayed across the screen with the countdown timer and target vendor's name.

### Step 2: Add Product as Admin on Vendor's Behalf
1. In the workspace, navigate to **Products** -> **Add Product** (`/vendor/products/new`).
2. Fill out product details and click **Create Product**.
3. Verify that the product is saved under the vendor's `vendorId`.
4. Inspect the product in `/vendor/products` and verify the badge **"Added by IntriHub Admin"** is visible.
5. Verify on public store (`/product/[slug]`) that customers see only the vendor's shop name with no admin identity exposed.

### Step 3: Verify Blocked Operations (HTTP 403)
1. In the workspace, go to **Settings** (`/vendor/settings`).
2. Click **Bank & Payouts**: verify the Lock icon, the "Blocked" badge, and the "Not allowed in admin mode" notice. Confirm input fields and save button are disabled.
3. Click **Password & Security**: verify inputs and update button are disabled.
4. Click **Shop Profile** & **KYC Documents**: verify the "View-Only in Admin Workspace" banner is displayed and saving is blocked.
5. Click **Delivery & Shipping**: verify that delivery slot configuration and delivery fees ARE editable by the admin.

### Step 4: Verify Admin Activity & Audit Trail
1. In Admin Console, navigate to **Workspace Activity** (`/admin/workspace-activity`).
2. Select the **Sessions** tab: verify the current active workspace session appears with admin email, vendor name, time started, and time remaining.
3. Select the **Audit Logs** tab: verify entries for `WORKSPACE_SESSION_STARTED`, `ITEM_CREATED`, and `DELIVERY_SETTINGS_UPDATED` with before/after state diffs and IP addresses.

### Step 5: Force Termination & Session Expiry
1. In `/admin/workspace-activity`, click **Force End** on the active session.
2. Confirm the prompt.
3. Switch to the vendor panel tab or refresh the page: confirm that the workspace session is immediately terminated, the banner disappears, and the user is redirected to `/admin/vendors`.

### Step 6: Verify Vendor Self-Login Regression
1. Log out of admin or open an incognito window.
2. Navigate to `/vendor/login`.
3. Log in with a vendor phone number and OTP/password.
4. Verify standard vendor access: Bank and Password tabs are fully editable, no admin banner is shown, and the vendor can view the **"Admin Activity"** section showing the changes made by the admin team.
