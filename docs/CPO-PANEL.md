# IntriHub CPO Panel (Chief Product Officer) — Phase 1 Documentation

## 1. Overview
The IntriHub **CPO Panel** (`/cpo`) provides an executive product management workspace allowing the Chief Product Officer to oversee all suppliers, curate unified catalogs across vendors, configure operational settings, and act inside any vendor's store on their behalf without the vendor's OTP, using their own server-verified authenticated session.

---

## 2. Security Architecture & Rules

### Non-Negotiable Rules
1. **DB-Backed Role (`CPO`)**:
   - `cpo@intrihub.com` (or any user assigned by a Super Admin) has `role = "cpo"` in the database.
   - Strictly no hardcoded bypasses.
   - Only `SUPER_ADMIN` can assign or revoke the `cpo` role via `assignCpoRole` / `removeCpoRole`. Vendors can never obtain it.
2. **Unified OTP Authentication**:
   - The CPO logs in from the **same login page** vendors use (`/vendor/login`) using the **exact same 6-digit OTP flow**.
   - OTP cannot be skipped or bypassed.
   - Protected by rate limiting and a 3-attempt brute-force lockout (15-minute freeze).
   - Upon successful verification, the server checks the DB role:
     - `vendor` -> `/vendor`
     - `cpo` -> `/cpo`
   - A security alert email is automatically dispatched to the CPO email address on new logins with IP, timestamp, and device metadata.
3. **Pure Server-Side Enforcement**:
   - All permissions enforced at route handlers and server actions via `requireCpoSession()` and `evaluateCpoAction()`.
4. **Shared `resolveVendorContext(req)` Resolution**:
   - When acting for a vendor, `vendorId` comes strictly from a server-verified database `ImpersonationSession` (`actorRole = "CPO"`), **never** from the client request body or query params.
   - Changes automatically stamp `createdByCpoId` / `updatedByCpoId` and `actorRole = "CPO"`.
5. **Strict 403 Blocked Operations**:
   - Bank details, payouts, settlements, refund approvals, vendor credentials (password/OTP), and vendor account deletion return **403 Forbidden**.

---

## 3. Permission Matrix (`lib/config/cpo-permissions.ts`)

| Category | Status | Actions |
| :--- | :--- | :--- |
| **Vendor Management** | **ALLOWED** | `vendor:list`, `vendor:create`, `vendor:edit_settings`, `vendor:update_status`, `vendor:update_commission`, `vendor:notes`, `vendor:act_as` |
| **Catalog Operations** | **ALLOWED** | `catalog:view`, `catalog:create_item`, `catalog:edit_item`, `catalog:delete_item`, `catalog:hide_item`, `catalog:bulk_upload`, `catalog:bulk_edit`, `catalog:image_upload` |
| **Store Oversight** | **ALLOWED** | `categories:manage`, `pricing:manage`, `merchandising:manage`, `delivery_slots:manage`, `seo:manage`, `announcements:manage`, `activity:view`, `dashboard:view` |
| **Vendor Profile / KYC** | **VIEW ONLY** | `vendor:view_profile`, `vendor:view_kyc`, `payouts:view_history`, `business:view` |
| **Financial & Destructive** | **BLOCKED (403)** | `bank:update`, `bank:view_details`, `payout:withdraw`, `payout:initiate`, `payout:settlement_update`, `refund:approve`, `auth:change_password`, `auth:change_otp_settings`, `auth:change_phone`, `auth:change_email`, `vendor:delete_account`, `vendor:permanent_delete` |

---

## 4. Phase 1 Implementation Files

