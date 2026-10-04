"use server";

import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getAdminSession, getAuthenticatedVendor } from "@/lib/server-auth";
import { STRICT_ADMIN_EMAIL } from "@/lib/admin-constants";
import { verifyPassword } from "@/lib/password-security";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  evaluateWorkspaceAction,
  WorkspaceAction,
  WORKSPACE_COOKIE_NAME,
  type VendorActor,
  type VendorContext,
} from "@/lib/config/vendor-workspace-permissions";
import { notifyVendorOfAdminChanges } from "@/lib/notifications/vendor-workspace-notify";

const SESSION_TTL_MS = 60 * 60 * 1000; // 60 minutes absolute expiry
const IDLE_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes idle timeout

/**
 * Checks whether an admin user holds the "vendor:act_as" permission.
 * Super Admins have it by default; other staff/admins require explicit grant.
 */
export async function checkAdminHasWorkspacePermission(adminId: string, email: string): Promise<boolean> {
  const cleanEmail = email.toLowerCase().trim();
  if (cleanEmail === STRICT_ADMIN_EMAIL.toLowerCase()) {
    return true; // Super Admin has default permission
  }

  const user = await prisma.user.findUnique({
    where: { id: adminId },
    include: { staffPermissions: true },
  });

  if (!user) return false;
  if (user.role === "admin") return true;

  // Check staff permissions array
  const hasPermission = user.staffPermissions.some((sp) =>
    sp.permissions.includes("vendor:act_as") || sp.permissions.includes("*")
  );

  return hasPermission;
}

/**
 * Helper to get client IP and user agent safely
 */
async function getClientMetadata(): Promise<{ ip?: string; userAgent?: string }> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : h.get("x-real-ip") || "127.0.0.1";
    const userAgent = h.get("user-agent") || undefined;
    return { ip, userAgent };
  } catch {
    return {};
  }
}

/**
 * CENTRAL HELPER: Resolves the effective vendor context for Route Handlers and Server Actions.
 *
 * Evaluation Order:
 * 1. Valid authentic vendor session -> actor: VENDOR (existing vendor self-service).
 * 2. Valid, unexpired DB ImpersonationSession for the authenticated admin with "vendor:act_as"
 *    -> actor: ADMIN, vendorId: session.vendorId (workspace session).
 * 3. Otherwise -> null / throws unauthorized.
 */
