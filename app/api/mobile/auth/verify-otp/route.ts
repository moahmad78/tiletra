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

    const cleanEmail = (email || "").trim().toLowerCase();

    console.log(`[VerifyOTP:Step 1/4] Incoming verification request: purpose=${purpose}, isBusiness=${isBusinessLogin}`);

    // 0. Dedicated Google Play Console App Review Bypass (development/staging or explicit bypass only)
    const isReviewerAllowed = process.env.NODE_ENV !== "production" || process.env.ENABLE_REVIEWER_BYPASS === "true";
    let isReviewerAccount = false;
    if (isReviewerAllowed && cleanEmail) {
      const { isPlayReviewerEmail, ensurePlayReviewerAccounts } = await import("@/lib/auth/reviewer-bypass");
      if (isPlayReviewerEmail(cleanEmail)) {
        isReviewerAccount = true;
        await ensurePlayReviewerAccounts();
        const { resetAllLockoutsForIp } = await import("@/lib/rate-limit");
        resetAllLockoutsForIp(clientIp);
      }
    }

    // 1. Check account & IP lockout for business login attempts (strictly active for ALL non-reviewer accounts)
    if (isBusinessLogin && !isReviewerAccount) {
      const lockoutCheck = checkVendorLoginLockout(clientIp, cleanEmail);
      if (lockoutCheck.locked) {
        console.warn(`[VerifyOTP:Lockout] Account/IP locked out, retryAfterSeconds=${lockoutCheck.retryAfterSeconds}`);
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
        const failRecord = recordVendorLoginFailure(clientIp, cleanEmail);
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

      console.log(`[VerifyOTP:Step 2/4] OTP verification response: success=${verifyRes.success}`);

      if (!verifyRes.success) {
        console.warn(`[VerifyOTP:Step 2/4] OTP verification failed: message=${verifyRes.message}`);
        const { isPlayReviewerEmail } = await import("@/lib/auth/reviewer-bypass");
        if (isBusinessLogin && !(isReviewerAllowed && isPlayReviewerEmail(cleanEmail))) {
          const failRecord = recordVendorLoginFailure(clientIp, cleanEmail);
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
      const isAdminOrStaff =
        user.role === "admin" ||
        user.role === "superadmin" ||
        user.role === "cpo" ||
        user.role?.toLowerCase() === "cpo" ||
        user.email?.toLowerCase().trim() === allowedAdminEmail;

      if (!isAdminOrStaff) {
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
            if (matchedVendor.status === "approved") {
              await prisma.user.update({
                where: { id: user.id },
                data: { role: "vendor" },
              });
              user.role = "vendor";
            }
            vendor = matchedVendor;
          }
        }

        // Role upgrade ONLY when vendor is positively approved
        if (vendor && vendor.status === "approved" && user.role !== "vendor") {
          await prisma.user.update({
            where: { id: user.id },
            data: { role: "vendor" },
          });
          user.role = "vendor";
        }

        console.log(`[VerifyOTP:Step 3/4] Vendor association check: vendorFound=${!!vendor}, vendorStatus=${vendor?.status || "NONE"}, userRole=${user.role}`);

        if (!vendor) {
          console.warn("[VerifyOTP:Step 3/4] Access restricted: Account not registered as vendor");
          const failRecord = recordVendorLoginFailure(clientIp, cleanEmail);
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
          const failRecord = recordVendorLoginFailure(clientIp, cleanEmail);
          let msg = "Your vendor account is not approved.";
          if (vendor.status === "pending") {
            msg = "Your vendor application is currently under review by the Intrihub Admin team. You will be notified upon approval.";
          } else if (vendor.status === "suspended") {
            msg = "Your vendor store has been suspended. Please contact Intrihub Partner Support at +91 7090120211.";
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

      // Successful business login -> reset lockout for IP & account
      resetVendorLoginLockout(clientIp, cleanEmail);
    }

    const allowedAdminEmail = (process.env.ADMIN_ALLOWED_EMAIL || "admin@intrihub.com").toLowerCase().trim();
    let effectiveRole = user.role;
    if ((effectiveRole === "admin" || effectiveRole === "superadmin") && user.email?.toLowerCase().trim() !== allowedAdminEmail) {
      effectiveRole = "customer";
    }

    if (body.pushToken && typeof body.pushToken === "string") {
      try {
        await (prisma as any).user.update({
          where: { id: user.id },
          data: { pushToken: body.pushToken.trim() },
        });
      } catch (tokErr) {
        console.warn("Could not save pushToken on verify-otp:", tokErr);
      }
    }

    const tokens = generateMobileTokens({
      id: user.id,
      role: effectiveRole,
      email: user.email,
      phone: user.phone,
      name: user.name,
    });

    console.log(`[VerifyOTP:Step 4/4] Success: tokens issued with effectiveRole=${effectiveRole}, userId=${user.id}`);

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
