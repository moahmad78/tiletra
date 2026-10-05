"use server";

import { cookies, headers } from "next/headers";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { checkIsAdmin, getAdminSession } from "@/lib/server-auth";
import { deliverEmail } from "@/lib/actions/email-otp";
import {
  CPO_SESSION_COOKIE,
  CPO_WORKSPACE_COOKIE,
  CpoSession,
  CpoWorkspaceStatus,
  evaluateCpoAction,
} from "@/lib/config/cpo-permissions";

function getCpoSecret(): string {
  const secret =
    process.env.CPO_SESSION_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    process.env.JWT_SECRET ||
    process.env.NEXTAUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CRITICAL SECURITY ERROR: CPO_SESSION_SECRET must be configured in production.");
    }
    return "intrihub-dev-cpo-secure-key";
  }
  return secret;
}

const CPO_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const WORKSPACE_TTL_MS = 60 * 60 * 1000; // 60 minutes
const IDLE_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes idle

/**
 * Generate signed HMAC token for CPO session
 */
export async function generateCpoSessionToken(userId: string, email: string): Promise<string> {
  const payload = JSON.stringify({
    userId,
    email: email.toLowerCase().trim(),
    role: "cpo",
    iat: Date.now(),
    exp: Date.now() + CPO_SESSION_TTL_MS,
  });
  const base64Payload = Buffer.from(payload).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getCpoSecret())
    .update(base64Payload)
    .digest("base64url");
  return `${base64Payload}.${signature}`;
}

/**
 * Verify signed HMAC token for CPO session
 */
export async function verifyCpoSessionToken(token: string): Promise<{
  valid: boolean;
  userId?: string;
  email?: string;
}> {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return { valid: false };
  }

  const [base64Payload, signature] = token.split(".");
  if (!base64Payload || !signature) return { valid: false };

  const expectedSignature = crypto
    .createHmac("sha256", getCpoSecret())
    .update(base64Payload)
    .digest("base64url");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSignature);

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return { valid: false };
  }

  try {
    const payload = JSON.parse(Buffer.from(base64Payload, "base64url").toString("utf8"));
    if (payload.exp && payload.exp < Date.now()) {
      return { valid: false };
    }
    if (payload.role !== "cpo") {
      return { valid: false };
    }
    return { valid: true, userId: payload.userId, email: payload.email };
  } catch {
    return { valid: false };
  }
}

/**
 * Get Client IP and User Agent safely
 */
async function getClientMetadata(): Promise<{ ip: string; userAgent: string }> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : h.get("x-real-ip") || "127.0.0.1";
    const userAgent = h.get("user-agent") || "Unknown Device";
    return { ip, userAgent };
  } catch {
    return { ip: "127.0.0.1", userAgent: "Unknown Device" };
  }
}

/**
 * Retrieve verified CPO session. Ensures user still has CPO role in DB.
 */
export async function getCpoSession(): Promise<CpoSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(CPO_SESSION_COOKIE)?.value;
    if (!token) return null;

    const verified = await verifyCpoSessionToken(token);
    if (!verified.valid || !verified.userId) return null;

    // Verify user exists and maintains role in DB
    const user = await prisma.user.findUnique({
      where: { id: verified.userId },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user || user.role.toLowerCase() !== "cpo") {
      cookieStore.delete(CPO_SESSION_COOKIE);
      cookieStore.delete(CPO_WORKSPACE_COOKIE);
      return null;
    }

    return {
      userId: user.id,
      email: user.email || verified.email || "cpo@intrihub.com",
      name: user.name || "Chief Product Officer",
      role: "cpo",
    };
  } catch (error) {
    console.error("getCpoSession error:", error);
    return null;
  }
}

/**
 * Strict server assertion: throws if caller is not an authenticated CPO
 */
export async function requireCpoSession(actionName?: string): Promise<CpoSession> {
  const session = await getCpoSession();
  if (!session) {
    throw new Error("Unauthorized: Active Chief Product Officer session required.");
  }

  if (actionName) {
    const check = evaluateCpoAction(actionName);
    if (!check.allowed) {
      throw new Error(`Forbidden: ${check.reason || "Action blocked for CPO."}`);
    }
  }

  return session;
}

/**
 * Send new-device / security alert email to CPO
 */