export async function resolveVendorContext(req?: any): Promise<VendorContext | null> {
  let cookieStore: any = null;
  try {
    cookieStore = await cookies();
  } catch {
    // Called outside React server context (e.g. edge or standalone handler)
  }

  // 1. Direct Vendor Session check
  const vendorAuth = await getAuthenticatedVendor();
  if (vendorAuth && vendorAuth.vendorId) {
    return {
      vendorId: vendorAuth.vendorId,
      actor: {
        type: "VENDOR",
      },
    };
  }

  // 2. CPO Impersonation Workspace Session check
  let cpoWorkspaceId = cookieStore?.get("intrihub_cpo_workspace_session")?.value;
  if (!cpoWorkspaceId && req) {
    if (typeof req.cookies?.get === "function") {
      cpoWorkspaceId = req.cookies.get("intrihub_cpo_workspace_session")?.value;
    } else if (req.headers) {
      const cookieHeader = typeof req.headers.get === "function" ? req.headers.get("cookie") : req.headers.cookie;
      if (cookieHeader && typeof cookieHeader === "string") {
        const match = cookieHeader.match(/(?:^|; )intrihub_cpo_workspace_session=([^;]*)/);
        if (match) cpoWorkspaceId = decodeURIComponent(match[1]);
      }
    }
  }

  if (cpoWorkspaceId) {
    let cpoToken = cookieStore?.get("intrihub_cpo_token")?.value;
    if (!cpoToken && req) {
      if (typeof req.cookies?.get === "function") {
        cpoToken = req.cookies.get("intrihub_cpo_token")?.value;
      } else if (req.headers) {
        const cookieHeader = typeof req.headers.get === "function" ? req.headers.get("cookie") : req.headers.cookie;
        if (cookieHeader && typeof cookieHeader === "string") {
          const match = cookieHeader.match(/(?:^|; )intrihub_cpo_token=([^;]*)/);
          if (match) cpoToken = decodeURIComponent(match[1]);
        }
      }
    }

    if (cpoToken) {
      const { verifyCpoSessionToken } = await import("@/lib/cpo/auth");
      const verified = await verifyCpoSessionToken(cpoToken);
      if (verified.valid && verified.userId) {
        const cpoSession = await prisma.impersonationSession.findUnique({
          where: { id: cpoWorkspaceId },
          include: {
            admin: { select: { id: true, email: true, role: true } },
            vendor: { select: { id: true, businessName: true, status: true } },
          },
        });

        if (
          cpoSession &&
          !cpoSession.endedAt &&
          cpoSession.adminId === verified.userId &&
          cpoSession.expiresAt.getTime() > Date.now()
        ) {
          return {
            vendorId: cpoSession.vendorId,
            actor: {
              type: "CPO",
              cpoId: cpoSession.adminId,
              cpoEmail: cpoSession.admin.email || verified.email,
            },
            sessionId: cpoSession.id,
          };
        }
      }
    }
  }

  // 3. Admin Impersonation Workspace Session check
  let workspaceSessionId = cookieStore?.get(WORKSPACE_COOKIE_NAME)?.value;
  if (!workspaceSessionId && req) {
    if (typeof req.cookies?.get === "function") {
      workspaceSessionId = req.cookies.get(WORKSPACE_COOKIE_NAME)?.value;
    } else if (req.headers) {
      const cookieHeader = typeof req.headers.get === "function" ? req.headers.get("cookie") : req.headers.cookie;
      if (cookieHeader && typeof cookieHeader === "string") {
        const match = cookieHeader.match(new RegExp(`(?:^|; )${WORKSPACE_COOKIE_NAME}=([^;]*)`));
        if (match) workspaceSessionId = decodeURIComponent(match[1]);
      }
    }
  }
  if (!workspaceSessionId) {
    return null;
  }

  const adminSession = await getAdminSession();
  if (!adminSession || !adminSession.adminId) {
    // Workspace cookie exists but admin is not authenticated
    return null;
  }

  const now = new Date();

  // Lookup active DB session
  const session = await prisma.impersonationSession.findUnique({
    where: { id: workspaceSessionId },
    include: {
      admin: { select: { id: true, email: true, role: true } },
      vendor: { select: { id: true, businessName: true, status: true } },
    },
  });

  if (!session) {
    cookieStore?.delete(WORKSPACE_COOKIE_NAME);
    return null;
  }

  // Verify session belongs to the logged-in admin
  if (session.adminId !== adminSession.adminId) {
    cookieStore?.delete(WORKSPACE_COOKIE_NAME);
    return null;
  }

  // Verify not already manually ended
  if (session.endedAt) {
    cookieStore?.delete(WORKSPACE_COOKIE_NAME);
    return null;
  }

  // Absolute Expiry check (60 min)
  if (session.expiresAt.getTime() <= now.getTime()) {
    await prisma.impersonationSession.update({
      where: { id: session.id },
      data: { endedAt: now },
    });
    cookieStore?.delete(WORKSPACE_COOKIE_NAME);
    return null;
  }

  // Idle Timeout check (20 min of inactivity)
  const idleElapsed = now.getTime() - session.lastActiveAt.getTime();
  if (idleElapsed > IDLE_TIMEOUT_MS) {
    await prisma.impersonationSession.update({
      where: { id: session.id },
      data: { endedAt: now },
    });
    cookieStore?.delete(WORKSPACE_COOKIE_NAME);
    return null;
  }

  // Verify admin still holds `vendor:act_as` permission
  const hasPermission = await checkAdminHasWorkspacePermission(adminSession.adminId, adminSession.email);
  if (!hasPermission) {
    await prisma.impersonationSession.update({
      where: { id: session.id },
      data: { endedAt: now },
    });
    cookieStore?.delete(WORKSPACE_COOKIE_NAME);
    return null;
  }

  // Refresh lastActiveAt (throttled to once every 20 seconds to prevent DB churn)
  if (idleElapsed > 20 * 1000) {
    await prisma.impersonationSession.update({
      where: { id: session.id },
      data: { lastActiveAt: now },
    });
  }

  return {
    vendorId: session.vendorId,
    actor: {
      type: "ADMIN",
      adminId: session.adminId,
      adminEmail: session.admin.email || adminSession.email,
    },
    sessionId: session.id,
  };
}