### Created Files
- [`lib/config/cpo-permissions.ts`](file:///d:/Intrihub/lib/config/cpo-permissions.ts): Permission matrix, action lists, evaluation helper, and cookie constants.
- [`lib/cpo/auth.ts`](file:///d:/Intrihub/lib/cpo/auth.ts): CPO HMAC session generation, verification, vendor workspace selection, device login alerts, and Super Admin role assignment actions.
- [`lib/actions/cpo.ts`](file:///d:/Intrihub/lib/actions/cpo.ts): Server actions for dashboard metrics, vendor search/settings, cross-vendor catalog, bulk CSV/edit operations, and audit logs.
- [`components/cpo/CpoSidebar.tsx`](file:///d:/Intrihub/components/cpo/CpoSidebar.tsx): CPO navigation sidebar with all 10 management routes and phase badges.
- [`components/cpo/CpoHeader.tsx`](file:///d:/Intrihub/components/cpo/CpoHeader.tsx): Top header with CPO identity, global vendor switcher modal, and sign out.
- [`components/cpo/CpoWorkspaceBanner.tsx`](file:///d:/Intrihub/components/cpo/CpoWorkspaceBanner.tsx): Persistent purple/indigo top banner displaying active vendor, remaining time, storefront link, and exit button.
- [`components/cpo/CpoPhasePlaceholder.tsx`](file:///d:/Intrihub/components/cpo/CpoPhasePlaceholder.tsx): Reusable component showing roadmap and planned capabilities for Phase 2 & 3 routes.
- [`app/cpo/layout.tsx`](file:///d:/Intrihub/app/cpo/layout.tsx): App router layout with auth guard, sidebar, header, and workspace banner.
- [`app/cpo/page.tsx`](file:///d:/Intrihub/app/cpo/page.tsx): CPO Dashboard overview with KPI stats, active workspace card, and recent audit activity.
- [`app/cpo/vendors/page.tsx`](file:///d:/Intrihub/app/cpo/vendors/page.tsx): Vendors management with search, filters, Add Vendor modal, Edit Settings modal, and workspace launcher.
- [`app/cpo/catalog/page.tsx`](file:///d:/Intrihub/app/cpo/catalog/page.tsx): Cross-vendor catalog with filters, Add/Edit Item modal, Bulk Edit modal, and Bulk CSV Upload modal.
- [`app/cpo/activity/page.tsx`](file:///d:/Intrihub/app/cpo/activity/page.tsx): Activity log page with vendor and action filters and expandable before/after diffs.
- [`app/cpo/categories/page.tsx`](file:///d:/Intrihub/app/cpo/categories/page.tsx): Phase 2 category manager placeholder.
- [`app/cpo/pricing/page.tsx`](file:///d:/Intrihub/app/cpo/pricing/page.tsx): Phase 3 pricing rules placeholder.
- [`app/cpo/merchandising/page.tsx`](file:///d:/Intrihub/app/cpo/merchandising/page.tsx): Phase 3 merchandising placeholder.
- [`app/cpo/delivery-slots/page.tsx`](file:///d:/Intrihub/app/cpo/delivery-slots/page.tsx): Phase 3 delivery slots placeholder.
- [`app/cpo/seo/page.tsx`](file:///d:/Intrihub/app/cpo/seo/page.tsx): Phase 3 SEO tools placeholder.
- [`app/cpo/announcements/page.tsx`](file:///d:/Intrihub/app/cpo/announcements/page.tsx): Phase 2 announcements placeholder.
- [`scripts/seed-cpo.ts`](file:///d:/Intrihub/scripts/seed-cpo.ts): Database seed script initializing `cpo@intrihub.com` with role `cpo`.

### Modified Files
- [`prisma/schema.prisma`](file:///d:/Intrihub/prisma/schema.prisma):
  - `User.role`: supports `cpo`.
  - `Product`: added `createdByCpoId`, `updatedByCpoId`, and `actorRole`.
  - `Vendor`: added `internalNotes`.
  - `ImpersonationSession`: added `actorRole` (`ADMIN` | `CPO`).
  - `AdminAuditLog`: added `actorRole`.
- [`lib/config/vendor-workspace-permissions.ts`](file:///d:/Intrihub/lib/config/vendor-workspace-permissions.ts):
  - Updated `VendorActor` to support `type: "VENDOR" | "ADMIN" | "CPO"`, `cpoId`, and `cpoEmail`.
- [`lib/vendor-workspace-auth.ts`](file:///d:/Intrihub/lib/vendor-workspace-auth.ts):
  - Integrated CPO workspace session resolution in `resolveVendorContext()`.
  - Integrated `evaluateCpoAction` in `requireVendorContext()`.
  - Updated `getVendorAdminActivity` to return `performedBy: "IntriHub CPO"` when `actorRole === "CPO"`.
- [`lib/actions/products.ts`](file:///d:/Intrihub/lib/actions/products.ts):
  - `createProduct`, `updateProduct`, `deleteProduct`, and `bulkCreateProducts` automatically handle CPO context, set vendor ID, stamp `createdByCpoId` / `updatedByCpoId`, and verify vendor scope.
- [`lib/actions/web-portal-auth.ts`](file:///d:/Intrihub/lib/actions/web-portal-auth.ts):
  - `checkVendorLoginMethod`: detects DB role `cpo` and requires OTP.
  - `sendVendorWebOtp`: permits CPO OTP dispatch with rate limiting and lockout.
  - `verifyVendorWebOtp`: detects DB role `cpo`, issues `intrihub_cpo_token`, sends login alert email, and redirects to `/cpo`.
- [`app/vendor/login/page.tsx`](file:///d:/Intrihub/app/vendor/login/page.tsx):
  - On OTP success, inspects `redirectTo === "/cpo"` and routes to `/cpo` with welcome toast.
- [`components/vendor/AdminActivitySection.tsx`](file:///d:/Intrihub/components/vendor/AdminActivitySection.tsx):
  - Updated to "IntriHub Team Activity" displaying verified actions performed by both CPO and Admin.

---

## 5. Manual Verification Steps

1. **CPO OTP Login**:
   - Navigate to `/vendor/login`.
   - Enter `cpo@intrihub.com` -> Click **Continue**.
   - Notice the form requires a 6-digit OTP (password login is never offered to CPO).
   - Enter the verified OTP -> Click **Verify & Enter Portal**.
   - Confirm server reads `role=cpo` and redirects to `/cpo` (not `/vendor`).
2. **Normal Vendor Isolation**:
   - Log in as a normal vendor email.
   - Confirm normal vendor lands on `/vendor`.
   - Directly navigating to `/cpo` redirects back to `/vendor/login` (unauthorized).
3. **Vendor Management & Settings**:
   - In `/cpo/vendors`, click **Add New Vendor** and create a supplier.
   - Click the **Edit** icon on a vendor row to change category, commission rate, and internal notes.
   - Confirm changes persist and are recorded in the audit trail.
4. **Vendor Workspace Selection**:
   - Click **Workspace** on any vendor row or use the **Global Switcher** in the top bar.
   - Confirm the persistent purple/indigo banner appears across all `/cpo` pages:
     `"Working on behalf of: <Vendor Name> | Time Left: MM:SS | Exit Workspace"`.
5. **Catalog Operations as Vendor**:
   - Navigate to `/cpo/catalog`.
   - Click **Add Product**; notice the target vendor is automatically set to the active workspace vendor.
   - Create a product; verify it appears in the vendor's catalog with the `CPO` badge.
   - In the database, verify `createdByCpoId` and `updatedByCpoId` are stamped with the CPO user's ID.
6. **Activity Log & Diffs**:
   - Navigate to `/cpo/activity`.
   - Confirm all workspace actions, product creations, and vendor edits appear with `[CPO]` actor role and expandable before/after state diffs.
7. **Vendor-Side Transparency**:
   - Log in as the vendor whose store was edited.
   - Check the **IntriHub Team Activity** section; confirm CPO actions are listed with timestamp and details.
