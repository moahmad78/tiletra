import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import {
  checkVendorLoginLockout,
  recordVendorLoginFailure,
} from "@/lib/rate-limit";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, phone, purpose = "business" } = body;
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    if (!email && !phone) {
      return mobileApiResponse(
        { success: false, loginMethod: "not_found", error: "Please provide an email address or phone number" },
        400
      );
    }

    // 1. Strict IP Lockout Check (3 attempts -> 15 min lockout)
    const lockoutCheck = checkVendorLoginLockout(clientIp);
    if (lockoutCheck.locked) {
      const mins = Math.floor((lockoutCheck.retryAfterSeconds || 0) / 60);
      const secs = (lockoutCheck.retryAfterSeconds || 0) % 60;
      const timeStr = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

      return mobileApiResponse(
        {
          success: false,
          loginMethod: "not_found",
          error: `Too many failed attempts. Try again in ${timeStr}`,
          locked: true,
          lockoutUntil: lockoutCheck.lockoutUntil,
          retryAfterSeconds: lockoutCheck.retryAfterSeconds,
          remainingAttempts: 0,
        },
        429
      );
    }

    const cleanEmail = email ? email.trim().toLowerCase() : "";
    const cleanPhone = phone ? phone.replace(/\D/g, "") : "";

    // 2. Check Admin account
    const allowedAdminEmail = (process.env.ADMIN_ALLOWED_EMAIL || "admin@intrihub.com").toLowerCase().trim();
    if (cleanEmail && cleanEmail === allowedAdminEmail) {
      const adminUser = await prisma.user.findFirst({
        where: { email: { equals: cleanEmail, mode: "insensitive" } },
      });
      const method = adminUser?.passwordHash ? "password" : "otp";
      return mobileApiResponse({
        success: true,
        loginMethod: method,
        vendorName: "Super Admin",
      });
    }

    // 3. Lookup Vendor
    let vendor = null;
    if (cleanEmail) {
      vendor = await prisma.vendor.findFirst({
        where: {
          OR: [
            { contactEmail: { equals: cleanEmail, mode: "insensitive" } },
            { owner: { email: { equals: cleanEmail, mode: "insensitive" } } },
          ],
        },
        include: { owner: true },
      });
    } else if (cleanPhone) {
      vendor = await prisma.vendor.findFirst({
        where: {
          OR: [
            { contactPhone: { contains: cleanPhone } },
            { owner: { phone: { contains: cleanPhone } } },
          ],
        },
        include: { owner: true },
      });
    }

    // Check fallback User with role vendor
    const vendorUser = !vendor && cleanEmail
      ? await prisma.user.findFirst({
          where: {
            email: { equals: cleanEmail, mode: "insensitive" },
            role: "vendor",
          },
        })
      : null;

    if (!vendor && !vendorUser) {
      // Record failure for brute-force enum protection
      const failCheck = recordVendorLoginFailure(clientIp);
      if (failCheck.locked) {
        return mobileApiResponse(
          {
            success: false,
            loginMethod: "not_found",
            reason: "NOT_FOUND",
            error: "Too many failed attempts. Account login blocked for 15 minutes.",
            locked: true,
            lockoutUntil: failCheck.lockoutUntil,
            retryAfterSeconds: failCheck.retryAfterSeconds,
            remainingAttempts: 0,
            email: cleanEmail,
          },
          429
        );
      }

      return mobileApiResponse(
        {
          success: false,
          loginMethod: "not_found",
          reason: "NOT_FOUND",
          error: "This email isn't registered as an approved vendor partner on Intrihub.",
          locked: false,
          remainingAttempts: failCheck.remainingAttempts,
          email: cleanEmail,
        },
        403
      );
    }

    // Check vendor status
    if (vendor) {
      if (vendor.status === "pending") {
        return mobileApiResponse(
          {
            success: false,
            loginMethod: vendor.loginMethod || "otp",
            reason: "PENDING_APPROVAL",
            error: "Your vendor partner application is currently under review by our onboarding team.",
            vendorName: vendor.businessName,
            email: cleanEmail,
          },
          403
        );
      }

      if (vendor.status === "suspended") {
        return mobileApiResponse(
          {
            success: false,
            loginMethod: vendor.loginMethod || "otp",
            reason: "SUSPENDED",
            error: "Your vendor partner account has been suspended or deactivated. Please contact partner support.",
            vendorName: vendor.businessName,
            email: cleanEmail,
          },
          403
        );
      }

      if (vendor.status === "rejected") {
        return mobileApiResponse(
          {
            success: false,
            loginMethod: vendor.loginMethod || "otp",
            reason: "REJECTED",
            error: `Your vendor application was not approved.${vendor.rejectionReason ? ` Reason: ${vendor.rejectionReason}` : " Please contact partner support."}`,
            vendorName: vendor.businessName,
            rejectionReason: vendor.rejectionReason,
            email: cleanEmail,
          },
          403
        );
      }
    }

    // Vendor is eligible: determine loginMethod
    const isPasswordConfigured =
      vendor?.loginMethod === "password" && Boolean(vendor?.passwordHash || vendor?.owner?.passwordHash);

    const determinedMethod: "otp" | "password" = isPasswordConfigured ? "password" : "otp";

    return mobileApiResponse({
      success: true,
      loginMethod: determinedMethod,
      vendorName: vendor?.businessName || vendorUser?.name || "Vendor Partner",
      email: cleanEmail,
    });
  } catch (err: any) {
    console.error("check-method API error:", err);
    return mobileApiResponse(
      { success: false, loginMethod: "not_found", error: err.message || "Failed to check authentication method" },
      500
    );
  }
}