/**
 * Strict server-side assertion helper: throws an Error if caller has neither vendor nor workspace access.
 */
export async function requireVendorContext(actionName?: string): Promise<VendorContext> {
  const context = await resolveVendorContext();
  if (!context) {
    throw new Error("Unauthorized: Active vendor or admin workspace session required.");
  }

  if (context.actor.type === "ADMIN" && actionName) {
    const perm = evaluateWorkspaceAction(actionName);
    if (!perm.allowed) {
      throw new Error(`Forbidden: ${perm.reason || "Action not allowed in admin workspace mode."}`);
    }
  }

  if (context.actor.type === "CPO" && actionName) {
    const { evaluateCpoAction } = await import("@/lib/config/cpo-permissions");
    const perm = evaluateCpoAction(actionName);
    if (!perm.allowed) {
      throw new Error(`Forbidden: ${perm.reason || "Action not allowed in CPO workspace mode."}`);
    }
  }

  return context;
}

/**
 * Step-Up Verification Helper
 */
function getSystemAdminPassword(): string {
  return (
    process.env.ADMIN_PASSWORD ||
    (process.env.NODE_ENV === "production" ? "" : "Admin@Intrihub#92")
  );
}

/**
 * Start an Impersonation Workspace Session.
 * Requires:
 * 1. Caller must have authenticated admin session
 * 2. Caller must have `vendor:act_as` permission
 * 3. Step-up verification: admin password or verified OTP
 * 4. Reason provided from valid list
 * 5. Rate limit: max 10 workspace starts per hour per admin
 */
