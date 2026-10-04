/**
 * Permission Matrix for IntriHub Vendor Workspace (Admin Impersonation Mode)
 *
 * NON-NEGOTIABLE SECURITY POLICY:
 * While acting inside a vendor's workspace on their behalf, an administrator
 * is restricted to operational tasks (catalog, inventory, fulfillment, delivery slots).
 * High-risk financial operations (bank, payouts), credential changes (password, OTP, phone, email),
 * and account destruction are strictly BLOCKED at the server layer with HTTP 403 Forbidden.
 */

export const WORKSPACE_ALLOWED_ACTIONS = [
  "item:create",
  "item:edit",
  "item:delete",
  "item:hide",
  "item:bulk_upload",
  "item:image_upload",
  "stock:manage",
  "order:view",
  "order:update_status",
  "order:bulk_status",
  "delivery_slots:manage",
  "delivery_slots:view",
  "dashboard:view",
  "inventory:view",
  "reviews:view",
] as const;

export const WORKSPACE_VIEW_ONLY_ACTIONS = [
  "profile:view",
  "kyc:view",
  "business:view",
  "payouts:view_history",
] as const;

export const WORKSPACE_BLOCKED_ACTIONS = [
  "bank:update",
  "bank:view_details",
  "payout:withdraw",
  "payout:initiate",
  "auth:change_password",
  "auth:change_phone",
  "auth:change_email",
  "vendor:delete_account",
  "vendor:suspend_account",
  "auth:login_settings",
  "financial:money_transfer",
] as const;

export type WorkspaceAction =
  | (typeof WORKSPACE_ALLOWED_ACTIONS)[number]
  | (typeof WORKSPACE_VIEW_ONLY_ACTIONS)[number]
  | (typeof WORKSPACE_BLOCKED_ACTIONS)[number];

export const WORKSPACE_COOKIE_NAME = "intrihub_vendor_workspace_session";

export interface VendorActor {
  type: "VENDOR" | "ADMIN" | "CPO";
  adminId?: string;
  adminEmail?: string;
  cpoId?: string;
  cpoEmail?: string;
}

export interface VendorContext {
  vendorId: string;
  actor: VendorActor;
  sessionId?: string;
}

export interface WorkspacePermissionCheck {
  allowed: boolean;
  status: "ALLOWED" | "VIEW_ONLY" | "BLOCKED";
  reason?: string;
}

export const WORKSPACE_REASONS = [
  { value: "Vendor onboarding", label: "Vendor onboarding — Setting up initial catalog & settings" },
  { value: "Vendor needs help", label: "Vendor needs help — Assisting vendor with operations" },
  { value: "OTP/login issue", label: "OTP/login issue — Helping vendor who cannot authenticate" },
  { value: "Bulk catalog upload", label: "Bulk catalog upload — Ingesting supplier inventory" },
  { value: "Other", label: "Other — Specialized administrative intervention" },
] as const;

/**
 * Validates whether an action is permitted in Vendor Workspace mode
 */
export function evaluateWorkspaceAction(action: WorkspaceAction | string): WorkspacePermissionCheck {
  if (WORKSPACE_BLOCKED_ACTIONS.includes(action as any)) {
    return {
      allowed: false,
      status: "BLOCKED",
      reason: `Action "${action}" is strictly prohibited while acting in Vendor Workspace mode for security and financial integrity.`,
    };
  }

  if (WORKSPACE_VIEW_ONLY_ACTIONS.includes(action as any)) {
    return {
      allowed: true,
      status: "VIEW_ONLY",
      reason: `Action "${action}" is accessible in view-only mode in Vendor Workspace.`,
    };
  }

  if (WORKSPACE_ALLOWED_ACTIONS.includes(action as any)) {
    return {
      allowed: true,
      status: "ALLOWED",
    };
  }

  // Any unrecognized mutating action is blocked by default principle of least privilege
  return {
    allowed: false,
    status: "BLOCKED",
    reason: `Unrecognized action "${action}" is not permitted in Vendor Workspace mode.`,
  };
}