export async function sendCpoNewDeviceAlert(email: string, ip: string, userAgent?: string): Promise<void> {
  try {
    const timeFormatted = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="border-bottom: 2px solid #8b5cf6; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #4c1d95; margin: 0;">IntriHub Security Alert: CPO Login Detected</h2>
        </div>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
          Hello Chief Product Officer,
        </p>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
          A new authenticated session was established for your IntriHub CPO portal.
        </p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #475569;">
            <tr><td style="padding: 6px 0; font-weight: 600;">Time:</td><td>${timeFormatted} IST</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600;">IP Address:</td><td>${ip}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: 600;">Device / Client:</td><td>${userAgent || "Web Browser"}</td></tr>
          </table>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
          If this was you, no action is needed. If you did not perform this login, please immediately contact the IntriHub Infrastructure and Security Team.
        </p>
      </div>
    `;

    await deliverEmail({
      to: email,
      subject: `[Security Alert] IntriHub CPO Portal Sign-in from ${ip}`,
      html,
    });
  } catch (err) {
    console.error("sendCpoNewDeviceAlert error:", err);
  }
}

/**
 * Select a vendor to work inside on their behalf as CPO.
 * Creates an ImpersonationSession with actorRole = "CPO".
 */
export async function selectCpoVendor(params: {
  vendorId: string;
  reason?: string;
}): Promise<{
  success: boolean;
  sessionId?: string;
  vendor?: { id: string; businessName: string; slug: string };
  error?: string;
}> {
  try {
    const cpo = await requireCpoSession("vendor:act_as");

    const vendor = await prisma.vendor.findUnique({
      where: { id: params.vendorId },
      select: { id: true, businessName: true, slug: true, status: true },
    });

    if (!vendor) {
      return { success: false, error: "Target vendor not found." };
    }

    const { ip, userAgent } = await getClientMetadata();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + WORKSPACE_TTL_MS);

    // End any existing active CPO sessions for this user
    await prisma.impersonationSession.updateMany({
      where: {
        adminId: cpo.userId,
        endedAt: null,
      },
      data: { endedAt: now },
    });

    const fullReason = params.reason?.trim() || "CPO catalog management & optimization";

    const session = await prisma.impersonationSession.create({
      data: {
        adminId: cpo.userId,
        vendorId: vendor.id,
        reason: fullReason,
        actorRole: "CPO",
        startedAt: now,
        expiresAt,
        lastActiveAt: now,
        ip,
        userAgent,
      },
    });

    // Set secure workspace session cookie
    const cookieStore = await cookies();
    cookieStore.set(CPO_WORKSPACE_COOKIE, session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60, // 60 minutes
    });

    // Write audit log
    await prisma.adminAuditLog.create({
      data: {
        adminId: cpo.userId,
        vendorId: vendor.id,
        sessionId: session.id,
        action: "CPO_WORKSPACE_SESSION_STARTED",
        entity: "Vendor",
        entityId: vendor.id,
        actorRole: "CPO",
        after: {
          vendorName: vendor.businessName,
          reason: fullReason,
          cpoEmail: cpo.email,
        },
        ip,
      },
    });

    return {
      success: true,
      sessionId: session.id,
      vendor: { id: vendor.id, businessName: vendor.businessName, slug: vendor.slug },
    };
  } catch (error: any) {
    console.error("selectCpoVendor error:", error);
    return { success: false, error: error?.message || "Failed to start vendor workspace" };
  }
}

/**
 * Exit current CPO vendor workspace
 */
export async function exitCpoVendor(): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(CPO_WORKSPACE_COOKIE)?.value;

    if (sessionId) {
      const now = new Date();
      const session = await prisma.impersonationSession.findUnique({
        where: { id: sessionId },
        include: { admin: { select: { email: true } }, vendor: { select: { id: true, businessName: true } } },
      });

      await prisma.impersonationSession.updateMany({
        where: { id: sessionId, endedAt: null },
        data: { endedAt: now },
      });
      cookieStore.delete(CPO_WORKSPACE_COOKIE);

      if (session) {
        // Query actions performed during this CPO session
        const sessionLogs = await prisma.adminAuditLog.findMany({
          where: { sessionId: session.id },
          select: { action: true },
        });

        let itemsCreated = 0;
        let itemsUpdated = 0;
        let itemsDeleted = 0;
        let slotsUpdated = false;

        for (const l of sessionLogs) {
          if (l.action.includes("ITEM_CREATED") || l.action.includes("CREATE")) itemsCreated++;
          else if (l.action.includes("ITEM_DELETED") || l.action.includes("DELETE")) itemsDeleted++;
          else if (l.action.includes("ITEM_UPDATED") || l.action.includes("EDIT") || l.action.includes("TOGGLED")) itemsUpdated++;
          else if (l.action.includes("DELIVERY") || l.action.includes("SLOT")) slotsUpdated = true;
        }

        if (itemsCreated > 0 || itemsUpdated > 0 || itemsDeleted > 0 || slotsUpdated) {
          try {
            const { notifyVendorOfAdminChanges } = await import("@/lib/notifications/vendor-workspace-notify");
            await notifyVendorOfAdminChanges({
              vendorId: session.vendorId,
              adminEmail: session.admin.email || "cpo@intrihub.com",
              reason: session.reason || "CPO catalog management & optimization",
              summary: {
                itemsCreated,
                itemsUpdated,
                itemsDeleted,
                ordersUpdated: 0,
                slotsUpdated,
              },
            });
          } catch (notifErr) {
            console.error("Failed to dispatch batched CPO exit notification:", notifErr);
          }
        }
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("exitCpoVendor error:", error);
    return { success: false, error: error?.message || "Failed to exit workspace" };
  }
}

/**
 * Get active CPO workspace status
 */
export async function getActiveCpoWorkspaceStatus(): Promise<CpoWorkspaceStatus> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(CPO_WORKSPACE_COOKIE)?.value;
    if (!sessionId) return { active: false };

    const session = await prisma.impersonationSession.findUnique({
      where: { id: sessionId },
      include: {
        vendor: { select: { id: true, businessName: true, slug: true } },
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
      cookieStore.delete(CPO_WORKSPACE_COOKIE);
      return { active: false };
    }

    // Refresh lastActiveAt throttled
    if (idleElapsed > 30 * 1000) {
      await prisma.impersonationSession.update({
        where: { id: session.id },
        data: { lastActiveAt: new Date() },
      });
    }

    return {
      active: true,
      vendorId: session.vendorId,
      vendorName: session.vendor.businessName,
      vendorSlug: session.vendor.slug,
      sessionId: session.id,
      reason: session.reason,
      secondsRemaining: Math.min(absRemaining, idleRemaining),
    };
  } catch (error) {
    console.error("getActiveCpoWorkspaceStatus error:", error);
    return { active: false };
  }
}

/**
 * CPO Logout
 */
export async function logoutCpo(): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(CPO_SESSION_COOKIE);
    cookieStore.delete(CPO_WORKSPACE_COOKIE);
    return { success: true };
  } catch {
    return { success: true };
  }
}

/**
 * Super Admin Security Control: Assign CPO Role
 * Strictly restricted to Super Admin. Vendors cannot obtain this.
 */
export async function assignCpoRole(targetUserId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return { success: false, error: "Forbidden: Super Admin authority required to assign CPO role." };
    }

    const admin = await getAdminSession();
    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) {
      return { success: false, error: "Target user not found." };
    }

    await prisma.user.update({
      where: { id: targetUserId },
      data: { role: "cpo" },
    });

    const { ip } = await getClientMetadata();
    await prisma.adminAuditLog.create({
      data: {
        adminId: admin?.adminId || "system",
        action: "ROLE_CPO_ASSIGNED",
        entity: "User",
        entityId: user.id,
        before: { role: user.role, email: user.email },
        after: { role: "cpo", email: user.email },
        ip,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("assignCpoRole error:", error);
    return { success: false, error: error?.message || "Failed to assign CPO role." };
  }
}

/**
 * Super Admin Security Control: Revoke CPO Role
 */
export async function removeCpoRole(targetUserId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return { success: false, error: "Forbidden: Super Admin authority required." };
    }

    const admin = await getAdminSession();
    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) {
      return { success: false, error: "Target user not found." };
    }

    await prisma.user.update({
      where: { id: targetUserId },
      data: { role: "customer" },
    });

    const { ip } = await getClientMetadata();
    await prisma.adminAuditLog.create({
      data: {
        adminId: admin?.adminId || "system",
        action: "ROLE_CPO_REVOKED",
        entity: "User",
        entityId: user.id,
        before: { role: user.role, email: user.email },
        after: { role: "customer", email: user.email },
        ip,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("removeCpoRole error:", error);
    return { success: false, error: error?.message || "Failed to revoke CPO role." };
  }
}