export async function startWorkspaceSession(params: {
  vendorId: string;
  reason: string;
  note?: string;
  stepUpPassword?: string;
  stepUpOtp?: string;
}): Promise<{
  success: boolean;
  sessionId?: string;
  vendor?: { id: string; businessName: string };
  expiresAt?: string;
  error?: string;
}> {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return { success: false, error: "Unauthorized: Administrator credentials required." };
    }

    // Permission check
    const hasPermission = await checkAdminHasWorkspacePermission(adminSession.adminId, adminSession.email);
    if (!hasPermission) {
      return {
        success: false,
        error: "Forbidden: You do not possess the 'vendor:act_as' permission to open vendor workspaces.",
      };
    }

    // Rate Limiting: max 10 session starts per hour per admin
    const rateLimit = checkRateLimit(`workspace-start:${adminSession.adminId}`, 10, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: "Rate limit reached: Maximum 10 vendor workspace sessions allowed per hour. Please wait before starting another.",
      };
    }

    // Step-Up Verification: Check Password or OTP
    let stepUpPassed = false;
    const cleanPassword = (params.stepUpPassword || "").trim();
    const cleanOtp = (params.stepUpOtp || "").trim();

    if (cleanPassword) {
      const adminUser = await prisma.user.findUnique({
        where: { id: adminSession.adminId },
        select: { passwordHash: true },
      });

      if (adminUser?.passwordHash) {
        stepUpPassed = verifyPassword(cleanPassword, adminUser.passwordHash);
      } else {
        // Fallback to configured ADMIN_PASSWORD
        const sysPwd = getSystemAdminPassword();
        stepUpPassed = Boolean(sysPwd && cleanPassword === sysPwd);
      }
    } else if (cleanOtp && cleanOtp.length === 6) {
      const token = await prisma.emailOtpToken.findFirst({
        where: {
          email: adminSession.email.toLowerCase(),
          otp: cleanOtp,
          used: false,
          expiresAt: { gt: new Date() },
        },
      });

      if (token) {
        stepUpPassed = true;
        await prisma.emailOtpToken.update({
          where: { id: token.id },
          data: { used: true },
        });
      }
    }

    if (!stepUpPassed) {
      return {
        success: false,
        error: "Step-up verification failed: Please enter a valid admin password or 2FA OTP code.",
      };
    }

    // Verify vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id: params.vendorId },
      select: { id: true, businessName: true, status: true },
    });

    if (!vendor) {
      return { success: false, error: "Target vendor not found." };
    }

    const { ip, userAgent } = await getClientMetadata();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

    // Enforce ONE active workspace per admin at a time: terminate existing active sessions
    await prisma.impersonationSession.updateMany({
      where: {
        adminId: adminSession.adminId,
        endedAt: null,
      },
      data: {
        endedAt: now,
      },
    });

    const fullReason = params.note?.trim()
      ? `${params.reason.trim()} — ${params.note.trim()}`
      : params.reason.trim();

    // Create DB-backed ImpersonationSession
    const session = await prisma.impersonationSession.create({
      data: {
        adminId: adminSession.adminId,
        vendorId: vendor.id,
        reason: fullReason,
        startedAt: now,
        expiresAt,
        lastActiveAt: now,
        ip,
        userAgent,
      },
    });

    // Set secure HTTP-only cookie referencing session ID
    const cookieStore = await cookies();
    cookieStore.set(WORKSPACE_COOKIE_NAME, session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60, // 60 minutes
    });

    // Write to AdminAuditLog
    await prisma.adminAuditLog.create({
      data: {
        adminId: adminSession.adminId,
        vendorId: vendor.id,
        sessionId: session.id,
        action: "WORKSPACE_SESSION_STARTED",
        entity: "ImpersonationSession",
        entityId: session.id,
        before: undefined,
        after: {
          vendorId: vendor.id,
          vendorName: vendor.businessName,
          reason: fullReason,
          expiresAt: expiresAt.toISOString(),
        },
        ip,
      },
    });

    return {
      success: true,
      sessionId: session.id,
      vendor: { id: vendor.id, businessName: vendor.businessName },
      expiresAt: expiresAt.toISOString(),
    };
  } catch (error: any) {
    console.error("startWorkspaceSession error:", error);
    return { success: false, error: error?.message || "Failed to start workspace session." };
  }
}

/**
 * End current admin workspace session.
 */
