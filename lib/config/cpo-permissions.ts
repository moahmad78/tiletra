/**
 * Permission Matrix for IntriHub Chief Product Officer (CPO) Panel
 *
 * NON-NEGOTIABLE SECURITY RULES:
 * 1. Only SUPER_ADMIN can assign/remove the CPO role. Vendors can never obtain it.
 * 2. CPO manages all vendors, their catalogs, settings, categories, pricing, and merchandising.
 * 3. BLOCKED for CPO (HTTP 403 Forbidden with clear messages):
 *    - Bank/payout/settlement details
 *    - Refund approval
 *    - Vendor password/OTP settings
 *    - Vendor account deletion (requires Super Admin)
 */

export const CPO_ALLOWED_ACTIONS = [
  // Vendor Management
  "vendor:list",
  "vendor:create",
  "vendor:edit_settings",
  "vendor:update_status",
  "vendor:update_commission",
  "vendor:notes",
  "vendor:act_as",

  // Catalog & Product Operations
  "catalog:view",
  "catalog:create_item",
  "catalog:edit_item",
  "catalog:delete_item",
  "catalog:hide_item",
  "catalog:bulk_upload",
  "catalog:bulk_edit",
  "catalog:image_upload",

  // Quality, Business & Store Oversight
  "categories:manage",
  "pricing:manage",
  "merchandising:manage",
  "delivery_slots:manage",
  "seo:manage",
  "announcements:manage",
  "activity:view",
  "dashboard:view",
] as const;

export const CPO_VIEW_ONLY_ACTIONS = [
  "vendor:view_profile",
  "vendor:view_kyc",
  "payouts:view_history",
  "business:view",
] as const;

export const CPO_BLOCKED_ACTIONS = [
  // Financial & Settlements
  "bank:update",
  "bank:view_details",
  "payout:withdraw",
  "payout:initiate",
  "payout:settlement_update",
  "financial:money_transfer",

  // Customer Refunds
  "refund:approve",
  "refund:override",

  // Authentication & Security Credential Mutations
  "auth:change_password",
  "auth:change_otp_settings",
  "auth:change_phone",
  "auth:change_email",

  // Destructive Vendor Account Operations (Super Admin Only)
  "vendor:delete_account",
  "vendor:permanent_delete",
] as const;

export type CpoAction =
  | (typeof CPO_ALLOWED_ACTIONS)[number]
  | (typeof CPO_VIEW_ONLY_ACTIONS)[number]
  | (typeof CPO_BLOCKED_ACTIONS)[number];

export const CPO_SESSION_COOKIE = "intrihub_cpo_token";
export const CPO_WORKSPACE_COOKIE = "intrihub_cpo_workspace_session";

export interface CpoPermissionCheck {
  allowed: boolean;
  status: "ALLOWED" | "VIEW_ONLY" | "BLOCKED";
  reason?: string;
}

export interface CpoSession {
  userId: string;
  email: string;
  name: string;
  role: "cpo";
}

export interface CpoWorkspaceStatus {
  active: boolean;
  vendorId?: string;
  vendorName?: string;
  vendorSlug?: string;
  sessionId?: string;
  reason?: string;
  secondsRemaining?: number;
}

/**
 * Validates whether an action is permitted for the CPO role
 */
export function evaluateCpoAction(action: CpoAction | string): CpoPermissionCheck {
  if (CPO_BLOCKED_ACTIONS.includes(action as any)) {
    return {
      allowed: false,
      status: "BLOCKED",
      reason: `Action "${action}" is strictly blocked for the CPO role (403 Forbidden). High-risk financial operations, credentials, refunds, and vendor deletion require Super Admin authority.`,
    };
  }

  if (CPO_VIEW_ONLY_ACTIONS.includes(action as any)) {
    return {
      allowed: true,
      status: "VIEW_ONLY",
      reason: `Action "${action}" is accessible in view-only mode for CPO.`,
    };
  }

  if (CPO_ALLOWED_ACTIONS.includes(action as any)) {
    return {
      allowed: true,
      status: "ALLOWED",
    };
  }

  // Principle of least privilege: default to blocked for unknown actions
  return {
    allowed: false,
    status: "BLOCKED",
    reason: `Unrecognized action "${action}" is blocked for CPO role.`,
  };
}
