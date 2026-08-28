import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyEmailOtp } from "@/lib/actions/email-otp";
import { generateMobileTokens, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import {
  checkVendorLoginLockout,
  recordVendorLoginFailure,
  resetVendorLoginLockout,
} from "@/lib/rate-limit";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, phone, otp, name, purpose = "customer" } = body;

    const isBusinessLogin = purpose === "business" || purpose === "vendor" || purpose === "admin";
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    // 1. Check IP lockout for business login attempts
    if (isBusinessLogin) {
      const lockoutCheck = checkVendorLoginLockout(clientIp);
      if (lockoutCheck.locked) {
        const mins = Math.floor((lockoutCheck.retryAfterSeconds || 0) / 60);
        const secs = (lockoutCheck.retryAfterSeconds || 0) % 60;
        const timeStr = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

        return mobileApiResponse(
          {
            success: false,
            error: `Too many failed attempts. Try again in ${timeStr}`,
            locked: true,
            lockoutUntil: lockoutCheck.lockoutUntil,
            retryAfterSeconds: lockoutCheck.retryAfterSeconds,
          },
          429
        );
      }
    }

    if (!otp || typeof otp !== "string") {
      if (isBusinessLogin) {
        const failRecord = recordVendorLoginFailure(clientIp);
        if (failRecord.locked) {
          return mobileApiResponse(
            {
              success: false,
              error: "Too many failed attempts. Try again in 15:00",
              locked: true,
              lockoutUntil: failRecord.lockoutUntil,
              retryAfterSeconds: failRecord.retryAfterSeconds,
            },
            429
          );
        }
      }
      return mobileApiResponse({ success: false, error: "Please provide a valid 6-digit OTP" }, 400);
    }

    let user: any = null;

    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      const verifyRes = await verifyEmailOtp(cleanEmail, otp, purpose);

      if (!verifyRes.success) {
        if (isBusinessLogin) {
          const failRecord = recordVendorLoginFailure(clientIp);
          if (failRecord.locked) {
            return mobileApiResponse(
              {
                success: false,
                error: "Too many failed attempts. Account login blocked for 15 minutes.",
                locked: true,
                lockoutUntil: failRecord.lockoutUntil,
                retryAfterSeconds: failRecord.retryAfterSeconds,
              },
              429
            );
          }
          return mobileApiResponse(
            {
              success: false,
              error: `${verifyRes.message}. (${failRecord.remainingAttempts} attempts remaining)`,
              remainingAttempts: failRecord.remainingAttempts,
            },
            400
          );
        }
        return mobileApiResponse({ success: false, error: verifyRes.message }, 400);
      }

      user = await prisma.user.findUnique({
        where: { id: verifyRes.userId },
        include: {
          vendor: true,
          addresses: {
            orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
          },
        },
      });
    } else if (phone) {
      const cleanPhone = phone.replace(/\D/g, "");
      if (cleanPhone.length !== 10) {
        return mobileApiResponse({ success: false, error: "Invalid phone number" }, 400);
      }

      user = await prisma.user.upsert({
        where: { phone: cleanPhone },
        update: {
          phoneVerified: true,
          name: name || undefined,
        },
        create: {
          phone: cleanPhone,
          name: name || `User ${cleanPhone.slice(-4)}`,
          phoneVerified: true,
          role: "customer",
        },
        include: {
          vendor: true,
          addresses: {
            orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
          },
        },
      });
    } else {
      return mobileApiResponse({ success: false, error: "Please provide email or phone" }, 400);
    }

    if (!user) {
      return mobileApiResponse({ success: false, error: "User not found" }, 404);
    }

    // 2. Business Login Security Whitelist Verification
    if (isBusinessLogin) {
      const allowedAdminEmail = (process.env.ADMIN_ALLOWED_EMAIL || "admin@intrihub.com").toLowerCase().trim();
      const isAdmin =
        (user.role === "admin" || user.role === "superadmin") &&
        user.email?.toLowerCase().trim() === allowedAdminEmail;

      if (!isAdmin) {
        let vendor = user.vendor;

        // If not directly linked, check by email/phone in Vendor table
        if (!vendor) {
          const matchedVendor = await prisma.vendor.findFirst({
            where: {
              OR: [
                user.email ? { contactEmail: user.email } : {},
                user.phone ? { contactPhone: user.phone } : {},
              ].filter((q) => Object.keys(q).length > 0),
            },
          });

          if (matchedVendor) {
            // Link vendor to this user account
            await prisma.vendor.update({
              where: { id: matchedVendor.id },
              data: { ownerId: user.id },
            });
            await prisma.user.update({
              where: { id: user.id },
              data: { role: "vendor" },
            });
            vendor = matchedVendor;
            user.role = "vendor";
          }
        }

        if (!vendor) {
          const failRecord = recordVendorLoginFailure(clientIp);
          return mobileApiResponse(
            {
              success: false,
              error:
                "Access Restricted: This account is not registered as an Intrihub vendor partner. Please submit a vendor application.",
              remainingAttempts: failRecord.remainingAttempts,
              locked: failRecord.locked,
            },
            403
          );
        }

        if (vendor.status !== "approved") {
          const failRecord = recordVendorLoginFailure(clientIp);
          let msg = "Your vendor account is not approved.";
          if (vendor.status === "pending") {
            msg = "Your vendor application is currently under review by the Intrihub Admin team. You will be notified upon approval.";
          } else if (vendor.status === "suspended") {
            msg = "Your vendor store has been suspended. Please contact Intrihub Partner Support at +91 9264920211.";
          } else if (vendor.status === "rejected") {
            msg = `Your vendor application was not approved. ${vendor.rejectionReason ? `Reason: ${vendor.rejectionReason}` : "Please contact partner support."}`;
          }

          return mobileApiResponse(
            {
              success: false,
              error: msg,
              vendorStatus: vendor.status,
              remainingAttempts: failRecord.remainingAttempts,
              locked: failRecord.locked,
            },
            403
          );
        }
      }

      // Successful business login -> reset IP lockout
      resetVendorLoginLockout(clientIp);
    }

    const allowedAdminEmail = (process.env.ADMIN_ALLOWED_EMAIL || "admin@intrihub.com").toLowerCase().trim();
    let effectiveRole = user.role;
    if ((effectiveRole === "admin" || effectiveRole === "superadmin") && user.email?.toLowerCase().trim() !== allowedAdminEmail) {
      effectiveRole = "customer";
    }

    const tokens = generateMobileTokens({
      id: user.id,
      role: effectiveRole,
      email: user.email,
      phone: user.phone,
      name: user.name,
    });

    return mobileApiResponse({
      success: true,
      message: "Authentication successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: effectiveRole,
        avatar: user.avatar,
        phoneVerified: user.phoneVerified,
        emailVerified: user.emailVerified,
        addresses: user.addresses,
      },
      tokens,
    });
  } catch (err: any) {
    console.error("Mobile verify-otp error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to verify authentication code" },
      500
    );
  }
}