export async function endWorkspaceSession(options?: {
  sessionId?: string;
  changesSummary?: {
    itemsCreated?: number;
    itemsUpdated?: number;
    itemsDeleted?: number;
    ordersUpdated?: number;
    slotsUpdated?: boolean;
  };
}): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies();
    const activeSessionId = options?.sessionId || cookieStore.get(WORKSPACE_COOKIE_NAME)?.value;

    if (!activeSessionId) {
      cookieStore.delete(WORKSPACE_COOKIE_NAME);
      return { success: true };
    }

    const now = new Date();
    const session = await prisma.impersonationSession.findUnique({
      where: { id: activeSessionId },
      include: {
        admin: { select: { email: true, id: true } },
        vendor: { select: { id: true, businessName: true } },
      },
    });

    if (session && !session.endedAt) {
      await prisma.impersonationSession.update({
        where: { id: session.id },
        data: { endedAt: now },
      });

      const { ip } = await getClientMetadata();

      await prisma.adminAuditLog.create({
        data: {
          adminId: session.adminId,
          vendorId: session.vendorId,
          sessionId: session.id,
          action: "WORKSPACE_SESSION_ENDED",
          entity: "ImpersonationSession",
          entityId: session.id,
          before: { lastActiveAt: session.lastActiveAt.toISOString() },
          after: { endedAt: now.toISOString(), forced: false },
          ip,
        },
      });

      // Dispatch batched notification to vendor if changes were made
      if (options?.changesSummary) {
        await notifyVendorOfAdminChanges({
          vendorId: session.vendorId,
          adminEmail: session.admin.email || "IntriHub Support",
          reason: session.reason,
          summary: {
            itemsCreated: options.changesSummary.itemsCreated || 0,
            itemsUpdated: options.changesSummary.itemsUpdated || 0,
            itemsDeleted: options.changesSummary.itemsDeleted || 0,
            ordersUpdated: options.changesSummary.ordersUpdated || 0,
            slotsUpdated: Boolean(options.changesSummary.slotsUpdated),
          },
        });
      }
    }

    cookieStore.delete(WORKSPACE_COOKIE_NAME);
    return { success: true };
  } catch (error: any) {
    console.error("endWorkspaceSession error:", error);
    return { success: false, error: error?.message || "Failed to exit workspace" };
  }
}

/**
 * Super Admin Force-End Workspace Session:
 * Allows a Super Admin to terminate any active workspace session immediately.
 */
export async function forceEndWorkspaceSession(targetSessionId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return { success: false, error: "Unauthorized: Admin privileges required." };
    }

    const hasPermission = await checkAdminHasWorkspacePermission(adminSession.adminId, adminSession.email);
    if (!hasPermission) {
      return { success: false, error: "Forbidden: Super Admin access required." };
    }

    const session = await prisma.impersonationSession.findUnique({
      where: { id: targetSessionId },
    });

    if (!session) {
      return { success: false, error: "Session not found." };
    }

    const now = new Date();
    await prisma.impersonationSession.update({
      where: { id: targetSessionId },
      data: { endedAt: now },
    });

    const { ip } = await getClientMetadata();

    await prisma.adminAuditLog.create({
      data: {
        adminId: adminSession.adminId,
        vendorId: session.vendorId,
        sessionId: session.id,
        action: "WORKSPACE_SESSION_FORCE_TERMINATED",
        entity: "ImpersonationSession",
        entityId: session.id,
        before: { lastActiveAt: session.lastActiveAt.toISOString(), adminId: session.adminId },
        after: { endedAt: now.toISOString(), terminatedBy: adminSession.email },
        ip,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("forceEndWorkspaceSession error:", error);
    return { success: false, error: error?.message || "Failed to terminate session." };
  }
}

/**
 * Retrieve current active workspace status (vendor name, seconds remaining until idle / absolute expiry)
 */
export async function getActiveWorkspaceStatus(): Promise<{
  active: boolean;
  vendorId?: string;
  vendorName?: string;
  vendorSlug?: string;
  reason?: string;
  secondsRemaining?: number;
  idleSecondsRemaining?: number;
  adminEmail?: string;
  sessionId?: string;
}> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(WORKSPACE_COOKIE_NAME)?.value;
    if (!sessionId) return { active: false };

    const session = await prisma.impersonationSession.findUnique({
      where: { id: sessionId },
      include: {
        vendor: { select: { id: true, businessName: true, slug: true } },
        admin: { select: { email: true } },
      },
    });

    if (!session || session.endedAt) {
      return { active: false };
    }

    const now = Date.now();
    const absRemaining = Math.max(0, Math.floor((session.expiresAt.getTime() - now) / 1000));
    const idleElapsed = now - session.lastActiveAt.getTime();
    const idleRemaining = Math.max(0, Math.floor((IDLE_TIMEOUT_MS - idleElapsed) / 1000));

    if (absRemaining <= 0 || idleRemaining <= 0) {
      return { active: false };
    }

    return {
      active: true,
      vendorId: session.vendorId,
      vendorName: session.vendor.businessName,
      vendorSlug: session.vendor.slug,
      reason: session.reason,
      secondsRemaining: Math.min(absRemaining, idleRemaining),
      idleSecondsRemaining: idleRemaining,
      adminEmail: session.admin.email || undefined,
      sessionId: session.id,
    };
  } catch (error) {
    console.error("getActiveWorkspaceStatus error:", error);
    return { active: false };
  }
}

/**
 * Log an action to AdminAuditLog
 */
export async function logAdminAuditAction(params: {
  sessionId?: string;
  adminId: string;
  vendorId?: string;
  action: string;
  entity: string;
  entityId?: string;
  before?: any;
  after?: any;
}) {
  try {
    const { ip } = await getClientMetadata();
    await prisma.adminAuditLog.create({
      data: {
        adminId: params.adminId,
        vendorId: params.vendorId || null,
        sessionId: params.sessionId || null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        before: params.before ? JSON.parse(JSON.stringify(params.before)) : undefined,
        after: params.after ? JSON.parse(JSON.stringify(params.after)) : undefined,
        ip: ip || null,
      },
    });
  } catch (err) {
    console.error("logAdminAuditAction error:", err);
  }
}

/**
 * Query Audit Logs with Filters (admin, vendor, date, action)
 */
export async function getAdminWorkspaceAuditLogs(filters?: {
  adminId?: string;
  vendorId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) return [];

    const where: any = {};
    if (filters?.adminId) where.adminId = filters.adminId;
    if (filters?.vendorId) where.vendorId = filters.vendorId;
    if (filters?.action) where.action = filters.action;

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const logs = await prisma.adminAuditLog.findMany({
      where,
      include: {
        admin: { select: { id: true, name: true, email: true } },
        vendor: { select: { id: true, businessName: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: filters?.limit || 50,
    });

    return logs;
  } catch (error) {
    console.error("getAdminWorkspaceAuditLogs error:", error);
    return [];
  }
}

/**
 * Query Active Impersonation Sessions for Super Admin monitor
 */
export async function getActiveImpersonationSessions() {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) return [];

    const now = new Date();
    const sessions = await prisma.impersonationSession.findMany({
      where: {
        endedAt: null,
        expiresAt: { gt: now },
      },
      include: {
        admin: { select: { id: true, name: true, email: true } },
        vendor: { select: { id: true, businessName: true, slug: true, contactPhone: true } },
      },
      orderBy: { startedAt: "desc" },
    });

    return sessions.map((s) => ({
      id: s.id,
      adminId: s.adminId,
      adminName: s.admin.name || s.admin.email,
      adminEmail: s.admin.email,
      vendorId: s.vendorId,
      vendorName: s.vendor.businessName,
      vendorPhone: s.vendor.contactPhone,
      reason: s.reason,
      startedAt: s.startedAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
      lastActiveAt: s.lastActiveAt.toISOString(),
      ip: s.ip,
      isIdle: now.getTime() - s.lastActiveAt.getTime() > IDLE_TIMEOUT_MS,
    }));
  } catch (error) {
    console.error("getActiveImpersonationSessions error:", error);
    return [];
  }
}

/**
 * Vendor-Side Transparency: Returns recent administrative activity on this vendor's account
 */
export async function getVendorAdminActivity(vendorId: string, limit = 15) {
  try {
    if (!vendorId) return [];
    const logs = await prisma.adminAuditLog.findMany({
      where: { vendorId },
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        actorRole: true,
        before: true,
        after: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return logs.map((l) => ({
      id: l.id,
      action: l.action,
      entity: l.entity,
      entityId: l.entityId,
      actorRole: l.actorRole,
      before: l.before,
      after: l.after,
      createdAt: l.createdAt.toISOString(),
      performedBy: l.actorRole === "CPO" ? "IntriHub CPO" : "IntriHub Admin Team",
    }));
  } catch (error) {
    console.error("getVendorAdminActivity error:", error);
    return [];
  }
}

